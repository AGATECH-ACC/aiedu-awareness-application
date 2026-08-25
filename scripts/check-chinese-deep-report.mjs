import assert from 'node:assert/strict';
import { FOUR_CARD_AWARENESS, THREE_CARD_AWARENESS } from '../lib/cards.js';
import { buildFixedReport, FIXED_REPORT_VERSION } from '../lib/fixed-report.js';

const scenarios = [
  {
    name: 'single-card',
    mode: 1,
    spreadKey: 'single',
    positions: [['当下的觉察', 'This moment']],
    cardNumbers: [1],
  },
  {
    name: 'three-card',
    mode: 3,
    spreadKey: THREE_CARD_AWARENESS.key,
    positions: THREE_CARD_AWARENESS.positions.map(({ cn, en }) => [cn, en]),
    cardNumbers: [1, 11, 31],
  },
  {
    name: 'four-card',
    mode: 4,
    spreadKey: FOUR_CARD_AWARENESS.key,
    positions: FOUR_CARD_AWARENESS.positions.map(({ cn, en }) => [cn, en]),
    cardNumbers: [1, 11, 21, 31],
  },
];

assert.equal(FIXED_REPORT_VERSION, 'fixed-card-insights-v3-cn');

for (const scenario of scenarios) {
  const report = buildFixedReport({ ...scenario, question: '' });
  assert.equal(/[A-Za-z]/.test(report), false, `${scenario.name} report includes Latin-script copy`);
}

console.log(`Verified Chinese-only report copy for ${scenarios.length} report shapes.`);
