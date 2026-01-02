/* eslint-disable @typescript-eslint/no-explicit-any */
import { A11yModule } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import { 
  afterNextRender,
  Component, 
  computed, 
  inject, 
  output, 
  signal,
  TemplateRef, 
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import {
  LucideAngularModule,
  LucideIconData,
} from 'lucide-angular';


import { TranslationService } from '~/services/translation.service';

type AlertMode = 'text' | 'html' | 'template';
export interface AlertOptions {
  title?: string;
  message: string;
  asHtml?: boolean;
  asTemplate?: boolean;
  template?: TemplateRef<unknown>;
  icon?: LucideIconData;
  showFooter?: boolean;
  showConfirmButton?:boolean;
  autoCloseMs?: number;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
  literals?: string[];
}

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, A11yModule],
  templateUrl: './app-alert.component.html'
})

export class AlertComponent {

  i18n = inject(TranslationService);
  sanitizer = inject(DomSanitizer);

  #mode = signal<AlertMode>('text');
  #title = signal('');
  #message = signal('');
  #template = signal<TemplateRef<unknown> | null>(null);
  #hasFooter = signal(true);
  #icon = signal<LucideIconData | undefined >(undefined);
  #confirm = signal(false);
  #literals = signal<string[]>([]);
  
  isOpen = signal(false);
  isHtml = computed(() => this.#mode() === 'html');
  isTemplate = computed(() => this.#mode() === 'template');
  isText = computed(() => this.#mode() === 'text');
  showFooter = computed(() => this.#hasFooter());
  showTitle = computed(() => this.#title().length > 0);
  showConfirmBtn = computed(() => ( this.#confirm()))
  title = computed(() => this.#title());
  icon = computed(() => this.#icon());
  literals = computed(() => {
    return [
      this.i18n.resolve(this.#literals()[0] || 'general.action.close'),
      this.i18n.resolve(this.#literals()[1] || 'general.action.accept') 
    ];
    this.#literals()
  });

  template = computed(() => this.#template());
  message = computed<string | SafeHtml>(() => {
    if (this.isHtml()) {
      return this.sanitizer.bypassSecurityTrustHtml(this.#message());
    }
    return this.#message();
  });

  constructor() {
    afterNextRender(() => {
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && this.isOpen()) {
          this.close();
        }
      });
    });
  }

  // Outputs
  closed = output<void>();
  cancelled = output<void>();
  confirmed = output<void>();

  setOptions(options: AlertOptions) {
    this.#title.set(options.title ?? '');
    this.#icon.set(options.icon);
    this.#hasFooter.set(options.showFooter ?? false);
    this.#confirm.set(options.showConfirmButton ?? false)

    if (options.asTemplate && options.template) {
      this.#mode.set('template');
      this.#template.set(options.template);
    } 
    else if (options.asHtml) {
      this.#message.set(options.message);
      this.#mode.set('html');
    } 
    else {
      this.#message.set(options.message);
      this.#mode.set('text');
    }

    if (options.autoCloseMs && options.autoCloseMs > 0) {
      setTimeout(() => this.close(), options.autoCloseMs);
    }

    if(options.literals && options.literals.length){
      this.#literals.set(
        [ options.literals[0], options.literals[1]]
      );
    }

  }

  open(): void {
    this.isOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  close(): void {
    this.isOpen.set(false);
    this.closed.emit();
    document.body.style.overflow = '';
    console.log('this.close()');
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('js-back-drop')) {
      this.onCancel();
    }
  }

  onCancel(): void {
    console.log('this.onCancel()');
    this.cancelled.emit();
    this.close();
  }

  onConfirm(): void {
    console.log('this.onConfirm()');
    this.confirmed.emit();
    this.close();
  }

}
