'use client';
import Image from "next/image";
import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { CHAPTERS, CARDS, byNum, CURRENT_SPREADS, drawCardsForPositions, SINGLE_CARD_RANGE } from "@/lib/cards";
import { insightFor } from "@/lib/card-insights";

/* ── 幸福人生觉察卡 · Happy Life Awareness Cards ──────────────────────
   Draw one card, a two-card awareness spread, a structured three-card spread,
   or four-card deep awareness.
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

function metaForMode(mode) {
  if (mode === 1) return [["当下的觉察", "This moment", "", "", SINGLE_CARD_RANGE.min, SINGLE_CARD_RANGE.max]];
  return CURRENT_SPREADS[mode].positions.map(({ cn, en, guide_cn, guide_en, min, max }) => (
    [cn, en, guide_cn, guide_en, min, max]
  ));
}

function CardArtwork({ card, side = "front", sizes, eager = false, decorative = false }) {
  const isBack = side === "back";
  const src = isBack ? "/cards/back-1.png" : cardFrontSrc(card.n);
  const alt = decorative
    ? ""
    : isBack
      ? "幸福人生觉察卡背面"
      : `第 ${String(card.n).padStart(2, "0")} 张：${card.cn}`;

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

function MiniCard({ card, badge, label, index }) {
  const chap = CHAPTERS[card.ch];
  return (
    <div style={{ animation: `fadeUp .5s ease both`, animationDelay: `${index * 140}ms`, textAlign: "center" }}>
      <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", aspectRatio: CARD_ASPECT_RATIO, background: "#fff", boxShadow: "0 4px 12px rgba(60,45,25,0.12)" }}>
        <CardArtwork card={card} sizes="(max-width: 480px) 29vw, 110px" eager />
        <div style={{ position: "absolute", top: 5, left: 6, background: "rgba(255,255,255,0.92)", color: chap.color, fontWeight: 800, fontSize: 12, borderRadius: 6, padding: "1px 6px" }}>{badge}</div>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: chap.color, marginTop: 6 }}>{label}</div>
    </div>
  );
}

function SpreadProgress({ cards, positions, revealedCount, activeIndex, drawing }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: cards.length === 4 ? "1fr 1fr" : `repeat(${cards.length}, 1fr)`,
      gap: 8,
      maxWidth: cards.length === 4 ? 300 : 360,
      margin: "0 auto 18px",
    }}>
      {cards.map((card, index) => {
        const revealed = index < revealedCount;
        const active = index === activeIndex && drawing;
        const position = positions[index];

        return (
          <div key={index} style={{ textAlign: "center", opacity: revealed || active ? 1 : 0.58, transition: "opacity .25s ease" }}>
            <div style={{
              position: "relative",
              width: "100%",
              maxWidth: 82,
              margin: "0 auto",
              aspectRatio: CARD_ASPECT_RATIO,
              overflow: "hidden",
              borderRadius: 10,
              background: "#fff",
              boxShadow: active ? "0 0 0 2px #b5842b, 0 5px 16px rgba(80,60,30,.18)" : "0 3px 10px rgba(60,45,25,.1)",
            }}>
              <CardArtwork card={card} side={revealed ? "front" : "back"} sizes="82px" eager decorative />
              <span style={{
                position: "absolute", top: 4, left: 5, minWidth: 18, borderRadius: 999, padding: "1px 4px",
                background: revealed ? "rgba(255,255,255,.92)" : "rgba(42,38,34,.82)",
                color: revealed ? CHAPTERS[card.ch].color : "#f3e6bf", fontSize: 11, fontWeight: 800,
              }}>{index + 1}</span>
            </div>
            <div style={{ color: revealed || active ? "#6f5a30" : "#9a8f78", fontSize: 11, fontWeight: 750, lineHeight: 1.3, marginTop: 5 }}>
              {position?.[0]}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InsightSection({ label, value, color, tint, question = false }) {
  if (!value) return null;
  return (
    <div style={{
      marginTop: 12,
      padding: question ? "12px 14px" : 0,
      borderRadius: question ? 12 : 0,
      background: question ? tint : "transparent",
      border: question ? `1px solid ${color}24` : "none",
    }}>
      <div style={{ color, fontSize: 13, fontWeight: 800, letterSpacing: 0.6 }}>{label}</div>
      <div style={{ color: "#40392f", fontSize: question ? 16 : 15, fontWeight: question ? 700 : 400, lineHeight: 1.75, marginTop: 4 }}>{value}</div>
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
        <InsightSection label="核心主题" value={insight.core} color={chap.color} tint={chap.tint} />
        <InsightSection label="转化方向" value={insight.shift} color={chap.color} tint={chap.tint} />
        <InsightSection label="觉察提问" value={insight.question} color={chap.color} tint={chap.tint} question />
      </div>
    );
  }

  return (
    <div className="card-insight" style={{ margin: "4px 0 18px", paddingBottom: 16, borderBottom: `1px solid ${chap.color}1f` }}>
      <InsightSection label="核心主题" value={insight.core} color={chap.color} tint={chap.tint} question />
      <InsightSection label="牌义解读" value={insight.meaning} color={chap.color} tint={chap.tint} />
      {insight.voices?.length ? (
        <div style={{ marginTop: 12 }}>
          <div style={{ color: chap.color, fontSize: 13, fontWeight: 800, letterSpacing: 0.6 }}>可能的内在声音</div>
          <ul style={{ margin: "6px 0 0", paddingLeft: 20, color: "#51483b", fontSize: 15, lineHeight: 1.7 }}>
            {insight.voices.map((voice, index) => (
              <li key={voice} style={{ marginTop: index === 0 ? 0 : 5 }}>
                <div>“{voice}”</div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <InsightSection label="你可能会看见" value={insight.signs} color={chap.color} tint={chap.tint} />
      <InsightSection label={insight.lensLabel.split(' · ')[0]} value={insight.lens} color={chap.color} tint={chap.tint} />
      <InsightSection label="这套模式的代价" value={insight.cost} color={chap.color} tint={chap.tint} />
      <InsightSection label="转化方向" value={insight.shift} color={chap.color} tint={chap.tint} />
      <InsightSection label="觉察提问" value={insight.question} color={chap.color} tint={chap.tint} question />
    </div>
  );
}

function ReadingRow({ card, badge, label, desc, index }) {
  const chap = CHAPTERS[card.ch];
  return (
    <div style={{ animation: `fadeUp .5s ease both`, animationDelay: `${index * 140 + 120}ms`, display: "flex", gap: 12, padding: "14px 0", borderTop: index === 0 ? "none" : "1px solid #eee4cf" }}>
      <div style={{ flex: "0 0 64px" }}>
        <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", aspectRatio: CARD_ASPECT_RATIO, background: "#fff", boxShadow: "0 3px 10px rgba(60,45,25,0.1)" }}>
          <CardArtwork card={card} sizes="64px" eager decorative />
          <div style={{ position: "absolute", top: 3, left: 4, background: "rgba(255,255,255,0.92)", color: chap.color, fontWeight: 800, fontSize: 12, borderRadius: 5, padding: "0 4px" }}>{badge}</div>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: chap.color }}>{label}</span>
        </div>
        {desc ? (
          <div style={{ fontSize: 13, color: "#9a8f78", marginTop: 1 }}>
            <div>{desc}</div>
          </div>
        ) : null}
        <div style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 700, color: "#2a2622", marginTop: 4 }}>
          {String(card.n).padStart(2, "0")}. {card.cn}
        </div>
        <div style={{ fontSize: 15, color: "#3a352e", lineHeight: 1.65, marginTop: 5 }}>
          <b style={{ color: chap.color }}>影响：</b>{card.affect_cn}
        </div>
        <RichCardInsight card={card} compact />
        <div style={{ fontSize: 15, color: "#3a352e", lineHeight: 1.65, marginTop: 6 }}>
          <b style={{ color: chap.color }}>练习：</b>{card.practice_cn}
        </div>
      </div>
    </div>
  );
}

const MODES = [
  { m: 1, cn: "单张牌" },
  { m: 2, cn: "两张牌" },
  { m: 3, cn: "三张牌" },
  { m: 4, cn: "四卡深度觉察" },
];

export default function App({ onReading, singleOnly = false, landing = false, initialMethod = "draw" } = {}) {
  const [mode, setMode] = useState(1);
  const [method, setMethod] = useState(initialMethod === "input" ? "input" : "draw"); // draw | input
  const [inputs, setInputs] = useState(["", "", "", ""]);
  const [err, setErr] = useState("");
  const [reading, setReading] = useState(null);
  const [posMeta, setPosMeta] = useState([]);
  const [drawPhase, setDrawPhase] = useState("idle");
  const [revealedCount, setRevealedCount] = useState(0);
  const [activeDrawIndex, setActiveDrawIndex] = useState(0);
  const [dealKey, setDealKey] = useState(0);
  const resultRef = useRef(null);
  const drawTimerRefs = useRef([]);
  const activeMode = singleOnly ? 1 : mode;
  const activePositions = metaForMode(activeMode);

  const clearRevealTimers = useCallback(() => {
    drawTimerRefs.current.forEach((timer) => window.clearTimeout(timer));
    drawTimerRefs.current = [];
  }, []);

  useEffect(() => clearRevealTimers, [clearRevealTimers]);

  const publishReading = useCallback((cards, completedMode, positions) => {
    if (!onReading) return;
    onReading({
      mode: completedMode,
      spreadKey: completedMode === 1 ? "single" : CURRENT_SPREADS[completedMode].key,
      cardNumbers: cards.map((card) => card.n),
      positions: positions.map(([cn, en]) => [cn, en]),
    });
  }, [onReading]);

  const runCardAnimation = useCallback((cards, drawMode, positions, cardIndex) => {
    clearRevealTimers();
    setActiveDrawIndex(cardIndex);
    setDrawPhase("running");
    setDealKey((key) => key + 1);

    const finishReveal = () => {
      const nextRevealedCount = cardIndex + 1;
      setDrawPhase("revealed");
      setRevealedCount(nextRevealedCount);
      drawTimerRefs.current = [];
      if (nextRevealedCount === drawMode) publishReading(cards, drawMode, positions);
    };

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reducedMotion) {
      finishReveal();
    } else {
      drawTimerRefs.current = [
        window.setTimeout(() => setDrawPhase("locked"), DECK_RUN_DURATION_MS),
        window.setTimeout(() => setDrawPhase("revealing"), DECK_RUN_DURATION_MS + DECK_LOCK_HOLD_MS),
        window.setTimeout(finishReveal, DECK_RUN_DURATION_MS + DECK_LOCK_HOLD_MS + CARD_REVEAL_DURATION_MS),
      ];
    }

    window.setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "nearest" });
    }, 120);
  }, [clearRevealTimers, publishReading]);

  const generate = useCallback((forcedCards, forcedMode = activeMode) => {
    clearRevealTimers();
    setErr("");
    const nextPositions = metaForMode(forcedMode);
    let cards;
    if (forcedCards) {
      cards = forcedCards;
    } else if (method === "input") {
      const nums = inputs.slice(0, forcedMode).map((s) => Number(s));
      if (nums.some((x) => !Number.isInteger(x))) {
        setErr("请为每个位置输入有效编号。");
        return;
      }
      const invalidPosition = nums.findIndex((number, index) => (
        number < nextPositions[index][4] || number > nextPositions[index][5]
      ));
      if (invalidPosition !== -1) {
        const position = nextPositions[invalidPosition];
        setErr(`${invalidPosition + 1}. ${position[0]} 只可输入 ${position[4]}–${position[5]}。`);
        return;
      }
      if (new Set(nums).size !== nums.length) {
        setErr("同一个牌阵里编号不能重复。");
        return;
      }
      cards = nums.map((x) => byNum[x]);
    } else {
      cards = drawCardsForPositions(forcedMode === 1 ? [SINGLE_CARD_RANGE] : CURRENT_SPREADS[forcedMode].positions);
    }
    setPosMeta(nextPositions);
    setReading(cards);
    setRevealedCount(0);
    setActiveDrawIndex(0);
    if (onReading) onReading(null);

    if (method === "input") {
      setRevealedCount(forcedMode);
      setDrawPhase("revealed");
      setDealKey((key) => key + 1);
      publishReading(cards, forcedMode, nextPositions);
    } else {
      runCardAnimation(cards, forcedMode, nextPositions, 0);
    }
  }, [method, inputs, activeMode, onReading, clearRevealTimers, publishReading, runCardAnimation]);

  const continueSpreadDraw = useCallback(() => {
    if (!reading || activeMode === 1 || method !== "draw" || revealedCount >= activeMode) return;
    runCardAnimation(reading, activeMode, posMeta, revealedCount);
  }, [reading, activeMode, method, revealedCount, posMeta, runCardAnimation]);

  const changeMode = useCallback((nextMode) => {
    clearRevealTimers();
    setReading(null);
    setDrawPhase("idle");
    setRevealedCount(0);
    setActiveDrawIndex(0);
    setErr("");
    setMode(nextMode);
    if (onReading) onReading(null);
  }, [clearRevealTimers, onReading]);

  const changeMethod = useCallback((nextMethod) => {
    clearRevealTimers();
    setReading(null);
    setDrawPhase("idle");
    setRevealedCount(0);
    setActiveDrawIndex(0);
    setErr("");
    setMethod(nextMethod);
    if (onReading) onReading(null);
  }, [clearRevealTimers, onReading]);

  const chap = reading && activeMode === 1 ? CHAPTERS[reading[0].ch] : null;
  const isDrawInProgress = Boolean(reading && (drawPhase === "running" || drawPhase === "locked" || drawPhase === "revealing"));
  const spreadComplete = Boolean(reading && revealedCount === activeMode);
  const shouldContinueSpread = Boolean(reading && method === "draw" && activeMode > 1 && revealedCount > 0 && !spreadComplete);
  const handlePrimaryAction = useCallback(() => {
    if (shouldContinueSpread) {
      continueSpreadDraw();
    } else {
      generate();
    }
  }, [shouldContinueSpread, continueSpreadDraw, generate]);
  const primaryActionLabel = isDrawInProgress
    ? `第 ${activeDrawIndex + 1} 张牌抽取中…`
    : method === "input"
      ? "查看解读"
      : shouldContinueSpread
        ? `抽第 ${revealedCount + 1} 张牌`
        : reading
          ? "重新抽牌"
          : activeMode > 1
            ? "抽第一张牌"
            : "抽 1 张牌";

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
          </header>
        )}

        <div className="draw-workspace">
          <section className="draw-controls" aria-label="抽牌设置">
            {landing ? (
              <div className="draw-controls-intro">
                <div>01 · 单张觉察</div>
                <h2>让一张牌，<br />照见此刻的自己</h2>
                <p>
                  先深呼吸，把注意力带回当下。准备好后，抽取今天最需要看见的觉察。
                </p>
                <aside className="draw-purpose" aria-labelledby="draw-purpose-title">
                  <div id="draw-purpose-title">为什么抽一张牌？</div>
                  <p>
                    抽牌不是预测答案，而是给自己一个停顿。图像与提问帮助你离开惯性，看见此刻的感受、需要与下一步。
                  </p>
                  <ol>
                    <li><strong>停一停</strong></li>
                    <li><strong>看见</strong></li>
                    <li><strong>选择</strong></li>
                  </ol>
                </aside>
              </div>
            ) : null}

        {/* Mode */}
        {singleOnly ? null : (
          <div className="deck-mode-switch" style={{ display: "flex", gap: 6, background: "#f0e7d4", padding: 5, borderRadius: 14, marginBottom: 12 }}>
            {MODES.map(({ m, cn }) => {
              const active = mode === m;
              return (
                <button type="button" key={m} aria-pressed={active} onClick={() => changeMode(m)} disabled={isDrawInProgress} style={{
                  flex: 1, border: "none", borderRadius: 10, padding: "9px 4px", cursor: isDrawInProgress ? "wait" : "pointer",
                  background: active ? "#2a2622" : "transparent", color: active ? "#f3e6bf" : "#6a5f4a",
                  fontWeight: 700, fontSize: 14, transition: "all .2s", opacity: isDrawInProgress && !active ? 0.55 : 1,
                }}>
                  <div>{cn}</div>
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
                <button type="button" key={k} aria-pressed={active} onClick={() => changeMethod(k)} disabled={isDrawInProgress} style={{
                  border: `1.5px solid ${active ? "#b5842b" : "#cdbf9e"}`, background: active ? "#b5842b" : "transparent",
                  color: active ? "#fff" : "#8a7a54", borderRadius: 999, padding: "6px 15px", fontSize: 14, fontWeight: 600,
                  cursor: isDrawInProgress ? "wait" : "pointer", opacity: isDrawInProgress && !active ? 0.55 : 1,
                }}>{cn}</button>
              );
            })}
          </div>
        )}

        {/* Two-card awareness explainer */}
        {activeMode === 2 && (
          <div style={{ background: "#f5ecd6", border: "1px solid #e6d3a8", borderRadius: 12, padding: "10px 14px", marginBottom: 14, fontSize: 14, color: "#7a6a44", lineHeight: 1.65 }}>
            <b>{CURRENT_SPREADS[2].name}</b><br />
            <span>防护模式 → 人生课题</span>
          </div>
        )}

        {/* Structured three-card explainer */}
        {activeMode === 3 && (
          <div style={{ background: "#f5ecd6", border: "1px solid #e6d3a8", borderRadius: 12, padding: "10px 14px", marginBottom: 14, fontSize: 14, color: "#7a6a44", lineHeight: 1.65 }}>
            <b>{CURRENT_SPREADS[3].name}</b><br />
            <span>每个位置从对应卡组抽一张，不混抽。</span>
          </div>
        )}

        {/* Four-card deep awareness explainer */}
        {activeMode === 4 && (
          <div style={{ background: "#f5ecd6", border: "1px solid #e6d3a8", borderRadius: 12, padding: "10px 14px", marginBottom: 14, fontSize: 14, color: "#7a6a44", lineHeight: 1.65 }}>
            <b>{CURRENT_SPREADS[4].name}</b><br />
            <span>模式 → 内在触发 → 需要 → 新选择</span>
          </div>
        )}

        {/* Number inputs (input mode) */}
        {method === "input" && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(activeMode, 4)}, 1fr)`, gap: 8 }}>
              {Array.from({ length: activeMode }).map((_, i) => {
                const meta = activePositions[i];
                return (
                  <div key={i}>
                    <label htmlFor={`card-number-${i}`} style={{ fontSize: 12, color: "#8a7f6c", fontWeight: 700, display: "block", marginBottom: 3, textAlign: "center" }}>
                      {activeMode === 1 ? "编号 №" : <>{i + 1}. {meta[0]}</>}
                    </label>
                    <input id={`card-number-${i}`} type="number" min={meta[4]} max={meta[5]} inputMode="numeric" value={inputs[i]}
                      onChange={(e) => { const v = [...inputs]; v[i] = e.target.value; setInputs(v); }}
                      placeholder={`${meta[4]}–${meta[5]}`}
                      style={{ width: "100%", boxSizing: "border-box", padding: "10px 6px", borderRadius: 10, border: "1.5px solid #cdbf9e", background: "#fffdf8", fontSize: 16, textAlign: "center", fontWeight: 700, color: "#2a2622" }} />
                  </div>
                );
              })}
            </div>
            {err && <div role="alert" style={{ color: "#b04a2e", fontSize: 14, marginTop: 8, textAlign: "center" }}>{err}</div>}
          </div>
        )}

        {/* Primary action */}
        <div className="deck-actions" style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 6 }}>
          <button className="deck-primary-action" type="button" onClick={handlePrimaryAction} disabled={isDrawInProgress} aria-busy={isDrawInProgress} style={{
            background: "#2a2622", color: "#f3e6bf", border: "none", borderRadius: 999, padding: "12px 26px",
            minWidth: activeMode > 1 ? 230 : 168, minHeight: 44, display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 700, cursor: isDrawInProgress ? "wait" : "pointer", opacity: isDrawInProgress ? 0.72 : 1,
          }}>
            {primaryActionLabel}
          </button>
        </div>
          </section>

        {/* ── RESULT ── */}
        <section className="draw-stage" ref={resultRef} aria-live="polite" aria-label="抽牌结果">
          {landing && !reading ? (
            <div className="draw-stage-empty">
              <div className="draw-stage-card-back">
                <CardArtwork side="back" sizes="(max-width: 760px) 76vw, 340px" eager />
              </div>
              <div className="draw-stage-prompt">
                <span>准备好时，抽一张牌</span>
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
                    <div style={{ fontSize: 13, color: chap.color, fontWeight: 700, letterSpacing: 1 }}>第 {String(reading[0].n).padStart(2, "0")} 张 · {chap.cn}</div>
                    <div style={{ fontFamily: SERIF, fontSize: 19, fontWeight: 700, marginTop: 2 }}>{reading[0].cn}</div>
                  </div>
                  <div style={{ padding: "16px 18px 18px" }}>
                    <Block label="此刻的提醒" color={chap.color} cn={reading[0].affect_cn} />
                    <RichCardInsight card={reading[0]} />
                    <Block label="今日练习" color={chap.color} cn={reading[0].practice_cn} last />
                  </div>
                </div>
              ) : null}
            </>
          )}

          {/* Multi-card ritual: reveal one position per deliberate click */}
          {reading && activeMode > 1 && method === "draw" ? (
            <div key={`ritual-${dealKey}`} style={{ marginTop: 20 }}>
              <div style={{ textAlign: "center", marginBottom: 14 }}>
                <div style={{ color: "#8b6929", fontSize: 12, fontWeight: 800, letterSpacing: 1.2 }}>
                  {spreadComplete ? "牌阵完成" : `第 ${activeDrawIndex + 1} 个位置，共 ${activeMode} 个位置`}
                </div>
                <div style={{ color: "#2a2622", fontFamily: SERIF, fontSize: 20, fontWeight: 700, marginTop: 4 }}>
                  {spreadComplete ? "让完整的牌阵慢慢浮现" : posMeta[activeDrawIndex]?.[0]}
                </div>
              </div>

              <SpreadProgress
                cards={reading}
                positions={posMeta}
                revealedCount={revealedCount}
                activeIndex={activeDrawIndex}
                drawing={isDrawInProgress}
              />

              {drawPhase === "running" || drawPhase === "locked" ? (
                <div style={{ width: "100%", margin: "0 auto" }}>
                  <DeckRun selectedCard={reading[activeDrawIndex]} locked={drawPhase === "locked"} />
                </div>
              ) : (
                <SingleCardReveal card={reading[activeDrawIndex]} phase={drawPhase} />
              )}

              {drawPhase === "revealed" && revealedCount > 0 ? (
                <div style={{ textAlign: "center", marginTop: 16, animation: "fadeUp .45s ease both" }}>
                  <div style={{ color: CHAPTERS[reading[activeDrawIndex].ch].color, fontSize: 15, fontWeight: 800 }}>
                    {String(reading[activeDrawIndex].n).padStart(2, "0")}. {reading[activeDrawIndex].cn}
                  </div>
                  {!spreadComplete ? (
                    <>
                      <p style={{ color: "#7a6f5a", fontSize: 14, lineHeight: 1.6, margin: "14px 0 10px" }}>
                        停一停，感受这张牌。准备好后，再抽下一张。
                      </p>
                      <button type="button" onClick={continueSpreadDraw} style={{
                        border: 0, borderRadius: 999, padding: "11px 22px", background: "#8b6929", color: "#fffdf8",
                        cursor: "pointer", fontSize: 15, fontWeight: 750,
                      }}>
                        抽第 {revealedCount + 1} 张牌
                      </button>
                    </>
                  ) : (
                    <p style={{ color: "#6f5a30", fontSize: 14, fontWeight: 700, lineHeight: 1.6, margin: "14px 0 4px" }}>
                      所有位置已经揭晓。完整解读在下方。
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Two-card awareness flow */}
          {reading && activeMode === 2 && spreadComplete && (
            <div key={`spread-two-${dealKey}`} style={{ marginTop: 20 }}>
              <div style={{ textAlign: "center", fontSize: 14, color: "#8a7f6c", fontWeight: 600, marginBottom: 12 }}>{CURRENT_SPREADS[2].name}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, maxWidth: 300, margin: "0 auto" }}>
                {reading.map((card, index) => (
                  <MiniCard key={card.n} card={card} badge={index + 1} label={posMeta[index][0]} index={index} />
                ))}
              </div>
              <div style={{ marginTop: 20, background: "#fffdf8", borderRadius: 18, border: "1px solid #e6d9bd", boxShadow: "0 6px 24px rgba(80,60,30,0.07)", padding: "6px 16px 16px" }}>
                {reading.map((card, index) => <ReadingRow key={index} card={card} badge={index + 1} label={posMeta[index][0]} desc={posMeta[index][2]} index={index} />)}
              </div>
            </div>
          )}

          {/* Three-card row */}
          {reading && activeMode === 3 && spreadComplete && (
            <div key={`spread-three-${dealKey}`} style={{ marginTop: 20 }}>
              <div style={{ textAlign: "center", fontSize: 14, color: "#8a7f6c", fontWeight: 600, marginBottom: 12 }}>{CURRENT_SPREADS[3].name}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, maxWidth: 360, margin: "0 auto" }}>
                {reading.map((c, i) => <MiniCard key={i} card={c} badge={i + 1} label={posMeta[i][0]} index={i} />)}
              </div>
              <div style={{ marginTop: 20, background: "#fffdf8", borderRadius: 18, border: "1px solid #e6d9bd", boxShadow: "0 6px 24px rgba(80,60,30,0.07)", padding: "6px 16px 16px" }}>
                {reading.map((c, i) => <ReadingRow key={i} card={c} badge={i + 1} label={posMeta[i][0]} desc={posMeta[i][2]} index={i} />)}
              </div>
            </div>
          )}

          {/* Four-card deep awareness flow */}
          {reading && activeMode === 4 && spreadComplete && (
            <div key={`spread-four-${dealKey}`} style={{ marginTop: 20 }}>
              <div style={{ textAlign: "center", fontSize: 14, color: "#8a7f6c", fontWeight: 600, marginBottom: 12 }}>
                模式 → 内在触发 → 需要 → 新选择
              </div>
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, maxWidth: 340, margin: "0 auto",
              }}>
                {reading.map((card, index) => (
                  <MiniCard key={card.n} card={card} badge={index + 1} label={posMeta[index][0]} index={index} />
                ))}
              </div>
              <div style={{ marginTop: 20, background: "#fffdf8", borderRadius: 18, border: "1px solid #e6d9bd", boxShadow: "0 6px 24px rgba(80,60,30,0.07)", padding: "6px 16px 16px" }}>
                {reading.map((c, i) => <ReadingRow key={i} card={c} badge={i + 1} label={posMeta[i][0]} desc={posMeta[i][2]} index={i} />)}
              </div>
            </div>
          )}
        </section>
        </div>

        <footer className="card-deck-disclaimer" style={{ textAlign: "center", marginTop: 30, fontSize: 13, color: "#a99b82", lineHeight: 1.65 }}>
          用于自我觉察与反思，不是诊断或建议。
        </footer>
      </div>
    </div>
  );
}

function Block({ label, cn, color, last }) {
  return (
    <div style={{ marginBottom: last ? 0 : 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: color }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: "#2a2622" }}>{label}</span>
      </div>
      <div style={{ fontSize: 16, lineHeight: 1.75, color: "#3a352e" }}>{cn}</div>
    </div>
  );
}
