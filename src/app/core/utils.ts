/* eslint-disable @typescript-eslint/no-explicit-any */

import { TranslationService } from '~/services/translation.service';

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
  // if (!path) return item.toString();
  // const parts = path.split('.');
  // let current: any = item;

  // for (const part of parts) {
  //   if (current === null || typeof current !== 'object') return undefined;
  //   current = current[part];
  // }
  // return current;
  if (!path) return item;
  if (!path.includes('.')) return item?.[path];
  let current = item;
  for (const part of path.split('.')) {
    if (current == null) return undefined;
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
 * Extracts unique values from an array of objects based on a specified key.
 * @param data - The array of objects to process
 * @param key - The property key to extract unique values from
 * @returns An array of unique string values sorted in their original order of appearance
 */
function getUniqueValues(data:[], key: string) {
  return [...new Set(data.map((row) => String((row as any)[key])))];
}

function getUniqueValuesSorted<T>(
  values: T[],
  comparer?: (a: T, b: T) => number
): T[] {
  const set = new Set<T>();
  for (const v of values) {
    if (v !== null && v !== undefined) {
      set.add(v);
    }
  }
  return Array.from(set).sort(comparer);
}

const EMPTY = '__EMPTY__';
const NULL = '__NULL__';
const UNDEFINED = '__UNDEFINED__';

function normalizeValue(raw: unknown): string {
  if (raw === undefined) return UNDEFINED;
  if (raw === null) return NULL;
  if (raw === '') return EMPTY;
  return String(raw);
}

function displayValue(val: string, i18n?: TranslationService): string {
  switch (val) {
    case EMPTY: return i18n ? i18n.t('general.empty') : '(Vacío)';
    case NULL: return i18n ? i18n.t('general.null') : '(Nulo)';
    case UNDEFINED: return i18n ? i18n.t('general.undefined') : '(Indefinido)';
    default: return val;
  }
}

export {
  getSafeFormData,
  createMap,
  accentNumericComparer,
  normalizeNFD,
  getValueByPath,
  formatNumber,
  getUniqueValues,
  getUniqueValuesSorted,
  EMPTY,
  NULL,
  UNDEFINED,
  normalizeValue,
  displayValue,
};
