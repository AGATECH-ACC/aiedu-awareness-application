'use client';
import Image from "next/image";
import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { CHAPTERS, CARDS, byNum, SPREAD3, INNER_CHILD } from "@/lib/cards";
import { insightFor } from "@/lib/card-insights";

/* ── 幸福人生觉察卡 · Happy Life Awareness Cards ──────────────────────
   Draw one card, a three-card spread, or the Inner Child four-card spread.
   Draw at random, or enter the numbers of cards you drew by hand.        */


const SERIF = 'Georgia, "Songti SC", "Times New Roman", serif';
const CARD_ASPECT_RATIO = "556 / 934";
const DECK_RUN_DURATION_MS = 3000;
const DECK_LOCK_HOLD_MS = 1000;
const CARD_REVEAL_DURATION_MS = 1100;
const DECK_RUN_CARD_WIDTH = 300;
const DECK_RUN_CARD_HEIGHT = Math.round(DECK_RUN_CARD_WIDTH * 934 / 556);
const DECK_RUN_GAP = 18;
const DECK_RUN_STOP_INDEX = 35;
const cardFrontSrc = (number) => `/cards/front-${String(number).padStart(2, "0")}.png`;

function drawN(n, pool) {
  const arr = [...pool], out = [];
  for (let i = 0; i < n && arr.length; i++) out.push(arr.splice(Math.floor(Math.random() * arr.length), 1)[0]);
  return out;
}

function CardArtwork({ card, side = "front", sizes, eager = false, decorative = false }) {
  const isBack = side === "back";
  const src = isBack ? "/cards/back-1.png" : cardFrontSrc(card.n);
  const alt = decorative
    ? ""
    : isBack
      ? "幸福人生觉察卡背面"
      : `第 ${String(card.n).padStart(2, "0")} 张：${card.cn} / ${card.en}`;

  return (
    <Image
      src={src}
      alt={alt}
      width={556}
      height={934}
      sizes={sizes}
      loading={eager ? "eager" : "lazy"}
      style={{ display: "block", width: "100%", height: "100%", objectFit: "contain" }}
    />
  );
}

function CardFace({ card }) {
  return (
    <div style={{
      width: "100%", height: "100%", background: "#fff", borderRadius: 20,
      overflow: "hidden",
    }}>
      <CardArtwork card={card} sizes="(max-width: 480px) 66vw, 300px" eager />
    </div>
  );
}

function DeckRun({ selectedCard, locked }) {
  const orderedCards = useMemo(() => {
    const selectedIndex = CARDS.findIndex((card) => card.n === selectedCard.n);
    const firstIndex = (selectedIndex - DECK_RUN_STOP_INDEX + CARDS.length) % CARDS.length;
    return Array.from({ length: CARDS.length }, (_, index) => CARDS[(firstIndex + index) % CARDS.length]);
  }, [selectedCard.n]);
  const step = DECK_RUN_CARD_WIDTH + DECK_RUN_GAP;
  const startX = -(DECK_RUN_CARD_WIDTH / 2);
  const stopX = -(DECK_RUN_STOP_INDEX * step + DECK_RUN_CARD_WIDTH / 2);

  return (
    <div aria-hidden="true" style={{
      position: "relative", height: DECK_RUN_CARD_HEIGHT, width: "100%", overflow: "hidden", borderRadius: 20,
      background: "#f4ecd9",
      border: "1px solid rgba(181,132,43,0.2)", boxShadow: "inset 0 2px 14px rgba(80,60,30,0.06)",
    }}>
      <div data-deck-run-track="true" style={{
        '--deck-run-start': `${startX}px`,
        '--deck-run-stop': `${stopX}px`,
        position: "absolute", left: "50%", top: 0, display: "flex", gap: DECK_RUN_GAP,
        width: "max-content", transform: `translate3d(${locked ? stopX : startX}px, 0, 0)`,
        animation: locked ? "none" : `deckRun ${DECK_RUN_DURATION_MS}ms cubic-bezier(.65, 0, .15, 1) both`,
        willChange: "transform",
      }}>
        {orderedCards.map((card, index) => {
          const selected = index === DECK_RUN_STOP_INDEX;
          return (
            <div key={card.n} style={{
              flex: `0 0 ${DECK_RUN_CARD_WIDTH}px`, width: DECK_RUN_CARD_WIDTH,
              height: DECK_RUN_CARD_HEIGHT, overflow: "hidden", borderRadius: 20,
              background: "#fff", boxShadow: selected
                ? "0 0 0 3px #b5842b, 0 8px 24px rgba(80,60,30,0.25)"
                : "0 4px 12px rgba(80,60,30,0.16)",
            }}>
              <CardArtwork side="back" sizes={`${DECK_RUN_CARD_WIDTH}px`} eager decorative />
            </div>
          );
        })}
      </div>
      <div style={{
        position: "absolute", zIndex: 2, left: "50%", top: 0, bottom: 0,
        width: DECK_RUN_CARD_WIDTH + 12, transform: "translateX(-50%)", borderRadius: 12,
        borderLeft: "2px solid rgba(181,132,43,0.7)", borderRight: "2px solid rgba(181,132,43,0.7)",
        pointerEvents: "none",
      }} />
    </div>
  );
}

function SingleCardReveal({ card, phase }) {
  const revealing = phase === "revealing";
  const revealed = phase === "revealed";

  return (
    <div style={{ width: "100%", maxWidth: DECK_RUN_CARD_WIDTH, margin: "20px auto 0", perspective: 1400 }}>
      <div data-card-reveal="true" style={{
        position: "relative", width: "100%", aspectRatio: CARD_ASPECT_RATIO, transformStyle: "preserve-3d",
        transform: `rotateY(${revealed ? 180 : 0}deg)`,
        animation: revealing ? `cardReveal ${CARD_REVEAL_DURATION_MS}ms cubic-bezier(.35, .05, .15, 1) both` : "none",
        willChange: revealing ? "transform" : "auto",
      }}>
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: 20, background: "#fff", WebkitBackfaceVisibility: "hidden", backfaceVisibility: "hidden" }}>
          <CardArtwork side="back" sizes="(max-width: 480px) calc(100vw - 32px), 300px" eager />
        </div>
        <div style={{ position: "absolute", inset: 0, WebkitBackfaceVisibility: "hidden", backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
          <CardFace card={card} />
        </div>
      </div>
    </div>
  );
}

function MiniCard({ card, badge, label, sub, index }) {
  const chap = CHAPTERS[card.ch];
  return (
    <div style={{ animation: `fadeUp .5s ease both`, animationDelay: `${index * 140}ms`, textAlign: "center" }}>
      <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", aspectRatio: CARD_ASPECT_RATIO, background: "#fff", boxShadow: "0 4px 12px rgba(60,45,25,0.12)" }}>
        <CardArtwork card={card} sizes="(max-width: 480px) 29vw, 110px" eager />
        <div style={{ position: "absolute", top: 5, left: 6, background: "rgba(255,255,255,0.92)", color: chap.color, fontWeight: 800, fontSize: 11, borderRadius: 6, padding: "1px 6px" }}>{badge}</div>
      </div>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: chap.color, marginTop: 6 }}>{label}</div>
      <div style={{ fontFamily: SERIF, fontSize: 9.5, fontStyle: "italic", color: "#9a8f78" }}>{sub}</div>
    </div>
  );
}

function InsightSection({ label, value, valueEn, color, tint, question = false }) {
  if (!value) return null;
  return (
    <div style={{
      marginTop: 12,
      padding: question ? "12px 14px" : 0,
      borderRadius: question ? 12 : 0,
      background: question ? tint : "transparent",
      border: question ? `1px solid ${color}24` : "none",
    }}>
      <div style={{ color, fontSize: 11, fontWeight: 800, letterSpacing: 0.6 }}>{label}</div>
      <div style={{ color: "#40392f", fontSize: question ? 13 : 12.5, fontWeight: question ? 700 : 400, lineHeight: 1.7, marginTop: 4 }}>{value}</div>
      {valueEn ? (
        <div lang="en" style={{ fontFamily: SERIF, fontStyle: "italic", color: "#776d5f", fontSize: question ? 12.5 : 12, fontWeight: question ? 600 : 400, lineHeight: 1.65, marginTop: 4 }}>
          {valueEn}
        </div>
      ) : null}
    </div>
  );
}

function RichCardInsight({ card, compact = false }) {
  const chap = CHAPTERS[card.ch];
  const insight = insightFor(card);
  if (!insight) return null;

  if (compact) {
    return (
      <div className="card-insight card-insight--compact" style={{ marginTop: 8 }}>
        <InsightSection label="核心主题 · Core theme" value={insight.core} valueEn={insight.core_en} color={chap.color} tint={chap.tint} />
        <InsightSection label="转化方向 · Growth direction" value={insight.shift} valueEn={insight.shift_en} color={chap.color} tint={chap.tint} />
        <InsightSection label="觉察提问 · Reflection question" value={insight.question} valueEn={insight.question_en} color={chap.color} tint={chap.tint} question />
      </div>
    );
  }

  return (
    <div className="card-insight" style={{ margin: "4px 0 18px", paddingBottom: 16, borderBottom: `1px solid ${chap.color}1f` }}>
      <InsightSection label="核心主题 · Core theme" value={insight.core} valueEn={insight.core_en} color={chap.color} tint={chap.tint} question />
      <InsightSection label="牌义解读 · What this card reveals" value={insight.meaning} valueEn={insight.meaning_en} color={chap.color} tint={chap.tint} />
      {insight.voices?.length ? (
        <div style={{ marginTop: 12 }}>
          <div style={{ color: chap.color, fontSize: 11, fontWeight: 800, letterSpacing: 0.6 }}>可能的内在声音 · Inner voices</div>
          <ul style={{ margin: "6px 0 0", paddingLeft: 20, color: "#51483b", fontSize: 12.5, lineHeight: 1.65 }}>
            {insight.voices.map((voice, index) => (
              <li key={voice} style={{ marginTop: index === 0 ? 0 : 5 }}>
                <div>“{voice}”</div>
                {insight.voices_en?.[index] ? (
                  <div lang="en" style={{ fontFamily: SERIF, fontStyle: "italic", color: "#776d5f", fontSize: 12, lineHeight: 1.55, marginTop: 1 }}>
                    “{insight.voices_en[index]}”
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <InsightSection label="你可能会看见 · You may notice" value={insight.signs} valueEn={insight.signs_en} color={chap.color} tint={chap.tint} />
      <InsightSection label={insight.lensLabel} value={insight.lens} valueEn={insight.lens_en} color={chap.color} tint={chap.tint} />
      <InsightSection label="这套模式的代价 · Possible cost" value={insight.cost} valueEn={insight.cost_en} color={chap.color} tint={chap.tint} />
      <InsightSection label="转化方向 · Growth direction" value={insight.shift} valueEn={insight.shift_en} color={chap.color} tint={chap.tint} />
      <InsightSection label="觉察提问 · Reflection question" value={insight.question} valueEn={insight.question_en} color={chap.color} tint={chap.tint} question />
    </div>
  );
}

function ReadingRow({ card, badge, label, sub, desc, descEn, index }) {
  const chap = CHAPTERS[card.ch];
  return (
    <div style={{ animation: `fadeUp .5s ease both`, animationDelay: `${index * 140 + 120}ms`, display: "flex", gap: 12, padding: "14px 0", borderTop: index === 0 ? "none" : "1px solid #eee4cf" }}>
      <div style={{ flex: "0 0 64px" }}>
        <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", aspectRatio: CARD_ASPECT_RATIO, background: "#fff", boxShadow: "0 3px 10px rgba(60,45,25,0.1)" }}>
          <CardArtwork card={card} sizes="64px" eager decorative />
          <div style={{ position: "absolute", top: 3, left: 4, background: "rgba(255,255,255,0.92)", color: chap.color, fontWeight: 800, fontSize: 9, borderRadius: 5, padding: "0 4px" }}>{badge}</div>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13.5, fontWeight: 800, color: chap.color }}>{label}</span>
          <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 11, color: "#a99b82" }}>{sub}</span>
        </div>
        {desc ? (
          <div style={{ fontSize: 11, color: "#9a8f78", marginTop: 1 }}>
            <div>{desc}</div>
            {descEn ? <div lang="en" style={{ fontFamily: SERIF, fontStyle: "italic", marginTop: 1 }}>{descEn}</div> : null}
          </div>
        ) : null}
        <div style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 700, color: "#2a2622", marginTop: 4 }}>
          {String(card.n).padStart(2, "0")}. {card.cn} <span style={{ fontSize: 11, color: "#8a7f6c", letterSpacing: 1 }}>{card.en}</span>
        </div>
        <div style={{ fontSize: 12, color: "#3a352e", lineHeight: 1.55, marginTop: 5 }}>
          <b style={{ color: chap.color }}>影响 · Affects you：</b>{card.affect_cn}
        </div>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 11.5, color: "#7a7060", lineHeight: 1.5, marginTop: 2 }}>{card.affect_en}</div>
        <RichCardInsight card={card} compact />
        <div style={{ fontSize: 12, color: "#3a352e", lineHeight: 1.55, marginTop: 6 }}>
          <b style={{ color: chap.color }}>练习 · Practice：</b>{card.practice_cn}
        </div>
        <div lang="en" style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 11.5, color: "#7a7060", lineHeight: 1.5, marginTop: 2 }}>{card.practice_en}</div>
      </div>
    </div>
  );
}

const MODES = [
  { m: 1, cn: "单张牌", en: "Single" },
  { m: 3, cn: "三张牌", en: "Three-Card" },
  { m: 4, cn: "内在小孩", en: "Inner Child · 4" },
];

export default function App({ onReading, singleOnly = false, landing = false, initialMethod = "draw" } = {}) {
  const [mode, setMode] = useState(1);
  const [method, setMethod] = useState(initialMethod === "input" ? "input" : "draw"); // draw | input
  const [set3, setSet3] = useState(0);
  const [inputs, setInputs] = useState(["", "", "", ""]);
  const [err, setErr] = useState("");
  const [reading, setReading] = useState(null);
  const [posMeta, setPosMeta] = useState([]);
  const [drawPhase, setDrawPhase] = useState("idle");
  const [dealKey, setDealKey] = useState(0);
  const resultRef = useRef(null);
  const drawTimerRefs = useRef([]);
  const activeMode = singleOnly ? 1 : mode;

  const pool = CARDS;

  const metaFor = useCallback((m) => {
    if (m === 1) return [["当下的觉察", "This moment", ""]];
    if (m === 3) return SPREAD3[set3].pos.map(([cn, en]) => [cn, en, ""]);
    return INNER_CHILD;
  }, [set3]);

  const clearRevealTimers = useCallback(() => {
    drawTimerRefs.current.forEach((timer) => window.clearTimeout(timer));
    drawTimerRefs.current = [];
  }, []);

  useEffect(() => clearRevealTimers, [clearRevealTimers]);

  const generate = useCallback((forcedCards, forcedMode = activeMode) => {
    clearRevealTimers();
    setErr("");
    let cards;
    if (forcedCards) {
      cards = forcedCards;
    } else if (method === "input") {
      const nums = inputs.slice(0, forcedMode).map((s) => parseInt(s, 10));
      if (nums.some((x) => !Number.isInteger(x) || x < 1 || x > 40)) {
        setErr("请为每个位置输入 1–40 的编号。 Please enter a number 1–40 for each position.");
        return;
      }
      if (new Set(nums).size !== nums.length) {
        setErr("同一个牌阵里编号不能重复。 Numbers can't repeat in one spread.");
        return;
      }
      cards = nums.map((x) => byNum[x]);
    } else {
      cards = drawN(forcedMode, pool);
    }
    setPosMeta(metaFor(forcedMode));
    setReading(cards);
    if (onReading) onReading({ mode: forcedMode, spreadKey: forcedMode === 3 ? String(set3) : forcedMode === 4 ? "inner" : "single", cardNumbers: cards.map((c) => c.n), positions: metaFor(forcedMode) });
    setDealKey((k) => k + 1);
    if (forcedMode === 1) {
      setDrawPhase("running");
      drawTimerRefs.current = [
        window.setTimeout(() => setDrawPhase("locked"), DECK_RUN_DURATION_MS),
        window.setTimeout(() => setDrawPhase("revealing"), DECK_RUN_DURATION_MS + DECK_LOCK_HOLD_MS),
        window.setTimeout(() => {
          setDrawPhase("revealed");
          drawTimerRefs.current = [];
        }, DECK_RUN_DURATION_MS + DECK_LOCK_HOLD_MS + CARD_REVEAL_DURATION_MS),
      ];
    } else {
      setDrawPhase("revealed");
    }
    setTimeout(() => {
      const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
      resultRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "nearest" });
    }, 120);
  }, [method, inputs, activeMode, pool, metaFor, onReading, clearRevealTimers]);

  const changeMode = useCallback((nextMode) => {
    clearRevealTimers();
    setReading(null);
    setDrawPhase("idle");
    setErr("");
    setMode(nextMode);
  }, [clearRevealTimers]);

  const chap = reading && activeMode === 1 ? CHAPTERS[reading[0].ch] : null;
  const isDrawInProgress = Boolean(reading && activeMode === 1 && drawPhase !== "revealed");

  return (
    <div id={landing ? "draw" : undefined} className={`card-deck${landing ? " card-deck--landing" : ""}`} style={landing ? {
      width: "100%", boxSizing: "border-box", padding: "0 24px 54px",
      fontFamily: '-apple-system, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif', color: "#201d1a",
    } : {
      minHeight: "100vh", width: "100%", boxSizing: "border-box",
      background: "radial-gradient(130% 80% at 50% -10%, #fdf6ea 0%, #f6eede 45%, #efe6d4 100%)",
      padding: "22px 16px 44px", fontFamily: '-apple-system, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif', color: "#2a2622",
    }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes deckRun {
          from { transform: translate3d(var(--deck-run-start), 0, 0); }
          to { transform: translate3d(var(--deck-run-stop), 0, 0); }
        }
        @keyframes cardReveal { from { transform: rotateY(0deg); } to { transform: rotateY(180deg); } }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
        select.aw { -webkit-appearance: none; appearance: none; }
      `}</style>

      <div className="card-deck-shell" style={{ maxWidth: landing ? 1120 : 460, margin: "0 auto" }}>
        {landing ? null : (
          <header style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontFamily: SERIF, fontSize: 25, fontWeight: 700, letterSpacing: 2 }}>幸福人生觉察卡</div>
            <div style={{ fontFamily: SERIF, fontSize: 10.5, letterSpacing: 4, color: "#a9863c", marginTop: 4 }}>HAPPY LIFE AWARENESS CARDS</div>
          </header>
        )}

        <div className="draw-workspace">
          <section className="draw-controls" aria-label="抽牌设置 · Draw settings">
            {landing ? (
              <div className="draw-controls-intro">
                <div>01 · ONE CARD AWARENESS</div>
                <h2>让一张牌，<br />照见此刻的自己</h2>
                <p>
                  先深呼吸，把注意力带回当下。准备好后，抽取今天最需要看见的觉察。<br />
                  <span>Take one quiet breath. Draw when you are ready to listen inward.</span>
                </p>
                <aside className="draw-purpose" aria-labelledby="draw-purpose-title">
                  <div id="draw-purpose-title">为什么抽一张牌 · Why draw a card?</div>
                  <p>
                    抽牌不是预测答案，而是给自己一个停顿。图像与提问帮助你离开惯性，看见此刻的感受、需要与下一步。<br />
                    <span>A card does not predict your future. It creates a pause to notice what you feel, what you need, and what you may choose next.</span>
                  </p>
                  <ol>
                    <li><strong>停一停</strong><small>Pause</small></li>
                    <li><strong>看见</strong><small>Notice</small></li>
                    <li><strong>选择</strong><small>Choose</small></li>
                  </ol>
                </aside>
              </div>
            ) : null}

        {/* Mode */}
        {singleOnly ? null : (
          <div className="deck-mode-switch" style={{ display: "flex", gap: 6, background: "#f0e7d4", padding: 5, borderRadius: 14, marginBottom: 12 }}>
            {MODES.map(({ m, cn, en }) => {
              const active = mode === m;
              return (
                <button type="button" key={m} aria-pressed={active} onClick={() => changeMode(m)} style={{
                  flex: 1, border: "none", borderRadius: 10, padding: "9px 4px", cursor: "pointer",
                  background: active ? "#2a2622" : "transparent", color: active ? "#f3e6bf" : "#6a5f4a",
                  fontWeight: 700, fontSize: 13, transition: "all .2s",
                }}>
                  <div>{cn}</div>
                  <div style={{ fontFamily: SERIF, fontSize: 9, fontStyle: "italic", opacity: 0.8, marginTop: 1 }}>{en}</div>
                </button>
              );
            })}
          </div>
        )}

        {/* Method */}
        {singleOnly ? null : (
          <div className="deck-method-switch" style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 14 }}>
            {[["draw", "随机抽牌", "Draw"], ["input", "输入编号", "Enter №"]].map(([k, cn, en]) => {
              const active = method === k;
              return (
                <button type="button" key={k} aria-pressed={active} onClick={() => setMethod(k)} style={{
                  border: `1.5px solid ${active ? "#b5842b" : "#cdbf9e"}`, background: active ? "#b5842b" : "transparent",
                  color: active ? "#fff" : "#8a7a54", borderRadius: 999, padding: "6px 15px", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                }}>{cn} · {en}</button>
              );
            })}
          </div>
        )}

        {/* 3-card position set picker */}
        {activeMode === 3 && (
          <div style={{ marginBottom: 14 }}>
            <label htmlFor="three-card-spread" style={{ fontSize: 11.5, color: "#8a7f6c", fontWeight: 600, display: "block", marginBottom: 5 }}>选择牌阵含义 · Position meanings</label>
            <div style={{ position: "relative" }}>
              <select id="three-card-spread" className="aw" value={set3} onChange={(e) => setSet3(Number(e.target.value))} style={{
                width: "100%", padding: "11px 34px 11px 14px", borderRadius: 12, border: "1.5px solid #cdbf9e",
                background: "#fffdf8", fontSize: 13.5, fontWeight: 600, color: "#2a2622", cursor: "pointer",
              }}>
                {SPREAD3.map((s, i) => <option key={i} value={i}>{s.name}  ({s.en})</option>)}
              </select>
              <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#b5842b" }}>▾</span>
            </div>
          </div>
        )}

        {/* Inner child explainer */}
        {activeMode === 4 && (
          <div style={{ background: "#f5ecd6", border: "1px solid #e6d3a8", borderRadius: 12, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#7a6a44", lineHeight: 1.6 }}>
            <b>内在小孩牌阵</b> · Inner Child Spread — 帮助你找出内在小孩的需求与渴望。
          </div>
        )}

        {/* Number inputs (input mode) */}
        {method === "input" && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(activeMode, 4)}, 1fr)`, gap: 8 }}>
              {Array.from({ length: activeMode }).map((_, i) => {
                const meta = metaFor(activeMode)[i];
                return (
                  <div key={i}>
                    <label htmlFor={`card-number-${i}`} style={{ fontSize: 10.5, color: "#8a7f6c", fontWeight: 700, display: "block", marginBottom: 3, textAlign: "center" }}>
                      {activeMode === 1 ? "编号 №" : `${i + 1}. ${meta[0]}`}
                    </label>
                    <input id={`card-number-${i}`} type="number" min={1} max={40} inputMode="numeric" value={inputs[i]}
                      onChange={(e) => { const v = [...inputs]; v[i] = e.target.value; setInputs(v); }}
                      placeholder="1–40"
                      style={{ width: "100%", boxSizing: "border-box", padding: "10px 6px", borderRadius: 10, border: "1.5px solid #cdbf9e", background: "#fffdf8", fontSize: 15, textAlign: "center", fontWeight: 700, color: "#2a2622" }} />
                  </div>
                );
              })}
            </div>
            {err && <div style={{ color: "#b04a2e", fontSize: 12, marginTop: 8, textAlign: "center" }}>{err}</div>}
          </div>
        )}

        {/* Primary action */}
        <div className="deck-actions" style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 6 }}>
          <button className="deck-primary-action" type="button" onClick={() => generate()} disabled={isDrawInProgress} aria-busy={isDrawInProgress} style={{
            background: "#2a2622", color: "#f3e6bf", border: "none", borderRadius: 999, padding: "12px 26px",
            minWidth: 168, minHeight: 44, display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, fontWeight: 700, cursor: isDrawInProgress ? "wait" : "pointer", opacity: isDrawInProgress ? 0.72 : 1,
          }}>
            {isDrawInProgress
              ? method === "input" ? "查看解读 · Read" : `抽 ${activeMode} 张牌 · Draw ${activeMode}`
              : method === "input"
                ? "查看解读 · Read"
                : reading
                  ? "重新抽牌 · Draw again"
                  : `抽 ${activeMode} 张牌 · Draw ${activeMode}`}
          </button>
        </div>
          </section>

        {/* ── RESULT ── */}
        <section className="draw-stage" ref={resultRef} aria-live="polite" aria-label="抽牌结果 · Draw result">
          {landing && !reading ? (
            <div className="draw-stage-empty">
              <div className="draw-stage-card-back">
                <CardArtwork side="back" sizes="(max-width: 760px) 76vw, 340px" eager />
              </div>
              <div className="draw-stage-prompt">
                <span>准备好时，抽一张牌</span>
                <small>When you are ready, draw one card.</small>
              </div>
            </div>
          ) : null}
          {/* Single card: flip */}
          {reading && activeMode === 1 && (
            <>
              {drawPhase === "running" || drawPhase === "locked" ? (
                <div key={`run-${dealKey}`} style={{ width: "100%", margin: "20px auto 0" }}>
                  <DeckRun selectedCard={reading[0]} locked={drawPhase === "locked"} />
                </div>
              ) : (
                <SingleCardReveal key={`card-${dealKey}`} card={reading[0]} phase={drawPhase} />
              )}
              {drawPhase === "revealed" ? (
                <div key={dealKey} style={{
                  marginTop: 22, background: "#fffdf8", borderRadius: 18, border: `1px solid ${chap.color}33`,
                  boxShadow: "0 6px 24px rgba(80,60,30,0.08)", overflow: "hidden", animation: "fadeUp .5s ease both", animationDelay: "150ms",
                }}>
                  <div style={{ background: chap.tint, padding: "12px 18px", borderBottom: `1px solid ${chap.color}22` }}>
                    <div style={{ fontSize: 12, color: chap.color, fontWeight: 700, letterSpacing: 1 }}>第 {String(reading[0].n).padStart(2, "0")} 张 · {chap.cn} / {chap.en}</div>
                    <div style={{ fontFamily: SERIF, fontSize: 19, fontWeight: 700, marginTop: 2 }}>{reading[0].cn} <span style={{ fontSize: 13, color: "#8a7f6c", letterSpacing: 1 }}>{reading[0].en}</span></div>
                  </div>
                  <div style={{ padding: "16px 18px 18px" }}>
                    <Block label="此刻的提醒" sub="Message for this moment" color={chap.color} cn={reading[0].affect_cn} en={reading[0].affect_en} />
                    <RichCardInsight card={reading[0]} />
                    <Block label="今日练习" sub="Today's practice" color={chap.color} cn={reading[0].practice_cn} en={reading[0].practice_en} last />
                  </div>
                </div>
              ) : null}
            </>
          )}

          {/* Three-card row */}
          {reading && activeMode === 3 && (
            <div key={dealKey} style={{ marginTop: 20 }}>
              <div style={{ textAlign: "center", fontSize: 12.5, color: "#8a7f6c", fontWeight: 600, marginBottom: 12 }}>{SPREAD3[set3].name} · {SPREAD3[set3].en}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, maxWidth: 360, margin: "0 auto" }}>
                {reading.map((c, i) => <MiniCard key={i} card={c} badge={i + 1} label={posMeta[i][0]} sub={posMeta[i][1]} index={i} />)}
              </div>
              <div style={{ marginTop: 20, background: "#fffdf8", borderRadius: 18, border: "1px solid #e6d9bd", boxShadow: "0 6px 24px rgba(80,60,30,0.07)", padding: "6px 16px 16px" }}>
                {reading.map((c, i) => <ReadingRow key={i} card={c} badge={i + 1} label={posMeta[i][0]} sub={posMeta[i][1]} index={i} />)}
              </div>
            </div>
          )}

          {/* Inner child cross */}
          {reading && activeMode === 4 && (
            <div key={dealKey} style={{ marginTop: 20 }}>
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, maxWidth: 340, margin: "0 auto",
                gridTemplateAreas: `". p2 ." "p1 . p4" ". p3 ."`,
              }}>
                <div style={{ gridArea: "p1" }}><MiniCard card={reading[0]} badge={1} label={INNER_CHILD[0][0]} sub={INNER_CHILD[0][1]} index={0} /></div>
                <div style={{ gridArea: "p2" }}><MiniCard card={reading[1]} badge={2} label={INNER_CHILD[1][0]} sub={INNER_CHILD[1][1]} index={1} /></div>
                <div style={{ gridArea: "p3" }}><MiniCard card={reading[2]} badge={3} label={INNER_CHILD[2][0]} sub={INNER_CHILD[2][1]} index={2} /></div>
                <div style={{ gridArea: "p4" }}><MiniCard card={reading[3]} badge={4} label={INNER_CHILD[3][0]} sub={INNER_CHILD[3][1]} index={3} /></div>
              </div>
              <div style={{ marginTop: 20, background: "#fffdf8", borderRadius: 18, border: "1px solid #e6d9bd", boxShadow: "0 6px 24px rgba(80,60,30,0.07)", padding: "6px 16px 16px" }}>
                {reading.map((c, i) => <ReadingRow key={i} card={c} badge={i + 1} label={INNER_CHILD[i][0]} sub={INNER_CHILD[i][1]} desc={INNER_CHILD[i][2]} descEn={INNER_CHILD[i][3]} index={i} />)}
              </div>
            </div>
          )}
        </section>
        </div>

        <footer className="card-deck-disclaimer" style={{ textAlign: "center", marginTop: 30, fontSize: 11, color: "#a99b82", lineHeight: 1.6 }}>
          用于自我觉察与反思，不是诊断或建议。<br />A gentle tool for self-reflection — not diagnosis or advice.
        </footer>
      </div>
    </div>
  );
}

function Block({ label, sub, cn, en, color, last }) {
  return (
    <div style={{ marginBottom: last ? 0 : 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: color }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: "#2a2622" }}>{label}</span>
        <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 11, color: "#a99b82" }}>{sub}</span>
      </div>
      <div style={{ fontSize: 13.5, lineHeight: 1.65, color: "#3a352e" }}>{cn}</div>
      <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 12.5, lineHeight: 1.6, color: "#7a7060", marginTop: 4 }}>{en}</div>
    </div>
  );
}
