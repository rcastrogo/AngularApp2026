import {
  ApplicationRef,
  ComponentRef,
  EnvironmentInjector,
  Injectable,
  TemplateRef,
  createComponent,
  inject,
} from '@angular/core';

import {
  Info,
  TriangleAlert,
  X,
  Check,
  CircleQuestionMark,
} from 'lucide-angular';

import { AlertComponent, AlertOptions } from '~/components/app-alert/app-alert.component';

@Injectable({ providedIn: 'root' })
export class AlertService {

  private appRef = inject(ApplicationRef);
  private injector = inject(EnvironmentInjector);
  private alertRef?: AlertComponent;
  private componentRef?: ComponentRef<AlertComponent>;


  // =====================================================
  // API pública
  // =====================================================

  showLoading(message: string){
    const html = `
      <div class="flex flex-col items-center gap-3 justify-center m-1">
        ${message}  
        <div class="h-1 w-full overflow-hidden rounded-full bg-red-700 mb-1">
          <div class="h-full w-full origin-left animate-[progress_2.5s_infinite_linear] bg-gray-400"></div>        
        </div>
      </div>
    `;
    this.showInfo(html, { asHtml: true, icon: undefined, disableClose: true, });
  }

  showInfo(message: string, options?: Partial<AlertOptions>) {
    this.show({
      icon: Info,
      message,
      showFooter: false,
      ...options,
    });
  }

  showSuccess(message: string, options?: Partial<AlertOptions>) {
    this.show({
      icon: Check,
      message,
      showFooter: false,
      ...options,
    });
  }

  showWarning(message: string, options?: Partial<AlertOptions>) {
    this.show({
      icon: TriangleAlert,
      message,
      showFooter: true,
      ...options,
    });
  }

  showError(message: string, options?: Partial<AlertOptions>) {
    this.show({
      icon: X,
      message,
      showFooter: true,
      ...options,
    });
  }

  showQuestion(message: string, options?: Partial<AlertOptions>) {
    this.show({
      icon: CircleQuestionMark,
      message,
      showFooter: true,
      ...options,
    });
  }

  confirm(message: string, options?: Partial<AlertOptions>): Promise<boolean> {
    return new Promise(resolve => {
      this.show({
        message,
        showFooter: true,
        icon: CircleQuestionMark,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
        showConfirmButton: true,
        ...options,
      });
    });
  }

  showTemplate(template: TemplateRef<unknown>, options: AlertOptions = {message: ''}) {
    this.show({
      ...options,
      asTemplate: true,
      template,
    });
  }

  close() {
    this.alertRef?.close();
  }

  // =====================================================
  // Core
  // =====================================================

  private show(options: AlertOptions) {
    this.destroy();

    this.componentRef = createComponent(AlertComponent, {
      environmentInjector: this.injector,
    });

    this.alertRef = this.componentRef.instance;

    this.alertRef.setOptions(options);

    this.appRef.attachView(this.componentRef.hostView);
    document.body.appendChild(this.componentRef.location.nativeElement);

    this.alertRef.confirmed.subscribe(() => options.onConfirm?.());
    this.alertRef.cancelled.subscribe(() => options.onCancel?.());

    this.alertRef.closed.subscribe(() => {
      options.onClose?.();
      this.destroy();
    });

    this.alertRef.open();
  }

  private destroy() {
    if (!this.componentRef) return;
    this.appRef.detachView(this.componentRef.hostView);
    this.componentRef.destroy();
    this.componentRef = undefined;
  }
}
