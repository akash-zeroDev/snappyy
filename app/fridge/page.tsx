"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import PaperBackground, { PAPER_PRESETS, type PaperType, type TextureStyle } from "../PaperBackground";
import {
  listMemories,
  putMemory,
  deleteMemory,
  type FridgeMemory,
} from "../fridgeDB";

const BOARD_HEIGHT = 720;
const CARD_W = 200;

type CustomFridge = {
  name: string;
  paperType: PaperType;
  textureStyle: TextureStyle;
  background: string;
  lineColor: string;
  textureIntensity: number;
};

const CUSTOM_KEY = "custom_fridges_v1";

const STYLE_TEMPLATES: Array<{ label: string; preset: Omit<CustomFridge, "name"> }> = [
  { label: "Cream", preset: { paperType: "lined", textureStyle: "vintage", background: "#f7efde", lineColor: "#d3c1a3", textureIntensity: 35 } },
  { label: "Grid", preset: { paperType: "grid", textureStyle: "modern", background: "#ffffff", lineColor: "#cfd3d8", textureIntensity: 18 } },
  { label: "Dotted", preset: { paperType: "dotted", textureStyle: "modern", background: "#f3f4f6", lineColor: "#9aa1ab", textureIntensity: 20 } },
  { label: "Kraft", preset: { paperType: "blank", textureStyle: "rough", background: "#d9b88a", lineColor: "#d9b88a", textureIntensity: 55 } },
  { label: "Wavy", preset: { paperType: "wavy", textureStyle: "vintage", background: "#f0e6ce", lineColor: "#b89e74", textureIntensity: 40 } },
  { label: "Slate", preset: { paperType: "grid", textureStyle: "modern", background: "#22262d", lineColor: "#3b4150", textureIntensity: 22 } },
  { label: "Pastel", preset: { paperType: "dotted", textureStyle: "smooth", background: "#e8efff", lineColor: "#a8b3cf", textureIntensity: 18 } },
];

export default function FridgePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [memories, setMemories] = useState<FridgeMemory[]>([]);
  const [open, setOpen] = useState<FridgeMemory | null>(null);
  const [preset, setPreset] = useState(0);
  const [customFridges, setCustomFridges] = useState<CustomFridge[]>([]);
  const [showAddFridge, setShowAddFridge] = useState(false);
  const [newName, setNewName] = useState("");
  const [newStyle, setNewStyle] = useState(0);

  // load + persist custom fridges
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(CUSTOM_KEY);
      if (raw) setCustomFridges(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(customFridges));
  }, [customFridges]);

  const ALL_FRIDGES = [
    ...PAPER_PRESETS.map((p) => ({ name: p.name, props: p.props, custom: false as const })),
    ...customFridges.map((c) => ({
      name: c.name,
      custom: true as const,
      props: {
        paperType: c.paperType,
        textureStyle: c.textureStyle,
        background: c.background,
        lineColor: c.lineColor,
        textureIntensity: c.textureIntensity,
      },
    })),
  ];

  const handleAddFridge = () => {
    const trimmed = newName.trim() || `My Fridge ${customFridges.length + 1}`;
    const tpl = STYLE_TEMPLATES[Math.max(0, Math.min(STYLE_TEMPLATES.length - 1, newStyle))];
    const next: CustomFridge = { name: trimmed, ...tpl.preset };
    setCustomFridges((prev) => [...prev, next]);
    setPreset(PAPER_PRESETS.length + customFridges.length); // jump to the newly added one
    setShowAddFridge(false);
    setNewName("");
    setNewStyle(0);
  };

  const handleDeleteCustomFridge = (customIndex: number) => {
    const absoluteIndex = PAPER_PRESETS.length + customIndex;
    // Move any memories on this fridge back to fridge 0
    setMemories((prev) => {
      const next = prev.map((m) =>
        (m.fridge ?? 0) === absoluteIndex ? { ...m, fridge: 0 } : m
      );
      next
        .filter((m, i) => m !== prev[i])
        .forEach((m) => {
          putMemory(m).catch(() => {});
        });
      return next;
    });
    setCustomFridges((prev) => prev.filter((_, i) => i !== customIndex));
    if (preset === absoluteIndex) setPreset(0);
  };

  useEffect(() => {
    listMemories()
      .then(async (all) => {
        // Migrate old memories without `fridge` field — default to 0
        const migrated = await Promise.all(
          all.map(async (m) => {
            if (typeof (m as FridgeMemory).fridge !== "number") {
              const updated = { ...m, fridge: 0 } as FridgeMemory;
              await putMemory(updated);
              return updated;
            }
            return m;
          })
        );
        setMemories(migrated);
      })
      .catch(() => {});
    const saved = typeof window !== "undefined" ? localStorage.getItem("fridge_preset") : null;
    if (saved != null) {
      const n = parseInt(saved, 10);
      if (!Number.isNaN(n) && n >= 0 && n < PAPER_PRESETS.length) setPreset(n);
    }
  }, []);

  const visibleMemories = memories.filter((m) => (m.fridge ?? 0) === preset);

  const handleMoveToFridge = async (m: FridgeMemory, targetFridge: number) => {
    if (m.fridge === targetFridge) return;
    const updated = {
      ...m,
      fridge: targetFridge,
      // give it a fresh natural spot on the new fridge so it doesn't land on top of an existing memory
      x: 40 + Math.random() * 600,
      y: 40 + Math.random() * 400,
      rotate: (Math.random() - 0.5) * 14,
    };
    await putMemory(updated);
    setMemories((prev) => prev.map((p) => (p.id === m.id ? updated : p)));
    setOpen(updated);
  };

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("fridge_preset", String(preset));
  }, [preset]);

  const handleDragEnd = async (m: FridgeMemory, dx: number, dy: number) => {
    const updated = { ...m, x: m.x + dx, y: m.y + dy };
    setMemories((prev) => prev.map((p) => (p.id === m.id ? updated : p)));
    await putMemory(updated);
  };

  const handleDelete = async (id: string) => {
    await deleteMemory(id);
    setMemories((prev) => prev.filter((p) => p.id !== id));
    setOpen(null);
  };

  const dateLabel = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <main style={{ minHeight: "100vh", background: "#0a0a0a" }}>
      {/* Top navbar */}
      <nav
        className="navbar-root"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 28px",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          background: "rgba(0,0,0,0.55)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          fontFamily: '"GT Walsheim Framer Regular", system-ui, sans-serif',
        }}
      >
        <Link
          href="/"
          className="navbar-brand"
          style={{
            color: "#fff",
            fontSize: 16,
            fontWeight: 500,
            letterSpacing: "-0.01em",
            textDecoration: "none",
          }}
        >
          Oh&nbsp;Snap
        </Link>
        <Link
          href="/"
          className="navbar-cta"
          style={{
            color: "rgba(255,255,255,0.78)",
            fontSize: 14,
            padding: "8px 16px",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 999,
            textDecoration: "none",
          }}
        >
          ← Back to camera
        </Link>
      </nav>

      <section className="fridge-section" style={{ padding: "60px 24px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h1
            className="fridge-heading"
            style={{
              fontFamily: '"GT Walsheim Framer Regular", system-ui, sans-serif',
              fontSize: 46,
              fontWeight: 500,
              letterSpacing: "-1.8px",
              color: "#fff",
              textAlign: "center",
              margin: 0,
            }}
          >
            Your Personal Fridge
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "rgba(255,255,255,0.55)",
              textAlign: "center",
              margin: "10px 0 32px",
            }}
          >
            Moments worth keeping.
          </p>

          {/* Fridge style chips — built-in presets + custom user fridges + add button */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              justifyContent: "center",
              marginBottom: 28,
            }}
          >
            {ALL_FRIDGES.map((p, i) => {
              const isActive = preset === i;
              const customIndex = p.custom ? i - PAPER_PRESETS.length : -1;
              return (
                <span key={`${p.name}-${i}`} style={{ display: "inline-flex", alignItems: "center" }}>
                  <button
                    onClick={() => setPreset(i)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 999,
                      fontSize: 13,
                      cursor: "pointer",
                      background: isActive ? "#fff" : "transparent",
                      color: isActive ? "#0a0a0a" : "rgba(255,255,255,0.75)",
                      border: isActive ? "1px solid #fff" : "1px solid rgba(255,255,255,0.18)",
                      transition: "background 200ms, color 200ms, border-color 200ms",
                    }}
                  >
                    {p.name}
                  </button>
                  {p.custom && isActive && (
                    <button
                      onClick={() => handleDeleteCustomFridge(customIndex)}
                      title="Delete this fridge"
                      style={{
                        marginLeft: 4,
                        width: 22,
                        height: 22,
                        borderRadius: 999,
                        border: "1px solid rgba(255,255,255,0.18)",
                        background: "transparent",
                        color: "rgba(255,255,255,0.6)",
                        fontSize: 12,
                        lineHeight: 1,
                        cursor: "pointer",
                      }}
                    >
                      ×
                    </button>
                  )}
                </span>
              );
            })}

            <button
              onClick={() => setShowAddFridge(true)}
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                fontSize: 13,
                cursor: "pointer",
                background: "transparent",
                color: "rgba(255,255,255,0.85)",
                border: "1px dashed rgba(255,255,255,0.32)",
              }}
            >
              + Add fridge
            </button>
          </div>

          {/* Memory board */}
          <PaperBackground
            {...(ALL_FRIDGES[preset]?.props ?? PAPER_PRESETS[0].props)}
            shadow
            style={{
              borderRadius: 14,
              border: "1px solid rgba(0,0,0,0.18)",
              minHeight: BOARD_HEIGHT,
              position: "relative",
            }}
          >
            <div
              ref={containerRef}
              className="fridge-board"
              style={{
                position: "relative",
                width: "100%",
                height: BOARD_HEIGHT,
              }}
            >
              {visibleMemories.length === 0 && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(0,0,0,0.45)",
                    fontSize: 14,
                  }}
                >
                  Nothing on this fridge yet —{" "}
                  <Link href="/" style={{ marginLeft: 6, textDecoration: "underline", color: "rgba(0,0,0,0.65)" }}>
                    take a snapshot
                  </Link>
                  .
                </div>
              )}

              {visibleMemories.map((m) => (
                <motion.div
                  key={m.id}
                  drag
                  dragMomentum={false}
                  dragElastic={0}
                  dragConstraints={containerRef}
                  initial={{ x: m.x, y: m.y, rotate: m.rotate, opacity: 0, scale: 0.6 }}
                  animate={{ x: m.x, y: m.y, rotate: m.rotate, opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 220, damping: 24 }}
                  whileHover={{ zIndex: 50 }}
                  whileDrag={{ scale: 1.05, zIndex: 100, cursor: "grabbing" }}
                  onDragEnd={(_, info) => handleDragEnd(m, info.offset.x, info.offset.y)}
                  onTap={() => setOpen(m)}
                  className="fridge-card"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: CARD_W,
                    cursor: "grab",
                    userSelect: "none",
                  }}
                >
                  <div
                    style={{
                      background: "rgb(252, 251, 248)",
                      borderRadius: 4,
                      padding: "6% 6% 18% 6%",
                      boxShadow:
                        "0 12px 24px rgba(0,0,0,0.45), 0 3px 6px rgba(0,0,0,0.35)",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        aspectRatio: "5640 / 3760",
                        background: "rgb(8,8,10)",
                        borderRadius: 2,
                        overflow: "hidden",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.image}
                        alt=""
                        draggable={false}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </div>
                    <p
                      style={{
                        fontFamily: "var(--font-patrick-hand), 'Patrick Hand', sans-serif",
                        fontSize: 14,
                        color: "#333",
                        textAlign: "center",
                        marginTop: 8,
                        marginBottom: 0,
                      }}
                    >
                      {dateLabel(m.date)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </PaperBackground>
        </div>
      </section>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.78)",
              backdropFilter: "blur(4px)",
              zIndex: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
            }}
          >
            <motion.div
              className="fridge-modal-inner"
              initial={{ scale: 0.85 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.85 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "rgb(252, 251, 248)",
                borderRadius: 6,
                padding: "3% 3% 10% 3%",
                width: "min(640px, 95vw)",
                boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
              }}
            >
              <div
                style={{
                  width: "100%",
                  aspectRatio: "5640 / 3760",
                  background: "rgb(8,8,10)",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={open.image}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
              <p
                style={{
                  fontFamily: "var(--font-patrick-hand), 'Patrick Hand', sans-serif",
                  fontSize: 22,
                  color: "#333",
                  textAlign: "center",
                  marginTop: 18,
                  marginBottom: 16,
                }}
              >
                {dateLabel(open.date)}
              </p>

              {/* Move to fridge picker */}
              <div style={{ marginBottom: 16, textAlign: "center" }}>
                <p
                  style={{
                    fontSize: 11,
                    color: "rgba(0,0,0,0.55)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 8,
                  }}
                >
                  Move to fridge
                </p>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    justifyContent: "center",
                  }}
                >
                  {ALL_FRIDGES.map((p, i) => {
                    const isCurrent = (open.fridge ?? 0) === i;
                    return (
                      <button
                        key={`${p.name}-${i}`}
                        onClick={() => handleMoveToFridge(open, i)}
                        disabled={isCurrent}
                        style={{
                          padding: "5px 10px",
                          borderRadius: 999,
                          fontSize: 11,
                          cursor: isCurrent ? "default" : "pointer",
                          background: isCurrent ? "#0a0a0a" : "transparent",
                          color: isCurrent ? "#fff" : "rgba(0,0,0,0.7)",
                          border: isCurrent
                            ? "1px solid #0a0a0a"
                            : "1px solid rgba(0,0,0,0.18)",
                          opacity: isCurrent ? 1 : 0.85,
                          transition: "background 150ms, color 150ms, border-color 150ms",
                        }}
                      >
                        {isCurrent ? `✓ ${p.name}` : p.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <button
                  onClick={() => handleDelete(open.id)}
                  style={{
                    border: "1px solid rgba(0,0,0,0.15)",
                    background: "transparent",
                    color: "#a33",
                    padding: "8px 16px",
                    borderRadius: 999,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Remove memory
                </button>
                <button
                  onClick={() => setOpen(null)}
                  style={{
                    border: "1px solid rgba(0,0,0,0.15)",
                    background: "#0a0a0a",
                    color: "#fff",
                    padding: "8px 18px",
                    borderRadius: 999,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Add Fridge modal */}
      <AnimatePresence>
        {showAddFridge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowAddFridge(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(6px)",
              zIndex: 220,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
            }}
          >
            <motion.div
              className="fridge-modal-inner"
              initial={{ scale: 0.92, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 10 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "min(440px, 95vw)",
                background: "#111",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14,
                padding: 24,
                color: "#fff",
                fontFamily: '"GT Walsheim Framer Regular", system-ui, sans-serif',
              }}
            >
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>Add a new fridge</h3>
              <p style={{ margin: "4px 0 18px", fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
                Name it, pick a paper style.
              </p>

              <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>
                Name
              </label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={`My Fridge ${customFridges.length + 1}`}
                autoFocus
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "#0a0a0a",
                  color: "#fff",
                  fontSize: 14,
                  outline: "none",
                  marginBottom: 16,
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddFridge();
                }}
              />

              <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 8 }}>
                Style
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 22 }}>
                {STYLE_TEMPLATES.map((t, i) => (
                  <button
                    key={t.label}
                    onClick={() => setNewStyle(i)}
                    style={{
                      padding: 0,
                      borderRadius: 10,
                      border: newStyle === i ? "2px solid #fff" : "1px solid rgba(255,255,255,0.14)",
                      cursor: "pointer",
                      overflow: "hidden",
                      height: 56,
                      background: "transparent",
                    }}
                  >
                    <PaperBackground
                      {...t.preset}
                      style={{ width: "100%", height: "100%" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-end",
                          justifyContent: "center",
                          height: "100%",
                          paddingBottom: 4,
                          fontSize: 10,
                          color: "rgba(0,0,0,0.7)",
                          fontWeight: 600,
                          letterSpacing: "0.04em",
                        }}
                      >
                        {t.label}
                      </div>
                    </PaperBackground>
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  onClick={() => setShowAddFridge(false)}
                  style={{
                    padding: "9px 16px",
                    borderRadius: 999,
                    fontSize: 13,
                    background: "transparent",
                    color: "rgba(255,255,255,0.7)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddFridge}
                  style={{
                    padding: "9px 20px",
                    borderRadius: 999,
                    fontSize: 13,
                    background: "#fff",
                    color: "#0a0a0a",
                    border: "1px solid #fff",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  Create fridge
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
