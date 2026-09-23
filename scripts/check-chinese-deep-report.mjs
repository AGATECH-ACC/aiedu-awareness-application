import assert from 'node:assert/strict';
import { CARDS, FOUR_CARD_AWARENESS, THREE_CARD_AWARENESS, TWO_CARD_AWARENESS } from '../lib/cards.js';
import { CARD_INSIGHTS, insightFor, REFLECTION_GUIDANCE } from '../lib/card-insights.js';
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
    name: 'two-card',
    mode: 2,
    spreadKey: TWO_CARD_AWARENESS.key,
    positions: TWO_CARD_AWARENESS.positions.map(({ cn, en }) => [cn, en]),
    cardNumbers: [1, 11],
  },
  {
    name: 'three-card',
    mode: 3,
    spreadKey: THREE_CARD_AWARENESS.key,
    positions: THREE_CARD_AWARENESS.positions.map(({ cn, en }) => [cn, en]),
    cardNumbers: [1, 21, 31],
  },
  {
    name: 'four-card',
    mode: 4,
    spreadKey: FOUR_CARD_AWARENESS.key,
    positions: FOUR_CARD_AWARENESS.positions.map(({ cn, en }) => [cn, en]),
    cardNumbers: [1, 21, 11, 31],
  },
];

assert.equal(FIXED_REPORT_VERSION, 'fixed-card-manual-v4-cn');

const headings = ['当你抽到这张卡', '它可能怎样出现在生活里', '这张卡可能在提醒你', '你可以这样理解自己', '给自己的一句话'];
assert.equal(CARDS.length, 40);
assert.equal(Object.keys(CARD_INSIGHTS).length, 40);
assert.equal(insightFor(0), null);

for (const card of CARDS) {
  const insight = insightFor(card);
  assert.ok(insight, `Missing manual description for card ${card.n}`);
  assert.ok(insight.meaning.length >= 1);
  assert.equal(insight.states.length, 3);
  assert.equal(insight.questions.length, 4);
  const report = buildFixedReport({ ...scenarios[0], cardNumbers: [card.n] });
  for (const heading of headings) assert.ok(report.includes(`**${heading}**`), `Missing bold ${heading} for card ${card.n}`);
  for (const text of [insight.core, ...insight.meaning, insight.reminder, ...insight.questions, insight.affirmation, ...Object.values(REFLECTION_GUIDANCE)]) {
    assert.ok(typeof text === 'string' && text.trim(), `Empty manual text for card ${card.n}`);
    assert.ok(report.includes(text), `Missing manual text for card ${card.n}: ${text}`);
  }
  for (const state of insight.states) {
    assert.ok(state.name && state.description);
    assert.ok(report.includes(`- **${state.name}：** ${state.description}`));
  }
  assert.doesNotMatch(report, /undefined|\[object Object\]|此刻的提醒|深层牌义|可能的内在声音|生活中的常见表现|可能代价|今日练习|也可能是可能/);
  assert.equal(/[A-Za-z]/.test(report), false, `Card ${card.n} includes Latin-script copy`);
}

// Lock the sample the user approved, including the split states and four questions.
const judgment = insightFor(3);
assert.equal(judgment.core, '只要先判断对错，我就能保护自己的价值');
assert.deepEqual(judgment.states.map(({ name }) => name), ['对外批判', '自我批判', '清明判断']);
assert.deepEqual(judgment.questions, ['你最近最常批判谁？', '这个行为实际造成了什么影响？', '这个标准最早来自哪里？', '你真正希望发生什么改变？']);
assert.equal(judgment.affirmation, '清楚不需要羞辱；我可以评价行为，而不否定一个人的价值。');

for (const scenario of scenarios) {
  const report = buildFixedReport({ ...scenario, question: '' });
  assert.equal(/[A-Za-z]/.test(report), false, `${scenario.name} report includes Latin-script copy`);
  assert.equal(report.split('**它可能怎样出现在生活里**').length - 1, scenario.mode);
  if (scenario.name === 'two-card') {
    assert.match(report, /防护模式 → 人生课题/);
  }
}

const reportWithQuestion = buildFixedReport({ ...scenarios[1], question: 'My job' });
assert.match(reportWithQuestion, /My job/);
assert.equal(/[A-Za-z]/.test(reportWithQuestion.replace('My job', '')), false, 'system copy includes Latin-script text');

console.log(`Verified all 40 manual descriptions, the approved card 03 sample, and ${scenarios.length} report shapes.`);
