/**
 * PixelDecor — pure-SVG pixel art components.
 * Each shape is built from <rect> on a small viewBox so it scales crisp.
 * Uses inline SVG (no images), so they're zero-network and easy to recolor.
 */

import type { SVGProps } from "react"
import { cn } from "@/lib/utils"

interface PixelProps extends SVGProps<SVGSVGElement> {
  size?: number
  className?: string
}

const baseProps = (size: number, className?: string) => ({
  width: size,
  height: size,
  className: cn("pixelated shrink-0", className),
  shapeRendering: "crispEdges" as const,
})

/* -------- 8x8 grid based pixel sprites -------- */

export function PixelCube({ size = 32, className, ...rest }: PixelProps) {
  return (
    <svg viewBox="0 0 8 8" {...baseProps(size, className)} {...rest}>
      {/* top face */}
      <rect x="2" y="0" width="4" height="1" fill="var(--color-brutal-pink)" />
      <rect x="1" y="1" width="6" height="1" fill="var(--color-brutal-pink)" />
      {/* left face */}
      <rect x="0" y="2" width="3" height="5" fill="var(--color-brutal-pink)" />
      <rect x="1" y="7" width="3" height="1" fill="var(--color-brutal-pink)" />
      {/* right face */}
      <rect x="3" y="2" width="5" height="5" fill="var(--color-brutal-pink)" />
      <rect x="4" y="7" width="4" height="1" fill="var(--color-brutal-pink)" />
      {/* outline */}
      <rect x="2" y="0" width="4" height="1" fill="var(--color-ink)" opacity="0" />
      <path
        d="M2 0h4M1 1h1M6 1h1M0 2h1M7 2h1M0 6h1M7 6h1M0 7h1M7 7h1M1 7h1M6 7h1"
        stroke="var(--color-ink)"
        strokeWidth="0"
      />
      {/* manual outline strokes via 1px rects */}
      {/* top */}
      <rect x="2" y="0" width="4" height="1" fill="var(--color-brutal-pink)" />
      <rect x="1" y="0" width="1" height="2" fill="var(--color-ink)" />
      <rect x="6" y="0" width="1" height="2" fill="var(--color-ink)" />
      <rect x="2" y="0" width="4" height="1" fill="var(--color-brutal-pink)" />
      {/* left edge */}
      <rect x="0" y="1" width="1" height="7" fill="var(--color-ink)" />
      {/* right edge */}
      <rect x="7" y="1" width="1" height="7" fill="var(--color-ink)" />
      {/* bottom edge */}
      <rect x="1" y="7" width="6" height="1" fill="var(--color-ink)" />
      {/* mid divider */}
      <rect x="3" y="2" width="1" height="5" fill="var(--color-ink)" />
      <rect x="1" y="2" width="2" height="5" fill="var(--color-brutal-pink)" />
      <rect x="4" y="2" width="3" height="5" fill="var(--color-brutal-pink)" />
      <rect x="1" y="1" width="6" height="1" fill="var(--color-brutal-pink)" />
    </svg>
  )
}

export function PixelStar({ size = 24, className, ...rest }: PixelProps) {
  return (
    <svg viewBox="0 0 8 8" {...baseProps(size, className)} {...rest}>
      <rect x="3" y="0" width="2" height="1" fill="var(--color-ink)" />
      <rect x="2" y="1" width="4" height="1" fill="var(--color-ink)" />
      <rect x="3" y="1" width="2" height="1" fill="var(--color-brutal-pink)" />
      <rect x="0" y="3" width="8" height="1" fill="var(--color-ink)" />
      <rect x="1" y="2" width="6" height="1" fill="var(--color-ink)" />
      <rect x="2" y="2" width="4" height="1" fill="var(--color-brutal-pink)" />
      <rect x="1" y="3" width="6" height="1" fill="var(--color-brutal-pink)" />
      <rect x="1" y="4" width="6" height="1" fill="var(--color-brutal-pink)" />
      <rect x="0" y="4" width="1" height="1" fill="var(--color-ink)" />
      <rect x="7" y="4" width="1" height="1" fill="var(--color-ink)" />
      <rect x="2" y="5" width="4" height="1" fill="var(--color-brutal-pink)" />
      <rect x="1" y="5" width="1" height="1" fill="var(--color-ink)" />
      <rect x="6" y="5" width="1" height="1" fill="var(--color-ink)" />
      <rect x="2" y="6" width="1" height="1" fill="var(--color-ink)" />
      <rect x="5" y="6" width="1" height="1" fill="var(--color-ink)" />
      <rect x="3" y="6" width="2" height="1" fill="var(--color-brutal-pink)" />
      <rect x="3" y="7" width="1" height="1" fill="var(--color-ink)" />
      <rect x="4" y="7" width="1" height="1" fill="var(--color-ink)" />
    </svg>
  )
}

export function PixelHeart({ size = 24, className, ...rest }: PixelProps) {
  return (
    <svg viewBox="0 0 8 8" {...baseProps(size, className)} {...rest}>
      <rect x="1" y="1" width="2" height="1" fill="var(--color-ink)" />
      <rect x="5" y="1" width="2" height="1" fill="var(--color-ink)" />
      <rect x="0" y="2" width="1" height="3" fill="var(--color-ink)" />
      <rect x="3" y="2" width="2" height="1" fill="var(--color-ink)" />
      <rect x="7" y="2" width="1" height="3" fill="var(--color-ink)" />
      <rect x="1" y="2" width="2" height="3" fill="var(--color-brutal-pink)" />
      <rect x="5" y="2" width="2" height="3" fill="var(--color-brutal-pink)" />
      <rect x="3" y="3" width="2" height="2" fill="var(--color-brutal-pink)" />
      <rect x="1" y="5" width="6" height="1" fill="var(--color-brutal-pink)" />
      <rect x="0" y="5" width="1" height="1" fill="var(--color-ink)" />
      <rect x="7" y="5" width="1" height="1" fill="var(--color-ink)" />
      <rect x="2" y="6" width="4" height="1" fill="var(--color-brutal-pink)" />
      <rect x="1" y="6" width="1" height="1" fill="var(--color-ink)" />
      <rect x="6" y="6" width="1" height="1" fill="var(--color-ink)" />
      <rect x="3" y="7" width="2" height="1" fill="var(--color-brutal-pink)" />
      <rect x="2" y="7" width="1" height="1" fill="var(--color-ink)" />
      <rect x="5" y="7" width="1" height="1" fill="var(--color-ink)" />
    </svg>
  )
}

export function PixelArrow({ size = 24, className, ...rest }: PixelProps) {
  return (
    <svg viewBox="0 0 8 8" {...baseProps(size, className)} {...rest}>
      <rect x="0" y="3" width="6" height="2" fill="var(--color-ink)" />
      <rect x="5" y="2" width="1" height="1" fill="var(--color-ink)" />
      <rect x="6" y="3" width="1" height="2" fill="var(--color-ink)" />
      <rect x="5" y="5" width="1" height="1" fill="var(--color-ink)" />
      <rect x="4" y="1" width="1" height="1" fill="var(--color-ink)" />
      <rect x="4" y="6" width="1" height="1" fill="var(--color-ink)" />
    </svg>
  )
}

export function PixelSparkle({ size = 16, className, ...rest }: PixelProps) {
  return (
    <svg viewBox="0 0 7 7" {...baseProps(size, className)} {...rest}>
      <rect x="3" y="0" width="1" height="2" fill="var(--color-ink)" />
      <rect x="3" y="5" width="1" height="2" fill="var(--color-ink)" />
      <rect x="0" y="3" width="2" height="1" fill="var(--color-ink)" />
      <rect x="5" y="3" width="2" height="1" fill="var(--color-ink)" />
      <rect x="3" y="3" width="1" height="1" fill="var(--color-brutal-pink)" />
      <rect x="2" y="2" width="1" height="1" fill="var(--color-brutal-pink)" />
      <rect x="4" y="2" width="1" height="1" fill="var(--color-brutal-pink)" />
      <rect x="2" y="4" width="1" height="1" fill="var(--color-brutal-pink)" />
      <rect x="4" y="4" width="1" height="1" fill="var(--color-brutal-pink)" />
    </svg>
  )
}

export function PixelBolt({ size = 24, className, ...rest }: PixelProps) {
  return (
    <svg viewBox="0 0 8 8" {...baseProps(size, className)} {...rest}>
      <rect x="4" y="0" width="2" height="1" fill="var(--color-ink)" />
      <rect x="3" y="1" width="2" height="1" fill="var(--color-ink)" />
      <rect x="5" y="1" width="1" height="1" fill="var(--color-brutal-pink)" />
      <rect x="2" y="2" width="2" height="1" fill="var(--color-ink)" />
      <rect x="4" y="2" width="2" height="1" fill="var(--color-brutal-pink)" />
      <rect x="1" y="3" width="2" height="1" fill="var(--color-ink)" />
      <rect x="3" y="3" width="3" height="1" fill="var(--color-brutal-pink)" />
      <rect x="6" y="3" width="1" height="1" fill="var(--color-ink)" />
      <rect x="2" y="4" width="3" height="1" fill="var(--color-ink)" />
      <rect x="5" y="4" width="1" height="1" fill="var(--color-brutal-pink)" />
      <rect x="6" y="4" width="1" height="1" fill="var(--color-ink)" />
      <rect x="2" y="5" width="2" height="1" fill="var(--color-brutal-pink)" />
      <rect x="4" y="5" width="1" height="1" fill="var(--color-ink)" />
      <rect x="2" y="6" width="2" height="1" fill="var(--color-ink)" />
      <rect x="2" y="7" width="1" height="1" fill="var(--color-ink)" />
    </svg>
  )
}

export function PixelRobot({ size = 56, className, ...rest }: PixelProps) {
  return (
    <svg viewBox="0 0 12 12" {...baseProps(size, className)} {...rest}>
      {/* antenna */}
      <rect x="5" y="0" width="2" height="1" fill="var(--color-ink)" />
      <rect x="6" y="0" width="1" height="1" fill="var(--color-brutal-pink)" />
      <rect x="5" y="1" width="2" height="1" fill="var(--color-ink)" />
      {/* head outline */}
      <rect x="2" y="2" width="8" height="1" fill="var(--color-ink)" />
      <rect x="2" y="6" width="8" height="1" fill="var(--color-ink)" />
      <rect x="1" y="3" width="1" height="3" fill="var(--color-ink)" />
      <rect x="10" y="3" width="1" height="3" fill="var(--color-ink)" />
      {/* head fill */}
      <rect x="2" y="3" width="8" height="3" fill="var(--color-brutal-pink)" />
      {/* eyes */}
      <rect x="3" y="4" width="2" height="1" fill="var(--color-ink)" />
      <rect x="7" y="4" width="2" height="1" fill="var(--color-ink)" />
      {/* mouth */}
      <rect x="5" y="5" width="2" height="1" fill="var(--color-ink)" />
      {/* body */}
      <rect x="3" y="7" width="6" height="1" fill="var(--color-ink)" />
      <rect x="3" y="11" width="6" height="1" fill="var(--color-ink)" />
      <rect x="2" y="8" width="1" height="3" fill="var(--color-ink)" />
      <rect x="9" y="8" width="1" height="3" fill="var(--color-ink)" />
      <rect x="3" y="8" width="6" height="3" fill="var(--color-brutal-pink)" />
      {/* chest light */}
      <rect x="5" y="9" width="2" height="1" fill="var(--color-brutal-pink)" />
      {/* arms */}
      <rect x="0" y="8" width="2" height="1" fill="var(--color-ink)" />
      <rect x="0" y="10" width="2" height="1" fill="var(--color-ink)" />
      <rect x="0" y="9" width="1" height="1" fill="var(--color-ink)" />
      <rect x="1" y="9" width="1" height="1" fill="var(--color-brutal-pink)" />
      <rect x="10" y="8" width="2" height="1" fill="var(--color-ink)" />
      <rect x="10" y="10" width="2" height="1" fill="var(--color-ink)" />
      <rect x="11" y="9" width="1" height="1" fill="var(--color-ink)" />
      <rect x="10" y="9" width="1" height="1" fill="var(--color-brutal-pink)" />
    </svg>
  )
}

export function PixelCheck({ size = 32, className, ...rest }: PixelProps) {
  return (
    <svg viewBox="0 0 10 10" {...baseProps(size, className)} {...rest}>
      <rect x="7" y="2" width="2" height="1" fill="var(--color-ink)" />
      <rect x="6" y="3" width="2" height="1" fill="var(--color-ink)" />
      <rect x="5" y="4" width="2" height="1" fill="var(--color-ink)" />
      <rect x="4" y="5" width="2" height="1" fill="var(--color-ink)" />
      <rect x="3" y="6" width="2" height="1" fill="var(--color-ink)" />
      <rect x="2" y="5" width="1" height="1" fill="var(--color-ink)" />
      <rect x="1" y="4" width="2" height="1" fill="var(--color-ink)" />
    </svg>
  )
}

export function PixelCross({ size = 32, className, ...rest }: PixelProps) {
  return (
    <svg viewBox="0 0 10 10" {...baseProps(size, className)} {...rest}>
      <rect x="1" y="1" width="2" height="1" fill="var(--color-ink)" />
      <rect x="2" y="2" width="2" height="1" fill="var(--color-ink)" />
      <rect x="3" y="3" width="2" height="1" fill="var(--color-ink)" />
      <rect x="4" y="4" width="2" height="1" fill="var(--color-ink)" />
      <rect x="3" y="5" width="2" height="1" fill="var(--color-ink)" />
      <rect x="2" y="6" width="2" height="1" fill="var(--color-ink)" />
      <rect x="1" y="7" width="2" height="1" fill="var(--color-ink)" />
      <rect x="7" y="1" width="2" height="1" fill="var(--color-ink)" />
      <rect x="6" y="2" width="2" height="1" fill="var(--color-ink)" />
      <rect x="5" y="3" width="2" height="1" fill="var(--color-ink)" />
      <rect x="5" y="5" width="2" height="1" fill="var(--color-ink)" />
      <rect x="6" y="6" width="2" height="1" fill="var(--color-ink)" />
      <rect x="7" y="7" width="2" height="1" fill="var(--color-ink)" />
    </svg>
  )
}

/**
 * Floating ambient pixel decorations — used as background sprites on desktop.
 * Each item has a different position, animation, and color.
 */
export function FloatingPixels() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden hidden lg:block"
    >
      <div className="absolute top-[8%] right-[5%] gpu" style={{ animation: "var(--animate-bob)" }}>
        <PixelStar size={48} />
      </div>
      <div
        className="absolute top-[22%] left-[3%] gpu"
        style={{ animation: "var(--animate-bob)", animationDelay: "-0.6s" }}
      >
        <PixelSparkle size={32} />
      </div>
      <div
        className="absolute bottom-[18%] right-[8%] gpu"
        style={{ animation: "var(--animate-bob)", animationDelay: "-1.2s" }}
      >
        <PixelHeart size={36} />
      </div>
      <div
        className="absolute bottom-[10%] left-[6%] gpu"
        style={{ animation: "var(--animate-bob)", animationDelay: "-1.8s" }}
      >
        <PixelBolt size={40} />
      </div>
      <div
        className="absolute top-[60%] right-[2%] gpu"
        style={{ animation: "var(--animate-bob)", animationDelay: "-0.3s" }}
      >
        <PixelSparkle size={20} />
      </div>
    </div>
  )
}
