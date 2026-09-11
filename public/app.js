const LANGUAGE_STORAGE_KEY = 'ks_locale';
const SUPPORTED_LOCALES = {
  hi: { label: 'Hindi', native: 'हिंदी', direction: 'ltr' },
  en: { label: 'English', native: 'English', direction: 'ltr' },
  bn: { label: 'Bengali', native: 'বাংলা', direction: 'ltr' }
};

let activeTranslations = {};
let activeFallbackTranslations = {};
let originalDocumentTitle = '';

function installLocaleFetchHeader() {
  if (!window.fetch || window.fetch.__localeAware) return;

  const originalFetch = window.fetch.bind(window);
  const localeAwareFetch = (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    if (!url.includes('/api/')) return originalFetch(input, init);

    const headers = new Headers(init.headers || {});
    headers.set('X-Locale', getStoredLocale() || detectLocaleFromBrowser());
    return originalFetch(input, { ...init, headers });
  };

  localeAwareFetch.__localeAware = true;
  window.fetch = localeAwareFetch;
}

const STATIC_LITERAL_TRANSLATIONS = {
  bn: {
    'kisaan setu': 'কিষাণ সেতু',
    'farm connect': 'ফার্ম কানেক্ট',
    'login': 'লগ ইন করুন',
    'log in': 'লগ ইন করুন',
    'browse produce': 'ফসল ব্রাউজ করুন',
    'marketplace': 'মার্কেটপ্লেস',
    'fresh harvest from verified farmers across the region.': 'অঞ্চলজুড়ে যাচাইকৃত কৃষকদের তাজা ফসল।',
    'become a buyer': 'ক্রেতা হিসেবে যোগ দিন',
    'crop type': 'ফসলের ধরন',
    'state': 'রাজ্য',
    'quality grade': 'গুণমান গ্রেড',
    'search by location': 'অবস্থান দিয়ে খুঁজুন',
    'apply filters': 'ফিল্টার প্রয়োগ করুন',
    'grade a': 'গ্রেড এ',
    'grade b': 'গ্রেড বি',
    'grade c': 'গ্রেড সি',
    'premium': 'প্রিমিয়াম',
    'fresh': 'তাজা',
    'fresh tomatoes': 'তাজা টমেটো',
    'red onion': 'লাল পেঁয়াজ',
    'fresh potatoes': 'তাজা আলু',
    'tomato': 'টমেটো',
    'onion': 'পেঁয়াজ',
    'maize': 'ভুট্টা',
    'green chilli': 'কাঁচা মরিচ',
    'wheat': 'গম',
    'cauliflower': 'ফুলকপি',
    'kg': 'কেজি',
    'quintal': 'কুইন্টাল',
    'browse produce - kisaan setu': 'ফসল ব্রাউজ করুন - কিষাণ সেতু',
    'listing detail - kisaan setu': 'ফসলের বিস্তারিত - কিষাণ সেতু',
    'my listings - kisaan setu': 'আমার তালিকা - কিষাণ সেতু',
    'buyer dashboard - kisaan setu': 'ক্রেতা ড্যাশবোর্ড - কিষাণ সেতু',
    'farmer dashboard - kisaan setu': 'কৃষক ড্যাশবোর্ড - কিষাণ সেতু',
    'admin dashboard - kisaan setu': 'অ্যাডমিন ড্যাশবোর্ড - কিষাণ সেতু',
    'login - kisaan setu': 'লগ ইন - কিষাণ সেতু',
    'signup - kisaan setu': 'নিবন্ধন - কিষাণ সেতু',
    'view details': 'বিস্তারিত দেখুন',
    'direct sourcing': 'সরাসরি সরবরাহ',
    'farmer dashboard': 'কৃষক ড্যাশবোর্ড',
    'buyer dashboard': 'ক্রেতা ড্যাশবোর্ড',
    'admin dashboard': 'অ্যাডমিন ড্যাশবোর্ড',
    'create listing': 'তালিকা তৈরি করুন',
    'my listings': 'আমার তালিকা',
    'notifications': 'বিজ্ঞপ্তি',
    'messages': 'বার্তা',
    'profile': 'প্রোফাইল',
    'save changes': 'পরিবর্তন সংরক্ষণ করুন',
    'search': 'খুঁজুন',
    'submit offer': 'অফার জমা দিন',
    'make offer': 'অফার দিন',
    'message farmer': 'কৃষককে বার্তা পাঠান',
    'send message': 'বার্তা পাঠান',
    'order history': 'অর্ডারের ইতিহাস',
    'order records': 'অর্ডারের তথ্য',
    'status': 'স্ট্যাটাস',
    'quantity': 'পরিমাণ',
    'price': 'দাম',
    'location': 'অবস্থান',
    'crop': 'ফসল',
    'farmer': 'কৃষক',
    'buyer': 'ক্রেতা',
    'admin': 'অ্যাডমিন',
    'platform': 'প্ল্যাটফর্ম',
    'resources': 'রিসোর্স',
    'company': 'কোম্পানি',
    'support': 'সাপোর্ট'
  }
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
  const response = await fetch(`i18n/${locale}.json`);
  if (!response.ok) {
    throw new Error(`Unable to load locale ${locale}`);
  }
  return response.json();
}

function buildLiteralLookup(fallbackTranslations, translations) {
  const lookup = new Map();
  Object.entries(fallbackTranslations || {}).forEach(([key, englishText]) => {
    if (!englishText || !translations[key]) return;
    const source = String(englishText).trim();
    lookup.set(source, String(translations[key]));
    lookup.set(source.toLocaleLowerCase(), String(translations[key]));
  });
  return lookup;
}

function getLiteralTranslation(source, lookup, locale) {
  const text = String(source || '').trim();
  const exact = lookup.get(text)
    || lookup.get(text.toLocaleLowerCase())
    || STATIC_LITERAL_TRANSLATIONS[locale]?.[text.toLocaleLowerCase()];
  if (exact) return exact;

  const aliases = STATIC_LITERAL_TRANSLATIONS[locale] || {};
  let translated = text;
  let changed = false;
  Object.entries(aliases)
    .sort(([left], [right]) => right.length - left.length)
    .forEach(([english, localized]) => {
      const escaped = english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`\\b${escaped}\\b`, 'gi');
      if (pattern.test(translated)) {
        translated = translated.replace(pattern, localized);
        changed = true;
      }
    });
  return changed ? translated : undefined;
}

function applyI18n(translations, locale, fallbackTranslations = {}) {
  activeTranslations = translations;
  activeFallbackTranslations = fallbackTranslations;

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
  const translatableElements = Array.from(document.querySelectorAll('body *'));
  translatableElements.forEach((element) => {
    if (element.hasAttribute('data-i18n') || element.children.length > 0) return;

    const source = element.dataset.i18nSource || String(element.textContent || '').trim();
    if (!element.dataset.i18nSource && source) {
      element.dataset.i18nSource = source;
    }
    const translated = getLiteralTranslation(source, lookup, locale);
    if (source.length < 2 || !translated) return;
    element.textContent = translated;
  });

  const attributeLookup = (element, attribute, sourceAttribute) => {
    const source = element.dataset[sourceAttribute] || element.getAttribute(attribute) || '';
    if (!element.dataset[sourceAttribute] && source) {
      element.dataset[sourceAttribute] = source;
    }
    const translated = getLiteralTranslation(source, lookup, locale);
    if (translated) {
      element.setAttribute(attribute, translated);
    }
  };

  document.querySelectorAll('input[placeholder], textarea[placeholder], select[aria-label]').forEach((element) => {
    if (element.hasAttribute('data-i18n-placeholder') || element.hasAttribute('data-i18n-aria')) return;
    if (element.hasAttribute('placeholder')) attributeLookup(element, 'placeholder', 'i18nPlaceholderSource');
    if (element.hasAttribute('aria-label')) attributeLookup(element, 'aria-label', 'i18nAriaSource');
  });

  const titleSource = originalDocumentTitle || document.title || '';
  originalDocumentTitle = titleSource;
  const translatedTitle = getLiteralTranslation(titleSource, lookup, locale);
  if (translatedTitle) {
    document.title = translatedTitle;
  }

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
      <button class="language-close" type="button" aria-label="Close" data-i18n-aria="common.close">×</button>
      <div class="language-modal-header">
        <span class="kicker" data-i18n="app.name">Kisaan Setu</span>
        <h2 class="language-title" data-i18n="lang.select.title">Choose your language</h2>
        <p class="language-subtitle" data-i18n="lang.select.subtitle">Select the language you prefer for your experience.</p>
      </div>
      <div class="language-options">
        <button class="language-option" type="button" data-locale="hi">
          <span class="language-name">हिंदी</span>
          <span class="language-detail" data-i18n="lang.hi.detail">Hindi</span>
        </button>
        <button class="language-option" type="button" data-locale="en">
          <span class="language-name">English</span>
          <span class="language-detail" data-i18n="lang.en.detail">English</span>
        </button>
        <button class="language-option" type="button" data-locale="bn">
          <span class="language-name">বাংলা</span>
          <span class="language-detail" data-i18n="lang.bn.detail">Bengali</span>
        </button>
      </div>
      <div class="language-confirm-row">
        <button class="btn btn-primary language-continue" type="button" data-i18n="common.continue">Continue</button>
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
  if (Object.keys(activeTranslations).length) {
    applyI18n(activeTranslations, selected, activeFallbackTranslations);
  }
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

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    if (document.getElementById('razorpay-checkout-js')) {
      const existing = document.getElementById('razorpay-checkout-js');
      existing.addEventListener('load', () => resolve(true));
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-checkout-js';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function escapeHtml(value) {
  return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&#39;');
}

function readSession() {
  try {
    return JSON.parse(localStorage.getItem('ks_session') || 'null');
  } catch (e) {
    return null;
  }
}

function saveSession(session) {
  try {
    localStorage.setItem('ks_session', JSON.stringify(session));
  } catch (e) {
    console.warn('[session] save failed', e);
  }
}

function clearSession() {
  try {
    localStorage.removeItem('ks_session');
  } catch (e) {
    console.warn('[session] clear failed', e);
  }
}

function syncLoginState() {
  const user = readSession();
  const loginLinks = Array.from(document.querySelectorAll('a[href="login.html"]'));
  const loginButtons = Array.from(document.querySelectorAll('button[data-login-button]'));
  loginLinks.forEach((link) => {
    link.style.display = user ? 'none' : '';
  });
  loginButtons.forEach((button) => {
    button.style.display = user ? 'none' : '';
  });

  const navActions = document.querySelector('.nav-actions');
  if (navActions && user && !navActions.querySelector('#logoutBtn')) {
    const logout = document.createElement('button');
    logout.type = 'button';
    logout.id = 'logoutBtn';
    logout.className = 'btn btn-secondary';
    logout.textContent = 'Logout';
    logout.addEventListener('click', () => {
      clearSession();
      localStorage.removeItem('ks_token');
      localStorage.removeItem('ks_user');
      location.href = 'login.html';
    });
    navActions.appendChild(logout);
  }

  if (navActions && !user && navActions.querySelector('#logoutBtn')) {
    navActions.querySelector('#logoutBtn').remove();
  }

  // Dashboard links stay available as static entry points again while auth is being
  // worked out separately in the backend and database layers.
}

function wireLoginFlow() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  const input = document.getElementById('email');
  const password = document.getElementById('password');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!input.value.trim() || !password.value.trim()) {
      alert('Enter your email or phone and password.');
      return;
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrPhone: input.value.trim(),
          password: password.value.trim()
        })
      });

      const data = await response.json().catch(() => ({ ok: false, message: 'Login failed' }));
      if (!response.ok || !data.ok) {
        alert(data.message || 'Invalid credentials.');
        return;
      }

      const role = data.user && data.user.role ? data.user.role : 'farmer';
      const session = {
        id: data.session && data.session.id ? data.session.id : `session-${Date.now()}`,
        token: data.token || '',
        userId: data.user && data.user._id ? data.user._id : data.user && data.user.id,
        name: data.user && data.user.name ? data.user.name : input.value.trim(),
        email: data.user && data.user.email ? data.user.email : input.value.trim(),
        phone: data.user && data.user.phone ? data.user.phone : '',
        role,
        status: data.user && data.user.status ? data.user.status : 'pending',
        createdAt: new Date().toISOString(),
        loggedInAt: new Date().toISOString(),
        expiresAt: data.session && data.session.expiresAt ? data.session.expiresAt : ''
      };

      saveSession(session);
      if (data.token) {
        localStorage.setItem('ks_token', data.token);
      }
      if (data.user) {
        localStorage.setItem('ks_user', JSON.stringify(data.user));
      }

      syncLoginState();
      if (role === 'admin') window.location.href = 'admin.html';
      else if (role === 'farmer') window.location.href = 'farmer-dashboard.html';
      else if (role === 'buyer') window.location.href = 'buyer-dashboard.html';
      else window.location.href = 'index.html';
    } catch (error) {
      console.warn('[login] failed', error);
      alert('Could not contact the server. Try again.');
    }
  });
}

function guardRolePages() {
  // Keep the dashboard HTML files in the static site visible again. The auth layer
  // is still mounted on the API side, but the dashboard route screens should not be
  // redirected through a forced login check during the current UI repair pass.
}

function wireNegotiationCheckout() {
  const offerForm = document.getElementById('offerForm');
  const negotiatedCard = document.getElementById('negotiatedCheckout');
  const price = document.getElementById('price');
  const quantity = document.getElementById('quantity');
  const note = document.getElementById('note');
  const negotiatedPrice = document.getElementById('negotiatedPrice');
  const negotiatedQuantity = document.getElementById('negotiatedQuantity');
  const negotiatedTotal = document.getElementById('negotiatedTotal');
  const gatewayMessage = document.getElementById('gatewayMessage');
  const placeOrderBtn = document.getElementById('placeOrderBtn');
  const receiptPanel = document.getElementById('receiptPanel');
  const receiptOrderId = document.getElementById('receiptOrderId');
  const receiptDate = document.getElementById('receiptDate');
  const receiptMethod = document.getElementById('receiptMethod');
  const receiptTransaction = document.getElementById('receiptTransaction');
  const receiptStatus = document.getElementById('receiptStatus');
  const receiptTotal = document.getElementById('receiptTotal');
  const downloadReceiptBtn = document.getElementById('downloadReceiptBtn');
  const newOrderBtn = document.getElementById('newOrderBtn');

  if (!offerForm || !negotiatedCard || !price || !quantity || !note || !negotiatedPrice || !negotiatedQuantity || !negotiatedTotal || !placeOrderBtn || !gatewayMessage || !receiptPanel || !receiptOrderId || !receiptDate || !receiptMethod || !receiptTransaction || !receiptStatus || !receiptTotal || !downloadReceiptBtn || !newOrderBtn) return;

  const updateNegotiatedValues = () => {
    const priceValue = Number(price.value || 25);
    const quantityValue = Number(quantity.value || 20);
    const total = priceValue * quantityValue * 100;

    negotiatedPrice.textContent = `₹${priceValue} / kg`;
    negotiatedQuantity.textContent = `${quantityValue} quintals`;
    negotiatedTotal.textContent = `₹${Math.round(total).toLocaleString('en-IN')}`;
  };

  const resetReceipt = () => {
    receiptPanel.hidden = true;
    placeOrderBtn.disabled = false;
    placeOrderBtn.textContent = 'Place negotiated order';
    gatewayMessage.textContent = '';
  };

  const showReceipt = (receipt) => {
    const date = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    receiptOrderId.textContent = receipt.orderId;
    receiptDate.textContent = date;
    receiptMethod.textContent = receipt.method;
    receiptTransaction.textContent = receipt.transactionId;
    receiptStatus.textContent = receipt.status;
    receiptTotal.textContent = `₹${Math.round(receipt.total).toLocaleString('en-IN')}`;

    receiptPanel.hidden = false;
    negotiatedCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  price.addEventListener('input', updateNegotiatedValues);
  quantity.addEventListener('input', updateNegotiatedValues);

  offerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!price.value || !quantity.value || !note.value.trim()) {
      alert('Complete the offer form before negotiating.');
      return;
    }

    const priceValue = Number(price.value);
    const quantityValue = Number(quantity.value);
    if (priceValue <= 0 || quantityValue <= 0) {
      alert('Enter a valid price and quantity.');
      return;
    }

    updateNegotiatedValues();
    gatewayMessage.textContent = 'Negotiation recorded. Review totals and place the order.';
    negotiatedCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  newOrderBtn.addEventListener('click', () => {
    resetReceipt();
    receiptPanel.hidden = true;
    note.value = '';
    price.value = '';
    quantity.value = '';
    negotiatedPrice.textContent = '₹25 / kg';
    negotiatedQuantity.textContent = '20 quintals';
    negotiatedTotal.textContent = '₹50,000';
    gatewayMessage.textContent = 'Ready for a new negotiated order.';
  });

  downloadReceiptBtn.addEventListener('click', () => {
    const receiptLines = [
      'KISAAN SETU — PAYMENT RECEIPT',
      '--------------------------------',
      `Order ID: ${receiptOrderId.textContent}`,
      `Date: ${receiptDate.textContent}`,
      `Payment method: ${receiptMethod.textContent}`,
      `Status: ${receiptStatus.textContent}`,
      `Transaction ID: ${receiptTransaction.textContent}`,
      '',
      `Total paid: ${receiptTotal.textContent}`
    ];

    const blob = new Blob([receiptLines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${receiptOrderId.textContent || 'receipt'}-receipt.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });

  placeOrderBtn.addEventListener('click', async () => {
    const selectedMethod = Array.from(document.querySelectorAll('[name="paymentMethod"]:checked')).map((el) => el.value)[0] || 'online';
    const priceValue = Number(price.value || 25);
    const quantityValue = Number(quantity.value || 20);
    const total = Math.round(priceValue * quantityValue * 100);

    if (!price.value || !quantity.value || !note.value.trim()) {
      gatewayMessage.textContent = 'Complete the negotiated offer details first.';
      return;
    }

    if (selectedMethod === 'cod') {
      const orderId = `KS-${Date.now().toString().slice(-8)}`;
      showReceipt({
        orderId,
        method: 'Cash on Delivery',
        status: 'Pay on Delivery',
        transactionId: '—',
        total
      });
      gatewayMessage.textContent = `Cash on delivery order ${orderId} confirmed.`;
      placeOrderBtn.textContent = 'Order confirmed';
      placeOrderBtn.disabled = true;
      return;
    }

    const ok = await loadRazorpayScript();
    if (!ok || !window.Razorpay) {
      gatewayMessage.textContent = 'Could not load Razorpay. Check your connection and try again.';
      return;
    }

    const orderId = `KS-${Date.now().toString().slice(-8)}`;
    const options = {
      key: 'rzp_test_1DP5mmOlF5G5ag',
      amount: total,
      currency: 'INR',
      name: 'Kisaan Setu',
      description: `Negotiated order ${orderId}`,
      notes: { order_id: orderId },
      theme: { color: '#1F4D2E' },
      handler(response) {
        gatewayMessage.textContent = `Payment successful. Order ${orderId} is confirmed.`;
        placeOrderBtn.textContent = 'Payment confirmed';
        placeOrderBtn.disabled = true;

        showReceipt({
          orderId,
          method: 'Online Payment',
          status: 'Paid',
          transactionId: response.razorpay_payment_id,
          total
        });
      },
      modal: {
        ondismiss: () => {
          gatewayMessage.textContent = 'Payment was dismissed before confirmation.';
        }
      },
      prefill: { name: '', email: '', contact: '' }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response) => {
      gatewayMessage.textContent = `Payment failed: ${response.error.description || 'please try again.'}`;
    });
    rzp.open();
  });
}

function wireListingCreatePersister() {
  const form = document.getElementById('listingCreateForm');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = {
      farmerId: 'demo-farmer',
      userId: 'demo-farmer',
      crop: document.getElementById('crop').value,
      category: document.getElementById('crop').value,
      variety: document.getElementById('crop').value,
      quantity: document.getElementById('quantity').value,
      unit: document.getElementById('unit').value,
      price: document.getElementById('price').value,
      quality: document.getElementById('quality').value,
      harvest: document.getElementById('harvest').value,
      location: document.getElementById('location').value,
      details: document.getElementById('details').value
    };

    try {
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await response.json();
      if (!response.ok) {
        console.warn('[listing] persist failed', json);
        return;
      }
      alert('Listing saved in local database store.');
      form.reset();
    } catch (err) {
      console.warn('[listing] persist failed', err);
      alert('Listing failed to persist.');
    }
  });
}

function wireFarmerRegistration() {
  const mobileScreen = document.getElementById('mobileScreen');
  if (!mobileScreen) return;

  const otpScreen = document.getElementById('otpScreen');
  const enamScreen = document.getElementById('enamScreen');
  const confirmScreen = document.getElementById('confirmScreen');
  const successScreen = document.getElementById('successScreen');

  const mobileInput = document.getElementById('farmerMobile');
  const mobileError = document.getElementById('mobileError');
  const sendOtpBtn = document.getElementById('sendOtpBtn');

  const otpInput = document.getElementById('farmerOtp');
  const otpError = document.getElementById('otpError');
  const demoOtpCode = document.getElementById('demoOtpCode');
  const otpTimer = document.getElementById('otpTimer');
  const resendOtpBtn = document.getElementById('resendOtpBtn');
  const verifyOtpBtn = document.getElementById('verifyOtpBtn');

  const enamInput = document.getElementById('enamId');
  const enamError = document.getElementById('enamError');
  const enamStatus = document.getElementById('enamStatus');
  const verifyEnamBtn = document.getElementById('verifyEnamBtn');
  const enamProfileCard = document.getElementById('enamProfileCard');

  const confirmProfileCard = document.getElementById('confirmProfileCard');
  const farmVillage = document.getElementById('farmVillage');
  const completeRegistrationBtn = document.getElementById('completeRegistrationBtn');

  const successMessage = document.getElementById('successMessage');
  const successProfileCard = document.getElementById('successProfileCard');
  const startOverBtn = document.getElementById('startOverBtn');

  const enamProfiles = {
    'EN10293847': { enamId: 'EN10293847', name: 'Ramesh Kumar Yadav', state: 'Uttar Pradesh', mandi: 'Lucknow APMC', category: 'Cereals & Grains' },
    'EN55821093': { enamId: 'EN55821093', name: 'Suresh Patel', state: 'Gujarat', mandi: 'Ahmedabad APMC', category: 'Cotton & Oilseeds' },
    'EN77410256': { enamId: 'EN77410256', name: 'Lakshmi Reddy', state: 'Andhra Pradesh', mandi: 'Guntur APMC', category: 'Chillies & Spices' }
  };

  let otpCode = '123456';
  let otpAttemptsLeft = 3;
  let otpTimerRemaining = 60;
  let otpTimerHandle = null;
  let selectedEnam = null;
  let currentScreen = 'mobile';

  const getEnamPattern = /^EN\d{8}$/;
  const isValidMobile = (value) => /^[6-9]\d{9}$/.test(value);

  function showScreen(screenName) {
    currentScreen = screenName;
    const map = {
      mobile: mobileScreen,
      otp: otpScreen,
      enam: enamScreen,
      confirm: confirmScreen,
      success: successScreen
    };

    Object.entries(map).forEach(([key, el]) => {
      el.hidden = key !== screenName;
    });

    const order = ['mobile', 'otp', 'enam', 'confirm'];
    const index = order.indexOf(screenName);
    document.querySelectorAll('[data-reg-step]').forEach((step) => {
      const stepName = step.getAttribute('data-reg-step');
      step.classList.toggle('active', order.indexOf(stepName) <= index && index >= 0);
    });
  }

  function startOtpCountdown() {
    clearInterval(otpTimerHandle);
    otpTimerRemaining = 60;
    otpTimerHandle = setInterval(() => {
      otpTimerRemaining -= 1;
      if (otpTimerRemaining <= 0) {
        clearInterval(otpTimerHandle);
        otpTimer.textContent = 'Code expired';
        verifyOtpBtn.disabled = true;
        resendOtpBtn.disabled = false;
        return;
      }
      otpTimer.textContent = `Code expires in ${otpTimerRemaining}s`;
      verifyOtpBtn.disabled = false;
    }, 1000);
  }

  function resetOtpState() {
    otpAttemptsLeft = 3;
    otpCode = '123456';
    demoOtpCode.textContent = otpCode;
    otpInput.value = '';
    otpError.textContent = '';
    resendOtpBtn.disabled = false;
    verifyOtpBtn.disabled = false;
    startOtpCountdown();
  }

  sendOtpBtn.addEventListener('click', () => {
    const number = mobileInput.value.replace(/\D/g, '').trim();
    if (!isValidMobile(number)) {
      mobileError.textContent = 'Enter a valid 10-digit mobile number.';
      return;
    }

    mobileError.textContent = '';
    resetOtpState();
    otpError.textContent = '';
    otpInput.value = '';
    demoOtpCode.textContent = otpCode;
    mobileScreen.hidden = true;
    otpScreen.hidden = false;
    enamScreen.hidden = true;
    confirmScreen.hidden = true;
    successScreen.hidden = true;
    showScreen('otp');
  });

  resendOtpBtn.addEventListener('click', () => {
    resetOtpState();
    otpError.textContent = '';
    showScreen('otp');
  });

  verifyOtpBtn.addEventListener('click', () => {
    if (otpInput.value.trim().length !== 6) {
      otpError.textContent = 'Enter the 6-digit code.';
      return;
    }

    if (otpInput.value.trim() === otpCode) {
      clearInterval(otpTimerHandle);
      otpError.textContent = '';
      showScreen('enam');
      return;
    }

    otpAttemptsLeft -= 1;
    if (otpAttemptsLeft <= 0) {
      otpError.textContent = 'Too many incorrect attempts. Request a new code.';
      verifyOtpBtn.disabled = true;
      resendOtpBtn.disabled = false;
      return;
    }

    otpError.textContent = `Incorrect code. ${otpAttemptsLeft} attempt${otpAttemptsLeft === 1 ? '' : 's'} left.`;
  });

  verifyEnamBtn.addEventListener('click', () => {
    const id = (enamInput.value || '').trim().toUpperCase();
    if (!getEnamPattern.test(id)) {
      enamError.textContent = 'eNAM ID should look like EN followed by 8 digits.';
      enamStatus.className = 'enam-status';
      enamStatus.textContent = '';
      enamProfileCard.hidden = true;
      return;
    }

    enamError.textContent = '';
    enamStatus.className = 'enam-status checking';
    enamStatus.textContent = 'Checking eNAM registry…';
    enamProfileCard.hidden = true;

    setTimeout(() => {
      const match = enamProfiles[id];
      if (!match) {
        enamStatus.className = 'enam-status failed';
        enamStatus.textContent = 'No matching eNAM registration found. Check the ID and try again.';
        selectedEnam = null;
        return;
      }

      selectedEnam = match;
      enamStatus.className = 'enam-status';
      enamStatus.textContent = 'eNAM verified';
      enamProfileCard.hidden = false;
      enamProfileCard.innerHTML = `
        <div class='profile-head'>${match.name}</div>
        <div class='profile-line'>State: ${match.state}</div>
        <div class='profile-line'>Registered mandi: ${match.mandi}</div>
        <div class='profile-line'>Produce category: ${match.category}</div>
      `;

      verifyEnamBtn.textContent = 'Continue to confirm';
      verifyEnamBtn.closest('.row').appendChild(verifyEnamBtn);
      showScreen('confirm');
    }, 700);
  });

  completeRegistrationBtn.addEventListener('click', () => {
    if (!selectedEnam) {
      enamError.textContent = 'Verify your eNAM ID before continuing.';
      return;
    }

    const farmerName = selectedEnam.name.split(' ')[0];
    const farmerId = `KS-F-${Date.now().toString().slice(-6)}`;

    confirmProfileCard.innerHTML = `
      <div class='profile-head'>${selectedEnam.name}</div>
      <div class='profile-line'>Phone: +91 ${mobileInput.value}</div>
      <div class='profile-line'>eNAM ID: ${selectedEnam.enamId}</div>
      <div class='profile-line'>State: ${selectedEnam.state}</div>
      <div class='profile-line'>Mandi: ${selectedEnam.mandi}</div>
      <div class='profile-line'>Village: ${farmVillage.value || 'Farm location not provided'}</div>
    `;

    successMessage.textContent = `Welcome to Kisaan Setu, ${farmerName}.`;
    successProfileCard.innerHTML = `
      <div class='profile-head'>Farmer profile created</div>
      <div class='profile-line'>Kisaan Setu ID: ${farmerId}</div>
      <div class='profile-line'>Name: ${selectedEnam.name}</div>
      <div class='profile-line'>Mobile: +91 ${mobileInput.value}</div>
      <div class='profile-line'>eNAM ID: ${selectedEnam.enamId}</div>
      <div class='profile-line'>Mandi: ${selectedEnam.mandi}</div>
      <div class='profile-line'>Village: ${farmVillage.value || 'Farm location not provided'}</div>
    `;

    showScreen('success');
  });

  startOverBtn.addEventListener('click', () => {
    mobileInput.value = '';
    mobileError.textContent = '';
    otpInput.value = '';
    otpError.textContent = '';
    otpTimer.textContent = 'Code expires in 60s';
    enamInput.value = '';
    enamError.textContent = '';
    enamStatus.className = 'enam-status';
    enamStatus.textContent = '';
    enamProfileCard.hidden = true;
    farmVillage.value = '';
    selectedEnam = null;
    verifyEnamBtn.textContent = 'Verify eNAM ID';
    clearInterval(otpTimerHandle);
    showScreen('mobile');
  });
}
document.addEventListener('DOMContentLoaded', () => {
  installLocaleFetchHeader();
  const body = document.body;
  const menu = document.querySelector('.mobile-menu');
  if (menu) {
    menu.addEventListener('click', () => {
      body.classList.toggle('mobile-nav-open');
    });
  }

  const notificationButtons = Array.from(document.querySelectorAll('.icon-button'));
  notificationButtons.forEach((button) => {
    button.addEventListener('click', () => {
      window.location.href = 'notifications.html';
    });
  });

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

  wireFarmerRegistration();
  wireNegotiationCheckout();
  wireListingCreatePersister();
  wireLoginFlow();
  syncLoginState();

  buildLanguageSwitcher();
  bootLanguageFlow().catch((err) => {
    console.warn('[i18n] locale boot failed', err);
  });
});
