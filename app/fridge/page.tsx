"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import PaperBackground, { PAPER_PRESETS, type PaperType, type TextureStyle } from "../PaperBackground";
import ProfileCard from "../ProfileCard";
import FeedbackModal from "../FeedbackModal";
import {
  listMemories,
  putMemory,
  deleteMemory,
  type FridgeMemory,
} from "../fridgeDB";

const BOARD_HEIGHT_DESKTOP = 1100;
const BOARD_HEIGHT_MOBILE = 700;
const CARD_W_DESKTOP = 280;
const CARD_W_MOBILE = 150;

const FONT_OPTIONS = [
  { key: "patrick", label: "Handwriting", css: "var(--font-patrick-hand), 'Patrick Hand', cursive", canvas: "Patrick Hand" },
  { key: "caveat", label: "Casual", css: "var(--font-caveat), 'Caveat', cursive", canvas: "Caveat" },
  { key: "marker", label: "Marker", css: "var(--font-permanent-marker), 'Permanent Marker', cursive", canvas: "Permanent Marker" },
  { key: "indie", label: "Sketchy", css: "var(--font-indie-flower), 'Indie Flower', cursive", canvas: "Indie Flower" },
  { key: "shadows", label: "Dreamy", css: "var(--font-shadows), 'Shadows Into Light', cursive", canvas: "Shadows Into Light" },
  { key: "satisfy", label: "Fancy", css: "var(--font-satisfy), 'Satisfy', cursive", canvas: "Satisfy" },
];

const SIZE_OPTIONS = [
  { key: "sm", label: "S", px: 16, canvas: 28 },
  { key: "md", label: "M", px: 22, canvas: 42 },
  { key: "lg", label: "L", px: 28, canvas: 56 },
  { key: "xl", label: "XL", px: 34, canvas: 68 },
];

const FRAME_COLORS = [
  { key: "classic", label: "Classic", color: "#FDFDFB", text: "#333" },
  { key: "black", label: "Dark", color: "#1a1a1a", text: "#eee" },
  { key: "cream", label: "Cream", color: "#F5ECDA", text: "#5a4a3a" },
  { key: "pink", label: "Blush", color: "#FADCE6", text: "#7a3a4a" },
  { key: "mint", label: "Mint", color: "#D4EDDA", text: "#2d5a3a" },
  { key: "sky", label: "Sky", color: "#D6EAF8", text: "#2a4a6a" },
  { key: "lavender", label: "Lavender", color: "#E8DAEF", text: "#5a3a6a" },
  { key: "sunset", label: "Sunset", color: "#FDEBD0", text: "#6a4a2a" },
];

function resolveFrameColor(key: string) {
  const preset = FRAME_COLORS.find(f => f.key === key);
  if (preset) return preset;
  const isLight = (() => {
    const hex = key.replace("#", "");
    if (hex.length !== 6) return true;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 140;
  })();
  return { key, label: "Custom", color: key, text: isLight ? "#333" : "#eee" };
}

const FRAME_SIZES = [
  { key: "auto", label: "Auto", imgRatio: "auto", bottomPct: 12, canvasBottom: 0.12 },
  { key: "compact", label: "Compact", imgRatio: "4 / 3", bottomPct: 8, canvasBottom: 0.08 },
  { key: "classic", label: "Classic", imgRatio: "3 / 4", bottomPct: 15, canvasBottom: 0.15 },
  { key: "wide", label: "Wide", imgRatio: "16 / 9", bottomPct: 10, canvasBottom: 0.10 },
  { key: "square", label: "Square", imgRatio: "1 / 1", bottomPct: 12, canvasBottom: 0.12 },
];

type CustomFridge = {
  name: string;
  paperType: PaperType;
  textureStyle: TextureStyle;
  background: string;
  lineColor: string;
  textureIntensity: number;
  customBgImage?: string;
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

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return mobile;
}

export default function FridgePage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [lightMode, setLightMode] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("oh_snap_theme");
      if (saved === "light") setLightMode(true);
    } catch {}
  }, []);
  const toggleTheme = () => {
    setLightMode((p) => {
      localStorage.setItem("oh_snap_theme", !p ? "light" : "dark");
      return !p;
    });
  };
  const CARD_W = isMobile ? CARD_W_MOBILE : CARD_W_DESKTOP;
  const BOARD_HEIGHT = isMobile ? BOARD_HEIGHT_MOBILE : BOARD_HEIGHT_DESKTOP;
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [memories, setMemories] = useState<FridgeMemory[]>([]);
  const [open, setOpen] = useState<FridgeMemory | null>(null);
  const [modalCaption, setModalCaption] = useState("");
  const [modalCaptionColor, setModalCaptionColor] = useState("#333");
  const [modalCaptionFont, setModalCaptionFont] = useState("patrick");
  const [modalCaptionSize, setModalCaptionSize] = useState("md");
  const [modalFrameColor, setModalFrameColor] = useState("classic");
  const [modalFrameSize, setModalFrameSize] = useState("auto");
  const [captionEditing, setCaptionEditing] = useState(false);
  const modalCardRef = useRef<HTMLDivElement>(null);
  const [preset, setPreset] = useState(0);
  const [customFridges, setCustomFridges] = useState<CustomFridge[]>([]);
  const [showAddFridge, setShowAddFridge] = useState(false);
  const [newName, setNewName] = useState("");
  const [newStyle, setNewStyle] = useState(0);
  const [newBgImage, setNewBgImage] = useState<string | null>(null);
  const bgImageInputRef = useRef<HTMLInputElement>(null);
  const [fridgesLoaded, setFridgesLoaded] = useState(false);
  const [showShowcase, setShowShowcase] = useState(false);
  const [showcaseIds, setShowcaseIds] = useState<Set<string>>(new Set());
  const [showFeedback, setShowFeedback] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteColor, setNoteColor] = useState("#fff9c4");
  const [noteStickers, setNoteStickers] = useState<Array<{ emoji: string; x: number; y: number }>>([]);
  const [noteTexts, setNoteTexts] = useState<Array<{ id: number; text: string; x: number; y: number; size: number; font: string; editing: boolean }>>([]);
  const [activeFont, setActiveFont] = useState("'Patrick Hand', cursive");
  const [activeSize, setActiveSize] = useState(18);
  const noteRef = useRef<HTMLDivElement>(null);

  // load custom fridges on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(CUSTOM_KEY);
      if (raw) setCustomFridges(JSON.parse(raw));
    } catch {}
    setFridgesLoaded(true);
    try {
      const saved = JSON.parse(localStorage.getItem("ring_showcase_ids") ?? "[]") as string[];
      if (saved.length) setShowcaseIds(new Set(saved));
    } catch {}
  }, []);

  // persist only after initial load is done
  useEffect(() => {
    if (!fridgesLoaded) return;
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(customFridges));
  }, [customFridges, fridgesLoaded]);

  const ALL_FRIDGES = [
    ...PAPER_PRESETS.map((p) => ({ name: p.name, props: p.props, custom: false as const, customBgImage: undefined as string | undefined })),
    ...customFridges.map((c) => ({
      name: c.name,
      custom: true as const,
      customBgImage: c.customBgImage,
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
    const next: CustomFridge = { name: trimmed, ...tpl.preset, ...(newBgImage ? { customBgImage: newBgImage } : {}) };
    setCustomFridges((prev) => [...prev, next]);
    setPreset(PAPER_PRESETS.length + customFridges.length);
    setShowAddFridge(false);
    setNewName("");
    setNewStyle(0);
    setNewBgImage(null);
  };

  const handleDeleteCustomFridge = (customIndex: number) => {
    if (!window.confirm("Delete this fridge? Cards on it will move to the first fridge.")) return;
    const absoluteIndex = PAPER_PRESETS.length + customIndex;
    setMemories((prev) => {
      const next = prev.map((m) => {
        const f = m.fridge ?? 0;
        if (f === absoluteIndex) return { ...m, fridge: 0 };
        if (f > absoluteIndex) return { ...m, fridge: f - 1 };
        return m;
      });
      next
        .filter((m, i) => m !== prev[i])
        .forEach((m) => { putMemory(m).catch(() => {}); });
      return next;
    });
    setCustomFridges((prev) => prev.filter((_, i) => i !== customIndex));
    if (preset >= absoluteIndex) setPreset(Math.max(0, preset - 1));
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
      if (!Number.isNaN(n) && n >= 0) setPreset(n);
    }
  }, []);

  const visibleMemories = memories.filter((m) => (m.fridge ?? 0) === preset);

  const handleMoveToFridge = async (m: FridgeMemory, targetFridge: number) => {
    if (m.fridge === targetFridge) return;
    const boardW = containerRef.current?.clientWidth ?? 1200;
    const updated = {
      ...m,
      fridge: targetFridge,
      x: 20 + Math.random() * Math.max(0, boardW - CARD_W - 40),
      y: 20 + Math.random() * Math.max(0, BOARD_HEIGHT - 350),
      rotate: (Math.random() - 0.5) * 14,
    };
    await putMemory(updated);
    setMemories((prev) => prev.map((p) => (p.id === m.id ? updated : p)));
    setOpen(null); setCaptionEditing(false);
  };

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("fridge_preset", String(preset));
  }, [preset]);

  const handleDragEnd = async (m: FridgeMemory, dx: number, dy: number) => {
    const boardW = containerRef.current?.clientWidth ?? 1200;
    const newX = Math.max(0, Math.min(m.x + dx, boardW - CARD_W));
    const newY = Math.max(0, Math.min(m.y + dy, BOARD_HEIGHT - 100));
    const updated = { ...m, x: newX, y: newY };
    setMemories((prev) => prev.map((p) => (p.id === m.id ? updated : p)));
    await putMemory(updated);
  };

  const handleRotate = async (m: FridgeMemory, deg: number) => {
    const updated = { ...m, rotate: (m.rotate || 0) + deg };
    setMemories((prev) => prev.map((p) => (p.id === m.id ? updated : p)));
    await putMemory(updated);
  };

  const handleDelete = async (id: string) => {
    await deleteMemory(id);
    setMemories((prev) => prev.filter((p) => p.id !== id));
    setOpen(null);
  };

  const handleDownloadMemory = (m: FridgeMemory) => {
    if (!m.image) return;
    const canvas = document.createElement("canvas");
    const cardW = 1800;
    const sidePad = Math.round(cardW * 0.055);
    const topPad = Math.round(cardW * 0.055);
    const frameSizeCfg = FRAME_SIZES.find(f => f.key === (m.frameSize || "auto"));
    const bottomPad = Math.round(cardW * (frameSizeCfg?.canvasBottom ?? 0.16));
    const imgW = cardW - sidePad * 2;
    const fc = resolveFrameColor(m.frameColor || "classic");
    const fColor = fc.color;
    const fText = fc.text;
    const isAuto = !m.frameSize || m.frameSize === "auto";
    const imgRatioStr = frameSizeCfg?.imgRatio ?? "4 / 3";
    const [rw, rh] = imgRatioStr.split("/").map(Number);
    const img = new Image();
    img.onload = () => {
      const imgH = isAuto
        ? Math.round(imgW / (img.width / img.height))
        : Math.round(imgW * (rh / rw));
      const cardH = topPad + imgH + bottomPad;
      canvas.width = cardW;
      canvas.height = cardH;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = fColor;
      ctx.fillRect(0, 0, cardW, cardH);
      const srcA = img.width / img.height;
      const tgtA = imgW / imgH;
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (!isAuto && srcA > tgtA) { sw = img.height * tgtA; sx = (img.width - sw) / 2; }
      else if (!isAuto) { sh = img.width / tgtA; sy = (img.height - sh) / 2; }
      ctx.drawImage(img, sx, sy, sw, sh, sidePad, topPad, imgW, imgH);
      if (m.caption?.trim()) {
        ctx.save();
        const canvasFont = FONT_OPTIONS.find(f => f.key === (m.captionFont || "patrick"))?.canvas ?? "Patrick Hand";
        const canvasSize = (SIZE_OPTIONS.find(s => s.key === (m.captionSize || "md"))?.canvas ?? 42) * 2;
        ctx.font = `${canvasSize}px '${canvasFont}', cursive`;
        ctx.fillStyle = m.captionColor || fText;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(m.caption, cardW / 2, topPad + imgH + bottomPad * 0.45, imgW - 40);
        ctx.restore();
      }
      const d = new Date(m.date);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      ctx.save();
      ctx.font = "48px 'Patrick Hand', cursive";
      ctx.fillStyle = fText !== "#333" ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.25)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(dateStr, cardW / 2, topPad + imgH + bottomPad * (m.caption?.trim() ? 0.78 : 0.5));
      ctx.restore();
      ctx.save();
      ctx.font = "32px 'Patrick Hand', cursive";
      ctx.fillStyle = fText !== "#333" ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.12)";
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillText("MemoryPrint", cardW - sidePad, cardH - 16);
      ctx.restore();
      const link = document.createElement("a");
      link.download = `memoryprint-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = m.image;
  };

  const [showDownloadPicker, setShowDownloadPicker] = useState(false);
  const [downloadSelected, setDownloadSelected] = useState<Set<string>>(new Set());
  const [downloadingSelected, setDownloadingSelected] = useState(false);

  const openDownloadPicker = () => {
    setDownloadSelected(new Set());
    setShowDownloadPicker(true);
  };

  const toggleDownloadItem = (id: string) => {
    setDownloadSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllDownload = () => {
    const photoIds = memories.filter((m) => m.image).map((m) => m.id);
    setDownloadSelected((prev) => prev.size === photoIds.length ? new Set() : new Set(photoIds));
  };

  const handleDownloadSelected = async () => {
    const selected = memories.filter((m) => m.image && downloadSelected.has(m.id));
    if (selected.length === 0) return;
    setDownloadingSelected(true);
    for (let i = 0; i < selected.length; i++) {
      await new Promise<void>((resolve) => {
        const m = selected[i];
        renderMemoryToCanvas(m, (dataUrl) => {
          const link = document.createElement("a");
          link.download = `memoryprint-${i + 1}.png`;
          link.href = dataUrl;
          link.click();
          setTimeout(resolve, 300);
        }, resolve);
      });
    }
    setDownloadingSelected(false);
    setShowDownloadPicker(false);
  };

  const renderMemoryToCanvas = (m: FridgeMemory, onDone: (dataUrl: string) => void, onError?: () => void) => {
    if (!m.image) { onError?.(); return; }
    const canvas = document.createElement("canvas");
    const cardW = 1800;
    const sidePad = Math.round(cardW * 0.055);
    const topPad = Math.round(cardW * 0.055);
    const frameSizeCfg = FRAME_SIZES.find(f => f.key === (m.frameSize || "auto"));
    const bottomPad = Math.round(cardW * (frameSizeCfg?.canvasBottom ?? 0.16));
    const imgW = cardW - sidePad * 2;
    const fc = resolveFrameColor(m.frameColor || "classic");
    const isAuto = !m.frameSize || m.frameSize === "auto";
    const imgRatioStr = frameSizeCfg?.imgRatio ?? "4 / 3";
    const [rw, rh] = imgRatioStr.split("/").map(Number);
    const img = new Image();
    img.onload = () => {
      const imgH = isAuto ? Math.round(imgW / (img.width / img.height)) : Math.round(imgW * (rh / rw));
      const cardH = topPad + imgH + bottomPad;
      canvas.width = cardW;
      canvas.height = cardH;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = fc.color;
      ctx.fillRect(0, 0, cardW, cardH);
      const srcA = img.width / img.height;
      const tgtA = imgW / imgH;
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (!isAuto && srcA > tgtA) { sw = img.height * tgtA; sx = (img.width - sw) / 2; }
      else if (!isAuto) { sh = img.width / tgtA; sy = (img.height - sh) / 2; }
      ctx.drawImage(img, sx, sy, sw, sh, sidePad, topPad, imgW, imgH);
      if (m.caption?.trim()) {
        ctx.save();
        const canvasFont = FONT_OPTIONS.find(f => f.key === (m.captionFont || "patrick"))?.canvas ?? "Patrick Hand";
        const canvasSize = (SIZE_OPTIONS.find(s => s.key === (m.captionSize || "md"))?.canvas ?? 42) * 2;
        ctx.font = `${canvasSize}px '${canvasFont}', cursive`;
        ctx.fillStyle = m.captionColor || fc.text;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(m.caption, cardW / 2, topPad + imgH + bottomPad * 0.45, imgW - 40);
        ctx.restore();
      }
      const d = new Date(m.date);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      ctx.save();
      ctx.font = "48px 'Patrick Hand', cursive";
      ctx.fillStyle = fc.text !== "#333" ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.25)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(dateStr, cardW / 2, topPad + imgH + bottomPad * (m.caption?.trim() ? 0.78 : 0.5));
      ctx.restore();
      ctx.save();
      ctx.font = "32px 'Patrick Hand', cursive";
      ctx.fillStyle = fc.text !== "#333" ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.12)";
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillText("MemoryPrint", cardW - sidePad, cardH - 16);
      ctx.restore();
      onDone(canvas.toDataURL("image/png"));
    };
    img.onerror = () => onError?.();
    img.src = m.image;
  };

  const fridgeBoardRef = useRef<HTMLDivElement>(null);
  const handleFridgeScreenshot = async () => {
    const el = fridgeBoardRef.current;
    if (!el) return;
    el.scrollIntoView({ block: "start" });
    await new Promise((r) => setTimeout(r, 100));
    const { default: html2canvas } = await import("html2canvas");
    const fridgeProps = ALL_FRIDGES[preset]?.props ?? PAPER_PRESETS[0].props;
    const canvas = await html2canvas(el, {
      useCORS: true,
      allowTaint: true,
      backgroundColor: fridgeProps.background || "#ffffff",
      scale: 2,
      logging: false,
    });
    const link = document.createElement("a");
    link.download = `my-fridge-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const boardW = containerRef.current?.clientWidth ?? 1200;
      const memory: FridgeMemory = {
        id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        image: dataUrl,
        date: new Date().toISOString(),
        x: 20 + Math.random() * Math.max(0, boardW - CARD_W - 40),
        y: 20 + Math.random() * Math.max(0, BOARD_HEIGHT - 320),
        rotate: (Math.random() - 0.5) * 14,
        fridge: preset,
      };
      await putMemory(memory);
      setMemories((prev) => [...prev, memory]);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const shuffleCards = useCallback(() => {
    const boardW = containerRef.current?.clientWidth ?? 1200;
    const maxX = Math.max(0, boardW - CARD_W - 20);
    const maxY = Math.max(0, BOARD_HEIGHT - 320);
    setMemories((prev) =>
      prev.map((m) => {
        if ((m.fridge ?? 0) !== preset) return m;
        const updated = {
          ...m,
          x: 20 + Math.random() * maxX,
          y: 20 + Math.random() * maxY,
          rotate: (Math.random() - 0.5) * 16,
        };
        putMemory(updated).catch(() => {});
        return updated;
      })
    );
  }, [preset]);



  const handleSaveNote = async () => {
    const validTexts = noteTexts.filter((t) => t.text.trim());
    if (validTexts.length === 0 && noteStickers.length === 0) return;
    const savedTexts = validTexts.map(({ id, text, x, y, size, font }) => ({ id, text, x, y, size, font }));
    const note: FridgeMemory = {
      id: `note-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      image: "",
      date: new Date().toISOString(),
      x: 40 + Math.random() * 500,
      y: 40 + Math.random() * 350,
      rotate: (Math.random() - 0.5) * 12,
      fridge: preset,
      type: "note",
      noteColor,
      stickers: noteStickers.length > 0 ? noteStickers : undefined,
      noteTexts: savedTexts.length > 0 ? savedTexts : undefined,
    };
    await putMemory(note);
    setMemories((prev) => [...prev, note]);
    setNoteTexts([]);
    setNoteStickers([]);
    setShowAddNote(false);
  };

  const dateLabel = (iso: string) => {
    const d = new Date(iso);
    const date = d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    return `${date}, ${time}`;
  };

  const t = {
    bg: lightMode ? "#f5f0eb" : "#0a0a0a",
    text: lightMode ? "#1a1a1a" : "#fff",
    textMuted: lightMode ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.55)",
    textSoft: lightMode ? "rgba(0,0,0,0.65)" : "rgba(255,255,255,0.65)",
    border: lightMode ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.18)",
    borderSubtle: lightMode ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.06)",
    navBg: lightMode ? "#f5f0eb" : "rgba(0,0,0,0.55)",
    btnBg: lightMode ? "rgba(0,0,0,0.06)" : "transparent",
    btnActiveBg: lightMode ? "#1a1a1a" : "#fff",
    btnActiveText: lightMode ? "#fff" : "#0a0a0a",
    dashBorder: lightMode ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.32)",
  };

  return (
    <main style={{ minHeight: "100vh", background: t.bg }}>
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
          padding: "12px clamp(12px, 3vw, 28px)",
          backdropFilter: lightMode ? "none" : "blur(10px)",
          WebkitBackdropFilter: lightMode ? "none" : "blur(10px)",
          background: t.navBg,
          borderBottom: lightMode ? "none" : `1px solid ${t.borderSubtle}`,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <Link
          href="/"
          className="navbar-brand"
          style={{
            color: t.text,
            fontSize: 16,
            fontWeight: 500,
            letterSpacing: "-0.01em",
            textDecoration: "none",
          }}
        >
          MemoryPrint
        </Link>
        <div style={{ display: "flex", gap: isMobile ? 4 : 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button
            onClick={toggleTheme}
            style={{
              background: lightMode ? "rgba(0,0,0,0.06)" : "transparent",
              border: `1px solid ${t.border}`,
              borderRadius: 999,
              padding: isMobile ? "5px 8px" : "7px 10px",
              cursor: "pointer",
              fontSize: 16,
              lineHeight: 1,
              display: "flex",
              alignItems: "center",
            }}
          >
            {lightMode ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            )}
          </button>
          <button
            onClick={() => setShowFeedback(true)}
            style={{
              color: t.textMuted,
              fontSize: isMobile ? 11 : 13,
              padding: isMobile ? "5px 10px" : "7px 14px",
              border: `1px solid ${t.border}`,
              borderRadius: 999,
              background: "transparent",
              cursor: "pointer",
            }}
          >
            Feedback
          </button>
          <div style={{ position: "relative" }}>
            <Link
              href="/coming-soon"
              style={{
                color: t.textMuted,
                fontSize: isMobile ? 11 : 13,
                padding: isMobile ? "5px 10px" : "7px 14px",
                border: `1px solid ${t.border}`,
                borderRadius: 999,
                textDecoration: "none",
                background: "transparent",
                display: "inline-block",
              }}
            >
              {isMobile ? "✨ Soon" : "✨ Brewing..."}
            </Link>
            {!isMobile && (
              <div
                className="navbar-hint"
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: "50%",
                  transform: "translateX(-50%)",
                  pointerEvents: "none",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0,
                }}
              >
                <svg width="20" height="18" viewBox="0 0 20 18" xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible" }}>
                  <path d="M 10 2 C 10 6, 10 12, 10 16" fill="none" stroke="rgba(245,175,105,0.8)" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M 5 12 L 10 18 L 15 12" fill="none" stroke="rgba(245,175,105,0.8)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{
                  fontFamily: "var(--font-patrick-hand), 'Patrick Hand', cursive",
                  fontSize: 13,
                  color: "rgba(245,175,105,0.85)",
                  whiteSpace: "nowrap",
                  transform: "rotate(-3deg)",
                  marginTop: 2,
                }}>
                  new stuff coming!
                </span>
              </div>
            )}
          </div>
          <Link
            href="/"
            className="navbar-cta"
            style={{
              color: t.textSoft,
              fontSize: isMobile ? 12 : 14,
              padding: isMobile ? "6px 12px" : "8px 16px",
              border: `1px solid ${t.border}`,
              borderRadius: 999,
              textDecoration: "none",
            }}
          >
            {isMobile ? "← Camera" : "← Back to camera"}
          </Link>
        </div>
      </nav>

      <section className="fridge-section" style={{ padding: isMobile ? "56px 10px 24px" : "60px 24px 32px" }}>
        <div style={{ maxWidth: 1500, margin: "0 auto" }}>
          <div
            className="fridge-hero"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: isMobile ? 16 : 36,
              marginBottom: isMobile ? 16 : 32,
              flexWrap: "wrap",
            }}
          >
            {!isMobile && <ProfileCard />}
            <div style={{ textAlign: "center", flex: "1 1 auto", minWidth: 200 }}>
              <h1
                className="fridge-heading"
                style={{
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontSize: "clamp(28px, 7vw, 46px)",
                  fontWeight: 500,
                  letterSpacing: "-1.2px",
                  color: t.text,
                  margin: 0,
                }}
              >
                Your Personal Fridge
              </h1>
              <p
                style={{
                  fontSize: 15,
                  color: t.textMuted,
                  margin: "10px 0 0",
                }}
              >
                Moments worth keeping.
              </p>
              <p style={{
                fontSize: 14,
                color: "rgba(245,175,105,0.85)",
                fontFamily: "var(--font-patrick-hand), 'Patrick Hand', sans-serif",
                margin: "8px 0 0",
              }}>
                📌 Your photos stay on this device — clearing browser data or switching browsers will erase them.
              </p>
              <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: isMobile ? 10 : 14, flexWrap: "wrap" }}>
                <button
                  onClick={() => setShowShowcase((p) => !p)}
                  style={{
                    padding: isMobile ? "5px 12px" : "7px 16px",
                    borderRadius: 999,
                    fontSize: isMobile ? 11 : 12,
                    cursor: "pointer",
                    background: showShowcase ? t.btnActiveBg : "transparent",
                    color: showShowcase ? t.btnActiveText : t.textSoft,
                    border: showShowcase ? `1px solid ${t.btnActiveBg}` : `1px solid ${t.border}`,
                    transition: "all 200ms",
                  }}
                >
                  {showShowcase ? "Done selecting" : "Showcase"}
                </button>
                <button
                  onClick={shuffleCards}
                  style={{
                    padding: isMobile ? "5px 12px" : "7px 16px",
                    borderRadius: 999,
                    fontSize: isMobile ? 11 : 12,
                    cursor: "pointer",
                    background: "transparent",
                    color: t.textSoft,
                    border: `1px solid ${t.border}`,
                  }}
                >
                  Shuffle
                </button>
                {memories.some((m) => m.image) && (
                  <>
                    <button
                      onClick={openDownloadPicker}
                      style={{
                        padding: isMobile ? "5px 12px" : "7px 16px",
                        borderRadius: 999,
                        fontSize: isMobile ? 11 : 12,
                        cursor: "pointer",
                        background: "transparent",
                        color: t.textSoft,
                        border: `1px solid ${t.border}`,
                      }}
                    >
                      ⬇ Download
                    </button>
                    <button
                      onClick={handleFridgeScreenshot}
                      style={{
                        padding: isMobile ? "5px 12px" : "7px 16px",
                        borderRadius: 999,
                        fontSize: isMobile ? 11 : 12,
                        cursor: "pointer",
                        background: "transparent",
                        color: t.textSoft,
                        border: `1px solid ${t.border}`,
                      }}
                    >
                      📸 Fridge Screenshot
                    </button>
                  </>
                )}
              </div>
              <AnimatePresence>
                {showShowcase && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{ overflow: "hidden", marginTop: 10 }}
                  >
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", alignItems: "center" }}>
                      {memories.filter((m) => m.image).map((m) => {
                        const selected = showcaseIds.has(m.id);
                        return (
                          <div
                            key={m.id}
                            onClick={() => {
                              setShowcaseIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(m.id)) next.delete(m.id);
                                else next.add(m.id);
                                localStorage.setItem("ring_showcase_ids", JSON.stringify([...next]));
                                return next;
                              });
                            }}
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 6,
                              overflow: "hidden",
                              cursor: "pointer",
                              border: selected ? `2px solid ${t.text}` : `2px solid ${t.border}`,
                              opacity: selected ? 1 : 0.45,
                              transition: "all 200ms",
                              flexShrink: 0,
                            }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={m.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                          </div>
                        );
                      })}
                      {showcaseIds.size > 0 && (
                        <button
                          onClick={() => { setShowcaseIds(new Set()); localStorage.removeItem("ring_showcase_ids"); }}
                          style={{ padding: "4px 10px", borderRadius: 999, fontSize: 10, cursor: "pointer", background: "transparent", color: t.textMuted, border: `1px solid ${t.border}` }}
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Fridge style chips — built-in presets + custom user fridges + add button */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: isMobile ? 5 : 8,
              justifyContent: "center",
              marginBottom: isMobile ? 16 : 28,
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
                      padding: isMobile ? "6px 10px" : "8px 14px",
                      borderRadius: 999,
                      fontSize: isMobile ? 11 : 13,
                      cursor: "pointer",
                      background: isActive ? t.btnActiveBg : "transparent",
                      color: isActive ? t.btnActiveText : t.textSoft,
                      border: isActive ? `1px solid ${t.btnActiveBg}` : `1px solid ${t.border}`,
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
                        border: `1px solid ${t.border}`,
                        background: "transparent",
                        color: t.textMuted,
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
                padding: isMobile ? "6px 10px" : "8px 14px",
                borderRadius: 999,
                fontSize: isMobile ? 11 : 13,
                cursor: "pointer",
                background: "transparent",
                color: t.textSoft,
                border: `1px dashed ${t.dashBorder}`,
              }}
            >
              + Add fridge
            </button>
            <button
              onClick={() => setShowAddNote(true)}
              style={{
                padding: isMobile ? "6px 10px" : "8px 14px",
                borderRadius: 999,
                fontSize: isMobile ? 11 : 13,
                cursor: "pointer",
                background: "transparent",
                color: t.textSoft,
                border: `1px dashed ${t.dashBorder}`,
              }}
            >
              + Add note
            </button>
            <button
              onClick={() => galleryInputRef.current?.click()}
              style={{
                padding: isMobile ? "6px 10px" : "8px 14px",
                borderRadius: 999,
                fontSize: isMobile ? 11 : 13,
                cursor: "pointer",
                background: "transparent",
                color: t.textSoft,
                border: `1px dashed ${t.dashBorder}`,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <svg width={isMobile ? 12 : 14} height={isMobile ? 12 : 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
              Upload photo
            </button>
            <Link
              href="/"
              style={{
                padding: isMobile ? "6px 10px" : "8px 14px",
                borderRadius: 999,
                fontSize: isMobile ? 11 : 13,
                cursor: "pointer",
                background: lightMode ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.12)",
                color: t.text,
                border: `1px solid ${t.border}`,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <svg width={isMobile ? 12 : 14} height={isMobile ? 12 : 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
              Take a snap
            </Link>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              onChange={handleGalleryUpload}
              style={{ display: "none" }}
            />
          </div>

          {/* Memory board */}
          <div ref={fridgeBoardRef}>
          <PaperBackground
            {...(ALL_FRIDGES[preset]?.props ?? PAPER_PRESETS[0].props)}
            shadow
            style={{
              borderRadius: isMobile ? 8 : 14,
              border: "1px solid rgba(0,0,0,0.18)",
              minHeight: BOARD_HEIGHT,
              position: "relative",
              ...(ALL_FRIDGES[preset]?.customBgImage ? {
                backgroundImage: `url(${ALL_FRIDGES[preset].customBgImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              } : {}),
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
                    color: "rgba(0,0,0,0.5)",
                    fontSize: 15,
                    fontFamily: "var(--font-patrick-hand), 'Patrick Hand', sans-serif",
                    textShadow: "0 0 8px rgba(255,255,255,0.5)",
                  }}
                >
                  Nothing on this fridge yet —{" "}
                  <Link href="/" style={{ marginLeft: 6, textDecoration: "underline", color: "rgba(0,0,0,0.7)" }}>
                    take a snapshot
                  </Link>
                  .
                </div>
              )}

              {visibleMemories.map((m) => {
                const fc = resolveFrameColor(m.frameColor || "classic");
                const frameBg = fc?.color ?? "rgb(252, 251, 248)";
                const frameText = fc?.text ?? "#333";
                const savedSize = SIZE_OPTIONS.find(s => s.key === (m.captionSize || "md"));
                const cardFontPx = Math.round((savedSize?.px ?? 14) * (CARD_W / 440));
                const fsKey = m.frameSize || "auto";
                const fsCfg = FRAME_SIZES.find(f => f.key === fsKey);
                const imgRatio = fsKey === "auto" ? undefined : fsCfg?.imgRatio;
                const bottomPct = fsCfg?.bottomPct ?? 18;
                return (
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
                  onPointerDown={(e) => {
                    dragStartRef.current = { x: e.clientX, y: e.clientY };
                  }}
                  onDragEnd={(_, info) => handleDragEnd(m, info.offset.x, info.offset.y)}
                  onPointerUp={(e) => {
                    const s = dragStartRef.current;
                    if (s && Math.abs(e.clientX - s.x) < 5 && Math.abs(e.clientY - s.y) < 5) {
                      setOpen(m);
                      setModalCaption(m.caption || "");
                      setModalCaptionColor(m.captionColor || (resolveFrameColor(m.frameColor || "classic")?.text ?? "#333"));
                      setModalCaptionFont(m.captionFont || "patrick");
                      setModalCaptionSize(m.captionSize || "md");
                      setModalFrameColor(m.frameColor || "classic");
                      setModalFrameSize(m.frameSize || "auto");
                    }
                    dragStartRef.current = null;
                  }}
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
                  {/* Rotate buttons — visible on hover */}
                  <div
                    className="rotate-btns"
                    style={{
                      position: "absolute",
                      top: -28,
                      left: "50%",
                      transform: "translateX(-50%)",
                      display: "flex",
                      gap: 2,
                      zIndex: 60,
                      opacity: 0,
                      transition: "opacity 0.15s",
                      pointerEvents: "none",
                    }}
                  >
                    <button
                      onPointerDown={(e) => { e.stopPropagation(); handleRotate(m, -15); }}
                      style={{
                        width: 24, height: 24, borderRadius: "50%",
                        background: "rgba(0,0,0,0.65)", border: "none", color: "#fff",
                        fontSize: 13, cursor: "pointer", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        pointerEvents: "auto",
                      }}
                    >↺</button>
                    <button
                      onPointerDown={(e) => { e.stopPropagation(); handleRotate(m, 15); }}
                      style={{
                        width: 24, height: 24, borderRadius: "50%",
                        background: "rgba(0,0,0,0.65)", border: "none", color: "#fff",
                        fontSize: 13, cursor: "pointer", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        pointerEvents: "auto",
                      }}
                    >↻</button>
                  </div>
                  {m.type === "note" ? (
                    <div
                      style={{
                        background: m.noteColor || "#fff9c4",
                        borderRadius: 4,
                        boxShadow:
                          "0 8px 20px rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.25)",
                        position: "relative",
                        width: CARD_W,
                        height: CARD_W,
                        overflow: "hidden",
                      }}
                    >
                      {m.noteTexts?.map((t) => (
                        <span
                          key={t.id}
                          style={{
                            position: "absolute",
                            left: `${t.x}%`,
                            top: `${t.y}%`,
                            transform: "translate(-50%, -50%)",
                            fontFamily: t.font,
                            fontSize: Math.round(t.size * 0.65),
                            color: "#333",
                            whiteSpace: "nowrap",
                            pointerEvents: "none",
                          }}
                        >
                          {t.text}
                        </span>
                      ))}
                      {m.note && !m.noteTexts && (
                        <p style={{
                          fontFamily: "var(--font-patrick-hand), 'Patrick Hand', cursive",
                          fontSize: 13, color: "#333", lineHeight: 1.5,
                          whiteSpace: "pre-wrap", wordBreak: "break-word",
                          margin: 0, padding: "12px",
                        }}>
                          {m.note}
                        </p>
                      )}
                      {m.stickers?.map((s, i) => (
                        <span
                          key={i}
                          style={{
                            position: "absolute",
                            left: `${s.x}%`,
                            top: `${s.y}%`,
                            fontSize: 18,
                            transform: "translate(-50%, -50%)",
                            pointerEvents: "none",
                          }}
                        >
                          {s.emoji}
                        </span>
                      ))}
                      <p
                        style={{
                          position: "absolute", bottom: 4, right: 6,
                          fontFamily: "var(--font-patrick-hand), 'Patrick Hand', sans-serif",
                          fontSize: 11, color: "rgba(0,0,0,0.3)", margin: 0,
                        }}
                      >
                        {dateLabel(m.date)}
                      </p>
                    </div>
                  ) : (
                  <div
                    style={{
                      background: frameBg,
                      borderRadius: 4,
                      padding: `4% 4% ${bottomPct}% 4%`,
                      boxShadow:
                        "0 12px 24px rgba(0,0,0,0.45), 0 3px 6px rgba(0,0,0,0.35)",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        background: "rgb(8,8,10)",
                        borderRadius: 2,
                        overflow: "hidden",
                        aspectRatio: imgRatio,
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
                    {/* Legacy: old positioned texts */}
                    {m.texts?.map((t) => (
                      <span
                        key={t.id}
                        style={{
                          position: "absolute",
                          left: `${t.x}%`,
                          top: `${t.y}%`,
                          transform: "translate(-50%, -50%)",
                          fontFamily: "var(--font-patrick-hand), 'Patrick Hand', cursive",
                          fontSize: 12,
                          color: frameText,
                          whiteSpace: "nowrap",
                          pointerEvents: "none",
                        }}
                      >
                        {t.text}
                      </span>
                    ))}
                    {/* Caption */}
                    {m.caption && (
                      <p style={{
                        fontFamily: FONT_OPTIONS.find(f => f.key === (m.captionFont || "patrick"))?.css,
                        fontSize: cardFontPx,
                        color: m.captionColor || frameText,
                        textAlign: "center",
                        margin: "4px 0 0",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {m.caption}
                      </p>
                    )}
                    <p
                      style={{
                        fontFamily: "var(--font-patrick-hand), 'Patrick Hand', sans-serif",
                        fontSize: m.caption ? 11 : 14,
                        color: frameText,
                        textAlign: "center",
                        marginTop: m.caption ? 2 : 8,
                        marginBottom: 0,
                        opacity: m.caption ? 0.5 : 1,
                      }}
                    >
                      {dateLabel(m.date)}
                    </p>
                  </div>
                  )}
                </motion.div>
                );
              })}
            </div>
          </PaperBackground>
          </div>
          {/* Showcase grid moved to under heading */}
        </div>
      </section>


      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => { setOpen(null); setCaptionEditing(false); }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.78)",
              backdropFilter: "blur(4px)",
              zIndex: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: isMobile ? 12 : 24,
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
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
                background: open.type === "note" ? (open.noteColor || "#fff9c4") : (resolveFrameColor(modalFrameColor).color),
                borderRadius: 6,
                padding: open.type === "note" ? "24px 20px 16px" : "3% 3% 10% 3%",
                width: open.type === "note" ? "min(440px, 92vw)" : "min(380px, 92vw)",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
                position: "relative",
              }}
            >
              {open.type === "note" ? (
                <div style={{ position: "relative", width: "100%", aspectRatio: "1", overflow: "hidden" }}>
                  {open.noteTexts?.map((t) => (
                    <span
                      key={t.id}
                      style={{
                        position: "absolute",
                        left: `${t.x}%`,
                        top: `${t.y}%`,
                        transform: "translate(-50%, -50%)",
                        fontFamily: t.font,
                        fontSize: t.size,
                        color: "#333",
                        whiteSpace: "nowrap",
                        pointerEvents: "none",
                      }}
                    >
                      {t.text}
                    </span>
                  ))}
                  {open.note && !open.noteTexts && (
                    <p style={{
                      fontFamily: "var(--font-patrick-hand), 'Patrick Hand', cursive",
                      fontSize: 22, color: "#333", lineHeight: 1.6,
                      whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0,
                    }}>
                      {open.note}
                    </p>
                  )}
                  {open.stickers?.map((s, i) => (
                    <span
                      key={i}
                      style={{
                        position: "absolute", left: `${s.x}%`, top: `${s.y}%`,
                        fontSize: 32, transform: "translate(-50%, -50%)", pointerEvents: "none",
                      }}
                    >
                      {s.emoji}
                    </span>
                  ))}
                  <p style={{
                    position: "absolute", bottom: 8, right: 10,
                    fontFamily: "var(--font-patrick-hand)", fontSize: 13,
                    color: "rgba(0,0,0,0.25)", margin: 0,
                  }}>
                    {dateLabel(open.date)}
                  </p>
                </div>
              ) : (
                <>
              {/* Edit toggle — kept minimal */}

              <div
                ref={modalCardRef}
                style={{
                  width: "100%",
                  position: "relative",
                  background: "rgb(8,8,10)",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={open.image}
                  alt=""
                  style={{ width: "100%", maxHeight: isMobile ? "28vh" : "35vh", objectFit: "contain", display: "block", margin: "0 auto" }}
                />

                {/* Legacy: old positioned texts */}
                {(open.texts ?? []).map((t) => (
                  <span
                    key={t.id}
                    style={{
                      position: "absolute",
                      left: `${t.x}%`,
                      top: `${t.y}%`,
                      transform: "translate(-50%, -50%)",
                      fontFamily: "var(--font-patrick-hand), 'Patrick Hand', cursive",
                      fontSize: 16,
                      color: "#fff",
                      textShadow: "0 1px 4px rgba(0,0,0,0.6)",
                      whiteSpace: "nowrap",
                      pointerEvents: "none",
                    }}
                  >
                    {t.text}
                  </span>
                ))}
              </div>

              {/* Caption editing */}
              <div
                style={{
                  padding: "10px 12px 4px",
                  cursor: "text",
                }}
                onClick={() => setCaptionEditing(true)}
              >
                {captionEditing ? (
                  <input
                    autoFocus
                    value={modalCaption}
                    onChange={(e) => setModalCaption(e.target.value)}
                    onBlur={() => {
                      setCaptionEditing(false);
                      const updated = { ...open, caption: modalCaption.trim() || undefined, captionColor: modalCaptionColor, captionFont: modalCaptionFont, captionSize: modalCaptionSize };
                      putMemory(updated).catch(() => {});
                      setMemories((prev) => prev.map((m) => (m.id === open.id ? updated : m)));
                      setOpen(updated);
                    }}
                    onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                    maxLength={40}
                    placeholder="write a caption..."
                    style={{
                      fontFamily: FONT_OPTIONS.find(f => f.key === modalCaptionFont)?.css,
                      fontSize: SIZE_OPTIONS.find(s => s.key === modalCaptionSize)?.px ?? 20,
                      color: modalCaptionColor,
                      background: "transparent",
                      border: "none",
                      borderBottom: modalFrameColor === "black" ? "1.5px dashed rgba(255,255,255,0.2)" : "1.5px dashed rgba(0,0,0,0.15)",
                      outline: "none",
                      textAlign: "center",
                      width: "100%",
                      padding: "2px 4px",
                    }}
                  />
                ) : (
                  <p style={{
                    fontFamily: FONT_OPTIONS.find(f => f.key === (open.captionFont || modalCaptionFont))?.css,
                    fontSize: SIZE_OPTIONS.find(s => s.key === (open.captionSize || modalCaptionSize))?.px ?? 20,
                    color: (open.caption || modalCaption) ? (open.captionColor || modalCaptionColor) : (resolveFrameColor(modalFrameColor).text !== "#333" ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)"),
                    textAlign: "center",
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}>
                    {!(open.caption || modalCaption) && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        <path d="m15 5 4 4" />
                      </svg>
                    )}
                    {open.caption || modalCaption || "write a caption..."}
                  </p>
                )}
              </div>

              {/* Caption style toolbar */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center", padding: "8px 0" }}>
                {/* Colors */}
                <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                  {["#333", "#fff", "#1a6dd4", "#c0392b", "#27ae60", "#8e44ad", "#e67e22"].map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setModalCaptionColor(c);
                        if (open.caption || modalCaption) {
                          const updated = { ...open, captionColor: c };
                          putMemory(updated).catch(() => {});
                          setMemories((prev) => prev.map((m) => (m.id === open.id ? updated : m)));
                          setOpen(updated);
                        }
                      }}
                      style={{
                        width: modalCaptionColor === c ? 22 : 16,
                        height: modalCaptionColor === c ? 22 : 16,
                        borderRadius: "50%",
                        backgroundColor: c,
                        border: modalCaptionColor === c ? "2px solid rgba(0,0,0,0.3)" : c === "#fff" ? "1.5px solid rgba(0,0,0,0.2)" : "1.5px solid rgba(0,0,0,0.1)",
                        cursor: "pointer",
                        transition: "all 150ms ease",
                      }}
                    />
                  ))}
                  <label
                    title="Pick any color"
                    style={{
                      width: !["#333", "#fff", "#1a6dd4", "#c0392b", "#27ae60", "#8e44ad", "#e67e22"].includes(modalCaptionColor) ? 22 : 16,
                      height: !["#333", "#fff", "#1a6dd4", "#c0392b", "#27ae60", "#8e44ad", "#e67e22"].includes(modalCaptionColor) ? 22 : 16,
                      borderRadius: "50%",
                      cursor: "pointer",
                      position: "relative",
                      overflow: "hidden",
                      border: !["#333", "#fff", "#1a6dd4", "#c0392b", "#27ae60", "#8e44ad", "#e67e22"].includes(modalCaptionColor)
                        ? "2px solid rgba(0,0,0,0.3)"
                        : "1.5px solid rgba(0,0,0,0.1)",
                      background: !["#333", "#fff", "#1a6dd4", "#c0392b", "#27ae60", "#8e44ad", "#e67e22"].includes(modalCaptionColor)
                        ? modalCaptionColor
                        : "conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
                      transition: "all 150ms ease",
                    }}
                  >
                    <input
                      type="color"
                      value={modalCaptionColor}
                      onChange={(e) => {
                        setModalCaptionColor(e.target.value);
                        if (open.caption || modalCaption) {
                          const updated = { ...open, captionColor: e.target.value };
                          putMemory(updated).catch(() => {});
                          setMemories((prev) => prev.map((m) => (m.id === open.id ? updated : m)));
                          setOpen(updated);
                        }
                      }}
                      style={{
                        position: "absolute",
                        inset: 0,
                        opacity: 0,
                        width: "100%",
                        height: "100%",
                        cursor: "pointer",
                        border: "none",
                        padding: 0,
                      }}
                    />
                  </label>
                </div>

                {/* Fonts */}
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "center" }}>
                  {FONT_OPTIONS.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => {
                        setModalCaptionFont(f.key);
                        if (open.caption || modalCaption) {
                          const updated = { ...open, captionFont: f.key };
                          putMemory(updated).catch(() => {});
                          setMemories((prev) => prev.map((m) => (m.id === open.id ? updated : m)));
                          setOpen(updated);
                        }
                      }}
                      style={{
                        fontFamily: f.css,
                        fontSize: 12,
                        padding: "3px 8px",
                        borderRadius: 16,
                        border: modalCaptionFont === f.key
                          ? `1.5px solid ${resolveFrameColor(modalFrameColor).text !== "#333" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"}`
                          : `1px solid ${resolveFrameColor(modalFrameColor).text !== "#333" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"}`,
                        background: modalCaptionFont === f.key
                          ? (resolveFrameColor(modalFrameColor).text !== "#333" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)")
                          : "transparent",
                        color: modalCaptionFont === f.key
                          ? (resolveFrameColor(modalFrameColor).text)
                          : (resolveFrameColor(modalFrameColor).text !== "#333" ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"),
                        cursor: "pointer",
                        transition: "all 150ms ease",
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Sizes */}
                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  {SIZE_OPTIONS.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => {
                        setModalCaptionSize(s.key);
                        if (open.caption || modalCaption) {
                          const updated = { ...open, captionSize: s.key };
                          putMemory(updated).catch(() => {});
                          setMemories((prev) => prev.map((m) => (m.id === open.id ? updated : m)));
                          setOpen(updated);
                        }
                      }}
                      style={{
                        fontSize: s.key === "sm" ? 10 : s.key === "md" ? 12 : s.key === "lg" ? 14 : 16,
                        fontWeight: 600,
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        border: modalCaptionSize === s.key
                          ? `1.5px solid ${resolveFrameColor(modalFrameColor).text !== "#333" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"}`
                          : `1px solid ${resolveFrameColor(modalFrameColor).text !== "#333" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"}`,
                        background: modalCaptionSize === s.key
                          ? (resolveFrameColor(modalFrameColor).text !== "#333" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)")
                          : "transparent",
                        color: modalCaptionSize === s.key
                          ? (resolveFrameColor(modalFrameColor).text)
                          : (resolveFrameColor(modalFrameColor).text !== "#333" ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"),
                        cursor: "pointer",
                        transition: "all 150ms ease",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Frame style toolbar */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center", padding: "4px 0 8px" }}>
                <p style={{ fontSize: 10, color: resolveFrameColor(modalFrameColor).text, opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Frame</p>
                <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                  {FRAME_COLORS.map((fc) => (
                    <button
                      key={fc.key}
                      onClick={() => {
                        setModalFrameColor(fc.key);
                        const updated = { ...open, frameColor: fc.key };
                        putMemory(updated).catch(() => {});
                        setMemories((prev) => prev.map((m) => (m.id === open.id ? updated : m)));
                        setOpen(updated);
                      }}
                      style={{
                        width: modalFrameColor === fc.key ? 26 : 20,
                        height: modalFrameColor === fc.key ? 26 : 20,
                        borderRadius: 4,
                        backgroundColor: fc.color,
                        border: modalFrameColor === fc.key ? "2px solid rgba(128,128,128,0.5)" : "1.5px solid rgba(128,128,128,0.2)",
                        cursor: "pointer",
                        transition: "all 150ms ease",
                      }}
                    />
                  ))}
                  <label
                    title="Pick any color"
                    style={{
                      width: !FRAME_COLORS.some(f => f.key === modalFrameColor) ? 26 : 20,
                      height: !FRAME_COLORS.some(f => f.key === modalFrameColor) ? 26 : 20,
                      borderRadius: 4,
                      cursor: "pointer",
                      position: "relative",
                      overflow: "hidden",
                      border: !FRAME_COLORS.some(f => f.key === modalFrameColor)
                        ? "2px solid rgba(128,128,128,0.5)"
                        : "1.5px solid rgba(128,128,128,0.2)",
                      background: !FRAME_COLORS.some(f => f.key === modalFrameColor)
                        ? resolveFrameColor(modalFrameColor).color
                        : "conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
                      transition: "all 150ms ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <input
                      type="color"
                      value={resolveFrameColor(modalFrameColor).color}
                      onChange={(e) => {
                        setModalFrameColor(e.target.value);
                        const updated = { ...open, frameColor: e.target.value };
                        putMemory(updated).catch(() => {});
                        setMemories((prev) => prev.map((m) => (m.id === open.id ? updated : m)));
                        setOpen(updated);
                      }}
                      style={{
                        position: "absolute",
                        inset: 0,
                        opacity: 0,
                        width: "100%",
                        height: "100%",
                        cursor: "pointer",
                        border: "none",
                        padding: 0,
                      }}
                    />
                  </label>
                </div>
                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  {FRAME_SIZES.map((fs) => (
                    <button
                      key={fs.key}
                      onClick={() => {
                        setModalFrameSize(fs.key);
                        const updated = { ...open, frameSize: fs.key };
                        putMemory(updated).catch(() => {});
                        setMemories((prev) => prev.map((m) => (m.id === open.id ? updated : m)));
                        setOpen(updated);
                      }}
                      style={{
                        fontSize: 11,
                        padding: "3px 10px",
                        borderRadius: 16,
                        border: modalFrameSize === fs.key
                          ? `1.5px solid ${resolveFrameColor(modalFrameColor).text !== "#333" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"}`
                          : `1px solid ${resolveFrameColor(modalFrameColor).text !== "#333" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"}`,
                        background: modalFrameSize === fs.key
                          ? (resolveFrameColor(modalFrameColor).text !== "#333" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)")
                          : "transparent",
                        color: modalFrameSize === fs.key
                          ? (resolveFrameColor(modalFrameColor).text)
                          : (resolveFrameColor(modalFrameColor).text !== "#333" ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"),
                        cursor: "pointer",
                        transition: "all 150ms ease",
                      }}
                    >
                      {fs.label}
                    </button>
                  ))}
                </div>
              </div>

              <p
                style={{
                  fontFamily: "var(--font-patrick-hand), 'Patrick Hand', sans-serif",
                  fontSize: 18,
                  color: resolveFrameColor(modalFrameColor).text,
                  textAlign: "center",
                  margin: "4px 0 16px",
                  opacity: 0.6,
                }}
              >
                {dateLabel(open.date)}
              </p>
                </>
              )}

              {/* Move to fridge picker */}
              <div style={{ marginBottom: 16, textAlign: "center" }}>
                <p
                  style={{
                    fontSize: 11,
                    color: resolveFrameColor(modalFrameColor).text !== "#333" ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)",
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
                          background: isCurrent ? (modalFrameColor === "black" ? "#fff" : "#0a0a0a") : "transparent",
                          color: isCurrent ? (modalFrameColor === "black" ? "#1a1a1a" : "#fff") : (resolveFrameColor(modalFrameColor).text !== "#333" ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)"),
                          border: isCurrent
                            ? `1px solid ${modalFrameColor === "black" ? "#fff" : "#0a0a0a"}`
                            : `1px solid ${resolveFrameColor(modalFrameColor).text !== "#333" ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.18)"}`,
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

              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  onClick={() => handleDownloadMemory(open)}
                  style={{
                    border: `1px solid ${resolveFrameColor(modalFrameColor).text !== "#333" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"}`,
                    background: "transparent",
                    color: resolveFrameColor(modalFrameColor).text,
                    padding: "8px 16px",
                    borderRadius: 999,
                    fontSize: 13,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download
                </button>
                <button
                  onClick={() => { if (window.confirm("Remove this memory? This can't be undone.")) handleDelete(open.id); }}
                  style={{
                    border: `1px solid ${resolveFrameColor(modalFrameColor).text !== "#333" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"}`,
                    background: "transparent",
                    color: modalFrameColor === "black" ? "#f88" : "#a33",
                    padding: "8px 16px",
                    borderRadius: 999,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Remove
                </button>
                <button
                  onClick={() => { setOpen(null); setCaptionEditing(false); }}
                  style={{
                    border: `1px solid ${resolveFrameColor(modalFrameColor).text !== "#333" ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.15)"}`,
                    background: modalFrameColor === "black" ? "#fff" : "#0a0a0a",
                    color: modalFrameColor === "black" ? "#1a1a1a" : "#fff",
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
                background: lightMode ? "#fff" : "#111",
                border: `1px solid ${t.border}`,
                borderRadius: 14,
                padding: 24,
                color: t.text,
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>Add a new fridge</h3>
              <p style={{ margin: "4px 0 18px", fontSize: 13, color: t.textMuted }}>
                Name it, pick a paper style.
              </p>

              <label style={{ display: "block", fontSize: 12, color: t.textMuted, marginBottom: 6 }}>
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
                  border: `1px solid ${t.border}`,
                  background: lightMode ? "#f5f0eb" : "#0a0a0a",
                  color: t.text,
                  fontSize: 14,
                  outline: "none",
                  marginBottom: 16,
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddFridge();
                }}
              />

              <label style={{ display: "block", fontSize: 12, color: t.textMuted, marginBottom: 8 }}>
                Style
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 22 }}>
                {STYLE_TEMPLATES.map((st, i) => (
                  <button
                    key={st.label}
                    onClick={() => { setNewStyle(i); setNewBgImage(null); }}
                    style={{
                      padding: 0,
                      borderRadius: 10,
                      border: newStyle === i && !newBgImage ? `2px solid ${t.text}` : `1px solid ${t.border}`,
                      cursor: "pointer",
                      overflow: "hidden",
                      height: 56,
                      background: "transparent",
                    }}
                  >
                    <PaperBackground
                      {...st.preset}
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
                        {st.label}
                      </div>
                    </PaperBackground>
                  </button>
                ))}
                <button
                  onClick={() => bgImageInputRef.current?.click()}
                  style={{
                    padding: 0,
                    borderRadius: 10,
                    border: newBgImage ? `2px solid ${t.text}` : `1px solid ${t.border}`,
                    cursor: "pointer",
                    overflow: "hidden",
                    height: 56,
                    background: newBgImage ? `url(${newBgImage}) center/cover` : (lightMode ? "#e8e2db" : "#1a1a1a"),
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 2,
                  }}
                >
                  {!newBgImage && (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                      </svg>
                      <span style={{ fontSize: 9, color: t.textMuted, fontWeight: 600 }}>Gallery</span>
                    </>
                  )}
                  {newBgImage && (
                    <span style={{ fontSize: 9, color: "#fff", fontWeight: 700, textShadow: "0 1px 3px rgba(0,0,0,0.7)" }}>Custom</span>
                  )}
                </button>
                <input
                  ref={bgImageInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      setNewBgImage(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                    e.target.value = "";
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  onClick={() => setShowAddFridge(false)}
                  style={{
                    padding: "9px 16px",
                    borderRadius: 999,
                    fontSize: 13,
                    background: "transparent",
                    color: t.textSoft,
                    border: `1px solid ${t.border}`,
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
                    background: t.btnActiveBg,
                    color: t.btnActiveText,
                    border: `1px solid ${t.btnActiveBg}`,
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
      <FeedbackModal open={showFeedback} onClose={() => setShowFeedback(false)} />

      {/* Download Picker Modal */}
      <AnimatePresence>
        {showDownloadPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 200,
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
            onClick={() => setShowDownloadPicker(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "min(520px, 95vw)",
                maxHeight: "80vh",
                background: lightMode ? "#fff" : "#1a1a1a",
                borderRadius: 16,
                border: `1px solid ${t.border}`,
                padding: 24,
                color: t.text,
                display: "flex",
                flexDirection: "column",
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>Pick photos to download</h3>
                <button
                  onClick={selectAllDownload}
                  style={{
                    fontSize: 12,
                    color: t.textMuted,
                    background: "transparent",
                    border: `1px solid ${t.border}`,
                    borderRadius: 999,
                    padding: "4px 12px",
                    cursor: "pointer",
                  }}
                >
                  {downloadSelected.size === memories.filter((m) => m.image).length ? "Deselect all" : "Select all"}
                </button>
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
                gap: 8,
                overflowY: "auto",
                flex: 1,
                paddingBottom: 16,
              }}>
                {memories.filter((m) => m.image).map((m) => {
                  const selected = downloadSelected.has(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggleDownloadItem(m.id)}
                      style={{
                        padding: 0,
                        border: selected ? `3px solid #3b82f6` : `2px solid ${t.border}`,
                        borderRadius: 8,
                        cursor: "pointer",
                        position: "relative",
                        overflow: "hidden",
                        aspectRatio: "1",
                        background: "transparent",
                      }}
                    >
                      <img
                        src={m.image}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                          opacity: selected ? 1 : 0.6,
                          transition: "opacity 0.15s",
                        }}
                      />
                      {selected && (
                        <div style={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: "#3b82f6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8, borderTop: `1px solid ${t.border}` }}>
                <button
                  onClick={() => setShowDownloadPicker(false)}
                  style={{
                    padding: "9px 16px",
                    borderRadius: 999,
                    fontSize: 13,
                    background: "transparent",
                    color: t.textSoft,
                    border: `1px solid ${t.border}`,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDownloadSelected}
                  disabled={downloadSelected.size === 0 || downloadingSelected}
                  style={{
                    padding: "9px 20px",
                    borderRadius: 999,
                    fontSize: 13,
                    background: downloadSelected.size > 0 ? t.btnActiveBg : (lightMode ? "#ddd" : "#333"),
                    color: downloadSelected.size > 0 ? t.btnActiveText : t.textMuted,
                    border: "none",
                    cursor: downloadSelected.size > 0 ? "pointer" : "not-allowed",
                    fontWeight: 500,
                    opacity: downloadingSelected ? 0.6 : 1,
                  }}
                >
                  {downloadingSelected ? "Downloading..." : `Download ${downloadSelected.size > 0 ? `(${downloadSelected.size})` : ""}`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Note Modal */}
      <AnimatePresence>
        {showAddNote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddNote(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 999,
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: 380,
                background: lightMode ? "#fff" : "#141414",
                borderRadius: 20,
                border: `1px solid ${t.borderSubtle}`,
                padding: "24px 22px",
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-patrick-hand), 'Patrick Hand', sans-serif",
                  fontSize: 22,
                  color: t.text,
                  textAlign: "center",
                  margin: "0 0 18px",
                }}
              >
                Stick a note 📌
              </h3>

              {/* Color + Font + Size row */}
              <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
                {[
                  { color: "#fff9c4", label: "Yellow" },
                  { color: "#f8bbd0", label: "Pink" },
                  { color: "#c8e6c9", label: "Green" },
                  { color: "#bbdefb", label: "Blue" },
                  { color: "#ffe0b2", label: "Orange" },
                  { color: "#e1bee7", label: "Purple" },
                  { color: "#ffffff", label: "White" },
                ].map((c) => (
                  <button
                    key={c.color}
                    onClick={() => setNoteColor(c.color)}
                    title={c.label}
                    style={{
                      width: 24, height: 24, borderRadius: "50%", background: c.color,
                      border: noteColor === c.color ? `2.5px solid ${t.text}` : `2px solid ${t.border}`,
                      cursor: "pointer", transition: "all 0.2s",
                    }}
                  />
                ))}
              </div>

              {/* Font picker */}
              <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                {[
                  { label: "Hand", value: "'Patrick Hand', cursive" },
                  { label: "Sans", value: "system-ui, sans-serif" },
                  { label: "Serif", value: "Georgia, serif" },
                  { label: "Mono", value: "'Courier New', monospace" },
                  { label: "Comic", value: "'Comic Sans MS', cursive" },
                ].map((f) => (
                  <button
                    key={f.label}
                    onClick={() => setActiveFont(f.value)}
                    style={{
                      padding: "4px 10px", borderRadius: 8, fontSize: 11,
                      fontFamily: f.value, color: activeFont === f.value ? t.text : t.textMuted,
                      border: activeFont === f.value ? `1.5px solid ${t.border}` : `1px solid ${t.borderSubtle}`,
                      background: activeFont === f.value ? (lightMode ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.1)") : "transparent",
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Size picker */}
              <div style={{ display: "flex", gap: 6, marginBottom: 12, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: t.textMuted, fontFamily: "var(--font-patrick-hand)" }}>Size</span>
                {[12, 16, 20, 26, 34].map((s) => (
                  <button
                    key={s}
                    onClick={() => setActiveSize(s)}
                    style={{
                      padding: "3px 8px", borderRadius: 6, fontSize: 11,
                      color: activeSize === s ? t.text : t.textMuted,
                      border: activeSize === s ? `1.5px solid ${t.border}` : `1px solid ${t.borderSubtle}`,
                      background: activeSize === s ? (lightMode ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.1)") : "transparent",
                      cursor: "pointer", transition: "all 0.15s",
                      fontFamily: "var(--font-patrick-hand)",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Note canvas — tap to add text */}
              <div
                ref={noteRef}
                style={{
                  background: noteColor,
                  borderRadius: 4,
                  width: "100%",
                  aspectRatio: "1",
                  position: "relative",
                  marginBottom: 14,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                  overflow: "hidden",
                }}
                onClick={(e) => {
                  if (noteTexts.some((t) => t.editing)) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  setNoteTexts((prev) => [
                    ...prev,
                    { id: Date.now(), text: "", x, y, size: activeSize, font: activeFont, editing: true },
                  ]);
                }}
              >
                {noteTexts.length === 0 && noteStickers.length === 0 && (
                  <p style={{
                    position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--font-patrick-hand)", fontSize: 14, color: "rgba(0,0,0,0.2)", pointerEvents: "none",
                  }}>
                    Tap anywhere to write
                  </p>
                )}

                {/* Draggable text blocks */}
                {noteTexts.map((t) => (
                  <motion.div
                    key={t.id}
                    drag={!t.editing}
                    dragMomentum={false}
                    dragElastic={0}
                    dragConstraints={noteRef}
                    onDragEnd={(_, info) => {
                      if (!noteRef.current) return;
                      const rect = noteRef.current.getBoundingClientRect();
                      const dx = (info.offset.x / rect.width) * 100;
                      const dy = (info.offset.y / rect.height) * 100;
                      setNoteTexts((prev) =>
                        prev.map((p) => p.id === t.id ? { ...p, x: Math.max(2, Math.min(98, p.x + dx)), y: Math.max(2, Math.min(98, p.y + dy)) } : p)
                      );
                    }}
                    style={{
                      position: "absolute",
                      left: `${t.x}%`,
                      top: `${t.y}%`,
                      transform: "translate(-50%, -50%)",
                      zIndex: 5,
                      cursor: t.editing ? "text" : "grab",
                    }}
                    whileDrag={{ scale: 1.08, cursor: "grabbing" }}
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  >
                    {t.editing ? (
                      <input
                        autoFocus
                        value={t.text}
                        onChange={(e) =>
                          setNoteTexts((prev) => prev.map((p) => p.id === t.id ? { ...p, text: e.target.value } : p))
                        }
                        onBlur={() => {
                          setTimeout(() => {
                            setNoteTexts((prev) =>
                              prev.map((p) => p.id === t.id ? { ...p, editing: false } : p).filter((p) => p.text.trim() !== "")
                            );
                          }, 100);
                        }}
                        onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                        placeholder="type..."
                        style={{
                          fontFamily: t.font, fontSize: t.size, color: "#333",
                          background: "rgba(255,255,255,0.5)", border: "none",
                          borderBottom: "1.5px dashed rgba(0,0,0,0.3)", outline: "none",
                          textAlign: "center", minWidth: 60, padding: "2px 6px", borderRadius: 3,
                        }}
                      />
                    ) : (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setNoteTexts((prev) => prev.map((p) => p.id === t.id ? { ...p, editing: true } : p));
                        }}
                        style={{
                          fontFamily: t.font, fontSize: t.size, color: "#333",
                          cursor: "grab", whiteSpace: "nowrap", userSelect: "none",
                        }}
                      >
                        {t.text}
                      </span>
                    )}
                  </motion.div>
                ))}

                {/* Draggable stickers */}
                {noteStickers.map((s, i) => (
                  <motion.span
                    key={`sticker-${i}`}
                    drag
                    dragMomentum={false}
                    dragElastic={0}
                    dragConstraints={noteRef}
                    onDragEnd={(_, info) => {
                      if (!noteRef.current) return;
                      const rect = noteRef.current.getBoundingClientRect();
                      const newX = s.x + (info.offset.x / rect.width) * 100;
                      const newY = s.y + (info.offset.y / rect.height) * 100;
                      setNoteStickers((prev) =>
                        prev.map((st, j) => j === i ? { ...st, x: Math.max(5, Math.min(95, newX)), y: Math.max(5, Math.min(95, newY)) } : st)
                      );
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setNoteStickers((prev) => prev.filter((_, j) => j !== i));
                    }}
                    style={{
                      position: "absolute", left: `${s.x}%`, top: `${s.y}%`,
                      fontSize: 24, transform: "translate(-50%, -50%)",
                      cursor: "grab", zIndex: 4, userSelect: "none",
                    }}
                    whileDrag={{ scale: 1.3, cursor: "grabbing" }}
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  >
                    {s.emoji}
                  </motion.span>
                ))}
              </div>

              {/* Sticker picker */}
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 14 }}>
                {["❤️", "⭐", "🔥", "✅", "❌", "⚠️", "📌", "💡", "🎯", "🏆", "😊", "👍", "🎉", "💌", "🌈", "☕"].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setNoteStickers((prev) => [
                        ...prev,
                        { emoji, x: 15 + Math.random() * 70, y: 15 + Math.random() * 70 },
                      ]);
                    }}
                    style={{
                      fontSize: 18, background: lightMode ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.06)",
                      border: `1px solid ${t.borderSubtle}`, borderRadius: 8,
                      padding: "3px 5px", cursor: "pointer",
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => {
                    setShowAddNote(false);
                    setNoteTexts([]);
                    setNoteStickers([]);
                  }}
                  style={{
                    flex: 1, padding: "10px", borderRadius: 999,
                    border: `1px solid ${t.border}`, background: "transparent",
                    color: t.textSoft, fontSize: 14, cursor: "pointer",
                    fontFamily: "var(--font-patrick-hand), 'Patrick Hand', sans-serif",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNote}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: 999,
                    border: "none",
                    background: t.btnActiveBg,
                    color: t.btnActiveText,
                    fontSize: 14,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontFamily: "var(--font-patrick-hand), 'Patrick Hand', sans-serif",
                    boxShadow: lightMode ? "rgba(0,0,0,0.15) 0px 3px 0px 0px" : "rgb(80,80,80) 0px 3px 0px 0px",
                  }}
                >
                  Stick it! 📋
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
