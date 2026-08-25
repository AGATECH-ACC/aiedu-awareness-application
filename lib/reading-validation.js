import {
  byNum,
  FOUR_CARD_AWARENESS,
  INNER_CHILD,
  SINGLE_CARD_RANGE,
  SPREAD3,
  THREE_CARD_AWARENESS,
} from './cards.js';

const VALID_MODES = new Set([1, 3, 4]);

function spreadRules(mode, spreadKey, { allowLegacy = false } = {}) {
  if (mode === 1 && spreadKey === 'single') {
    return {
      key: 'single',
      positions: [['当下的觉察', 'This moment']],
      ranges: allowLegacy ? null : [[SINGLE_CARD_RANGE.min, SINGLE_CARD_RANGE.max]],
    };
  }
  if (mode === 3 && spreadKey === THREE_CARD_AWARENESS.key) {
    return {
      key: THREE_CARD_AWARENESS.key,
      positions: THREE_CARD_AWARENESS.positions.map(({ cn, en }) => [cn, en]),
      ranges: THREE_CARD_AWARENESS.positions.map(({ min, max }) => [min, max]),
    };
  }
  if (mode === 4 && spreadKey === FOUR_CARD_AWARENESS.key) {
    return {
      key: FOUR_CARD_AWARENESS.key,
      positions: FOUR_CARD_AWARENESS.positions.map(({ cn, en }) => [cn, en]),
      ranges: FOUR_CARD_AWARENESS.positions.map(({ min, max }) => [min, max]),
    };
  }
  if (allowLegacy && mode === 4 && spreadKey === 'inner') {
    return {
      key: 'inner',
      positions: INNER_CHILD.map(([cn, en]) => [cn, en]),
      ranges: null,
    };
  }
  if (allowLegacy && mode === 3 && /^\d+$/.test(String(spreadKey)) && SPREAD3[Number(spreadKey)]) {
    return {
      key: String(Number(spreadKey)),
      positions: SPREAD3[Number(spreadKey)].pos,
      ranges: null,
    };
  }
  return null;
}

export function normalizeNewReading(body, { allowLegacy = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: '请求内容必须是对象。' };
  }

  const { mode, spreadKey, cardNumbers, positions } = body;
  if (!VALID_MODES.has(mode)) {
    return { error: '牌阵模式无效。' };
  }
  if (!Array.isArray(cardNumbers) || cardNumbers.length !== mode) {
    return { error: `此牌阵需要 ${mode} 张牌。` };
  }
  if (!cardNumbers.every((number) => Number.isInteger(number) && byNum[number])) {
    return { error: '牌卡编号必须是 1–40 的整数。' };
  }
  if (new Set(cardNumbers).size !== cardNumbers.length) {
    return { error: '同一牌阵不能有重复牌卡。' };
  }
  if (!Array.isArray(positions) || positions.length !== mode || !positions.every((position) => Array.isArray(position) && typeof position[0] === 'string' && typeof position[1] === 'string')) {
    return { error: `此牌阵需要 ${mode} 个位置说明。` };
  }

  const rules = spreadRules(mode, spreadKey, { allowLegacy });
  if (!rules) {
    return { error: '牌阵位置组合无效。' };
  }
  if (rules.ranges) {
    const invalidPosition = cardNumbers.findIndex((number, index) => {
      const [min, max] = rules.ranges[index];
      return number < min || number > max;
    });
    if (invalidPosition !== -1) {
      const [min, max] = rules.ranges[invalidPosition];
      const [positionCn] = rules.positions[invalidPosition];
      return {
        error: `第 ${invalidPosition + 1} 位「${positionCn}」只接受 ${min}–${max} 号牌。`,
      };
    }
  }

  if (body.question != null && typeof body.question !== 'string') {
    return { error: '提问必须是文字。' };
  }
  const question = typeof body.question === 'string' ? body.question.trim() : '';
  if (question.length > 2000) {
    return { error: '提问请限制在 2000 字以内。' };
  }

  return {
    value: {
      mode,
      spreadKey: rules.key,
      cardNumbers,
      positions: rules.positions,
      question,
    },
  };
}

export function normalizeSavedReading(reading) {
  const cardNumbers = Array.isArray(reading?.cards) ? reading.cards.map((card) => card?.n) : [];
  const rules = spreadRules(reading?.mode, reading?.spread_key, { allowLegacy: true });
  return normalizeNewReading({
    mode: reading?.mode,
    spreadKey: reading?.spread_key,
    cardNumbers,
    positions: rules?.positions,
    question: reading?.question || '',
  }, { allowLegacy: true });
}
