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
import { accentNumericComparer, getValueByPath, resolveText } from '~/core/utils';
import { TranslationService } from '~/services/translation.service';

export interface Identifiable {
  id: string | number;
}

export type Localizable = string | { key: string };

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
  sorter?: (a: T, b: T) => number;
  //sorter?: keyof T | ((a: T, b: T) => number) | NestedPaths<T> | string;  
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

@Component({
  selector: 'app-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    LucideAngularModule,
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
  @Input() entity = 'Items';
  @Input() pageSizeInitial = 10;
  @Input() enableDoubleClickEdit = false;
  @Input() waitingForRows = false;
  @Input() actionHandlers?: ActionHandlers<T>;
  @Input() columns: Column<T>[] = [];
  @Input() buttons: ActionButton[] = [];
  @Input() set dataSource(value: T[]) {
    this.data.set(value ?? []);
    this.selected.set(new Set());
    this.currentPage.set(1);
  }
  // =============================================================================
  // Signals
  // =============================================================================
  readonly data = signal<T[]>([]);
  readonly selected = signal<Set<string | number>>(new Set());
  readonly currentPage = signal(1);
  readonly pageSize = signal(this.pageSizeInitial);
  readonly sortedColumn = signal<string | null>(null);
  readonly sortDirection = signal<'asc' | 'desc' | null>(null);
  readonly visibleColumnIds = signal<Set<string>>(new Set());
  // =============================================================================
  // Inicialización
  // =============================================================================
  ngOnInit(): void {
    const savedColumns = storage.readValue<string[]>('app-table-xxx');
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
    storage.writeValue('app-table-xxx', Array.from(this.visibleColumnIds()));
  });

  readonly visibleColumns = computed(() => {
    const visibleSet = this.visibleColumnIds();
    return this.columns
      .filter(col => visibleSet.has(col.key));
  });

  toggleColumn(columnId: string) {
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

  readonly sortedRows = computed(() => {
    const colKey = this.sortedColumn();
    const dir = this.sortDirection();

    if (!colKey || !dir) {
      return this.data();
    }

    const column = this.columns.find(c => c.key === colKey);
    if (!column || !column.sorter) {
      return this.data();
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

    return [...this.data()].sort((a, b) =>
      dir === 'asc'
        ? sorterFn(a, b)
        : sorterFn(b, a)
    );
  });

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

  refresh() {
    this.selected.set(new Set());
    this.actionHandlers?.onCustomAction?.('reload');
    this.firstPage();
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

  showAsButton = (btn: ActionButton) => !btn.show || btn.show === 'button' || btn.show === 'both';
  isButtonEnabled = (btn: ActionButton) => btn.enabledWhen ? btn.enabledWhen(this.selected()) : true;
  resolveText = (value: Localizable, params?: Record<string, string | number>) => resolveText(value, this.i18n, params);


}

