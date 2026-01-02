import { Component, inject, TemplateRef, ViewChild } from '@angular/core';

import { AlertService } from '~/services/alert.service';
import { TranslationService } from '~/services/translation.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [],
  template: `

    <ng-template #htmlAlert>
      <div class="flex w-full flex-col items-center gap-4">
        <h2 class="text-4xl font-bold">
          Esto es ng-template
        </h2>
        <div class="relative h-1 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            class="absolute left-0 top-0 h-full w-1/3
                  animate-[progress-two_1.5s_linear_infinite]
                  bg-slate-900">
          </div>
        </div>
      </div>
    </ng-template>

    <div class="p-8 animate-page-entry">
      <h2 class="text-3xl font-bold mb-4">{{ i18n.t('contact.info.title') }}</h2>
      <p>{{ i18n.t('contact.info.description') }}</p>

       <!-- Botones de prueba -->
      <div class="flex flex-wrap gap-3 mt-6">

        <button
          class="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          (click)="showInfo()">
          Info (autoclose)
        </button>

        <button
          class="px-4 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600"
          (click)="showWarning()">
          Warning (confirm)
        </button>

        <button
          class="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
          (click)="showError()">
          Error
        </button>

        <button
          class="px-4 py-2 rounded bg-slate-800 text-white hover:bg-slate-900"
          (click)="showConfirmPromise()">
          Confirm (Promise)
        </button>

        <button
          class="px-4 py-2 rounded bg-gray-600 text-white hover:bg-slate-900"
          (click)="showTemplateAlert()">
          Template
        </button>
        
      </div>
  `
})
export class ContactComponent {
  i18n = inject(TranslationService);
  alert = inject(AlertService);

  showInfo() {
    this.alert.showInfo(
      'This is an informational alert that closes automatically.',
      {
        autoCloseMs: 20500,
        onClose: () => console.log('Info closed'),
      }
    );
  }

  showWarning() {
    this.alert.showWarning(
      'Are you sure you want to continue?',
      {
        title: 'Confirmation required',
        onConfirm: () => console.log('User confirmed'),
        onCancel: () => console.log('User cancelled'),
      }
    );
  }

  showError() {
    this.alert.showError(
      'Something went wrong while saving data.',
      {
        title: 'Error',
        onClose: () => {
          setTimeout(() => this.showHtml(), 500); 
        },
      }
    );
  }

  showHtml(){
    const html = `
      <div class="flex w-full flex-col items-center gap-4">
        <h2 class="text-4xl font-bold text-center text-slate-900 dark:text-white">
          Esto es HTML
        </h2>

        <p class="w-full rounded-md border border-slate-200 dark:border-slate-700 p-4 text-center">
          Mensaje de prueba con <strong>HTML</strong> embebido.
        </p>

        <div class="relative h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            class="absolute left-0 top-0 h-full w-1/3
                  animate-[progress-two_1.5s_linear_infinite]
                  bg-slate-900 dark:bg-slate-100">
          </div>
        </div>
      </div>
    `;
    this.alert.showInfo(
      html,
      {
        title: 'Prueba html',
        asHtml: true,
        autoCloseMs: 5500,
        icon: undefined, 
      }
    );
  }

  async showConfirmPromise() {
    const result = await this.alert.confirm(
      'Do you really want to delete this item?',
      {
        title: 'Delete item',        
        literals: [
          'general.action.no', 
          'general.action.yes'
        ]
      }
    );

    console.log('Confirm result:', result);
  }

  @ViewChild('htmlAlert') tpl!: TemplateRef<unknown>;

  showTemplateAlert() {
    this.alert.showTemplate(this.tpl, {
      message: '',
      title: 'Template mode',
      showFooter: false,
      autoCloseMs: 5000,
    });
  }
}
