const LANGUAGE_STORAGE_KEY = 'ks_locale';
const SUPPORTED_LOCALES = {
  hi: { label: 'Hindi', native: 'हिंदी', direction: 'ltr' },
  en: { label: 'English', native: 'English', direction: 'ltr' },
  bn: { label: 'Bengali', native: 'বাংলা', direction: 'ltr' }
};

function getStoredLocale() {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return stored && SUPPORTED_LOCALES[stored] ? stored : '';
  } catch (e) {
    return '';
  }
}

function setStoredLocale(locale) {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, locale);
  } catch (e) {
    // Local storage may be unavailable; ignore.
  }
}

function detectLocaleFromBrowser() {
  const nav = (navigator.language || navigator.languages?.[0] || 'en').toLowerCase();
  if (nav.startsWith('hi')) return 'hi';
  if (nav.startsWith('bn')) return 'bn';
  return 'en';
}

async function loadLocale(locale) {
  const response = await fetch(`/i18n/${locale}.json`);
  if (!response.ok) {
    throw new Error(`Unable to load locale ${locale}`);
  }
  return response.json();
}

function buildLiteralLookup(fallbackTranslations, translations) {
  const lookup = new Map();
  Object.entries(fallbackTranslations || {}).forEach(([key, englishText]) => {
    if (!englishText || !translations[key]) return;
    lookup.set(String(englishText).trim(), String(translations[key]));
  });
  return lookup;
}

function applyI18n(translations, locale, fallbackTranslations = {}) {
  const all = Array.from(document.querySelectorAll('[data-i18n]'));
  all.forEach((element) => {
    const key = element.getAttribute('data-i18n');
    if (translations[key]) {
      element.textContent = translations[key];
    }
  });

  const placeholders = Array.from(document.querySelectorAll('[data-i18n-placeholder]'));
  placeholders.forEach((element) => {
    const key = element.getAttribute('data-i18n-placeholder');
    if (translations[key]) {
      element.placeholder = translations[key];
    }
  });

  const ariaLabels = Array.from(document.querySelectorAll('[data-i18n-aria]'));
  ariaLabels.forEach((element) => {
    const key = element.getAttribute('data-i18n-aria');
    if (translations[key]) {
      element.setAttribute('aria-label', translations[key]);
    }
  });

  const lookup = buildLiteralLookup(fallbackTranslations, translations);
  const bodies = Array.from(document.querySelectorAll('body *'));
  bodies.forEach((element) => {
    if (element.hasAttribute('data-i18n') || element.querySelector('[data-i18n]')) return;
    const plain = String(element.textContent || '').trim();
    if (!plain || plain.length < 2 || !lookup.has(plain)) return;
    element.textContent = lookup.get(plain);
  });

  const languageButton = document.getElementById('language-toggle');
  if (languageButton) {
    const selected = SUPPORTED_LOCALES[locale] || SUPPORTED_LOCALES.en;
    languageButton.innerHTML = `${selected.native} ${selected.label}`;
  }

  document.documentElement.setAttribute('lang', locale);
  document.documentElement.setAttribute('dir', SUPPORTED_LOCALES[locale].direction);
}

function buildLanguageModal() {
  const modal = document.createElement('div');
  modal.className = 'language-modal';
  modal.id = 'language-modal';
  modal.innerHTML = `
    <div class="language-modal-backdrop"></div>
    <div class="language-modal-panel">
      <button class="language-close" type="button" aria-label="Close">×</button>
      <div class="language-modal-header">
        <span class="kicker">Kisaan Setu</span>
        <h2 class="language-title">Choose your language</h2>
        <p class="language-subtitle">Select the language you prefer for your experience.</p>
      </div>
      <div class="language-options">
        <button class="language-option" type="button" data-locale="hi">
          <span class="language-name">हिंदी</span>
          <span class="language-detail">Hindi</span>
        </button>
        <button class="language-option" type="button" data-locale="en">
          <span class="language-name">English</span>
          <span class="language-detail">English</span>
        </button>
        <button class="language-option" type="button" data-locale="bn">
          <span class="language-name">বাংলা</span>
          <span class="language-detail">Bengali</span>
        </button>
      </div>
      <div class="language-confirm-row">
        <button class="btn btn-primary language-continue" type="button">Continue</button>
      </div>
    </div>
  `;
  return modal;
}

function buildLanguageSwitcher() {
  const navActions = document.querySelector('.nav-actions');
  if (!navActions || navActions.querySelector('#language-toggle')) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'language-toggle';
  button.className = 'language-toggle';
  button.setAttribute('aria-label', 'Choose language');
  const locale = getStoredLocale() || detectLocaleFromBrowser();
  const label = SUPPORTED_LOCALES[locale] || SUPPORTED_LOCALES.en;
  button.innerHTML = `${label.native} ${label.label}`;
  button.addEventListener('click', () => {
    openLanguageModal(getStoredLocale() || detectLocaleFromBrowser());
  });

  navActions.appendChild(button);
}

function openLanguageModal(startLocale) {
  const modal = buildLanguageModal();
  const options = Array.from(modal.querySelectorAll('[data-locale]'));
  const selected = startLocale || getStoredLocale() || detectLocaleFromBrowser();

  options.forEach((option) => {
    option.classList.toggle('chosen', option.dataset.locale === selected);
  });

  options.forEach((option) => {
    option.addEventListener('click', () => {
      options.forEach((btn) => btn.classList.toggle('chosen', btn === option));
    });
  });

  modal.querySelector('.language-continue').addEventListener('click', () => {
    const chosen = modal.querySelector('[data-locale].chosen') || options[0];
    const locale = chosen.dataset.locale;
    setStoredLocale(locale);

    Promise.all([
      loadLocale('en'),
      loadLocale(locale)
    ])
      .then(([fallbackTranslations, translations]) => applyI18n(translations, locale, fallbackTranslations))
      .catch((err) => console.warn('[i18n] failed to load locale', err));

    modal.classList.add('language-modal-hidden');
    setTimeout(() => modal.remove(), 300);
  });

  modal.querySelector('.language-close').addEventListener('click', () => {
    modal.classList.add('language-modal-hidden');
    setTimeout(() => modal.remove(), 300);
  });

  document.body.appendChild(modal);
  modal.classList.add('language-modal-visible');
}

async function bootLanguageFlow() {
  const existing = getStoredLocale();
  const selectedLocale = existing || detectLocaleFromBrowser();

  try {
    const [fallbackTranslations, translations] = await Promise.all([
      loadLocale('en'),
      loadLocale(selectedLocale)
    ]);
    applyI18n(translations, selectedLocale, fallbackTranslations);
  } catch (e) {
    console.warn('[i18n] failed to load locale', e);
  }

  if (!existing) {
    openLanguageModal(selectedLocale);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const menu = document.querySelector('.mobile-menu');
  if (menu) {
    menu.addEventListener('click', () => {
      body.classList.toggle('mobile-nav-open');
    });
  }

  const roleCards = Array.from(document.querySelectorAll('.role-option'));
  roleCards.forEach((card) => {
    card.addEventListener('click', () => {
      roleCards.forEach((r) => r.classList.toggle('active', r === card));
    });
  });

  const forms = Array.from(document.querySelectorAll('form[data-validate]'));
  forms.forEach((form) => {
    form.addEventListener('submit', (event) => {
      const required = Array.from(form.querySelectorAll('[required]'));
      const valid = required.every((field) => {
        if (field.type === 'file') return field.files.length > 0;
        return String(field.value || '').trim().length > 0;
      });
      if (!valid) {
        event.preventDefault();
        alert('Please complete all required listing details before continuing.');
      }
    });
  });

  const navLinks = Array.from(document.querySelectorAll('.main-nav a'));
  const current = location.pathname.split('/').pop() || 'index.html';
  navLinks.forEach((link) => {
    if ((link.getAttribute('href') || '').endsWith(current)) {
      link.classList.add('active');
    }
  });

  buildLanguageSwitcher();
  bootLanguageFlow().catch((err) => {
    console.warn('[i18n] locale boot failed', err);
  });
});
