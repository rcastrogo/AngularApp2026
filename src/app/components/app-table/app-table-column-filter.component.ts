import { CdkTrapFocus } from '@angular/cdk/a11y';
import { CdkMenuModule } from '@angular/cdk/menu';
import { CommonModule } from '@angular/common';
import { Component, computed, effect, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { LucideAngularModule, Menu, Trash, X, Check } from 'lucide-angular';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { accentNumericComparer, displayValue } from '~/core/utils';
import { TranslationService } from '~/services/translation.service';

@Component({
  selector: 'app-table-column-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, CdkMenuModule, LucideAngularModule, CdkTrapFocus, ],
  templateUrl: './app-table-column-filter.component.html',
})
export class TableColumnFilterMenuComponent {
  // =============================================================================
  // injección de servicios
  // =============================================================================
  i18n = inject(TranslationService);
  // ==============================================================
  // Inputs
  // ==============================================================
  columnLabel = input.required<string>();
  values = input.required<string[]>();
  hideValues = input<boolean>(false);
  resetToken = input<number>(0);
  // ==============================================================
  // Outputs
  // ==============================================================
  changeFilter = output<{ text: string , values: string[] }>();
  // ==============================================================
  // Estado local
  // ==============================================================
  selected = signal<string[]>([]);
  text = signal('');
  inputRef = viewChild<ElementRef<HTMLInputElement>>('inputRef');
  // ==============================================================
  // Iconos para lucide
  // ==============================================================
  readonly MenuIcon = Menu;
  readonly TrashIcon = Trash;
  readonly XIcon = X;
  readonly CheckIcon = Check;

  private debounceSubject = new Subject<string>();

  readonly displayValue = displayValue;

  constructor() {
    effect(() => {
      this.resetToken();
      this.clearFilters();
    });
    this.debounceSubject.pipe(debounceTime(300)).subscribe((val) => {
      this.changeFilter.emit({ text: val, values: this.selected() });
    });
  }

  hasActiveFilters = computed(() => this.text().length > 0 || this.selected().length > 0);
  orderedValues = computed(() => {
    return this.values().sort(accentNumericComparer);
    // return this.values().sort((a, b) => {
    //   const aSel = this.selected().includes(a);
    //   const bSel = this.selected().includes(b);
    //   if (aSel && !bSel) return -1;
    //   if (!aSel && bSel) return 1;
    //   return a.localeCompare(b);
    // });
  })

  handleInputChange(newVal: string) {
    this.text.set(newVal);
    this.debounceSubject.next(newVal);
  }

  handleCheckboxChange(value: string) {
    this.selected.update(current => {
      if (current.includes(value)) {
        return current.filter(v => v !== value);
      } else {
        return [...current, value];
      }
    });
    this.changeFilter.emit({ text: this.text(), values: this.selected()});
  }

  clearFilters() {
    this.text.set('');
    this.selected.set([]);
    this.changeFilter.emit({ text: '', values: []});
  }

  onMenuOpened() {
    setTimeout(() => this.inputRef()?.nativeElement.focus(), 0);
  }

  closeMenu(){
    console.log('close');
  }

}
