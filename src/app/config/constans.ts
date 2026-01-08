
export const APP_VERSION = '1.00';
export const APP_DEV = window.location.hostname.toLowerCase() === 'localhost';
export const APP_BASENAME = document.querySelector('base')?.getAttribute('href') || '/';


// LocalStorage namespace to avoid key collisions
export const LOCAL_STORAGE_ROOT = "angular-app.";
export const DEFAULT_LANGUAGE = "en";

// Nofication position
export type NotificationPosition =
  | 'top-right'
  | 'top-left'
  | 'top-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center';
export const NOTIFICATION_POSITION: NotificationPosition = 'top-center';
