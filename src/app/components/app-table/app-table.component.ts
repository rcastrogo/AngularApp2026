
import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  ChangeDetectionStrategy,
  signal,
  computed,
  effect,
  TemplateRef,
  inject,
  OnInit,
} from '@angular/core';


import { LucideAngularModule } from 'lucide-angular';

import { storage } from '~/core/storageUtil';
import { accentNumericComparer, getUniqueValues, getValueByPath } from '~/core/utils';
import { Localizable, TranslationService } from '~/services/translation.service';

import { TableColumnFilterMenuComponent } from "./app-table-column-filter.component";
import { TableMenuComponent } from "./app-table-menu.component";

export const ACTIONS = {
  SELECT_ALL: 'select-all',
  CLEAR_ALL: 'clear-all',
  TOGGLE_COLUMN_PREFIX: 'toggle-column-',
  PAGE_SIZE_PREFIX: 'page-size-',
  INVERT_SELECTION: 'invert-selection',
  CHOOSE_SELECTION: 'show_only_selection',
  NEW: 'new',
  DELETE: 'delete',
  EDIT: 'edit',
} as const;

export interface Identifiable {
  id: string | number;
}

export interface ActionHandlers<T> {
  onCreate?: (callback: (item: T) => void) => void;
  onDelete?: (ids: (string | number)[], callback: () => void) => void;
  onEdit?: (item: T, callback: (updated: T) => void) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCustomAction?: (action: string, payload?: any) => void;
}

export interface CellContext<T extends Identifiable> {
  $implicit: T;   // row
  column: Column<T>;
}

export interface Column<T extends Identifiable> {
  key: string;
  title: Localizable;
  isVisible?: boolean;
  className?: string;
  sorter?: keyof T | ((a: T, b: T) => number); // | NestedPaths<T> | string;  
  cellTemplate?: TemplateRef<CellContext<T>>;
  map?: (id: number) => string;
  accessor?: keyof T | ((item: T) => string | number | boolean | null);
  hideValueSelection?: boolean;
  hideSeachButton?: boolean;
}

export interface ActionButton {
  key: string,
  label: Localizable;
  onClick?: () => void;
  icon?: string;
  show?: 'menu' | 'button' | 'both';
  enabledWhen?: (selected: Set<string | number>) => boolean;
}

const TABLE_STORAGE_KEY = 'app-table';
const VISIBLE_COLUMNS = 'visibleColumns';
const buildStorageKey = (base:string, name: string) => {
  return TABLE_STORAGE_KEY + '-' + base + '-' + name;
}

@Component({
  selector: 'app-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    LucideAngularModule,
    TableMenuComponent,
    TableColumnFilterMenuComponent
],
  templateUrl: './app-table.component.html',
})
export class TableComponent<T extends Identifiable> implements OnInit {
  // =============================================================================
  // injección de servicios
  // =============================================================================
  i18n = inject(TranslationService);
  // =============================================================================
  // Parámtros de entrada
  // =============================================================================
  @Input() key = 'key';
  @Input() entity = 'Items';
  @Input() pageSizeInitial = 10;
  @Input() enableDoubleClickEdit = false;
  @Input() waitingForRows = false;
  @Input() actionHandlers?: ActionHandlers<T>;
  @Input() columns: Column<T>[] = [];
  @Input() buttons: ActionButton[] = [];
  @Input() set dataSource(value: T[]) {
    const safeValue = value ?? [];
    this.dataOriginal.set(safeValue);
    this.data.set(safeValue);
    this.selected.set(new Set());
    this.currentPage.set(1);
  }
  // =============================================================================
  // Signals
  // =============================================================================
  readonly resetFilterToken = signal(0);
  readonly dataOriginal = signal<T[]>([]);
  readonly data = signal<T[]>([]);
  readonly selected = signal<Set<string | number>>(new Set());
  readonly currentPage = signal(1);
  readonly pageSize = signal(this.pageSizeInitial);
  readonly sortedColumn = signal<string | null>(null);
  readonly sortDirection = signal<'asc' | 'desc' | null>(null);
  readonly visibleColumnIds = signal<Set<string>>(new Set());
  // =================================================================================
  // Inicialización
  // =================================================================================
  ngOnInit(): void {
    const visibleColumnsKey = buildStorageKey(this.key, VISIBLE_COLUMNS);
    const savedColumns = storage.readValue<string[]>(visibleColumnsKey);
    this.visibleColumnIds.set(
      new Set(
        savedColumns?.length
          ? savedColumns
          : this
            .columns
            .filter(c => c.isVisible !== false)
            .map(c => c.key)
      )
    );
  }
  // =============================================================================
  // Persistencia
  // =============================================================================
  private readonly _persist = effect(() => {
    const visibleColumnsKey = buildStorageKey(this.key, VISIBLE_COLUMNS);
    storage.writeValue( visibleColumnsKey, Array.from(this.visibleColumnIds()) );
  });

  // =============================================================
  // Botones
  // =============================================================
  readonly actionButtons = computed(() =>
    this.buttons.filter(
      btn => !btn.show || btn.show === 'button' || btn.show === 'both'
    )
  );
  isButtonEnabled = (btn: ActionButton) => btn.enabledWhen ? btn.enabledWhen(this.selected()) : true;
  handleOnButtonClick = (item: ActionButton) => {
    if (item.onClick) {
      item.onClick();
      return;
    }
    this.onAction(item.key);
  }

  // =============================================================================
  // Columnas visibles
  // =============================================================================
  readonly visibleColumns = computed(() => {
    const visibleSet = this.visibleColumnIds();
    return this.columns
      .filter(col => visibleSet.has(col.key));
  });

  handleToggleColumn(columnId: string) {
    this.visibleColumnIds.update(set => {
      const newSet = new Set(set);
      if (newSet.has(columnId)) {
        newSet.delete(columnId);
      } else {
        newSet.add(columnId);
      }
      return newSet;
    });
  }
  // =============================================================================
  // Ordenación de columnas
  // =============================================================================
  readonly sortedRows = computed(() => {
    const data = this.filteredRows()
    const colKey = this.sortedColumn();
    const dir = this.sortDirection();

    if (!colKey || !dir) {
      return data;
    }

    const column = this.columns.find(c => c.key === colKey);
    if (!column || !column.sorter) {
      return data;
    }

    let sorterFn: (a: T, b: T) => number;

    if (typeof column.sorter === 'function') {
      sorterFn = column.sorter;
    } else {
      sorterFn = (a: T, b: T) => {
        const valA = this.resolveCellValue(column, a);
        const valB = this.resolveCellValue(column, b);

        // null / undefined
        if (valA == null && valB == null) return 0;
        if (valA == null) return -1;
        if (valB == null) return 1;

        // strings → comparación acentuada
        if (typeof valA === 'string' && typeof valB === 'string') {
          return accentNumericComparer(valA, valB);
        }

        // numbers / booleans / mixed
        if (valA < valB) return -1;
        if (valA > valB) return 1;
        return 0;
      };
    }

    return [...data].sort((a, b) =>
      dir === 'asc'
        ? sorterFn(a, b)
        : sorterFn(b, a)
    );
  });
  // =============================================================================
  // Paginación
  // =============================================================================
  handlePageSizeCange(value: string) {
    this.pageSize.set((~~value) || 5);
  }

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.sortedRows().length / this.pageSize()))
  );

  readonly pageRows = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.sortedRows().slice(start, start + this.pageSize());
  });

  toggleSort(column: Column<T>) {
    if (!column.sorter) return;

    if (this.sortedColumn() === column.key) {
      this.sortDirection.update(d =>
        d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc'
      );
    } else {
      this.sortedColumn.set(column.key);
      this.sortDirection.set('asc');
    }
    this.currentPage.set(1);
  }

  firstPage = () => this.currentPage.set(1);
  lastPage = () => this.currentPage.set(this.totalPages());
  prevPage = () => this.currentPage.update(p => Math.max(1, p - 1));
  nextPage = () => this.currentPage.update(p => Math.min(this.totalPages(), p + 1));
  goToPage(e: Event) {
    const value = Number((e.target as HTMLInputElement).value);
    if (value >= 1 && value <= this.totalPages()) {
      this.currentPage.set(value);
    }
  }
  // =============================================================================
  // Selección de registros
  // =============================================================================
  toggleRow(id: string | number, checked: boolean) {
    this.selected.update(prev => {
      const next = new Set(prev);
      if (checked)
        next.add(id)
      else
        next.delete(id);
      return next;
    });
  }

  selectAll(checked: boolean) {
    if (!checked) {
      this.selected.set(new Set());
    } else {
      this.selected.set(new Set(this.sortedRows().map(r => r.id)));
    }
  }

  handleInvertSelection() {
    const allIds = new Set(this.sortedRows().map(r => r.id));
    const current = this.selected();

    const inverted = new Set<string | number>();
    for (const id of allIds) 
      if (!current.has(id)) inverted.add(id);

    this.selected.set(inverted);
  }

  handleShowOnlySelected() {
    const selectedIds = this.selected();
    if (selectedIds.size === 0) return;
    const filtered = this.dataOriginal().filter(row =>
      selectedIds.has(row.id)
    );
    this.data.set(filtered);
    this.currentPage.set(1);
  }

  // =============================================================================
  // Acciones
  // =============================================================================
  refresh() {
    this.selected.set(new Set());
    this.actionHandlers?.onCustomAction?.('reload');
    this.firstPage();
    this.resetActiveFilters();
  }

  insert() {
    this.actionHandlers?.onCreate?.(item => {
      this.data.update(d => [...d, item]);
      this.lastPage();
    });
  }

  deleteSelected() {
    const ids = [...this.selected()];
    if (!ids.length) return;

    this.actionHandlers?.onDelete?.(ids, () => {
      this.data.update(d => d.filter(i => !this.selected().has(i.id)));
      this.selected.set(new Set());
    });
  }

  editSelected() {
    if (this.selected().size !== 1) return;
    const id = [...this.selected()][0];
    const item = this.data().find(i => i.id === id);
    if (!item) return;

    this.actionHandlers?.onEdit?.(item, updated => {
      this.data.update(d =>
        d.map(i => i.id === id ? { ...i, ...updated } : i)
      );
    });
  }

  onAction(action: string) {
    if (action == ACTIONS.SELECT_ALL) this.selectAll(true);
    else if (action == ACTIONS.CLEAR_ALL) this.selectAll(false);
    else if (action == ACTIONS.INVERT_SELECTION) this.handleInvertSelection();
    else if (action == ACTIONS.CHOOSE_SELECTION) this.handleShowOnlySelected();
    else if (action == ACTIONS.NEW) this.insert();
    else if (action == ACTIONS.DELETE) this.deleteSelected();
    else if (action == ACTIONS.EDIT) this.editSelected();
    else if (action.startsWith(ACTIONS.PAGE_SIZE_PREFIX)) this.handlePageSizeCange(action.split('-')[2]);
    else if (action.startsWith(ACTIONS.TOGGLE_COLUMN_PREFIX)) this.handleToggleColumn(action.split('-')[2]);
    else this.actionHandlers?.onCustomAction?.(action, this.selected());
    console.log('Action triggered:', action);
  }

  // ========================================================================================
  // Recuperación de valores de las celdas y columnas 
  // ========================================================================================
  resolveCellValue(column: Column<T>, item: T): string | number | boolean | null {
    if (column.accessor) {
      if (typeof column.accessor === "function") {
        return column.accessor(item);
      }
      return getValueByPath(item, column.accessor as string);
    }
    if (column.map && typeof column.map === "function") {
      const raw = getValueByPath(item, column.key);
      return column.map(raw);
    }
    return getValueByPath(item, column.key);
  };

  getUniqueValues = (column: Column<T>) => {
    // ===============================================================================
    // Recuperar descripciones de los códigos
    // ===============================================================================
    // const val = String(this.resolveCellValue({ key: col } as any, item));  
    // if (column.map) {
    //   const ids = getUniqueValues(datos as [], column.key);
    //   acc[column.key] = ids.map((id) => column.map!(~~id)).sort(accentNumericComparer);
    //   return acc;
    // }
    return getUniqueValues(this.data() as [], column.key).sort(accentNumericComparer);
  }

  // ========================================================================================
  // Filtrado de filas 
  // ========================================================================================
  activeFilters = signal<Record<string, { text: string, values: string[] }>>({});
  resetActiveFilters = () => this.resetFilterToken.update(v => v + 1);
  handleActiveFilters(event: { text: string, values: string[] }, column: string) {
    this.activeFilters.update(filters => ({
      ...filters,
      [column]: event
    }));
    this.currentPage.set(1);
  }

  readonly filteredRows = computed(() => {
    const rawData = this.data();
    const filters = this.activeFilters();

    if (Object.keys(filters).length === 0) return rawData;

    return rawData.filter(item => {
      return Object.keys(filters).every(col => {
        const { text, values } = filters[col];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const val = String(this.resolveCellValue({ key: col } as any, item));     
        // Si hay texto, debe incluirlo
        const matchesText = !text || val.toLowerCase().includes(text.toLowerCase());
        // Si hay valores seleccionados, debe estar entre ellos
        const matchesValues = values.length === 0 ||  values.includes(val);
        return matchesText && matchesValues;
      });
    });

  });
  
}

