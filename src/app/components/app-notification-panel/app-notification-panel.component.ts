import {
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';

import {
  LucideAngularModule,
  LucideIconData,
  Info,
  TriangleAlert,
  CircleX,
  Check,
} from 'lucide-angular';

import { NOTIFICATION_POSITION, NotificationPosition } from '~/config/constans';
import {
  MSG_CLOSE_NOTIFICATION,
  MSG_SHOW_NOTIFICATION,
} from '~/core/messages';
import { pubSub } from '~/core/pubsub';
import { TranslationService } from '~/services/translation.service';

export type NotificationType = 'info' | 'error' | 'success' | 'warning' | '';

export interface NotificationInput {
  message: string;
  autoCloseMs?: number;
  type?: NotificationType;
}

export interface NotificationItem extends NotificationInput {
  id: number;
  closing: boolean;
  offsetX?: number;
  swiping?:boolean;
  swipeDirection?: 'left' | 'right';
  swipeClosing?: boolean;
}
const SWIPE_THRESHOLD = 100;
const POSITION_CLASS_MAP: Record<NotificationPosition, string> = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
};

let notificationId = 1;

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <div 
      class="fixed z-50 w-96 max-w-full flex flex-col gap-2"
      [class]="positionClass()"
      >
      @for (notification of notifications(); track notification.id) {
        <div
          class="relative bg-white dark:bg-gray-800
                 border border-gray-300 dark:border-gray-700
                 rounded-lg shadow-lg p-4"
                  [style.transform]="
                    notification.swiping
                      ? 'translateX(' + (notification.offsetX ?? 0) + 'px)'
                      : null
                  "
                  [style.--target.px]="notification.swipeDirection === 'right' ? 300 : -300"
                  [class.animate-slide-out-x]="notification.closing && notification.swipeClosing"
                  [class.animate-slide-out-y]="notification.closing && !notification.swipeClosing"
          style="touch-action: pan-y"
          (pointerdown)="onPointerDown($event, notification)"
          (pointermove)="onPointerMove($event, notification)"
          (pointerup)="onPointerUp(notification)"
          (pointercancel)="onPointerUp(notification)"
        >
          <button
            (click)="close(notification.id)"
            class="
              group absolute top-2 right-2 w-8 h-8 flex items-center justify-center               
              transition-colors
            "
            aria-label="Close notification"
          >
            <lucide-angular 
              [img]="closeIcon" 
              class="
                  size-6 shrink-0
                text-gray-500
                group-hover:text-gray-800
                dark:text-gray-400
                dark:group-hover:text-white
                transition-colors
              "></lucide-angular>
          </button>
          <div class="pr-8 flex items-start gap-3 text-sm text-gray-800 dark:text-gray-200">
            @if (notification.type) {
              <lucide-angular
                [img]="resolveIcon(notification)"
                class="size-6 shrink-0"
              ></lucide-angular>
            }

            <p class="wrap-break-word">
              {{ notification.message }}
            </p>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    /* Animación vertical (cerrado normal / auto-close) */
    @keyframes slideOutY {
      from {
        transform: translateY(0);
        opacity: 1;
      }
      to {
        transform: translateY(-8rem);
        opacity: 0;
      }
    }

    /* Animación horizontal (swipe) */
    @keyframes slideOutX {
      from {
        transform: translateX(var(--offset, 0px));
        opacity: 1;
      }
      to {
        transform: translateX(var(--target, 200px));
        opacity: 0;
      }
    }

    /* Clases */
    .animate-slide-out-y {
      animation: slideOutY 0.5s ease-in forwards;
    }

    .animate-slide-out-x {
      animation: slideOutX 0.3s ease-in forwards;
    }
  `],
})
export class AppNotificationPanel {

  readonly i18n = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly notifications = signal<NotificationItem[]>([]);
  readonly closeIcon = CircleX;

  constructor() {
    const subs = [
      pubSub.subscribe<string | NotificationInput>(
        MSG_SHOW_NOTIFICATION,
        (payload) => payload && this.show(payload)
      ),

      pubSub.subscribe<number>(
        MSG_CLOSE_NOTIFICATION,
        (id) => id && this.close(id)
      ),
    ];

    this.destroyRef.onDestroy(() => subs.forEach(unsub => unsub()));
  }

  positionClass = signal(
    POSITION_CLASS_MAP[NOTIFICATION_POSITION]
  );

  // ======================================================
  // API interna
  // ======================================================
  private show(payload: string | NotificationInput) {
    const input: NotificationInput =
      typeof payload === 'string'
        ? { message: payload, type: '' }
        : payload;

    const notification: NotificationItem = {
      id: notificationId++,
      message: input.message,
      autoCloseMs: input.autoCloseMs ?? 4000,
      closing: false,
      type: input.type,
    };

    this.notifications.update(list => [...list, notification]);

    if (notification.autoCloseMs && notification.autoCloseMs > 0) {
      setTimeout(
        () => this.close(notification.id), 
        notification.autoCloseMs
      );
    }
  }

  close(id: number, swipe = false) {
    this.notifications.update(list =>
      list.map(n =>
        n.id === id
          ? { ...n, closing: true, swipeClosing: swipe }
          : n
      )
    );

    setTimeout(() => {
      this.notifications.update(list =>
        list.filter(n => n.id !== id)
      )
    }, 500);
  }


  resolveIcon(notification: NotificationItem): (LucideIconData | undefined){
    if(notification.type){
      if(notification.type === 'error') return CircleX;
      if(notification.type === 'info') return Info;
      if(notification.type === 'warning') return TriangleAlert;
      if(notification.type === 'success') return Check;
    }
    return undefined;
  }

  private startX = 0;
  

  onPointerDown(ev: PointerEvent, n: NotificationItem) {
    this.startX = ev.clientX;

    this.notifications.update(list =>
      list.map(item =>
        item.id === n.id
          ? { ...item, swiping: true, offsetX: 0 }
          : item
      )
    );
  }

  onPointerMove(ev: PointerEvent, n: NotificationItem) {
    const delta = ev.clientX - this.startX;
    const offsetX = Math.max(-300, Math.min(300, delta));

    this.notifications.update(list =>
      list.map(item =>
        item.id === n.id && item.swiping
          ? { ...item, offsetX }
          : item
      )
    );
  }

  onPointerUp(n: NotificationItem) {
    const offsetX = n.offsetX ?? 0;
    const abs = Math.abs(offsetX);

    this.notifications.update(list =>
      list.map(item =>
        item.id === n.id
          ? {
              ...item,
              swiping: false,
              swipeDirection: offsetX > 0 ? 'right' : 'left',
            }
          : item
      )
    );

    if (abs > SWIPE_THRESHOLD) {
      this.close(n.id, true);
    } else {
      this.notifications.update(list =>
        list.map(item =>
          item.id === n.id
            ? { ...item, offsetX: 0 }
            : item
        )
      );
    }
  }
}
