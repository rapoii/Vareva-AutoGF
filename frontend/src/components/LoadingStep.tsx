import { useEffect, useState } from "react"
import { Link2, Sparkles, Send, Zap, Eye, Terminal } from "lucide-react"
import { PixelRobot, PixelStar, PixelSparkle, PixelBolt } from "@/components/PixelDecor"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface LoadingStepProps {
  count: number
  formUrl: string
  reviewMode?: boolean
  streamLogs?: string[]
  currentProvider?: string
}

const AUTO_PHASES = [
  { id: "parse", icon: Link2, label: "PARSE STRUCTURE", desc: "Extracting form fields from Google..." },
  { id: "generate", icon: Sparkles, label: "GENERATE PERSONA", desc: "Creating Indonesian personas with AI..." },
  { id: "submit", icon: Send, label: "SUBMIT FORMS", desc: "Filling and submitting to Google Forms..." },
]

const REVIEW_PHASES = [
  { id: "parse", icon: Link2, label: "PARSE STRUCTURE", desc: "Extracting form fields from Google..." },
  { id: "generate", icon: Sparkles, label: "GENERATE & ANSWER", desc: "AI answering each question..." },
]

export function LoadingStep({ count, formUrl, reviewMode = false, streamLogs = [], currentProvider = "" }: LoadingStepProps) {
  const shortUrl = formUrl.length > 40 ? formUrl.slice(0, 40) + "…" : formUrl
  const PHASES = reviewMode ? REVIEW_PHASES : AUTO_PHASES
  const logs = streamLogs.length > 0
    ? streamLogs
    : [
        "Initializing AI pipeline...",
        "Loading provider chain: Gemini → Groq → Cerebras → OpenRouter",
        `Estimated time: ~${Math.max(15, count * 5)}s`,
        `Processing request_${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}...`,
      ]

  // Animated progress through phases
  const [activeIndex, setActiveIndex] = useState(0)
  const [requestId] = useState(() => String(Math.floor(Math.random() * 9999)).padStart(4, "0"))

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((i) => (i < PHASES.length - 1 ? i + 1 : i))
    }, 2500)
    return () => clearInterval(interval)
  }, [PHASES.length])

  return (
    <div
      className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-12"
      style={{ animation: "var(--animate-fade-in)" }}
    >
      {/* =========================================================
       * MAIN LOADER COLUMN
       * ========================================================= */}
      <div className="lg:col-span-8 space-y-4">
        {/* Big Status Card */}
        <Card tone="yellow">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Pixel Art Robot Spinner */}
              <div
                className="relative border-brutal bg-white p-4 shadow-brutal gpu"
                style={{ animation: "var(--animate-bob)" }}
              >
                <PixelRobot size={64} />
                {/* Blinking indicator */}
                <div className="absolute -top-2 -right-2 w-4 h-4 border-brutal-2 bg-(--color-brutal-pink)" />
                <div
                  className="absolute -top-2 -right-2 w-4 h-4 border-brutal-2 bg-brutal-lime"
                  style={{ animation: "var(--animate-pixel-blink)" }}
                />
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className="font-display text-xs mb-2 flex items-center justify-center md:justify-start gap-2">
                  <PixelBolt size={16} />
                  <span className="bg-(--color-ink) text-(--color-brutal-yellow) px-2 py-0.5">
                    PROCESSING
                  </span>
                </div>
                <h2 className="font-display text-lg md:text-xl leading-tight">
                  {reviewMode ? "GENERATING ANSWERS..." : `PROCESSING ${count} SUBMISSIONS...`}
                </h2>
                <p className="font-mono text-xs mt-2 text-ink-soft truncate">
                  {shortUrl}
                </p>
              </div>

              {/* Count badge */}
              <div className="border-brutal bg-(--color-brutal-pink) shadow-brutal px-4 py-3 text-center min-w-20">
                <div className="font-display text-2xl">{String(count).padStart(2, "0")}</div>
                <div className="font-mono text-[8px] uppercase tracking-widest">jobs</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Phase Steps — chunky blocks */}
        <div className="space-y-3">
          {PHASES.map((phase, idx) => {
            const Icon = phase.icon
            const isActive = idx === activeIndex
            const isDone = idx < activeIndex

            return (
              <div
                key={phase.id}
                className={`press border-brutal p-4 flex items-center gap-4 gpu transition-all ${
                  isActive
                    ? "bg-brutal-lime shadow-brutal"
                    : isDone
                      ? "bg-white shadow-brutal-sm opacity-70"
                      : "bg-muted shadow-brutal-sm opacity-50"
                }`}
                style={{ animation: isActive ? "var(--animate-pop)" : undefined }}
              >
                {/* Status indicator */}
                <div
                  className={`w-10 h-10 border-brutal-2 flex items-center justify-center shrink-0 ${
                    isActive ? "bg-(--color-ink) text-white" : "bg-white"
                  }`}
                >
                  {isDone ? (
                    <PixelStar size={20} />
                  ) : isActive ? (
                    <Icon className="w-5 h-5" strokeWidth={3} />
                  ) : (
                    <span className="font-display text-xs">{String(idx + 1).padStart(2, "0")}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm uppercase tracking-wide">{phase.label}</div>
                  <div className="font-mono text-xs text-ink-soft truncate">
                    {phase.desc}
                  </div>
                </div>

                {isActive && (
                  <div
                    className="w-3 h-3 bg-(--color-brutal-pink) border-brutal-2 shrink-0"
                    style={{ animation: "var(--animate-pixel-blink)" }}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Terminal-style status — live from SSE */}
        <Card tone="cream" flat>
          <CardContent className="p-4 font-mono text-xs space-y-1">
            <div className="flex items-center gap-2 border-b-2 border-dashed border-(--color-ink) pb-2 mb-2">
              <Terminal className="w-4 h-4" />
              <span className="font-bold uppercase tracking-widest">System Log</span>
              {currentProvider && (
                <span className="ml-auto bg-brutal-lime border-brutal-2 px-2 py-0.5 text-[10px] font-bold uppercase">
                  {currentProvider}
                </span>
              )}
            </div>
            <div className="max-h-48 overflow-y-auto pr-2 space-y-1 overscroll-contain">
              {logs.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${i === logs.length - 1 ? "animate-pulse" : ""}`}>
                  <span className="text-(--color-brutal-pink)">{">"}</span>
                  <span>{msg}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* =========================================================
       * SIDEBAR — stats & mode info (desktop only)
       * ========================================================= */}
      <aside className="hidden lg:flex lg:col-span-4 flex-col gap-4">
        <Card tone="violet">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PixelSparkle size={20} />
              STATUS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 font-mono text-xs">
            <StatRow k="Mode" v={reviewMode ? "REVIEW" : "AUTO"} />
            <StatRow k="Jobs" v={String(count)} />
            <StatRow k="Provider" v={currentProvider || "Waiting..."} />
            <StatRow k="Progress" v={`${Math.round(((activeIndex + 1) / PHASES.length) * 100)}%`} />
          </CardContent>
        </Card>

        <div className="border-brutal bg-(--color-brutal-yellow) shadow-brutal-lg p-4 gpu" style={{ animation: "var(--animate-bob)" }}>
          <div className="font-display text-[10px] mb-2 flex items-center gap-2">
            <PixelStar size={16} /> TIP
          </div>
          <div className="font-mono text-xs leading-relaxed">
            {reviewMode
              ? "Review mode lets you edit AI-generated answers before submitting."
              : "Auto mode submits directly. Check the sidebar for live stats."}
          </div>
        </div>

        {/* Mode icon big */}
        <div className="border-brutal bg-white shadow-brutal-lg p-6 flex items-center justify-center">
          {reviewMode ? (
            <Eye className="w-12 h-12 text-brutal-violet" strokeWidth={2} />
          ) : (
            <Zap className="w-12 h-12 text-brutal-lime" strokeWidth={2} />
          )}
        </div>
      </aside>

      {/* Mobile warning */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t-[3px] border-(--color-ink) bg-(--color-bg) p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <div className="font-mono text-xs text-center">
          <span className="inline-block w-2 h-2 bg-(--color-brutal-pink) mr-2" style={{ animation: "var(--animate-pixel-blink)" }} />
          Processing... Don't close this page.
        </div>
      </div>
    </div>
  )
}

function StatRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between items-center gap-2 border-b-2 border-dashed border-(--color-ink) pb-2 last:border-0 last:pb-0">
      <span className="font-bold uppercase text-[10px] tracking-widest">{k}</span>
      <span className="font-bold">{v}</span>
    </div>
  )
}
