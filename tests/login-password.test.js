const test = require('node:test');
const assert = require('node:assert/strict');
const { verifyPasswordFromStoredHash } = require('../backend/services/persistence');

test('verifyPasswordFromStoredHash accepts and rejects password hashes consistently', () => {
  assert.equal(verifyPasswordFromStoredHash('hash:secret123', 'secret123'), true);
  assert.equal(verifyPasswordFromStoredHash('hash:secret123', 'wrongsecret'), false);
  assert.equal(verifyPasswordFromStoredHash('demo-password-hash', 'anything'), false);
});
