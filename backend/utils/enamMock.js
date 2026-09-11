const ENAM_PROFILES = {
  'EN10293847': { enamId: 'EN10293847', name: 'Ramesh Kumar Yadav', state: 'Uttar Pradesh', mandi: 'Lucknow APMC', category: 'Cereals & Grains' },
  'EN55821093': { enamId: 'EN55821093', name: 'Suresh Patel', state: 'Gujarat', mandi: 'Ahmedabad APMC', category: 'Cotton & Oilseeds' },
  'EN77410256': { enamId: 'EN77410256', name: 'Lakshmi Reddy', state: 'Andhra Pradesh', mandi: 'Guntur APMC', category: 'Chillies & Spices' }
};

function lookupEnam(enamId) {
  const normalized = String(enamId || '').trim().toUpperCase();
  if (!/^EN\d{8}$/.test(normalized)) {
    return Promise.resolve({ ok: false, reason: 'invalid_format' });
  }

  if (!ENAM_PROFILES[normalized]) {
    return Promise.resolve({ ok: false, reason: 'not_found' });
  }

  return Promise.resolve({ ok: true, profile: ENAM_PROFILES[normalized] });
}

module.exports = { lookupEnam, ENAM_PROFILES };
