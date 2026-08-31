import {
  byNum,
  CHAPTERS,
  FOUR_CARD_AWARENESS,
  INNER_CHILD,
  SPREAD3,
  THREE_CARD_AWARENESS,
  TWO_CARD_AWARENESS,
} from './cards.js';
import { insightFor } from './card-insights.js';

export const FIXED_REPORT_VERSION = 'fixed-card-insights-v3-cn';

function cleanInline(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function chineseLabel(value, fallback) {
  return cleanInline(value).split(' · ')[0] || fallback;
}

function spreadName(mode, spreadKey) {
  if (mode === 1) return '单张觉察';
  if (mode === 2 && spreadKey === TWO_CARD_AWARENESS.key) return TWO_CARD_AWARENESS.name;
  if (mode === 3 && spreadKey === THREE_CARD_AWARENESS.key) return THREE_CARD_AWARENESS.name;
  if (mode === 4 && spreadKey === FOUR_CARD_AWARENESS.key) return FOUR_CARD_AWARENESS.name;
  if (mode === 4) return '内在小孩牌阵';
  return SPREAD3[Number(spreadKey)]?.name || '三张牌牌阵';
}

function currentSpread(mode, spreadKey) {
  if (mode === 2 && spreadKey === TWO_CARD_AWARENESS.key) return TWO_CARD_AWARENESS;
  if (mode === 3 && spreadKey === THREE_CARD_AWARENESS.key) return THREE_CARD_AWARENESS;
  if (mode === 4 && spreadKey === FOUR_CARD_AWARENESS.key) return FOUR_CARD_AWARENESS;
  return null;
}

function positionMeaning(mode, spreadKey, index, position) {
  if (mode === 1) {
    return '这个位置聚焦你此刻最值得看见的主题。它不是结论，而是一面帮助你暂停和观察的镜子。';
  }
  const spread = currentSpread(mode, spreadKey);
  if (spread) return spread.positions[index]?.guide_cn;
  if (mode === 4) {
    return INNER_CHILD[index]?.[2] || `这张牌帮助你理解「${position[0]}」所代表的层面。`;
  }
  return `在「${position[0]}」的位置，这张牌邀请你把它的主题放回这个层面观察，而不是把牌义当成固定答案。`;
}

function resolvedCards(mode, spreadKey, cardNumbers, positions) {
  return cardNumbers.map((number, index) => {
    const card = byNum[number];
    return {
      card,
      insight: insightFor(card),
      chapter: CHAPTERS[card.ch],
      position: positions[index],
      positionMeaning: positionMeaning(mode, spreadKey, index, positions[index]),
    };
  });
}

function spreadFlow(mode, spreadKey, positions) {
  if (mode === 2 && spreadKey === TWO_CARD_AWARENESS.key) {
    return {
      path: '防护模式 → 人生课题',
      connection: '这两张牌先邀请你看见当下如何保护自己，再把注意力放到这个模式正在邀请你学习和练习的课题上。它不是结论，而是一条可以慢慢观察的路径。',
      transformation: `1. **防护模式：** 看见我当下如何保护自己，不急着批评这个反应。
2. **人生课题：** 留意这个模式邀请我学习、练习或更真实回应的方向。`,
    };
  }
  if (mode === 3 && spreadKey === THREE_CARD_AWARENESS.key) {
    return {
      path: '表层反应与保护 → 深层旧故事 → 可以发展的新力量',
      connection: '整组三张牌从表层走向深层，再回到新的选择：先看见自己如何反应与保护，再辨认背后长期相信的故事，最后把注意力放在现在能够发展的力量。',
      transformation: `1. **表层：** 看见当下的反应与防护，不急着批评自己。
2. **深层：** 辨认这个反应背后长期相信的故事。
3. **新选择：** 从成长牌中选出一个今天能够实践的力量。`,
    };
  }
  if (mode === 4 && spreadKey === FOUR_CARD_AWARENESS.key) {
    return {
      path: '模式 → 内在触发 → 需要 → 新选择',
      connection: '整组四张牌是一条完整的重新回应路径：先辨认保护模式，再看见被触发的旧故事，照顾故事背后的真实需要，最后选择一种今天可以实践的新回应。',
      transformation: `1. **模式：** 我现在正在用什么方式保护自己？
2. **内在触发：** 此刻，我内在什么旧故事被触发了？
3. **需要：** 在这个故事背后，我真正需要的是什么？
4. **新选择：** 今天的我，可以怎样重新回应？`,
    };
  }
  return {
    path: positions.map(([cn]) => cn).join(' → '),
    connection: '整组牌最重要的连接，是从「看见」走向「选择」：先辨认当下模式，再理解它试图保护或提醒什么，最后实践一个较健康、较真实的回应。',
    transformation: `1. **看见：** 不急着评判，先辨认哪一张牌最像你此刻的状态。
2. **理解：** 留意这个模式的内在声音、常见表现，以及它可能正在保护的需要。
3. **选择：** 从上方的「转化方向」中只选一个最小、最现实的行动。
4. **复盘：** 行动后记录发生了什么，不用用一次结果证明自己成功或失败。`,
  };
}

function cardSection(item, index) {
  const { card, insight, chapter, position, positionMeaning: meaningOfPosition } = item;
  const voices = insight.voices.map((voice) => `- ${voice}`).join('\n');
  const cost = insight.cost || '这张成长牌更强调可以培养的生命资源，而不是警告代价。';
  const lensLabel = chineseLabel(insight.lensLabel, '成长焦点');

  return `### 位置 ${index + 1}：${position[0]}

**第 ${String(card.n).padStart(2, '0')} 张：${card.cn}**

**章节：** ${chapter.cn}

**这个位置如何阅读**

${meaningOfPosition}

**卡面提问**

${card.text_cn}

**此刻的提醒**

${card.affect_cn}

**核心主题**

${insight.core}

**深层牌义**

${insight.meaning}

**可能的内在声音**

${voices}

**生活中的常见表现**

${insight.signs}

**${lensLabel}**

${insight.lens}

**可能代价**

${cost}

**转化方向**

${insight.shift}

**觉察提问**

${insight.question}

**今日练习**

${card.practice_cn}`;
}

function sevenDayPractice(items) {
  const first = items[0];
  const second = items[1 % items.length];
  const third = items[2 % items.length];
  const last = items[items.length - 1];

  return [
    `1. **第 1 天 — 停下来：** 留意「${first.card.cn}」何时出现，不急着改变。`,
    `2. **第 2 天 — 听见声音：** 当「${first.insight.voices[0]}」出现时，把它写下来。`,
    `3. **第 3 天 — 看见模式：** 从生活中找出一个与「${second.insight.signs}」有关的具体时刻。`,
    `4. **第 4 天 — 做一个小练习：** ${third.card.practice_cn}`,
    `5. **第 5 天 — 换一个方向：** 读一遍「${last.insight.shift}」，并选择其中最小的一步。`,
    '6. **第 6 天 — 回到身体：** 在回应重要事情前，停三个呼吸，分辨事实、感受和需要。',
    '7. **第 7 天 — 回顾：** 写下这一周你看见的一个模式、完成的一个行动，以及下周愿意继续的一步。',
  ].join('\n');
}

/**
 * Build a deterministic Chinese-only report from the reviewed card dataset.
 */
export function buildFixedReport({ mode, spreadKey, positions, cardNumbers, question = '' }) {
  const items = resolvedCards(mode, spreadKey, cardNumbers, positions);
  const flow = spreadFlow(mode, spreadKey, positions);
  const cardSequence = items.map(({ card }) => `${String(card.n).padStart(2, '0')} ${card.cn}`).join(' → ');
  const coreSequence = items.map(({ insight }) => insight.core).join(' → ');
  const fixedQuestion = cleanInline(question);
  const situation = fixedQuestion
    ? `> **你的原始情境：** ${fixedQuestion}

这份报告不会猜测你的经历。请把下方每个觉察提问放回这个情境，留意哪些内容与你真实发生的经验相符。`
    : '你没有输入特定情境，因此这份报告以牌卡本身为中心。阅读时，可以选择一个最近反复出现的关系、决定或感受作为观察对象。';
  const connections = items.map(({ card, insight, position }, index) => (
    `${index + 1}. **${position[0]} — ${card.cn}：** ${insight.shift}`
  )).join('\n');
  const journalPrompts = items.map(({ card, insight, position }) => (
    `- **${position[0]} — ${card.cn}：** ${insight.question}`
  )).join('\n');

  return `# 幸福人生觉察报告

## 抽牌核心

**牌阵：** ${spreadName(mode, spreadKey)}

**牌卡顺序：** ${cardSequence}

**觉察路径：** ${flow.path}

这次牌阵依序把注意力带到：${coreSequence}

这不是命运预测，也不是对你的定论。它是一份根据牌卡固定内容整理的觉察地图，帮助你看见模式、提出问题，并选择一个可以实践的小行动。

## 逐位深读

${items.map(cardSection).join('\n\n')}

## 模式连接图

请按牌阵位置由前往后阅读。每一步都不是必须发生的结果，而是一条可供你检视的觉察与转化路径。

${connections}

${flow.connection}

## 回到你的情境

${situation}

## 转化路径

${flow.transformation}

## 七日练习

${sevenDayPractice(items)}

## 深度书写

${journalPrompts}

- **整合提问：** 如果我愿意少一点自动反应、多一点诚实选择，下一步会是什么？

## 肯定语

我愿意诚实看见此刻的自己，也愿意用一个温柔而具体的行动回应。

> 用于自我觉察与反思，不是心理诊断、治疗或医疗建议。

> 本报告由牌卡固定内容与深层牌义资料生成，不调用人工智能模型。`;
}
