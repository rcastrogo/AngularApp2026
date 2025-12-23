import { CdkMenuModule } from '@angular/cdk/menu';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';

import { 
  LucideAngularModule,
} from 'lucide-angular';

import { TranslationService } from '~/services/translation.service';

import { ActionButton, ACTIONS, Column, Identifiable } from './app-table.component';

@Component({
  selector: 'app-table-menu',
  standalone: true,
  imports: [CommonModule, CdkMenuModule, LucideAngularModule],
  templateUrl: './app-table-menu.component.html',
})
export class TableMenuComponent<T extends Identifiable>  {    
  i18n = inject(TranslationService);
  ACTIONS = ACTIONS;
  // =============================================================
  // Inputs
  // =============================================================
  columns = input.required<Column<T>[]>();
  visibleColumnIds = input.required<Set<string>>();
  selectedRows = input.required<Set<string | number>>();
  rowsCount = input<number>(0); 
  pageSize = input<number>(0);
  menuItems = input<ActionButton[]>([]);
  // =============================================================
  // Outputs
  // =============================================================
  toggleColumn = output<string>();
  actionTriggered = output<string>();
  // =============================================================
  // Computed
  // =============================================================
  readonly menuButtons = computed(() =>
    this.menuItems().filter(
      btn => btn.show === 'menu' || btn.show === 'both'
    )
  );

  handleToggleColumn = (columnId: string) => this.toggleColumn.emit(columnId);
  handleAction = (actionId: string) => this.actionTriggered.emit(actionId);
  handleOnMenuItem = (item: ActionButton) => {
    if (item.onClick) {
      item.onClick();
      return;
    }
    this.handleAction(item.key);
  }
  isButtonEnabled = (btn: ActionButton) => btn.enabledWhen ? btn.enabledWhen(this.selectedRows()) : true;

}
