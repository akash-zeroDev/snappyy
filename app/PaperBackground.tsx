"use client";

import { useId, useMemo, CSSProperties } from "react";

export type PaperType = "lined" | "grid" | "dotted" | "blank" | "wavy";
export type TextureStyle = "vintage" | "modern" | "rough" | "smooth";

type Props = {
  paperType?: PaperType;
  lineColor?: string;
  lineSpacing?: number;
  lineWidth?: number;
  opacity?: number;
  paperTexture?: boolean;
  textureStyle?: TextureStyle;
  textureIntensity?: number; // 10..80
  background?: string;
  shadow?: boolean;
  noise?: boolean;
  noiseIntensity?: number; // 5..60
  className?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
};

export default function PaperBackground({
  paperType = "lined",
  lineColor = "#d0d0d0",
  lineSpacing = 24,
  lineWidth = 1,
  opacity = 0.3,
  paperTexture = true,
  textureStyle = "vintage",
  textureIntensity = 30,
  background = "#ffffff",
  shadow = false,
  noise = false,
  noiseIntensity = 25,
  className,
  style,
  children,
}: Props) {
  const reactId = useId().replace(/:/g, "");
  const patternId = `pap-${reactId}`;
  const noiseId = `noi-${reactId}`;

  const renderPattern = () => {
    switch (paperType) {
      case "lined":
        return (
          <defs>
            <pattern id={patternId} x="0" y="0" width="100%" height={lineSpacing} patternUnits="userSpaceOnUse">
              <line x1="0" y1={lineSpacing} x2="100%" y2={lineSpacing} stroke={lineColor} strokeWidth={lineWidth} opacity={opacity} />
            </pattern>
          </defs>
        );
      case "grid":
        return (
          <defs>
            <pattern id={patternId} x="0" y="0" width={lineSpacing} height={lineSpacing} patternUnits="userSpaceOnUse">
              <line x1="0" y1={lineSpacing} x2={lineSpacing} y2={lineSpacing} stroke={lineColor} strokeWidth={lineWidth} opacity={opacity} />
              <line x1={lineSpacing} y1="0" x2={lineSpacing} y2={lineSpacing} stroke={lineColor} strokeWidth={lineWidth} opacity={opacity} />
            </pattern>
          </defs>
        );
      case "dotted":
        return (
          <defs>
            <pattern id={patternId} x="0" y="0" width={lineSpacing} height={lineSpacing} patternUnits="userSpaceOnUse">
              <circle cx={lineSpacing / 2} cy={lineSpacing / 2} r={lineWidth} fill={lineColor} opacity={opacity} />
            </pattern>
          </defs>
        );
      case "wavy":
        return (
          <defs>
            <pattern id={patternId} x="0" y="0" width="100" height={lineSpacing} patternUnits="userSpaceOnUse">
              <path
                d={`M 0,${lineSpacing / 2} Q 25,${lineSpacing / 2 - 8} 50,${lineSpacing / 2} T 100,${lineSpacing / 2}`}
                fill="none"
                stroke={lineColor}
                strokeWidth={lineWidth}
                opacity={opacity}
              />
            </pattern>
          </defs>
        );
      default:
        return null;
    }
  };

  const textureCss: CSSProperties = useMemo(() => {
    if (!paperTexture) return {};
    const intensity = textureIntensity / 100;
    switch (textureStyle) {
      case "vintage":
        return {
          filter: `contrast(${1 + intensity * 0.4}) brightness(${1 - intensity * 0.2}) saturate(${1 - intensity * 0.25}) sepia(${intensity * 0.35}) hue-rotate(${intensity * 15}deg)`,
          backgroundImage: `
            radial-gradient(ellipse at 20% 30%, rgba(139, 69, 19, ${intensity * 0.25}) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 70%, rgba(160, 82, 45, ${intensity * 0.22}) 0%, transparent 55%),
            radial-gradient(ellipse at 40% 80%, rgba(210, 180, 140, ${intensity * 0.18}) 0%, transparent 45%),
            radial-gradient(ellipse at 70% 20%, rgba(222, 184, 135, ${intensity * 0.2}) 0%, transparent 50%),
            radial-gradient(ellipse at 10% 60%, rgba(205, 133, 63, ${intensity * 0.15}) 0%, transparent 40%),
            linear-gradient(45deg, rgba(139, 69, 19, ${intensity * 0.08}) 0%, transparent 30%, rgba(160, 82, 45, ${intensity * 0.06}) 70%),
            linear-gradient(-30deg, rgba(222, 184, 135, ${intensity * 0.1}) 0%, transparent 40%)
          `,
        };
      case "modern":
        return {
          filter: `contrast(${1 + intensity * 0.15}) brightness(${1 - intensity * 0.08}) saturate(${1 + intensity * 0.1})`,
          backgroundImage: `
            linear-gradient(45deg, rgba(0, 0, 0, ${intensity * 0.04}) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(0, 0, 0, ${intensity * 0.04}) 25%, transparent 25%)
          `,
        };
      case "rough":
        return {
          filter: `contrast(${1 + intensity * 0.3}) brightness(${1 - intensity * 0.15}) saturate(${1 - intensity * 0.15})`,
          backgroundImage: `
            radial-gradient(ellipse at 30% 40%, rgba(101, 67, 33, ${intensity * 0.18}) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 60%, rgba(139, 69, 19, ${intensity * 0.15}) 0%, transparent 45%),
            radial-gradient(ellipse at 50% 90%, rgba(160, 82, 45, ${intensity * 0.12}) 0%, transparent 40%)
          `,
        };
      case "smooth":
      default:
        return {
          filter: `contrast(${1 + intensity * 0.08}) brightness(${1 - intensity * 0.05})`,
          backgroundImage: `linear-gradient(135deg, rgba(0, 0, 0, ${intensity * 0.03}) 0%, transparent 100%)`,
        };
    }
  }, [paperTexture, textureStyle, textureIntensity]);

  const overlayPattern = useMemo(() => {
    if (textureStyle === "vintage") {
      return `
        repeating-linear-gradient(0deg, transparent, transparent 0.8px, rgba(139, 69, 19, 0.12) 0.8px, rgba(139, 69, 19, 0.12) 1.6px),
        repeating-linear-gradient(90deg, transparent, transparent 0.8px, rgba(160, 82, 45, 0.1) 0.8px, rgba(160, 82, 45, 0.1) 1.6px),
        repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(222, 184, 135, 0.08) 3px, rgba(222, 184, 135, 0.08) 4px)
      `;
    }
    if (textureStyle === "rough") {
      return `
        repeating-linear-gradient(35deg, transparent, transparent 1.5px, rgba(101, 67, 33, 0.15) 1.5px, rgba(101, 67, 33, 0.15) 2.5px),
        repeating-linear-gradient(-55deg, transparent, transparent 2px, rgba(139, 69, 19, 0.12) 2px, rgba(139, 69, 19, 0.12) 3px),
        repeating-linear-gradient(80deg, transparent, transparent 4px, rgba(160, 82, 45, 0.1) 4px, rgba(160, 82, 45, 0.1) 5px)
      `;
    }
    if (textureStyle === "modern") {
      return `
        repeating-linear-gradient(0deg, transparent, transparent 0.5px, rgba(0, 0, 0, 0.08) 0.5px, rgba(0, 0, 0, 0.08) 1px),
        repeating-linear-gradient(90deg, transparent, transparent 0.5px, rgba(0, 0, 0, 0.06) 0.5px, rgba(0, 0, 0, 0.06) 1px)
      `;
    }
    return `
      repeating-linear-gradient(0deg, transparent, transparent 0.7px, rgba(0, 0, 0, 0.06) 0.7px, rgba(0, 0, 0, 0.06) 1.4px),
      repeating-linear-gradient(90deg, transparent, transparent 0.7px, rgba(0, 0, 0, 0.04) 0.7px, rgba(0, 0, 0, 0.04) 1.4px)
    `;
  }, [textureStyle]);

  return (
    <div
      className={className}
      style={{
        position: "relative",
        background,
        overflow: "hidden",
        boxShadow: shadow ? "0 12px 30px rgba(0,0,0,0.18)" : undefined,
        ...style,
      }}
    >
      {paperTexture && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            ...textureCss,
            pointerEvents: "none",
          }}
        />
      )}

      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: overlayPattern,
          pointerEvents: "none",
          mixBlendMode: textureStyle === "vintage" ? "multiply" : "normal",
        }}
      />

      {paperTexture && textureIntensity > 40 && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            opacity: ((textureIntensity - 40) / 100) * 0.6,
            mixBlendMode: "overlay",
            backgroundImage:
              textureStyle === "vintage"
                ? `radial-gradient(circle at 10% 10%, rgba(139, 69, 19, 0.15) 0%, transparent 30%),
                   radial-gradient(circle at 90% 90%, rgba(160, 82, 45, 0.12) 0%, transparent 25%),
                   radial-gradient(circle at 30% 70%, rgba(205, 133, 63, 0.1) 0%, transparent 35%),
                   radial-gradient(circle at 70% 30%, rgba(222, 184, 135, 0.08) 0%, transparent 40%)`
                : textureStyle === "rough"
                ? `radial-gradient(circle at 20% 20%, rgba(101, 67, 33, 0.2) 0%, transparent 40%),
                   radial-gradient(circle at 80% 80%, rgba(139, 69, 19, 0.18) 0%, transparent 35%),
                   radial-gradient(circle at 50% 10%, rgba(160, 82, 45, 0.15) 0%, transparent 30%)`
                : `radial-gradient(circle at 25% 25%, rgba(0, 0, 0, 0.05) 0%, transparent 50%),
                   radial-gradient(circle at 75% 75%, rgba(0, 0, 0, 0.03) 0%, transparent 45%)`,
            pointerEvents: "none",
          }}
        />
      )}

      <svg
        width="100%"
        height="100%"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        aria-hidden
      >
        {renderPattern()}
        {noise && (
          <defs>
            <filter id={noiseId}>
              <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
              <feColorMatrix
                values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${noiseIntensity / 100} 0`}
              />
            </filter>
          </defs>
        )}
        {paperType !== "blank" && <rect width="100%" height="100%" fill={`url(#${patternId})`} />}
        {noise && <rect width="100%" height="100%" filter={`url(#${noiseId})`} />}
      </svg>

      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}

// 7 curated presets covering paperType × textureStyle combinations
export const PAPER_PRESETS: Array<{
  name: string;
  props: Partial<Props>;
}> = [
  { name: "Vintage Lined",  props: { paperType: "lined",   textureStyle: "vintage", background: "#f7efde", lineColor: "#d3c1a3", textureIntensity: 35 } },
  { name: "Vintage Grid",   props: { paperType: "grid",    textureStyle: "vintage", background: "#f5e9cc", lineColor: "#c9b187", textureIntensity: 45 } },
  { name: "Modern Dotted",  props: { paperType: "dotted",  textureStyle: "modern",  background: "#f3f4f6", lineColor: "#9aa1ab", textureIntensity: 20 } },
  { name: "Rough Kraft",    props: { paperType: "blank",   textureStyle: "rough",   background: "#d9b88a", textureIntensity: 55 } },
  { name: "Smooth Cream",   props: { paperType: "blank",   textureStyle: "smooth",  background: "#fbf7ee", textureIntensity: 25 } },
  { name: "Wavy Vintage",   props: { paperType: "wavy",    textureStyle: "vintage", background: "#f0e6ce", lineColor: "#b89e74", textureIntensity: 40 } },
  { name: "Modern Grid",    props: { paperType: "grid",    textureStyle: "modern",  background: "#ffffff", lineColor: "#cfd3d8", textureIntensity: 18 } },
];
