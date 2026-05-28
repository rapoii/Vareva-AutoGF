import { PixelRobot } from "@/components/PixelDecor"

interface LoadingOverlayProps {
  title?: string
  message?: string
}

export function LoadingOverlay({ title = "MEMUAT", message = "Sebentar, sistem sedang memproses." }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-(--color-ink)/45 px-4 backdrop-blur-[2px]" style={{ animation: "var(--animate-fade-in)" }}>
      <div className="w-full max-w-sm border-brutal bg-(--color-bg-alt) text-(--color-ink) shadow-brutal-lg p-5 text-center" style={{ animation: "var(--animate-pop)" }}>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border-brutal-2 bg-(--color-candy-blush) shadow-brutal-sm gpu" style={{ animation: "var(--animate-bob)" }}>
          <PixelRobot size={38} />
        </div>
        <div className="font-display text-base leading-tight">{title}</div>
        <p className="mx-auto mt-2 max-w-64 font-mono text-[11px] leading-relaxed text-(--color-ink-soft)">
          {message}
        </p>
        <div className="mt-5 grid grid-cols-3 gap-2" aria-hidden="true">
          <span className="h-3 border-2 border-(--color-ink) bg-(--color-brutal-pink) motion-safe-blink" />
          <span className="h-3 border-2 border-(--color-ink) bg-(--color-brutal-yellow) motion-safe-blink [animation-delay:120ms]" />
          <span className="h-3 border-2 border-(--color-ink) bg-(--color-bg) motion-safe-blink [animation-delay:240ms]" />
        </div>
      </div>
    </div>
  )
}
