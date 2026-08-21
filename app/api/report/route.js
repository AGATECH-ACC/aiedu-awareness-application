import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerSupabase } from '@/lib/supabase-server';
import { byNum, CHAPTERS, SPREAD3 } from '@/lib/cards';

export const runtime = 'nodejs';
export const maxDuration = 60;

const SYSTEM = `你是「幸福人生觉察卡」(Happy Life Awareness Cards) 的温柔而深入的觉察引导者。
你根据使用者抽到的牌，写出一份个人化的「深度觉察报告」。

原则：
- 这是自我觉察与反思的工具，不是心理诊断、治疗或医疗建议；语气温暖、尊重、赋能，不下定论、不贴标签。
- 双语书写：先简体中文，紧接英文（English）。英文自然流畅，不是逐字翻译。
- 把各张牌与它们的「位置含义」编织成一个连贯的故事，而不是逐条罗列。
- 具体、贴近生活，避免空泛的灵性套话。
- 若牌阵中包含防护模式或潜意识剧本类的牌，温柔点出其保护性的初衷，再指向成长。

严格用以下 Markdown 段落结构输出（保留中英标题）：
## 概览 · Overview
## 逐位解读 · Card by Card
## 内在模式 · Inner Patterns
## 整合指引 · Integrated Guidance
## 七日练习 · 7-Day Practice
## 肯定语 · Affirmation`;

function buildUserMessage({ mode, spreadKey, positions, cardNumbers, question }) {
  const spreadName =
    mode === 1 ? '单张牌 Single card'
    : mode === 4 ? '内在小孩牌阵 Inner Child spread (需求 / 阻碍 / 行动 / 结果)'
    : `三张牌牌阵 Three-card spread — ${SPREAD3[Number(spreadKey)]?.name || ''} (${SPREAD3[Number(spreadKey)]?.en || ''})`;

  const lines = cardNumbers.map((n, i) => {
    const c = byNum[n];
    const pos = positions?.[i] || [];
    const chap = CHAPTERS[c.ch];
    return [
      `位置 ${i + 1}｜${pos[0] || ''} (${pos[1] || ''})`,
      `  牌：${String(c.n).padStart(2, '0')}. ${c.cn} / ${c.en} — 章节：${chap.cn} ${chap.en}`,
      `  牌义：${c.text_cn}`,
      `  影响：${c.affect_cn}`,
      `  练习：${c.practice_cn}`,
    ].join('\n');
  }).join('\n\n');

  return `牌阵：${spreadName}

抽到的牌：
${lines}

${question ? `使用者的提问 / 情境：${question}\n\n` : ''}请依系统指示，写出这份双语深度觉察报告。`;
}

export async function POST(request) {
  // Auth gate — Layer 2 only.
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'bad request' }, { status: 400 }); }

  const { mode, spreadKey, positions, cardNumbers, question } = body || {};
  if (!Array.isArray(cardNumbers) || cardNumbers.length === 0 || !cardNumbers.every((n) => byNum[n])) {
    return NextResponse.json({ error: 'invalid cards' }, { status: 400 });
  }

  // Persist the reading first (RLS: user can only insert their own).
  const cardsPayload = cardNumbers.map((n, i) => ({
    n, position_cn: positions?.[i]?.[0] || null, position_en: positions?.[i]?.[1] || null,
  }));
  const { data: reading, error: rErr } = await supabase
    .from('readings')
    .insert({ user_id: user.id, mode, spread_key: String(spreadKey ?? ''), question: question || null, cards: cardsPayload })
    .select('id').single();
  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 });

  // Generate the deep report with Claude.
  const model = process.env.REPORT_MODEL || 'claude-sonnet-5';
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let content = '';
  try {
    const msg = await anthropic.messages.create({
      model,
      max_tokens: 2200,
      system: SYSTEM,
      messages: [{ role: 'user', content: buildUserMessage({ mode, spreadKey, positions, cardNumbers, question }) }],
    });
    content = msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
  } catch (e) {
    return NextResponse.json({ error: 'report_generation_failed', detail: String(e?.message || e) }, { status: 502 });
  }

  const { data: report, error: dErr } = await supabase
    .from('deep_reports')
    .insert({ user_id: user.id, reading_id: reading.id, model, content })
    .select('id, content, created_at').single();
  if (dErr) return NextResponse.json({ error: dErr.message }, { status: 500 });

  return NextResponse.json({ readingId: reading.id, reportId: report.id, content: report.content });
}
