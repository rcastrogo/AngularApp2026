import { Component, inject, TemplateRef, ViewChild } from '@angular/core';

import {
  LucideAngularModule,
  CircleX,
  TriangleAlert,
  Check,
  NotepadText,
} from 'lucide-angular';

import { AlertSize, literals } from '~/components/app-alert/app-alert.component';
import { AlertService } from '~/services/alert.service';
import { NotificationService } from '~/services/notification.service';
import { TranslationService } from '~/services/translation.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [LucideAngularModule],
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

      <h2 class="text-3xl font-bold my-4">Alerts</h2>
      <div class="flex flex-wrap gap-3">

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

      <h2 class="text-3xl font-bold my-4">Notificaciones</h2>
      <div class="flex flex-wrap gap-3">
        <button
          class="px-4 py-2 rounded-full bg-gray-600 text-white hover:bg-slate-900"
          (click)="notifications.info('Información', 5000)">
          <lucide-angular name="info" class="size-5 shrink-0"></lucide-angular>
        </button>
        <button
          class="px-4 py-2 rounded-full bg-gray-600 text-white hover:bg-slate-900"
          (click)="notifications.success('Éxito')">
          <lucide-angular [img]="successIcon" class="size-5 shrink-0"></lucide-angular>
        </button>           
        <button
          class="px-4 py-2 rounded-full bg-gray-600 text-white hover:bg-slate-900"
          (click)="notifications.error('Error', 5000)">
          <lucide-angular [img]="errorIcon" class="size-5 shrink-0"></lucide-angular>
        </button>
        <button
          class="px-4 py-2 rounded-full bg-gray-600 text-white hover:bg-slate-900"
          (click)="notifications.warning('Aviso', 500)">
          <lucide-angular [img]="warningIcon" class="size-5 shrink-0"></lucide-angular>
        </button>
        <button
          class="px-4 py-2 rounded-full bg-gray-600 text-white hover:bg-slate-900"
          (click)="notifications.show('Mensaje normal', 10000)">
          <lucide-angular [img]="textIcon" class="size-5 shrink-0"></lucide-angular>          
        </button>
        <button
          class="px-4 py-2 rounded-full bg-gray-600 text-white hover:bg-slate-900"
          (click)="notifications.warning('Aviso', -1)">
          <lucide-angular [img]="warningIcon" class="size-5 shrink-0"></lucide-angular>
        </button>          
        <button
          class="px-4 flex gap-2 py-2 rounded-full bg-gray-600 text-white hover:bg-slate-900 items-center"
          (click)="notifications.show(large_message, 10000)">
          <lucide-angular [img]="textIcon" class="size-5 shrink-0"></lucide-angular> 
          Multiline         
        </button>
        <button
          class="px-4 flex gap-2 py-2 rounded-full bg-gray-600 text-white hover:bg-slate-900 items-center"
          (click)="notifications.warning(large_message, 10000)">
          <lucide-angular [img]="warningIcon" class="size-5 shrink-0"></lucide-angular> 
          Multiline         
        </button>                   
      </div>

      <h2 class="text-3xl font-bold my-4">Diálogos</h2>
      <div class="flex flex-wrap gap-3">
        <button
          class="px-4 py-2 rounded-full bg-gray-600 text-white hover:bg-slate-900"
          (click)="showTemplateAlert('sm')">
          sm
        </button>
        <button
          class="px-4 py-2 rounded-full bg-gray-600 text-white hover:bg-slate-900"
          (click)="showTemplateAlert('md')">
          md
        </button>
        <button
          class="px-4 py-2 rounded-full bg-gray-600 text-white hover:bg-slate-900"
          (click)="showTemplateAlert('lg')">
          lg
        </button>
        <button
          class="px-4 py-2 rounded-full bg-gray-600 text-white hover:bg-slate-900"
          (click)="showTemplateAlert('xl')">
          xl
        </button>
        <button
          class="px-4 py-2 rounded-full bg-gray-600 text-white hover:bg-slate-900"
          (click)="showTemplateAlert('fullscreen')">
          fullscreen
        </button>
        <button
          class="px-4 py-2 rounded-full bg-gray-600 text-white hover:bg-slate-900"
          (click)="showHtmlAlert('xl')">
          Html xl
        </button>
        <button
          class="px-4 py-2 rounded-full bg-gray-600 text-white hover:bg-slate-900"
          (click)="showHtmlAlert('fullscreen')">
          Html fullscreen
        </button>                             
      </div>

  `
})
export class ContactComponent {
  i18n = inject(TranslationService);
  alert = inject(AlertService);
  notifications = inject(NotificationService);

  readonly errorIcon = CircleX;
  readonly warningIcon = TriangleAlert;
  readonly successIcon = Check;
  readonly textIcon = NotepadText;
  showInfo() {
    this.alert.showInfo(
      'This is an informational alert that closes automatically.',
      {
        autoCloseMs: 1500,
        onClose: () => console.log('Info closed'),
      }
    );
  }

  readonly large_message = 'Are you sure you want to continue?\n\n' +
    'This action may have important consequences and cannot be undone once it is completed.\n\n' +
    'Please take a moment to review the following considerations:\n\n' +
    '- Any unsaved changes will be permanently lost.\n' +
    '- Active processes related to this operation will be stopped immediately.\n' +
    '- Users currently depending on this resource may experience interruptions.\n\n' +
    'If you are unsure, it is recommended to cancel this action and review the configuration again.\n\n' +
    'Do you still want to proceed?';

  showWarning() {
    this.alert.showWarning(
      this.large_message,
      {
        title: 'Confirmation required',
        onConfirm: () => console.log('User confirmed'),
        onCancel: () => console.log('User cancelled'),
        size: 'md',
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
        literals: literals.noYes
      }
    );

    console.log('Confirm result:', result);
  }

  @ViewChild('htmlAlert') tpl!: TemplateRef<unknown>;

  showTemplateAlert(size: AlertSize = 'sm') {
    this.alert.showTemplate(this.tpl, {
      message: '',
      title: 'Template mode',
      showFooter: true,
      autoCloseMs: -1,
      size:size,
    });
  }

  showHtmlAlert(size: AlertSize = 'sm') {
    const html = `
      <div class="flex flex-col gap-3 p-4">
        <ul class="divide-y divide-slate-200 dark:divide-slate-700 ">
          ${Array.from({ length: 20 })
            .map(
              (_, i) => `
            <li class="py-3 flex items-center gap-3">
              <button type="button" 
                class="online-flex items-center justify-center rounded-md text-sm font-medium transition-colors
                bg-slate-900 dark:bg-slate-100
                text-white dark:text-slate-900
                hover:bg-slate-800 dark:hover:bg-slate-200
                py-2 px-6">
                  ${i + 1}
              </button>                 
              <div class="flex-1 justify-items-start text-left">
                <p class="font-medium text-slate-800 dark:text-slate-100">
                  Elemento ${i + 1}
                </p>
                <p class="text-sm text-slate-600 dark:text-slate-400">
                  Descripción larga del elemento ${i + 1}. Este texto está aquí
                  para forzar el crecimiento vertical del contenido y comprobar
                  cómo responde el scroll dentro del diálogo.
                </p>
              </div>
            </li>
          `
            )
            .join('')}
        </ul>

      </div>
      `;

    this.alert.showInfo(html, {
      asHtml: true, 
      icon: undefined, 
      disableClose: true,
      title: 'Html mode',
      subTitle: 'Este diálogo contiene una lista larga para probar el scroll vertical.',
      size:size,
    });
  }
}
