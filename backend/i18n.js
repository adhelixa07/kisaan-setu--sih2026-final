const fs = require('fs');
const path = require('path');

const SUPPORTED_LOCALES = ['hi', 'en', 'bn'];
const DEFAULT_LOCALE = 'en';
const translations = {};

for (const locale of SUPPORTED_LOCALES) {
  const filePath = path.join(__dirname, 'lang', `${locale}.json`);
  translations[locale] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeLocale(value) {
  const locale = String(value || '').trim().toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
}

function localeFromRequest(req) {
  const requested = req.get('x-locale') || req.query.locale;
  if (requested) return normalizeLocale(requested);

  const accepted = req.get('accept-language') || '';
  const preferred = accepted.split(',')[0];
  return normalizeLocale(preferred);
}

function interpolate(value, params = {}) {
  return value.replace(/\{(\w+)\}/g, (match, key) => (
    Object.prototype.hasOwnProperty.call(params, key) ? params[key] : match
  ));
}

function t(locale, key, params) {
  const activeLocale = normalizeLocale(locale);
  const value = translations[activeLocale][key] ?? translations[DEFAULT_LOCALE][key] ?? key;
  return typeof value === 'string' ? interpolate(value, params) : value;
}

function i18nMiddleware(req, res, next) {
  req.locale = localeFromRequest(req);
  req.t = (key, params) => t(req.locale, key, params);
  res.set('Content-Language', req.locale);
  next();
}

module.exports = {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  normalizeLocale,
  localeFromRequest,
  i18nMiddleware,
  t,
  translations
};
