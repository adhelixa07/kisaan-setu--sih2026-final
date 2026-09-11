// Stand-in for the real eNAM / AGMARKNET verification API.
//
// There's no public self-serve endpoint for this — access requires
// integration approval from the National Agriculture Market team under
// the Ministry of Agriculture. Once you have that, replace the body of
// `lookupEnam` with the real HTTP call and keep the same return shape
// so nothing else in this file has to change.

const ENAM_ID_PATTERN = /^EN\d{8}$/;

const MOCK_ENAM_DB = [
  { enamId: "EN10293847", name: "Ramesh Kumar Yadav", state: "Uttar Pradesh", mandi: "Lucknow APMC", category: "Cereals & Grains" },
  { enamId: "EN55821093", name: "Suresh Patel", state: "Gujarat", mandi: "Ahmedabad APMC", category: "Cotton & Oilseeds" },
  { enamId: "EN77410256", name: "Lakshmi Reddy", state: "Andhra Pradesh", mandi: "Guntur APMC", category: "Chillies & Spices" },
];

function isValidEnamFormat(id) {
  return ENAM_ID_PATTERN.test(id);
}

async function lookupEnam(rawId) {
  const id = String(rawId || "").trim().toUpperCase();
  if (!isValidEnamFormat(id)) {
    return { ok: false, reason: "invalid_format" };
  }
  const match = MOCK_ENAM_DB.find((f) => f.enamId === id);
  if (!match) {
    return { ok: false, reason: "not_found" };
  }
  return { ok: true, profile: match };
}

module.exports = { lookupEnam, isValidEnamFormat };
