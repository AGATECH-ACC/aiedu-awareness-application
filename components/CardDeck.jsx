'use client';
import React, { useState, useMemo, useCallback, useRef } from "react";
import { CHAPTERS, CARDS, byNum, SPREAD3, INNER_CHILD } from "@/lib/cards";

/* ── 幸福人生觉察卡 · Happy Life Awareness Cards ──────────────────────
   Draw one card, a three-card spread, or the Inner Child four-card spread.
   Draw at random, or enter the numbers of cards you drew by hand.        */


const SERIF = 'Georgia, "Songti SC", "Times New Roman", serif';
const isDark = (hex) => {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) < 150;
};

function drawN(n, pool) {
  const arr = [...pool], out = [];
  for (let i = 0; i < n && arr.length; i++) out.push(arr.splice(Math.floor(Math.random() * arr.length), 1)[0]);
  return out;
}

function ChildFigure({ tone, size = 70 }) {
  return (
    <svg viewBox="0 0 120 90" width={size} height={size * 0.74} style={{ display: "block" }}>
      <ellipse cx="60" cy="26" rx="17" ry="18" fill={tone} />
      <path d="M60 40 C44 40 37 52 35 72 C34 82 40 88 47 88 L73 88 C80 88 86 82 85 72 C83 52 76 40 60 40 Z" fill={tone} />
    </svg>
  );
}

function CardFace({ card }) {
  const chap = CHAPTERS[card.ch];
  const [top, bottom] = card.grad;
  const figureTone = isDark(bottom) ? "rgba(255,255,255,0.16)" : "rgba(40,30,20,0.28)";
  const isAffirm = card.ch === 4;
  return (
    <div style={{
      width: "100%", height: "100%", background: "#fdfbf5", borderRadius: 20,
      border: `2px solid ${chap.color}`, display: "flex", flexDirection: "column",
      overflow: "hidden", padding: "16px 15px 15px",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: "#2a2622", letterSpacing: 1 }}>
          {String(card.n).padStart(2, "0")}. {card.cn}
        </div>
        <div style={{ fontFamily: SERIF, fontSize: 11, letterSpacing: 3, color: chap.color, marginTop: 3, fontWeight: 600 }}>{card.en}</div>
      </div>
      <div style={{
        position: "relative", marginTop: 12, borderRadius: 12, overflow: "hidden", flex: "1 1 auto", minHeight: 150,
        background: `linear-gradient(165deg, ${top}, ${bottom})`, display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}>
        <div style={{ position: "absolute", top: "-30%", left: "50%", transform: "translateX(-50%)", width: "150%", height: "80%", borderRadius: "50%", background: "radial-gradient(closest-side, rgba(255,255,255,0.45), transparent)" }} />
        <div style={{ position: "absolute", top: 16, fontSize: 40, filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.25))" }}>{card.icon}</div>
        <div style={{ marginBottom: 6 }}><ChildFigure tone={figureTone} /></div>
      </div>
      <div style={{ padding: "12px 4px 2px", textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "#2a2622", lineHeight: 1.55, fontWeight: 500 }}>{card.text_cn}</div>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 12, color: "#5a5248", lineHeight: 1.5, marginTop: 6 }}>{card.text_en}</div>
      </div>
      <div style={{ textAlign: "center", fontFamily: SERIF, fontSize: 9, letterSpacing: 2, color: chap.color, marginTop: 8, opacity: 0.8 }}>
        {isAffirm ? "AFFIRMATION" : "REFLECTION"} · {chap.cn}
      </div>
    </div>
  );
}

function CardBack({ hint }) {
  return (
    <div style={{
      width: "100%", height: "100%", borderRadius: 20, overflow: "hidden",
      background: "radial-gradient(120% 90% at 50% 15%, #24406e 0%, #16233f 55%, #0e1729 100%)",
      border: "2px solid #caa64a", display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "space-between", padding: "26px 20px 24px", position: "relative",
    }}>
      <div style={{ textAlign: "center", color: "#e9d8a6" }}>
        <div style={{ fontSize: 10, letterSpacing: 4, opacity: 0.85 }}>AiEDU</div>
        <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, marginTop: 10, color: "#f3e6bf", lineHeight: 1.3 }}>幸福人生<br />觉察卡</div>
        <div style={{ fontFamily: SERIF, fontSize: 8.5, letterSpacing: 2.5, marginTop: 8, opacity: 0.8 }}>HAPPY LIFE AWARENESS CARDS</div>
      </div>
      <svg viewBox="0 0 120 120" width="120" height="120" style={{ opacity: 0.95 }}>
        <defs><radialGradient id="glow" cx="50%" cy="42%" r="55%"><stop offset="0%" stopColor="#f6e6b0" stopOpacity="0.55" /><stop offset="100%" stopColor="#f6e6b0" stopOpacity="0" /></radialGradient></defs>
        <circle cx="60" cy="52" r="52" fill="url(#glow)" />
        <path d="M60 92 L60 58" stroke="#caa64a" strokeWidth="2.4" strokeLinecap="round" />
        {[...Array(9)].map((_, i) => { const a = (i / 9) * Math.PI * 2, r = 22 + (i % 3) * 6; return <line key={i} x1="60" y1="58" x2={60 + Math.cos(a) * r} y2={54 + Math.sin(a) * r * 0.8} stroke="#caa64a" strokeWidth="1.3" strokeLinecap="round" opacity="0.85" />; })}
        {[...Array(22)].map((_, i) => { const a = (i * 2.4), r = 10 + ((i * 7) % 30); return <circle key={i} cx={60 + Math.cos(a) * r} cy={50 + Math.sin(a) * r * 0.85} r={1.2 + (i % 3) * 0.5} fill="#f3e6bf" opacity={0.55 + (i % 4) * 0.1} />; })}
        <line x1="48" y1="92" x2="72" y2="92" stroke="#caa64a" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div style={{ textAlign: "center", color: "#d8c690" }}>
        {hint ? (
          <span style={{ background: "rgba(202,166,74,0.92)", color: "#16233f", fontWeight: 700, fontSize: 12.5, padding: "8px 16px", borderRadius: 999 }}>{hint}</span>
        ) : (
          <>
            <div style={{ fontSize: 10, letterSpacing: 1 }}>一张牌 · 一次觉察 · 一个更幸福的自己</div>
            <div style={{ fontFamily: SERIF, fontSize: 8, letterSpacing: 2, marginTop: 5, opacity: 0.75 }}>ONE CARD · ONE AWARENESS · A HAPPIER YOU</div>
          </>
        )}
      </div>
    </div>
  );
}

function MiniCard({ card, badge, label, sub, index }) {
  const chap = CHAPTERS[card.ch];
  const figureTone = isDark(card.grad[1]) ? "rgba(255,255,255,0.18)" : "rgba(40,30,20,0.3)";
  return (
    <div style={{ animation: `fadeUp .5s ease both`, animationDelay: `${index * 140}ms`, textAlign: "center" }}>
      <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: `2px solid ${chap.color}`, aspectRatio: "44/64", background: `linear-gradient(165deg, ${card.grad[0]}, ${card.grad[1]})`, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <div style={{ position: "absolute", top: 5, left: 6, background: "rgba(255,255,255,0.92)", color: chap.color, fontWeight: 800, fontSize: 11, borderRadius: 6, padding: "1px 6px" }}>{badge}</div>
        <div style={{ position: "absolute", top: "22%", fontSize: 26, filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.3))" }}>{card.icon}</div>
        <div style={{ marginBottom: 2 }}><ChildFigure tone={figureTone} size={40} /></div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(253,251,245,0.94)", padding: "3px 2px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#2a2622", lineHeight: 1.1 }}>{String(card.n).padStart(2, "0")}.{card.cn}</div>
        </div>
      </div>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: chap.color, marginTop: 6 }}>{label}</div>
      <div style={{ fontFamily: SERIF, fontSize: 9.5, fontStyle: "italic", color: "#9a8f78" }}>{sub}</div>
    </div>
  );
}

function ReadingRow({ card, badge, label, sub, desc, index }) {
  const chap = CHAPTERS[card.ch];
  const figureTone = isDark(card.grad[1]) ? "rgba(255,255,255,0.18)" : "rgba(40,30,20,0.3)";
  const isAffirm = card.ch === 4;
  return (
    <div style={{ animation: `fadeUp .5s ease both`, animationDelay: `${index * 140 + 120}ms`, display: "flex", gap: 12, padding: "14px 0", borderTop: index === 0 ? "none" : "1px solid #eee4cf" }}>
      <div style={{ flex: "0 0 64px" }}>
        <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: `2px solid ${chap.color}`, height: 90, background: `linear-gradient(165deg, ${card.grad[0]}, ${card.grad[1]})`, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ position: "absolute", top: 3, left: 4, background: "rgba(255,255,255,0.92)", color: chap.color, fontWeight: 800, fontSize: 9, borderRadius: 5, padding: "0 4px" }}>{badge}</div>
          <div style={{ position: "absolute", top: "20%", fontSize: 22, filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.3))" }}>{card.icon}</div>
          <div style={{ marginBottom: 2 }}><ChildFigure tone={figureTone} size={34} /></div>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13.5, fontWeight: 800, color: chap.color }}>{label}</span>
          <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 11, color: "#a99b82" }}>{sub}</span>
        </div>
        {desc && <div style={{ fontSize: 11, color: "#9a8f78", marginTop: 1 }}>{desc}</div>}
        <div style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 700, color: "#2a2622", marginTop: 4 }}>
          {String(card.n).padStart(2, "0")}. {card.cn} <span style={{ fontSize: 11, color: "#8a7f6c", letterSpacing: 1 }}>{card.en}</span>
        </div>
        <div style={{ fontSize: 12, color: "#3a352e", lineHeight: 1.55, marginTop: 5 }}>
          <b style={{ color: chap.color }}>影响 · Affects you：</b>{card.affect_cn}
        </div>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 11.5, color: "#7a7060", lineHeight: 1.5, marginTop: 2 }}>{card.affect_en}</div>
        <div style={{ fontSize: 12, color: "#3a352e", lineHeight: 1.55, marginTop: 6 }}>
          <b style={{ color: chap.color }}>练习 · Practice：</b>{card.practice_cn}
        </div>
      </div>
    </div>
  );
}

const MODES = [
  { m: 1, cn: "单张牌", en: "Single" },
  { m: 3, cn: "三张牌", en: "Three-Card" },
  { m: 4, cn: "内在小孩", en: "Inner Child · 4" },
];

export default function App({ onReading } = {}) {
  const [mode, setMode] = useState(1);
  const [method, setMethod] = useState("draw"); // draw | input
  const [set3, setSet3] = useState(0);
  const [filter, setFilter] = useState(0);
  const [inputs, setInputs] = useState(["", "", "", ""]);
  const [err, setErr] = useState("");
  const [reading, setReading] = useState(null);
  const [posMeta, setPosMeta] = useState([]);
  const [flipped, setFlipped] = useState(false);
  const [dealKey, setDealKey] = useState(0);
  const [showDeck, setShowDeck] = useState(false);
  const resultRef = useRef(null);

  const pool = useMemo(() => (filter === 0 ? CARDS : CARDS.filter((c) => c.ch === filter)), [filter]);

  const metaFor = useCallback((m) => {
    if (m === 1) return [["当下的觉察", "This moment", ""]];
    if (m === 3) return SPREAD3[set3].pos.map(([cn, en]) => [cn, en, ""]);
    return INNER_CHILD;
  }, [set3]);

  const generate = useCallback((forcedCards, forcedMode = mode) => {
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
      setFlipped(false);
      setTimeout(() => setFlipped(true), 60);
    }
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 120);
  }, [method, inputs, mode, pool, metaFor]);

  const changeMode = useCallback((nextMode) => {
    setReading(null);
    setFlipped(false);
    setErr("");
    setMode(nextMode);
  }, []);

  const chap = reading && mode === 1 ? CHAPTERS[reading[0].ch] : null;

  return (
    <div style={{
      minHeight: "100vh", width: "100%", boxSizing: "border-box",
      background: "radial-gradient(130% 80% at 50% -10%, #fdf6ea 0%, #f6eede 45%, #efe6d4 100%)",
      padding: "22px 16px 44px", fontFamily: '-apple-system, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif', color: "#2a2622",
    }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
        select.aw { -webkit-appearance: none; appearance: none; }
      `}</style>

      <div style={{ maxWidth: 460, margin: "0 auto" }}>
        <header style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontFamily: SERIF, fontSize: 25, fontWeight: 700, letterSpacing: 2 }}>幸福人生觉察卡</div>
          <div style={{ fontFamily: SERIF, fontSize: 10.5, letterSpacing: 4, color: "#a9863c", marginTop: 4 }}>HAPPY LIFE AWARENESS CARDS</div>
        </header>

        {/* Mode */}
        <div style={{ display: "flex", gap: 6, background: "#f0e7d4", padding: 5, borderRadius: 14, marginBottom: 12 }}>
          {MODES.map(({ m, cn, en }) => {
            const active = mode === m;
            return (
              <button key={m} onClick={() => changeMode(m)} style={{
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

        {/* Method */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 14 }}>
          {[["draw", "随机抽牌", "Draw"], ["input", "输入编号", "Enter №"]].map(([k, cn, en]) => {
            const active = method === k;
            return (
              <button key={k} onClick={() => setMethod(k)} style={{
                border: `1.5px solid ${active ? "#b5842b" : "#cdbf9e"}`, background: active ? "#b5842b" : "transparent",
                color: active ? "#fff" : "#8a7a54", borderRadius: 999, padding: "6px 15px", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
              }}>{cn} · {en}</button>
            );
          })}
        </div>

        {/* 3-card position set picker */}
        {mode === 3 && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11.5, color: "#8a7f6c", fontWeight: 600, display: "block", marginBottom: 5 }}>选择牌阵含义 · Position meanings</label>
            <div style={{ position: "relative" }}>
              <select className="aw" value={set3} onChange={(e) => setSet3(Number(e.target.value))} style={{
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
        {mode === 4 && (
          <div style={{ background: "#f5ecd6", border: "1px solid #e6d3a8", borderRadius: 12, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#7a6a44", lineHeight: 1.6 }}>
            <b>内在小孩牌阵</b> · Inner Child Spread — 帮助你找出内在小孩的需求与渴望。
          </div>
        )}

        {/* Chapter filter (draw only) */}
        {method === "draw" && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 16 }}>
            {[0, 1, 2, 3, 4].map((k) => {
              const active = filter === k;
              const c = k === 0 ? "#7a6a4a" : CHAPTERS[k].color;
              return (
                <button key={k} onClick={() => setFilter(k)} style={{
                  border: `1.5px solid ${c}`, background: active ? c : "transparent", color: active ? "#fff" : c,
                  borderRadius: 999, padding: "5px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600,
                }}>{k === 0 ? "全部 All" : CHAPTERS[k].cn}</button>
              );
            })}
          </div>
        )}

        {/* Number inputs (input mode) */}
        {method === "input" && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(mode, 4)}, 1fr)`, gap: 8 }}>
              {Array.from({ length: mode }).map((_, i) => {
                const meta = metaFor(mode)[i];
                return (
                  <div key={i}>
                    <label style={{ fontSize: 10.5, color: "#8a7f6c", fontWeight: 700, display: "block", marginBottom: 3, textAlign: "center" }}>
                      {mode === 1 ? "编号 №" : `${i + 1}. ${meta[0]}`}
                    </label>
                    <input type="number" min={1} max={40} inputMode="numeric" value={inputs[i]}
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
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 6 }}>
          <button onClick={() => generate()} style={{
            background: "#2a2622", color: "#f3e6bf", border: "none", borderRadius: 999, padding: "12px 26px",
            fontSize: 15, fontWeight: 700, cursor: "pointer",
          }}>
            {method === "input" ? "查看解读 · Read" : reading ? "重新抽牌 · Draw again" : `抽 ${mode} 张牌 · Draw ${mode}`}
          </button>
          <button onClick={() => setShowDeck((s) => !s)} style={{
            background: "transparent", color: "#7a6a4a", border: "1.5px solid #c8b48a", borderRadius: 999, padding: "12px 16px",
            fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>{showDeck ? "收起" : "全部 40"}</button>
        </div>

        {/* ── RESULT ── */}
        <div ref={resultRef}>
          {/* Single card: flip */}
          {reading && mode === 1 && (
            <>
              <div style={{ perspective: 1400, width: "100%", maxWidth: 300, margin: "20px auto 0" }}>
                <div style={{
                  position: "relative", width: "100%", aspectRatio: "44 / 76", transformStyle: "preserve-3d",
                  transform: `rotateY(${flipped ? 180 : 0}deg)`, transition: "transform .8s cubic-bezier(.4,.1,.25,1)",
                }}>
                  <div style={{ position: "absolute", inset: 0, WebkitBackfaceVisibility: "hidden", backfaceVisibility: "hidden" }}><CardBack /></div>
                  <div style={{ position: "absolute", inset: 0, WebkitBackfaceVisibility: "hidden", backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}><CardFace card={reading[0]} /></div>
                </div>
              </div>
              <div key={dealKey} style={{
                marginTop: 22, background: "#fffdf8", borderRadius: 18, border: `1px solid ${chap.color}33`,
                boxShadow: "0 6px 24px rgba(80,60,30,0.08)", overflow: "hidden", animation: "fadeUp .5s ease both", animationDelay: "700ms",
              }}>
                <div style={{ background: chap.tint, padding: "12px 18px", borderBottom: `1px solid ${chap.color}22` }}>
                  <div style={{ fontSize: 12, color: chap.color, fontWeight: 700, letterSpacing: 1 }}>第 {String(reading[0].n).padStart(2, "0")} 张 · {chap.cn} / {chap.en}</div>
                  <div style={{ fontFamily: SERIF, fontSize: 19, fontWeight: 700, marginTop: 2 }}>{reading[0].cn} <span style={{ fontSize: 13, color: "#8a7f6c", letterSpacing: 1 }}>{reading[0].en}</span></div>
                </div>
                <div style={{ padding: "16px 18px 18px" }}>
                  <Block label="这张牌如何影响你" sub="How this affects you" color={chap.color} cn={reading[0].affect_cn} en={reading[0].affect_en} />
                  <Block label="今日练习" sub="Today's practice" color={chap.color} cn={reading[0].practice_cn} en={reading[0].practice_en} last />
                </div>
              </div>
            </>
          )}

          {/* Three-card row */}
          {reading && mode === 3 && (
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
          {reading && mode === 4 && (
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
                {reading.map((c, i) => <ReadingRow key={i} card={c} badge={i + 1} label={INNER_CHILD[i][0]} sub={INNER_CHILD[i][1]} desc={INNER_CHILD[i][2]} index={i} />)}
              </div>
            </div>
          )}
        </div>

        {/* Deck grid */}
        {showDeck && (
          <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {CARDS.map((c) => {
              const cc = CHAPTERS[c.ch];
              return (
                <button key={c.n} onClick={() => { setShowDeck(false); setMode(1); setMethod("draw"); generate([c], 1); }} style={{
                  border: `1.5px solid ${cc.color}`, borderRadius: 10, background: "#fffdf8", padding: "8px 4px", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(160deg, ${c.grad[0]}, ${c.grad[1]})` }}>{c.icon}</div>
                  <div style={{ fontSize: 10, color: cc.color, fontWeight: 700 }}>{String(c.n).padStart(2, "0")}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.1 }}>{c.cn}</div>
                </button>
              );
            })}
          </div>
        )}

        <footer style={{ textAlign: "center", marginTop: 30, fontSize: 11, color: "#a99b82", lineHeight: 1.6 }}>
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
