/* eslint-disable @typescript-eslint/no-explicit-any */

import { Localizable } from "~/components/app-table/app-table.component";
import { TranslationService } from "~/services/translation.service";

/**
 * Returns a sanitized object from a FormData instance, trimming whitespace
 * from string values and preserving file entries as-is.
 *
 * @param {FormData} formData - The FormData object to process.
 * @returns {Record<string, string>} - A key-value object containing cleaned string values.
 *   Non-string values (e.g., File objects) are left unchanged.
 *
 * @example
 * const formData = new FormData();
 * formData.append('name', '  Alice  ');
 * formData.append('cv_file', new File([], 'cv.pdf'));
 *
 * const safeData = getSafeFormData(formData);
 * // → { name: "Alice", cv_file: File }
 */
const getSafeFormData = (formData: FormData): Record<string, string> => {
  const entries = Array.from(formData.entries());
  const cleanedEntries = entries.map(([key, value]) => {
    if (typeof value === 'string') return [key, value.trim()];
    return [key, value];
  });
  return Object.fromEntries(cleanedEntries);
};


/**
 * Creates a simple map (dictionary) from an array of objects.
 * Each entry maps `item[idKey]` → `item[nameKey]`.
 *
 * @template T
 * @param {T[]} array - The array of objects to convert.
 * @param {keyof T} [idKey='id'] - The property name to use as the key.
 * @param {keyof T} [nameKey='name'] - The property name to use as the value.
 * @returns {Record<string | number, string>} A map of IDs to names.
 *
 * @example
 * const roles = [
 *   { id: 1, name: "Developer" },
 *   { id: 2, name: "Manager" }
 * ];
 * const map = createMap(roles);
 * // map = { 1: "Developer", 2: "Manager" }
 */
// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
function createMap(array: any[], idKey = 'id', nameKey = 'name'): { [k: string]: any; } {
  if (!Array.isArray(array)) return {};
  return Object.fromEntries(array.map(item => [item[idKey], getValueByPath(item , nameKey)]));
}

/**
 * Retrieves a value from an object using a dot-notation path string.
 * @param item - The object to retrieve the value from.
 * @param path - A dot-separated string path (e.g., 'user.profile.name'). If empty, returns the string representation of the item.
 * @returns The value at the specified path, or `undefined` if the path is invalid or any intermediate value is null or not an object.
 * @example
 * const obj = { user: { name: 'John', age: 30 } };
 * getValueByPath(obj, 'user.name'); // 'John'
 * getValueByPath(obj, 'user.age'); // 30
 * getValueByPath(obj, 'user.email'); // undefined
 */
function getValueByPath (item: any, path: string): any {
  if (!path) return item.toString();
  const parts = path.split('.');
  let current: any = item;

  for (const part of parts) {
    if (current === null || typeof current !== 'object') return undefined;
    current = current[part];
  }
  return current;
}

export type NestedPaths<T> = T extends object
  ? {
    [K in keyof T]-?: K extends string
    ? `${K}` | `${K}.${NestedPaths<T[K]>}`
    : never;
  }[keyof T]
  : '';

/**
 * Compares two strings using locale-aware comparison with accent sensitivity and numeric ordering.
 * @param a - The first string to compare
 * @param b - The second string to compare
 * @returns A negative number if a comes before b, a positive number if a comes after b, or 0 if they are equal
 */
function accentNumericComparer(a: string, b: string){
  return a.localeCompare(b, undefined, { sensitivity: 'accent', numeric: true });
}

/**
 * Normalizes a string by removing diacritical marks and converting to lowercase.
 * 
 * @param value - The string to normalize
 * @returns The normalized string with diacritical marks removed and converted to lowercase
 * 
 * @example
 * normalizeNFD('Café') // returns 'cafe'
 * normalizeNFD('Naïve') // returns 'naive'
 */
const normalizeNFD = (value: string) => {
  return value.normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase();
}

/**
 * Formats a number according to the specified locale.
 * @param value - The number to format.
 * @param lng - The locale language code. Defaults to 'es' (Spanish).
 * @returns A formatted string representation of the number.
 */
const formatNumber = (value: number, lng = 'es') => new Intl.NumberFormat(lng).format(value);

/**
 * Resolves a display string from a Localizable value.
 *
 * If the provided value is already a plain string, it is returned unchanged.
 * Otherwise the value is treated as a Localizable object (expected to contain
 * a `key` property) and the translation service is used to look up and return
 * the corresponding localized string.
 *
 * @param value - The value to resolve. Can be a plain string or a Localizable
 *   object (e.g. `{ key: string }`).
 * @param i18n - The translation service used to translate keys. The function
 *   calls `i18n.t(value.key, params)` when `value` is not a string.
 * @param params - Optional interpolation parameters passed to the translation
 *   service (a map of placeholder names to string or number values).
 *
 * @returns The resolved string: either the original string value or the
 *   translation returned by the translation service.
 *
 * @remarks
 * - This function is synchronous and forwards any errors thrown by the
 *   translation service.
 * - The exact shape of the Localizable type and the behavior of `i18n.t` are
 *   defined elsewhere; this helper assumes `value` has a `key: string` when it
 *   is not a string.
 *
 * @example
 * // value is a plain string
 * resolveText("Direct text", i18n);
 *
 * @example
 * // value is a Localizable object with interpolation params
 * resolveText({ key: "greeting" }, i18n, { name: "Alice" });
 */
const resolveText = ( 
  value: Localizable, i18n: TranslationService, params?: Record<string, string | number>
) => {
  if (typeof value === 'string') return value;
  return i18n.t(value.key, params);
}

export {
  getSafeFormData,
  createMap,
  accentNumericComparer,
  normalizeNFD,
  getValueByPath,
  formatNumber,
  resolveText
};
