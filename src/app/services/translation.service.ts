
import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';

import { MSG_LANGUAGE_CHANGE, MSG_LOADING_BEGINS, MSG_LOADING_END } from '~/core/messages';
import { pubSub } from '~/core/pubsub';

export type Language = 'es' | 'en';
export type Localizable = string | { key: string };

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

  private langVersionSignal = signal(0);
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
  }

  /**
   * Retrieves a translated string using a dot-notation key and optionally
   * interpolates dynamic parameters into the translation.
   *
   * @param key - The translation key using dot notation
   *              (e.g., 'common.welcome.message').
   * @param params - Optional object containing values to interpolate into
   *                 the translated string. Placeholders must be defined
   *                 using double curly braces (e.g., {{name}}, {{count}}).
   *
   * @returns The translated and interpolated string. If the translation
   *          key is not found, the key itself is returned.
   *
   * @example Basic usage
   * ```ts
   * this.t('greetings.hello');
   * ```
   *
   * @example With interpolation parameters
   * ```ts
   * this.t('greetings.welcome', { name: 'John' });
   * // Translation: "Welcome {{name}}"
   * // Result: "Welcome John"
   * ```
   *
   * @example Multiple parameters
   * ```ts
   * this.t('table.summary', { count: 5, page: 2 });
   * // Translation: "Page {{page}} - {{count}} items"
   * // Result: "Page 2 - 5 items"
   * ```
   */
  t(key: string, params?: Record<string, string | number>): string {
    const value = key.split('.').reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (acc: any, part) => acc?.[part],
      this.translations
    );

    if (typeof value !== 'string') return key;
    if (!params) return value;
    return value.replace(/\{\{(\w+)\}\}/g, (_, param) => {
      return param in params ? String(params[param]) : `{{${param}}}`;
    });
  }

  /**
   * Resolves a translatable value to its translated string representation.
   * @param value - The value to resolve, either a string key or a Localizable object containing a key property.
   * @param params - Optional record of parameters to interpolate into the translated string.
   * @returns The translated string with any parameters interpolated.
   */
  resolve(value: Localizable, params?: Record<string, string | number>): string {
    const key = (typeof value === 'string') ? value : value.key;
    return this.t(key, params);
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
        this.langVersionSignal.update(v => v + 1);           
        localStorage.setItem('lang', lang);     
        pubSub.publish(MSG_LANGUAGE_CHANGE, lang);
        pubSub.publish(MSG_LOADING_END);        
        console.log('Language loaded: ' + lang + ' ' + this.langVersion)
      });
  }

  public readonly langVersion = this.langVersionSignal.asReadonly();

}
