import {
  byNum,
  CHAPTERS,
  FOUR_CARD_AWARENESS,
  INNER_CHILD,
  SPREAD3,
  THREE_CARD_AWARENESS,
} from './cards.js';
import { insightFor } from './card-insights.js';

export const FIXED_REPORT_VERSION = 'fixed-card-insights-v2';

function cleanInline(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function spreadName(mode, spreadKey) {
  if (mode === 1) return ['单张觉察', 'Single-card awareness'];
  if (mode === 3 && spreadKey === THREE_CARD_AWARENESS.key) return [THREE_CARD_AWARENESS.name, THREE_CARD_AWARENESS.en];
  if (mode === 4 && spreadKey === FOUR_CARD_AWARENESS.key) return [FOUR_CARD_AWARENESS.name, FOUR_CARD_AWARENESS.en];
  if (mode === 4) return ['内在小孩牌阵', 'Inner Child spread'];
  const spread = SPREAD3[Number(spreadKey)];
  return [spread?.name || '三张牌牌阵', spread?.en || 'Three-card spread'];
}

function currentSpread(mode, spreadKey) {
  if (mode === 3 && spreadKey === THREE_CARD_AWARENESS.key) return THREE_CARD_AWARENESS;
  if (mode === 4 && spreadKey === FOUR_CARD_AWARENESS.key) return FOUR_CARD_AWARENESS;
  return null;
}

function positionMeaning(mode, spreadKey, index, position) {
  if (mode === 1) {
    return [
      '这个位置聚焦你此刻最值得看见的主题。它不是结论，而是一面帮助你暂停和观察的镜子。',
      'This position focuses on the theme most worth noticing now. It is not a verdict, but a mirror that helps you pause and observe.',
    ];
  }
  const spread = currentSpread(mode, spreadKey);
  if (spread) {
    const guide = spread.positions[index];
    return [guide?.guide_cn, guide?.guide_en];
  }
  if (mode === 4) {
    const guide = INNER_CHILD[index];
    return [
      guide?.[2] || `这张牌帮助你理解「${position[0]}」所代表的层面。`,
      guide?.[3] || `This card helps you understand the ${position[1]} position.`,
    ];
  }
  return [
    `在「${position[0]}」的位置，这张牌邀请你把它的主题放回这个层面观察，而不是把牌义当成固定答案。`,
    `In the ${position[1]} position, this card invites you to explore its theme through that part of the spread rather than treat it as a fixed answer.`,
  ];
}

function resolvedCards(mode, spreadKey, cardNumbers, positions) {
  return cardNumbers.map((number, index) => {
    const card = byNum[number];
    const insight = insightFor(card);
    return {
      card,
      insight,
      chapter: CHAPTERS[card.ch],
      position: positions[index],
      positionMeaning: positionMeaning(mode, spreadKey, index, positions[index]),
    };
  });
}

function spreadFlow(mode, spreadKey, positions) {
  if (mode === 3 && spreadKey === THREE_CARD_AWARENESS.key) {
    return {
      pathCn: '表层反应与保护 → 深层旧故事 → 可以发展的新力量',
      pathEn: 'Surface reaction and protection → deeper old story → new strength to develop',
      connectionCn: '整组三张牌从表层走向深层，再回到新的选择：先看见自己如何反应与保护，再辨认背后长期相信的故事，最后把注意力放在现在能够发展的力量。',
      connectionEn: 'These three cards move from surface to depth and then toward a new choice: notice how you react and protect yourself, recognise the long-held story underneath, and focus on the strength you can develop now.',
      transformation: `1. **表层 · Surface:** 看见当下的反应与防护，不急着批评自己。 / Notice the present reaction and protection without rushing to judge yourself.
2. **深层 · Depth:** 辨认这个反应背后长期相信的故事。 / Name the long-held story beneath the reaction.
3. **新选择 · New Choice:** 从成长牌中选出一个今天能够实践的力量。 / Choose one strength from the growth card to practise today.`,
    };
  }
  if (mode === 4 && spreadKey === FOUR_CARD_AWARENESS.key) {
    return {
      pathCn: '模式 → 内在触发 → 需要 → 新选择',
      pathEn: 'Pattern → Trigger → Need → New Choice',
      connectionCn: '整组四张牌是一条完整的重新回应路径：先辨认保护模式，再看见被触发的旧故事，照顾故事背后的真实需要，最后选择一种今天可以实践的新回应。',
      connectionEn: 'These four cards form a complete path toward a different response: identify the protective pattern, notice the old story being triggered, care for the real need beneath it, and choose a new response you can practise today.',
      transformation: `1. **模式 · Pattern:** 我现在正在用什么方式保护自己？ / How am I protecting myself right now?
2. **内在触发 · Trigger:** 此刻，我内在什么旧故事被触发了？ / What old story within me has been triggered in this moment?
3. **需要 · Need:** 在这个故事背后，我真正需要的是什么？ / What do I truly need beneath this story?
4. **新选择 · New Choice:** 今天的我，可以怎样重新回应？ / How can I respond differently today?`,
    };
  }
  return {
    pathCn: positions.map(([cn]) => cn).join(' → '),
    pathEn: positions.map(([, en]) => en).join(' → '),
    connectionCn: '整组牌最重要的连接，是从「看见」走向「选择」：先辨认当下模式，再理解它试图保护或提醒什么，最后实践一个较健康、较真实的回应。',
    connectionEn: 'The spread’s most important connection is the movement from noticing to choosing: recognise the present pattern, understand what it is protecting or highlighting, then practise one healthier and more authentic response.',
    transformation: `1. **看见 · Notice:** 不急着评判，先辨认哪一张牌最像你此刻的状态。 / Without judging, identify which card most closely resembles your present state.
2. **理解 · Understand:** 留意这个模式的内在声音、常见表现，以及它可能正在保护的需要。 / Notice the pattern's inner voice, common signs, and the need it may be trying to protect.
3. **选择 · Choose:** 从上方的「转化方向」中只选一个最小、最现实的行动。 / Choose only one small, realistic action from the growth directions above.
4. **复盘 · Review:** 行动后记录发生了什么，不用用一次结果证明自己成功或失败。 / After acting, record what happened without using one outcome to prove that you succeeded or failed.`,
  };
}

function cardSection(item, index) {
  const { card, insight, chapter, position, positionMeaning: meaningOfPosition } = item;
  const voices = insight.voices.map((voice, voiceIndex) => (
    `- ${voice} / ${insight.voices_en[voiceIndex] || ''}`
  )).join('\n');
  const costCn = insight.cost || '这张成长牌更强调可以培养的生命资源，而不是警告代价。';
  const costEn = insight.cost_en || 'This growth-oriented card focuses on a life resource you can develop rather than a cost to fear.';

  return `### 位置 ${index + 1}：${position[0]} · ${position[1]}

**第 ${String(card.n).padStart(2, '0')} 张：${card.cn} · ${card.en}**

**章节 · Chapter:** ${chapter.cn} · ${chapter.en}

**这个位置如何阅读 · How to read this position**

${meaningOfPosition[0]}

${meaningOfPosition[1]}

**卡面提问 · Card prompt**

${card.text_cn}

${card.text_en}

**此刻的提醒 · Message for this moment**

${card.affect_cn}

${card.affect_en}

**核心主题 · Core theme**

${insight.core}

${insight.core_en}

**深层牌义 · Deeper meaning**

${insight.meaning}

${insight.meaning_en}

**可能的内在声音 · Possible inner voices**

${voices}

**生活中的常见表现 · Common signs in daily life**

${insight.signs}

${insight.signs_en}

**${insight.lensLabel || '成长焦点 · Growth focus'}**

${insight.lens}

${insight.lens_en}

**可能代价 · Possible cost**

${costCn}

${costEn}

**转化方向 · Growth direction**

${insight.shift}

${insight.shift_en}

**觉察提问 · Reflection question**

${insight.question}

${insight.question_en}

**今日练习 · Today's practice**

${card.practice_cn}

${card.practice_en}`;
}

function sevenDayPractice(items) {
  const first = items[0];
  const second = items[1 % items.length];
  const third = items[2 % items.length];
  const last = items[items.length - 1];

  return [
    `1. **第 1 天 · Day 1 — 停下来:** 留意「${first.card.cn}」何时出现，不急着改变。 / Notice when ${first.card.en} appears, without rushing to change it.`,
    `2. **第 2 天 · Day 2 — 听见声音:** 当「${first.insight.voices[0]}」出现时，把它写下来。 / Write it down when the voice “${first.insight.voices_en[0]}” appears.`,
    `3. **第 3 天 · Day 3 — 看见模式:** 从生活中找出一个与「${second.insight.signs}」有关的具体时刻。 / Identify one concrete moment connected with: ${second.insight.signs_en}`,
    `4. **第 4 天 · Day 4 — 做一个小练习:** ${third.card.practice_cn} / ${third.card.practice_en}`,
    `5. **第 5 天 · Day 5 — 换一个方向:** 读一遍「${last.insight.shift}」，并选择其中最小的一步。 / Read “${last.insight.shift_en}” and choose its smallest workable step.`,
    '6. **第 6 天 · Day 6 — 回到身体:** 在回应重要事情前，停三个呼吸，分辨事实、感受和需要。 / Before responding to something important, pause for three breaths and separate facts, feelings, and needs.',
    '7. **第 7 天 · Day 7 — 回顾:** 写下这一周你看见的一个模式、完成的一个行动，以及下周愿意继续的一步。 / Write down one pattern you noticed, one action you completed, and one step you want to continue next week.',
  ].join('\n');
}

/**
 * Build the Version 2 report without calling an external model.
 * Every interpretive paragraph comes from the reviewed bilingual card dataset.
 */
export function buildFixedReport({ mode, spreadKey, positions, cardNumbers, question = '' }) {
  const items = resolvedCards(mode, spreadKey, cardNumbers, positions);
  const [spreadCn, spreadEn] = spreadName(mode, spreadKey);
  const flow = spreadFlow(mode, spreadKey, positions);
  const cardSequenceCn = items.map(({ card }) => `${String(card.n).padStart(2, '0')} ${card.cn}`).join(' → ');
  const cardSequenceEn = items.map(({ card }) => `${String(card.n).padStart(2, '0')} ${card.en}`).join(' → ');
  const coreSequenceCn = items.map(({ insight }) => insight.core).join(' → ');
  const coreSequenceEn = items.map(({ insight }) => insight.core_en).join(' → ');
  const fixedQuestion = cleanInline(question);
  const situation = fixedQuestion
    ? `> **你的原始情境 · Your original context:** ${fixedQuestion}

这份报告不会猜测你的经历。请把下方每个觉察提问放回这个情境，留意哪些内容与你真实发生的经验相符。

This report does not guess what happened to you. Bring each reflection question below back to this context and notice what genuinely matches your lived experience.`
    : `你没有输入特定情境，因此这份报告以牌卡本身为中心。阅读时，可以选择一个最近反复出现的关系、决定或感受作为观察对象。

No specific context was entered, so this report stays centred on the cards. As you read, you may choose one recent relationship, decision, or recurring feeling as your point of reflection.`;
  const connections = items.map(({ card, insight, position }, index) => (
    `${index + 1}. **${position[0]} · ${position[1]} — ${card.cn} · ${card.en}:** ${insight.shift} / ${insight.shift_en}`
  )).join('\n');
  const journalPrompts = items.map(({ card, insight, position }) => (
    `- **${position[0]} · ${position[1]} — ${card.cn} · ${card.en}:** ${insight.question} / ${insight.question_en}`
  )).join('\n');

  return `# 幸福人生觉察报告 · Happy Life Awareness Report

## 抽牌核心 · Reading Essence

**牌阵 · Spread:** ${spreadCn} · ${spreadEn}

**牌卡顺序 · Card sequence:** ${cardSequenceCn} / ${cardSequenceEn}

**觉察路径 · Awareness path:** ${flow.pathCn} / ${flow.pathEn}

这次牌阵依序把注意力带到：${coreSequenceCn}

In order, this spread brings attention to: ${coreSequenceEn}

这不是命运预测，也不是对你的定论。它是一份根据牌卡固定内容整理的双语觉察地图，帮助你看见模式、提出问题，并选择一个可以实践的小行动。

This is neither fortune-telling nor a verdict about you. It is a bilingual awareness map assembled from the cards' reviewed fixed content, designed to help you notice patterns, ask useful questions, and choose one practical next step.

## 逐位深读 · Card-by-Card Reading

${items.map(cardSection).join('\n\n')}

## 模式连接图 · Pattern Connections

请按牌阵位置由前往后阅读。每一步都不是必须发生的结果，而是一条可供你检视的觉察与转化路径。

Read the spread from one position to the next. These are not outcomes that must happen, but an awareness and growth path you can examine.

${connections}

${flow.connectionCn}

${flow.connectionEn}

## 回到你的情境 · Your Situation

${situation}

## 转化路径 · Transformation Path

${flow.transformation}

## 七日练习 · 7-Day Practice

${sevenDayPractice(items)}

## 深度书写 · Journal Prompts

${journalPrompts}

- **整合提问 · Integration prompt:** 如果我愿意少一点自动反应、多一点诚实选择，下一步会是什么？ / If I respond a little less automatically and choose a little more honestly, what would my next step be?

## 肯定语 · Affirmation

我愿意诚实看见此刻的自己，也愿意用一个温柔而具体的行动回应。

I am willing to see myself honestly in this moment and respond with one gentle, concrete action.

> 用于自我觉察与反思，不是心理诊断、治疗或医疗建议。 · For self-reflection only — not diagnosis, therapy, or medical advice.

> 版本说明：本报告由牌卡固定内容与深层牌义资料生成，不调用 AI 模型。 · Version note: this report is generated from fixed card content and reviewed deep-meaning data; it does not call an AI model.`;
}
