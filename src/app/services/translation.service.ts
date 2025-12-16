
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { MSG_LANGUAGE_CHANGE, MSG_LOADING_BEGINS, MSG_LOADING_END } from '~/core/messages';
import { pubSub } from '~/core/pubsub';

export type Language = 'es' | 'en';

/**
 * Service for managing application translations and language settings.
 * 
 * Provides functionality to load translation files, switch languages, and retrieve
 * translated strings using dot-notation keys. Publishes language change events
 * through the pub/sub system.
 * 
 * @example
 * ```typescript
 * constructor(private translation: TranslationService) {}
 * 
 * getWelcomeMessage(): string {
 *   return this.translation.t('common.welcome');
 * }
 * 
 * changeLanguage(lang: string): void {
 *   this.translation.setLanguage(lang);
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class TranslationService {

  private readonly http = inject(HttpClient);

  /**
   * Current language code.
   * @private
   */
  private lang:Language = 'es';

  /**
   * Loaded translation objects keyed by language.
   * @private
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private translations: Record<string, any> | undefined = undefined;

  /**
   * Creates an instance of TranslationService.
   * Initializes with the default language ('es').
   * 
   */
  constructor() {
    const saved = localStorage.getItem('lang') as Language;
    this.setLanguage(saved || 'es');
  }

  /**
   * Gets the currently active language code.
   * 
   * @returns The current language code
   */
  public getLang(): Language { 
    return this.lang;
  }

  /**
   * Sets the application language and loads the corresponding translation file.
   * 
   * @param lang - The language code to switch to
   */
  setLanguage(lang: Language) {
    if(lang === this.lang && this.translations) return;
    this.lang = lang;
    this.load(lang);
    localStorage.setItem('lang', lang);
  }

  /**
   * Retrieves a translated string using dot-notation key.
   * 
   * @param key - The translation key (e.g., 'common.welcome.message')
   * @returns The translated string, or the key itself if translation not found
   * 
   * @example
   * ```typescript
   * const greeting = this.t('greetings.hello'); // Returns translated value
   * ```
   */
  t(key: string): string {
    const v = key.split('.').reduce(
      (acc, part) => acc?.[part],
      this.translations
    );
    return v ? String(v) : key;
  }

  /**
   * Loads translation file for the specified language.
   * Publishes a language change event upon successful load.
   * 
   * @param lang - The language code to load translations for
   * @private
   */
  private load(lang: string) {
    pubSub.publish(MSG_LOADING_BEGINS);
    this.http
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .get<Record<string, any>>(`/assets/i18n/${lang}/translation.json`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .subscribe((data:Record<string, any>) => {
        this.translations = data;
        pubSub.publish(MSG_LANGUAGE_CHANGE, lang);
        console.log('Language loaded: ' + lang)
        pubSub.publish(MSG_LOADING_END);
      });
  }
}
