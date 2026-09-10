/**
 * Kisaan Setu i18n utility.
 * - Loads the active locale's JSON translation file.
 * - Applies translations to any element with a `data-i18n` attribute (text
 *   content), `data-i18n-placeholder` (input placeholder), or
 *   `data-i18n-aria` (aria-label) attribute.
 * - Exposes `t(key, params)` for JS-generated markup and the voice assistant.
 */

const SUPPORTED_LOCALES = ['hi', 'en', 'bn'];
const DEFAULT_LOCALE = 'en';
const STORAGE_KEY = 'ks_locale';

let translations = {};
let activeLocale = DEFAULT_LOCALE;
const readyCallbacks = [];

function getStoredLocale() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return SUPPORTED_LOCALES.includes(stored) ? stored : null;
  } catch (err) {
    return null;
  }
}

function setStoredLocale(locale) {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch (err) {
    // localStorage may be unavailable (private browsing); ignore.
  }
}

async function loadLocale(locale) {
  const res = await fetch(`/i18n/${locale}.json`);
  if (!res.ok) throw new Error(`Failed to load translations for ${locale}`);
  return res.json();
}

/** Interpolates {param} placeholders in a translation string. */
function interpolate(str, params) {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (match, key) => (key in params ? params[key] : match));
}

/** Translate a key, with optional interpolation params. Falls back to the key itself if missing. */
function t(key, params) {
  const raw = translations[key];
  if (raw === undefined) {
    console.warn(`[i18n] missing key: ${key}`);
    return key;
  }
  return interpolate(raw, params);
}

/** Applies translations to the current DOM. Safe to call repeatedly (e.g. after dynamic render). */
function applyToDom(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
  });
  root.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
  });
  document.documentElement.setAttribute('lang', activeLocale);
}

async function setLocale(locale) {
  if (!SUPPORTED_LOCALES.includes(locale)) locale = DEFAULT_LOCALE;
  translations = await loadLocale(locale);
  activeLocale = locale;
  setStoredLocale(locale);
  applyToDom();
  document.dispatchEvent(new CustomEvent('i18n:changed', { detail: { locale } }));
}

function getLocale() {
  return activeLocale;
}

function onReady(cb) {
  readyCallbacks.push(cb);
}

async function init() {
  const stored = getStoredLocale();
  const initial = stored || DEFAULT_LOCALE;
  await setLocale(initial);
  readyCallbacks.forEach((cb) => cb());
}

// Auto-init on load so every page just needs to import this module.
document.addEventListener('DOMContentLoaded', () => {
  init().catch((err) => console.error('[i18n] init failed:', err));
});

export { t, setLocale, getLocale, applyToDom, onReady, SUPPORTED_LOCALES, DEFAULT_LOCALE };