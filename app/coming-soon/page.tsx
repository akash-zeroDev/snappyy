"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import Link from "next/link";

const LS_THEME = "oh_snap_theme";

const CARDS = [
  {
    id: "share",
    bg: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #2563eb 100%)",
    color: "#fff",
    emoji: "🔗",
    title: "Share your fridge",
    subtitle: "with friends",
    description: "Send a link and let your friends peek at your fridge — all your polaroids, sticky notes, the whole vibe.",
    tags: ["secret link 🔑", "view-only 👀", "reactions 💬", "no signup"],
  },
  {
    id: "community",
    bg: "linear-gradient(135deg, #f97316 0%, #ea580c 50%, #fb923c 100%)",
    color: "#fff",
    emoji: "🌍",
    title: "Community Fridge",
    subtitle: "for everyone",
    description: "One big public fridge. Pin your snaps, discover others' memories, join photo challenges.",
    tags: ["explore 🔍", "photo challenges 🏆", "save faves ❤️", "no gatekeeping"],
  },
];

function getCardStyle(index: number, active: number, total: number) {
  let diff = index - active;
  if (diff > total / 2) diff -= total;
  if (diff < -total / 2) diff += total;

  if (diff === 0) return { x: "0%", y: 0, rotate: 0, scale: 1, opacity: 1, zIndex: 5 };
  if (diff === 1) return { x: "30%", y: 8, rotate: 8, scale: 0.9, opacity: 0.7, zIndex: 4 };
  if (diff === -1) return { x: "-30%", y: 8, rotate: -8, scale: 0.9, opacity: 0.7, zIndex: 4 };
  return { x: diff > 0 ? "55%" : "-55%", y: 16, rotate: diff > 0 ? 14 : -14, scale: 0.8, opacity: 0, zIndex: 1 };
}

export default function ComingSoonPage() {
  const [lightMode, setLightMode] = useState(false);
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragX = useMotionValue(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_THEME);
      if (saved === "light") setLightMode(true);
    } catch {}
  }, []);

  const toggleTheme = () => {
    const next = !lightMode;
    setLightMode(next);
    localStorage.setItem(LS_THEME, next ? "light" : "dark");
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 40;
    if (info.offset.x > threshold) {
      setActive((p) => (p - 1 + CARDS.length) % CARDS.length);
    } else if (info.offset.x < -threshold) {
      setActive((p) => (p + 1) % CARDS.length);
    }
    animate(dragX, 0, { type: "spring", stiffness: 300, damping: 30 });
  };

  const t = {
    bg: lightMode ? "#f5f0eb" : "#0a0a0a",
    text: lightMode ? "#1a1a1a" : "#fff",
    textMuted: lightMode ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.55)",
    textSoft: lightMode ? "rgba(0,0,0,0.65)" : "rgba(255,255,255,0.65)",
    border: lightMode ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.18)",
    accent: lightMode ? "#1a1a1a" : "#fff",
    accentText: lightMode ? "#fff" : "#0a0a0a",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: t.bg,
        color: t.text,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        transition: "background 0.3s, color 0.3s",
        overflow: "hidden",
      }}
    >
      {/* Nav */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: `1px solid ${t.border}`,
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-patrick-hand), 'Patrick Hand', sans-serif",
            fontSize: 22,
            color: t.text,
            textDecoration: "none",
          }}
        >
          MemoryPrint
        </Link>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            onClick={toggleTheme}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 6,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title={lightMode ? "Dark mode" : "Light mode"}
          >
            {lightMode ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            )}
          </button>
          <Link
            href="/fridge"
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              fontSize: 13,
              color: t.textSoft,
              border: `1px solid ${t.border}`,
              textDecoration: "none",
            }}
          >
            My Fridge
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "44px 24px 10px" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center" }}
        >
          <h1
            style={{
              fontFamily: "var(--font-patrick-hand), 'Patrick Hand', sans-serif",
              fontSize: "clamp(34px, 7vw, 52px)",
              fontWeight: 400,
              lineHeight: 1.15,
              margin: "0 0 12px",
            }}
          >
            Coming soon to MemoryPrint
          </h1>
          <p
            style={{
              fontFamily: "var(--font-caveat), 'Caveat', cursive",
              fontSize: 21,
              color: t.textMuted,
              lineHeight: 1.5,
              maxWidth: 400,
              margin: "0 auto 8px",
            }}
          >
            swipe the cards to explore what's next ✨
          </p>
        </motion.div>
      </div>

      {/* Swipe Section */}
      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: "100%",
          height: "min(520px, 65vh)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          touchAction: "pan-y",
          userSelect: "none",
        }}
      >
        {CARDS.map((card, i) => {
          const style = getCardStyle(i, active, CARDS.length);
          return (
            <motion.div
              key={card.id}
              animate={{
                x: style.x,
                y: style.y,
                rotate: style.rotate,
                scale: style.scale,
                opacity: style.opacity,
              }}
              transition={{ type: "spring", stiffness: 150, damping: 14, mass: 0.8 }}
              style={{
                position: "absolute",
                width: "min(340px, 75vw)",
                aspectRatio: "3 / 4",
                borderRadius: 28,
                background: card.bg,
                color: card.color,
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
                padding: "32px 26px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                zIndex: style.zIndex,
                cursor: i === active ? "grab" : "default",
                overflow: "hidden",
              }}
            >
              {/* Decorative circles */}
              <div style={{
                position: "absolute", top: -40, right: -40,
                width: 160, height: 160, borderRadius: "50%",
                background: "rgba(255,255,255,0.1)",
                pointerEvents: "none",
              }} />
              <div style={{
                position: "absolute", bottom: -30, left: -30,
                width: 120, height: 120, borderRadius: "50%",
                background: "rgba(255,255,255,0.06)",
                pointerEvents: "none",
              }} />

              {/* Content */}
              <div style={{ position: "relative", zIndex: 2 }}>
                <span style={{ fontSize: 44, display: "block", marginBottom: 12 }}>{card.emoji}</span>
                <h2 style={{
                  fontFamily: "var(--font-patrick-hand), 'Patrick Hand', sans-serif",
                  fontSize: 32, fontWeight: 400, margin: "0 0 4px", lineHeight: 1.1,
                }}>
                  {card.title}
                </h2>
                <p style={{
                  fontFamily: "var(--font-caveat), 'Caveat', cursive",
                  fontSize: 22, opacity: 0.75, margin: "0 0 16px",
                }}>
                  {card.subtitle}
                </p>
                <p style={{
                  fontFamily: "var(--font-patrick-hand), 'Patrick Hand', sans-serif",
                  fontSize: 16, opacity: 0.85, lineHeight: 1.55, margin: 0,
                }}>
                  {card.description}
                </p>
              </div>

              {/* Tags */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, position: "relative", zIndex: 2 }}>
                {card.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontFamily: "var(--font-caveat), 'Caveat', cursive",
                      fontSize: 15, padding: "4px 12px",
                      background: "rgba(255,255,255,0.18)", borderRadius: 999,
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          );
        })}

        {/* Drag overlay */}
        <motion.div
          drag="x"
          dragElastic={0.2}
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            cursor: "grab",
          }}
          whileDrag={{ cursor: "grabbing" }}
        />
      </div>

      {/* Dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 10, padding: "8px 0 16px" }}>
        {CARDS.map((card, i) => (
          <button
            key={card.id}
            onClick={() => setActive(i)}
            style={{
              width: active === i ? 28 : 8,
              height: 8,
              borderRadius: 999,
              border: "none",
              background: active === i
                ? (i === 0 ? "#3b82f6" : "#f97316")
                : (lightMode ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.2)"),
              cursor: "pointer",
              transition: "all 0.3s ease",
              padding: 0,
            }}
          />
        ))}
      </div>

      {/* Bottom text + CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        style={{ textAlign: "center", padding: "16px 24px 60px" }}
      >
        <p style={{
          fontFamily: "var(--font-caveat), 'Caveat', cursive",
          fontSize: 24,
          color: t.textMuted,
          lineHeight: 1.4,
          marginBottom: 24,
        }}>
          more ideas are scribbled on sticky notes somewhere 🗒️
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/"
            style={{
              display: "inline-block",
              padding: "12px 28px",
              borderRadius: 999,
              background: t.accent,
              color: t.accentText,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
              fontFamily: "var(--font-patrick-hand), 'Patrick Hand', sans-serif",
            }}
          >
            📸 Take a snap
          </Link>
          <Link
            href="/fridge"
            style={{
              display: "inline-block",
              padding: "12px 28px",
              borderRadius: 999,
              background: "transparent",
              color: t.textSoft,
              textDecoration: "none",
              fontSize: 14,
              border: `1px solid ${t.border}`,
              fontFamily: "var(--font-patrick-hand), 'Patrick Hand', sans-serif",
            }}
          >
            🧊 Open my fridge
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
