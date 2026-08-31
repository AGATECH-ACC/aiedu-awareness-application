import assert from 'node:assert/strict';
import { TWO_CARD_AWARENESS, drawCardsForPositions } from '../lib/cards.js';
import { normalizeNewReading, normalizeSavedReading } from '../lib/reading-validation.js';

const canonicalPositions = TWO_CARD_AWARENESS.positions.map(({ cn, en }) => [cn, en]);

function reading(cardNumbers, extra = {}) {
  return normalizeNewReading({
    mode: 2,
    spreadKey: TWO_CARD_AWARENESS.key,
    cardNumbers,
    ...extra,
  });
}

for (const cardNumbers of [[1, 11], [10, 20]]) {
  const result = reading(cardNumbers);
  assert.deepEqual(result.value?.cardNumbers, cardNumbers);
  assert.deepEqual(result.value?.positions, canonicalPositions);
}

assert.deepEqual(reading([1, 11], { positions: 'ignored' }).value?.positions, canonicalPositions);
assert.match(reading([11, 12]).error || '', /防护模式/);
assert.match(reading([1, 10]).error || '', /人生课题/);
assert.match(reading([1]).error || '', /需要 2 张牌/);
assert.match(reading([1, 11], { spreadKey: 'wrong' }).error || '', /牌阵位置组合无效/);
assert.match(reading([1, 1]).error || '', /不能有重复/);

for (const value of ['1.5', '1abc']) {
  assert.equal(Number.isInteger(Number(value)), false, `${value} is not a valid manual card number`);
}

function savedReading(cards, extra = {}) {
  return normalizeSavedReading({
    mode: 2,
    spread_key: TWO_CARD_AWARENESS.key,
    cards: cards.map((n) => ({ n })),
    ...extra,
  });
}

assert.deepEqual(savedReading([1, 11]).value?.positions, canonicalPositions);
assert.match(savedReading([11, 12]).error || '', /防护模式/);
assert.match(savedReading([1]).error || '', /需要 2 张牌/);
assert.match(savedReading([1, 11], { spread_key: 'wrong' }).error || '', /牌阵位置组合无效/);

assert.deepEqual(drawCardsForPositions(TWO_CARD_AWARENESS.positions, () => 0).map((card) => card.n), [1, 11]);
assert.deepEqual(drawCardsForPositions(TWO_CARD_AWARENESS.positions, () => 1 - Number.EPSILON).map((card) => card.n), [10, 20]);

for (let index = 0; index < 100; index += 1) {
  const [pattern, lesson] = drawCardsForPositions(TWO_CARD_AWARENESS.positions);
  assert.ok(pattern.n >= 1 && pattern.n <= 10);
  assert.ok(lesson.n >= 11 && lesson.n <= 20);
}

console.log('Verified two-card validation and draw boundaries.');
