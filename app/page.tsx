"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FluidGlassButton from "./FluidGlassButton";
import { putMemory, type FridgeMemory } from "./fridgeDB";

type Stage = "landing" | "camera" | "preview" | "printing" | "result";

const SCENE_IMGS = [
  "/Sea_and_sun-removebg-preview.png",
  "/summer-removebg-preview.png",
  "/download__52_-removebg-preview.png",
  "/download__53_-removebg-preview.png",
  "/download__54_-removebg-preview.png",
  "/download__55_-removebg-preview.png",
  "/download__56_-removebg-preview.png",
  "/download__57_-removebg-preview.png",
];

export default function Home() {
  const [stage, setStage] = useState<Stage>("landing");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [developing, setDeveloping] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [flying, setFlying] = useState(false);
  const router = useRouter();

  const handleAddToFridge = useCallback(async () => {
    if (!capturedImage) return;
    setFlying(true);
    const preset =
      typeof window !== "undefined"
        ? parseInt(localStorage.getItem("fridge_preset") ?? "0", 10) || 0
        : 0;
    const memory: FridgeMemory = {
      id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      image: capturedImage,
      date: new Date().toISOString(),
      x: 40 + Math.random() * 600,
      y: 40 + Math.random() * 400,
      rotate: (Math.random() - 0.5) * 14,
      fridge: preset,
    };
    await putMemory(memory);
    await new Promise((r) => setTimeout(r, 900));
    setFlying(false);
    setCapturedImage(null);
    setStage("landing");
    router.push("/fridge");
  }, [capturedImage, router]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      alert("Camera access denied. Please allow camera permissions.");
    }
  }, [facingMode, stopCamera]);

  useEffect(() => {
    if (stage === "camera") startCamera();
    return () => {
      if (stage === "camera") stopCamera();
    };
  }, [stage, startCamera, stopCamera]);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const targetAspect = 5640 / 3760;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    let sw: number, sh: number;
    if (vw / vh > targetAspect) {
      sh = vh;
      sw = vh * targetAspect;
    } else {
      sw = vw;
      sh = vw / targetAspect;
    }
    const ox = (vw - sw) / 2;
    const oy = (vh - sh) / 2;
    canvas.width = Math.round(sw);
    canvas.height = Math.round(sh);
    const ctx = canvas.getContext("2d")!;
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, ox, oy, sw, sh, 0, 0, canvas.width, canvas.height);
    setCapturedImage(canvas.toDataURL("image/jpeg", 0.92));
    stopCamera();
    setStage("preview");
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setStage("camera");
  };

  const handleContinue = () => {
    setShowFlash(true);
    setStage("printing");
    setTimeout(() => setShowFlash(false), 600);
    setTimeout(() => {
      setDeveloping(true);
      setTimeout(() => {
        setDeveloping(false);
        setStage("result");
      }, 3200);
    }, 2800);
  };

  const handleDownload = () => {
    if (!capturedImage) return;
    const canvas = document.createElement("canvas");
    const cardW = 900;
    const cardH = Math.round(cardW * (20 / 27));
    const topPad = Math.round(cardW * 0.03);
    const sidePad = Math.round(cardW * 0.03);
    const imgW = cardW - sidePad * 2;
    const imgH = Math.round(imgW * (3760 / 5640));
    canvas.width = cardW;
    canvas.height = cardH;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#FDFDFB";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const img = new Image();
    img.onload = () => {
      const srcAspect = img.width / img.height;
      const targetAspect = imgW / imgH;
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (srcAspect > targetAspect) {
        sw = img.height * targetAspect;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / targetAspect;
        sy = (img.height - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, sidePad, topPad, imgW, imgH);
      const link = document.createElement("a");
      link.download = `oh-snap-${Date.now()}.jpg`;
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.click();
    };
    img.src = capturedImage;
  };

  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* Top navbar */}
      <nav
        className="navbar-root"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 28px",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          background: "rgba(0,0,0,0.35)",
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
        <div style={{ position: "relative" }}>
          <Link
            href="/fridge"
            className="navbar-cta"
            style={{
              color: "rgba(255,255,255,0.78)",
              fontSize: 14,
              padding: "8px 16px",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: 999,
              textDecoration: "none",
              transition: "color 200ms, border-color 200ms",
            }}
          >
            Your Fridge
          </Link>

          {/* Hand-drawn hint pointing at "Your Fridge" — only on landing */}
          {stage === "landing" && (
            <motion.div
              className="navbar-hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                right: 60,
                pointerEvents: "none",
                display: "flex",
                alignItems: "flex-start",
                gap: 4,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-patrick-hand), 'Patrick Hand', cursive",
                  fontSize: 19,
                  fontWeight: 700,
                  color: "rgba(245, 175, 105, 0.85)",
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                  transform: "rotate(-6deg)",
                  marginTop: 38,
                }}
              >
                your snaps land here
              </span>
              <svg
                width="96"
                height="100"
                viewBox="0 0 96 100"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
                style={{ overflow: "visible" }}
              >
                <path
                  d="M 6 92 C 14 70, 22 52, 38 32 C 54 14, 70 8, 84 4"
                  fill="none"
                  stroke="rgba(245, 175, 105, 0.85)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* arrowhead */}
                <path
                  d="M 70 0 L 86 4 L 80 18"
                  fill="none"
                  stroke="rgba(245, 175, 105, 0.85)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>
          )}
        </div>
      </nav>

      {/* Flash overlay */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            className="fixed inset-0 z-[100] bg-white pointer-events-none"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </AnimatePresence>

      <canvas ref={canvasRef} className="hidden" />

      <AnimatePresence mode="wait">
        {/* ===================== LANDING ===================== */}
        {stage === "landing" && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="framer-landing"
            style={{ minHeight: "100vh", width: "auto", position: "relative", overflow: "hidden" }}
          >
            {/* Warm amber bottom-corner glows — cinematic mood */}
            <div
              style={{
                position: "absolute",
                left: "-10%",
                bottom: "-10%",
                width: "45%",
                height: "55%",
                background:
                  "radial-gradient(ellipse at 30% 70%, rgba(180, 100, 40, 0.10) 0%, rgba(140, 75, 30, 0.05) 35%, transparent 70%)",
                filter: "blur(20px)",
                zIndex: 1,
                pointerEvents: "none",
                mixBlendMode: "screen",
              }}
            />
            <div
              style={{
                position: "absolute",
                right: "-10%",
                bottom: "-10%",
                width: "45%",
                height: "55%",
                background:
                  "radial-gradient(ellipse at 70% 70%, rgba(180, 105, 50, 0.09) 0%, rgba(140, 80, 35, 0.04) 35%, transparent 70%)",
                filter: "blur(20px)",
                zIndex: 1,
                pointerEvents: "none",
                mixBlendMode: "screen",
              }}
            />


            {/* 3D rotating media ring behind camera */}
            <div className="scene3d-wrap" aria-hidden>
              <div className="framer-3dscene">
                <div className="framer-a3d-wrap">
                  <div
                    className="framer-a3d"
                    style={{ ["--n" as never]: 14, ["--w" as never]: "25em" }}
                  >
                    {Array.from({ length: 14 }).map((_, i) => (
                      <div
                        key={i}
                        className="framer-card"
                        style={{ ["--i" as never]: i }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={SCENE_IMGS[i % SCENE_IMGS.length]} alt="" draggable={false} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="scene3d-fade" />
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh",
                position: "relative",
                padding: "40px 20px",
                gap: "0",
                zIndex: 3,
              }}
            >
              {/* Single leaf laying flat on the surface near camera base */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/new_leave.png"
                alt=""
                aria-hidden
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: "18%",
                  width: "340px",
                  height: "auto",
                  transform:
                    "translateX(-50%) perspective(800px) rotateX(72deg) rotateZ(-14deg)",
                  transformOrigin: "center bottom",
                  zIndex: 4,
                  pointerEvents: "none",
                  opacity: 0.85,
                  filter:
                    "saturate(0.85) brightness(0.8) drop-shadow(0 8px 12px rgba(0,0,0,0.75))",
                  WebkitMaskImage:
                    "radial-gradient(65% 70% at 50% 50%, #000 50%, transparent 100%)",
                  maskImage:
                    "radial-gradient(65% 70% at 50% 50%, #000 50%, transparent 100%)",
                }}
              />

              {/* Text section */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "12px",
                  zIndex: 10,
                  marginBottom: "20px",
                }}
              >
                {/* Heading with subtle glow */}
                <div style={{ textAlign: "center", position: "relative" }}>
                  <div
                    aria-hidden
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                      width: "120%",
                      height: "180%",
                      background:
                        "radial-gradient(ellipse at center, rgba(255, 220, 180, 0.18) 0%, rgba(220, 180, 140, 0.08) 35%, transparent 70%)",
                      filter: "blur(24px)",
                      pointerEvents: "none",
                      zIndex: 0,
                    }}
                  />
                  <p
                    className="hero-heading"
                    style={{
                      fontFamily:
                        '"GT Walsheim Framer Regular", "GT Walsheim Framer Regular Placeholder", sans-serif',
                      fontSize: "51px",
                      fontWeight: 500,
                      letterSpacing: "-2.16px",
                      lineHeight: "54px",
                      textAlign: "center",
                      color: "rgb(255, 255, 255)",
                      margin: 0,
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    Keep This One
                  </p>
                </div>

                {/* Subheadline */}
                <div style={{ maxWidth: "460px", textAlign: "center", padding: "0 16px" }}>
                  <p
                    className="hero-subheading"
                    style={{
                      fontSize: "15px",
                      letterSpacing: "-0.01px",
                      lineHeight: "24.3px",
                      textAlign: "center",
                      color: "rgba(255, 255, 255, 0.6)",
                      margin: 0,
                    }}
                  >
                    Some moments are too good to scroll past.
                  </p>
                </div>
              </div>

              {/* Surface base — slightly lighter warm-dark tone so the gradient is visible */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: "55%",
                  background:
                    "linear-gradient(to bottom, transparent 0%, rgba(48, 40, 32, 0.55) 40%, rgba(58, 48, 38, 0.7) 100%)",
                  zIndex: 1,
                  pointerEvents: "none",
                }}
              />
              {/* Surface — dark gradient with blur (per reference) */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: "50%",
                  background:
                    "linear-gradient(rgb(0, 0, 0) 37%, rgba(0, 0, 0, 0) 100%)",
                  filter: "blur(9px)",
                  opacity: 1,
                  transform: "scaleY(-1)",
                  zIndex: 1,
                  pointerEvents: "none",
                }}
              />

              {/* Camera assembly with grounding shadows */}
              <div
                style={{
                  position: "relative",
                  width: "min(689px, 90vw)",
                  aspectRatio: "3600 / 2688",
                  transform: "scale(0.75) perspective(1200px) rotateX(6deg)",
                  transformOrigin: "center center",
                  zIndex: 5,
                  margin: "-40px 0",
                }}
              >
                {/* L1: Deep soft cast shadow — projected forward on the floor */}
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    bottom: "-30%",
                    transform: "translateX(-50%)",
                    width: "200%",
                    height: "75%",
                    background:
                      "radial-gradient(ellipse 60% 50% at 50% 60%, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.45) 25%, rgba(0,0,0,0.2) 55%, transparent 85%)",
                    filter: "blur(45px)",
                    zIndex: 1,
                    pointerEvents: "none",
                  }}
                />
                {/* L2: Mid contact shadow — directly under */}
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    bottom: "-8%",
                    transform: "translateX(-50%)",
                    width: "115%",
                    height: "30%",
                    background:
                      "radial-gradient(ellipse 55% 60% at 50% 50%, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 35%, rgba(0,0,0,0.25) 65%, transparent 90%)",
                    filter: "blur(18px)",
                    zIndex: 2,
                    pointerEvents: "none",
                  }}
                />
                {/* L3: Ambient occlusion — tight dark crescent where camera meets floor */}
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    bottom: "2%",
                    transform: "translateX(-50%)",
                    width: "78%",
                    height: "9%",
                    background:
                      "radial-gradient(ellipse 70% 100% at 50% 50%, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 50%, transparent 90%)",
                    filter: "blur(5px)",
                    zIndex: 2,
                    pointerEvents: "none",
                  }}
                />
                {/* Camera image — with multi-stop drop shadows for body depth */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/mycamera.png"
                  alt="Polaroid Camera"
                  style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    position: "relative",
                    zIndex: 3,
                    filter:
                      "drop-shadow(0 2px 1px rgba(0,0,0,0.7)) drop-shadow(0 8px 6px rgba(0,0,0,0.55)) drop-shadow(0 28px 18px rgba(0,0,0,0.45)) drop-shadow(0 55px 40px rgba(0,0,0,0.35))",
                  }}
                />
                {/* Surface reflection — flipped camera fading down */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/mycamera.png"
                  alt=""
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "85%",
                    width: "100%",
                    height: "60%",
                    objectFit: "contain",
                    objectPosition: "top",
                    transform: "scaleY(-1)",
                    opacity: 0.7,
                    zIndex: 4,
                    pointerEvents: "none",
                    WebkitMaskImage:
                      "linear-gradient(to top, transparent 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.9) 100%)",
                    maskImage:
                      "linear-gradient(to top, transparent 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.9) 100%)",
                    filter: "blur(1px)",
                  }}
                />
                {/* L4: Bounce light from marquee onto camera underside */}
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    bottom: "8%",
                    transform: "translateX(-50%)",
                    width: "55%",
                    height: "12%",
                    background:
                      "radial-gradient(ellipse at center, rgba(120, 140, 200, 0.12) 0%, transparent 70%)",
                    filter: "blur(10px)",
                    zIndex: 4,
                    pointerEvents: "none",
                    mixBlendMode: "screen",
                  }}
                />
              </div>

              {/* CTA — Fluid Glass Button */}
              <div style={{ zIndex: 10, marginTop: "-20px" }}>
                <FluidGlassButton
                  text="Take a Snapshot"
                  onClick={() => setStage("camera")}
                />
              </div>

            </div>
          </motion.div>
        )}

        {/* ===================== CAMERA ===================== */}
        {stage === "camera" && (
          <motion.div
            key="camera"
            className="flex flex-col items-center justify-center min-h-screen gap-6 px-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
          >
            <div className="relative w-full max-w-lg aspect-square rounded-xl overflow-hidden bg-[#08080a] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Viewfinder corners */}
              <div className="absolute inset-4 pointer-events-none">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white/40 rounded-tl" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white/40 rounded-tr" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white/40 rounded-bl" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white/40 rounded-br" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() =>
                  setFacingMode((m) => (m === "user" ? "environment" : "user"))
                }
                className="px-4 py-2 rounded-full text-sm text-white/60 border border-white/10 hover:border-white/30 transition cursor-pointer"
              >
                Flip
              </button>
              <motion.button
                onClick={handleCapture}
                className="w-16 h-16 rounded-full bg-white border-4 border-white/30 shadow-lg cursor-pointer"
                whileTap={{ scale: 0.85 }}
              />
              <button
                onClick={() => {
                  stopCamera();
                  setStage("landing");
                }}
                className="px-4 py-2 rounded-full text-sm text-white/60 border border-white/10 hover:border-white/30 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {/* ===================== PREVIEW ===================== */}
        {stage === "preview" && capturedImage && (
          <motion.div
            key="preview"
            className="flex flex-col items-center justify-center min-h-screen gap-6 px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <div className="w-[260px] md:w-[300px] rounded-xl overflow-hidden border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full object-cover"
                style={{ aspectRatio: "5640 / 3760" }}
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleRetake}
                className="px-6 py-3 rounded-full text-sm text-white/70 border border-white/15 hover:border-white/30 transition cursor-pointer"
              >
                Retake
              </button>
              <motion.button
                onClick={handleContinue}
                className="cursor-pointer"
                style={{
                  backgroundColor: "rgb(255, 255, 255)",
                  borderRadius: "100px",
                  boxShadow:
                    "rgb(176, 176, 176) 0px 5px 0px 0px, rgba(0, 0, 0, 0.28) 0px 8px 14px 0px",
                  border: "none",
                  padding: "12px 28px",
                  color: "#000",
                  fontSize: "15px",
                  fontWeight: 500,
                }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                Continue
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ===================== PRINTING ===================== */}
        {stage === "printing" && capturedImage && (
          <motion.div
            key="printing"
            className="flex flex-col items-center justify-center min-h-screen px-4 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div
              style={{
                position: "relative",
                width: "min(689px, 90vw)",
                aspectRatio: "3600 / 2688",
                transform: "scale(0.75)",
                transformOrigin: "center top",
                marginTop: "-20px",
              }}
            >
              {/* Polaroid sliding out from print slot — behind camera front (z-index 1), starts inside, slides down to emerge */}
              <motion.div
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: "5%",
                  width: "42%",
                  zIndex: 1,
                  transformOrigin: "50% 0%",
                }}
                initial={{ x: "-50%", y: "0%", rotateX: 90, opacity: 0 }}
                animate={{ x: "-50%", y: "65%", rotateX: 0, opacity: 1 }}
                transition={{
                  delay: 0.8,
                  duration: 2.5,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                <div
                  style={{
                    backgroundColor: "rgb(253, 253, 251)",
                    borderRadius: "4px",
                    boxShadow:
                      "rgba(0, 0, 0, 0.28) 0px 20px 45px 0px, rgba(0, 0, 0, 0.12) 0px 4px 10px 0px, inset 0 0 0 1px rgba(0, 0, 0, 0.04)",
                    padding: "3% 3% 0 3%",
                    aspectRatio: "27 / 20",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: "rgb(8, 8, 10)",
                      borderRadius: "1px",
                      width: "100%",
                      aspectRatio: "5640 / 3760",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={capturedImage}
                      alt="Developing"
                      className={
                        developing
                          ? "developing"
                          : ""
                      }
                      style={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        ...(developing
                          ? {}
                          : {
                              filter: "blur(14px) brightness(2) saturate(0)",
                              opacity: 0.8,
                            }),
                      }}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Camera image on top — masks the polaroid */}
              <motion.div
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 4,
                }}
                animate={{ x: [0, -3, 3, -2, 0] }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/mycamera.png"
                  alt="Polaroid Camera"
                  style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              </motion.div>
            </div>

            <motion.p
              style={{
                color: "rgba(255, 255, 255, 0.4)",
                fontSize: "14px",
                marginTop: "-20px",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              Developing your photo...
            </motion.p>
          </motion.div>
        )}

        {/* ===================== RESULT ===================== */}
        {stage === "result" && capturedImage && (
          <motion.div
            key="result"
            className="flex flex-col items-center justify-center min-h-screen gap-8 px-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
          >
            <motion.div
              className="result-polaroid"
              drag
              dragMomentum={true}
              dragElastic={0.1}
              whileDrag={{ scale: 1.05, cursor: "grabbing", rotate: 0 }}
              style={{
                width: "clamp(260px, 38vw, 340px)",
                aspectRatio: "27 / 20",
                backgroundColor: "rgb(253, 253, 251)",
                borderRadius: "4px",
                boxShadow:
                  "rgba(0, 0, 0, 0.28) 0px 20px 45px 0px, rgba(0, 0, 0, 0.12) 0px 4px 10px 0px, inset 0 0 0 1px rgba(0, 0, 0, 0.04)",
                padding: "3% 3% 0 3%",
                cursor: "grab",
                display: "flex",
                flexDirection: "column",
              }}
              initial={{ rotate: -2 }}
              animate={{ rotate: 1 }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
            >
              <div
                style={{
                  backgroundColor: "rgb(8, 8, 10)",
                  borderRadius: "1px",
                  width: "100%",
                  aspectRatio: "5640 / 3760",
                  overflow: "hidden",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={capturedImage}
                  alt="Your Polaroid"
                  style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
            </motion.div>

            <div className="flex gap-4 flex-wrap justify-center result-actions">
              <motion.button
                onClick={handleAddToFridge}
                className="cursor-pointer"
                style={{
                  backgroundColor: "rgb(255, 255, 255)",
                  borderRadius: "100px",
                  boxShadow:
                    "rgb(176, 176, 176) 0px 5px 0px 0px, rgba(0, 0, 0, 0.28) 0px 8px 14px 0px",
                  border: "none",
                  padding: "12px 28px",
                  color: "#000",
                  fontSize: "15px",
                  fontWeight: 500,
                }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                Add to Fridge
              </motion.button>
              <button
                onClick={handleDownload}
                style={{
                  background: "transparent",
                  color: "rgba(255,255,255,0.78)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 999,
                  padding: "10px 20px",
                  fontSize: 14,
                  cursor: "pointer",
                  outline: "none",
                  transition: "border-color 200ms, color 200ms",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.78)";
                }}
              >
                Download
              </button>
              <button
                onClick={() => {
                  setCapturedImage(null);
                  setStage("landing");
                }}
                style={{
                  background: "transparent",
                  color: "rgba(255,255,255,0.78)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 999,
                  padding: "10px 20px",
                  fontSize: 14,
                  cursor: "pointer",
                  outline: "none",
                  transition: "border-color 200ms, color 200ms",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.78)";
                }}
              >
                Take Another
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fly-to-fridge overlay — flies the print to the fridge section */}
      <AnimatePresence>
        {flying && capturedImage && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              pointerEvents: "none",
              zIndex: 150,
            }}
          >
            <motion.div
              initial={{ top: "40%", left: "50%", x: "-50%", y: "-50%", rotate: 0, scale: 1 }}
              animate={{
                top: "100%",
                left: "50%",
                x: "-50%",
                y: "-50%",
                rotate: 12,
                scale: 0.25,
              }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: "absolute",
                width: "min(360px, 70vw)",
                background: "rgb(252, 251, 248)",
                borderRadius: 6,
                padding: "3% 3% 10% 3%",
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
                  src={capturedImage}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
