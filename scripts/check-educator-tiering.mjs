import assert from 'node:assert/strict';
import { getEducatorTier, EDUCATOR_TIER_TARGET } from '../lib/educator-tiering.js';
import { normalizeRecipient } from '../lib/recipient-input.js';

assert.equal(getEducatorTier(EDUCATOR_TIER_TARGET - 1), 'basic');
assert.equal(getEducatorTier(EDUCATOR_TIER_TARGET), 'advanced');
assert.deepEqual(normalizeRecipient({
  name: '  王  小明 ',
  email: ' WANG@example.com ',
  phone: '+60 12-345 6789',
}), { name: '王 小明', email: 'wang@example.com', phone: '+60123456789' });
assert.deepEqual(
  normalizeRecipient({ name: '王小明', email: 'wang@example.com', phone: 'invalid' }),
  { error: '请输入有效的联系电话。' }
);
assert.deepEqual(
  normalizeRecipient({ name: '王小明', email: 'wang@example.com', phone: '123456' }),
  { error: '请输入有效的联系电话。' }
);
assert.deepEqual(
  normalizeRecipient({ name: '王小明', email: 'wang@example.com', phone: '123456789012345678901' }),
  { error: '请输入有效的联系电话。' }
);

console.log('Educator tiering checks passed.');
