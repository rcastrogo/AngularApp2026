import { CdkMenuModule } from '@angular/cdk/menu';
import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { LucideAngularModule, Menu, Trash, X, Check } from 'lucide-angular';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-table-column-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, CdkMenuModule, LucideAngularModule],
  templateUrl: './app-table-column-filter.component.html',
})
export class TableColumnFilterMenuComponent {
  // ==============================================================
  // Inputs
  // ==============================================================
  columnLabel = input.required<string>();
  values = input.required<string[]>();
  hideValues = input<boolean>(false);
  selected: string[] = [];
  // ==============================================================
  // Outputs
  // ==============================================================
  toggleValue = output<{ value: string; term: string }>();
  // ==============================================================
  // Estado local
  // ==============================================================
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

  constructor() {

    this.debounceSubject.pipe(debounceTime(300)).subscribe((val) => {
      this.toggleValue.emit({ value: '', term: val });
    });
  }

  // Computed: Reemplaza useMemo
  filteredValues = computed(() => {
    return this.values();
    // const normalizedText = this.text().trim().toLowerCase();
    // const currentSelected = this.selected().map(s => s.toLowerCase());

    // const list = this.values().filter((value) => {
    //   const v = value.toLowerCase();
    //   return v.includes(normalizedText) || currentSelected.includes(v);
    // });

    // return list.sort((a, b) => {
    //   const aSel = currentSelected.includes(a.toLowerCase());
    //   const bSel = currentSelected.includes(b.toLowerCase());
    //   return aSel === bSel ? 0 : aSel ? -1 : 1;
    // });
  });

  hasActiveFilters = computed(() => this.text().length > 0 || this.selected.length > 0);

  // Métodos
  handleInputChange(newVal: string) {
    this.text.set(newVal);
    this.debounceSubject.next(newVal);
  }

  handleCheckboxChange(value: string) {
    this.toggleValue.emit({ value, term: this.text() });
  }

  clearFilters() {
    this.text.set('');
    this.toggleValue.emit({ value: '~~~~', term: '' });
  }

  onMenuOpened() {
    setTimeout(() => this.inputRef()?.nativeElement.focus(), 0);
  }
  closeMenu(){
    console.log('close');
  }

}
