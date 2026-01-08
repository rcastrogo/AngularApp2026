import { Injectable } from '@angular/core';
import { NotificationType } from '~/components/app-notification-panel/app-notification-panel.component';

import { MSG_CLOSE_NOTIFICATION, MSG_SHOW_NOTIFICATION } from '~/core/messages';
import { pubSub } from '~/core/pubsub';

export interface NotificationInput {
  message: string;
  autoCloseMs?: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {

  show(message: string, autoCloseMs?: number, type: NotificationType = '') {
    pubSub.publish(MSG_SHOW_NOTIFICATION, {
      message,
      autoCloseMs,
      type
    });
  }

  success(message: string, autoCloseMs = 4000) {
    this.show(message, autoCloseMs, 'success');
  }

  info(message: string, autoCloseMs = 4000) {
    this.show(message, autoCloseMs, 'info');
  }

  warning(message: string, autoCloseMs = 6000) {
    this.show(message, autoCloseMs, 'warning');
  }

  error(message: string, autoCloseMs = 8000) {
    this.show(message, autoCloseMs, 'error');
  }

  close(id: number) {
    pubSub.publish(MSG_CLOSE_NOTIFICATION, id);
  }
}
