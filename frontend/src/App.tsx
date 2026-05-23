import { useState } from "react"
import { BatchSetupStep } from "@/components/BatchSetupStep"
import { LoadingStep } from "@/components/LoadingStep"
import { BatchResultStep } from "@/components/BatchResultStep"
import { ReviewSubmitStep } from "@/components/ReviewSubmitStep"
import { FloatingPixels, PixelRobot, PixelSparkle, PixelStar } from "@/components/PixelDecor"
import { api, batchRunStream, type BatchRunResponse, type FormSchema, type GenerateResponse, type SSEEvent } from "@/lib/api"

type AppState = "setup" | "loading" | "review" | "result"

function App() {
  const [appState, setAppState] = useState<AppState>("setup")
  const [pendingUrl, setPendingUrl] = useState("")
  const [pendingCount, setPendingCount] = useState(1)
  const [batchResult, setBatchResult] = useState<BatchRunResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingReviewMode, setPendingReviewMode] = useState(false)

  // Streaming state
  const [streamLogs, setStreamLogs] = useState<string[]>([])
  const [currentProvider, setCurrentProvider] = useState<string>("")

  // review mode state (now supports multiple personas)
  const [reviewSchema, setReviewSchema] = useState<FormSchema | null>(null)
  const [reviewSessionId, setReviewSessionId] = useState<number>(0)
  const [reviewResults, setReviewResults] = useState<GenerateResponse[]>([])

  async function handleStart(formUrl: string, count: number, reviewMode: boolean) {
    setPendingUrl(formUrl)
    setPendingCount(count)
    setPendingReviewMode(reviewMode)
    setError(null)
    setStreamLogs([])
    setCurrentProvider("")
    setAppState("loading")

    batchRunStream(formUrl, count, reviewMode, async (event: SSEEvent) => {
      if (event.type === "log") {
        setStreamLogs((logs) => [...logs.slice(-80), event.data.message])
      }

      if (event.type === "provider") {
        setCurrentProvider(event.data.provider)
        const label = event.data.iteration
          ? `Persona ${event.data.iteration}: using ${event.data.provider}`
          : `Using ${event.data.provider}`
        setStreamLogs((logs) => [...logs.slice(-80), label])
      }

      if (event.type === "error") {
        setError(event.data.message)
        setAppState("setup")
      }

      if (event.type === "complete") {
        const result = event.data
        if (reviewMode) {
          const validResults = result.results
            .filter((r) => r.answers && Object.keys(r.answers).length > 0)
            .map((r) => ({
              answers: r.answers,
              tokens_used: r.tokens_used,
              retries: r.retries ?? 0,
            }))
          if (validResults.length === 0) {
            setError(result.results[0]?.error_message ?? "Gagal generate persona")
            setAppState("setup")
            return
          }
          const parseResult = await api.parse(formUrl)
          setReviewSchema(parseResult.schema_)
          setReviewSessionId(parseResult.session_id)
          setReviewResults(validResults)
          setAppState("review")
        } else {
          setBatchResult(result)
          setAppState("result")
        }
      }
    })
  }

  function handleReset() {
    setAppState("setup")
    setBatchResult(null)
    setReviewSchema(null)
    setReviewResults([])
    setError(null)
    setStreamLogs([])
    setCurrentProvider("")
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <FloatingPixels />

      {/* ============================================================
       * HEADER
       * Wide marquee strip + chunky brand row with mascot.
       * ============================================================ */}
      <header className="sticky top-0 z-30 bg-(--color-bg)">
        {/* marquee strip */}
        <div className="marquee-shell bg-(--color-ink) text-(--color-brutal-yellow) font-mono text-xs py-1.5 border-b-[3px] border-(--color-ink)">
          <div className="marquee-track" aria-hidden="true">
            {Array.from({ length: 3 }).map((_, repeat) => (
              <div key={repeat} className="marquee-group">
                {[
                  "★ AUTO FILL GOOGLE FORMS",
                  "▲ POWERED BY AI",
                  "● 100% INDONESIAN PERSONAS",
                  "■ NEOBRUTALIST × PIXEL EDITION",
                  "◆ MULTI-PROVIDER FALLBACK",
                  "✱ BUILT FOR SPEED",
                ].map((t) => (
                  <span key={`${repeat}-${t}`} className="font-bold uppercase tracking-widest leading-none flex items-center">
                    {t}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* brand row */}
        <div className="premium-band h-2 border-b-[3px] border-(--color-ink)" />

        <div className="border-b-[3px] border-(--color-ink) pixel-glass">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-10 h-14 sm:h-16 md:h-20 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
              <div
                className="rounded-md md:rounded-lg border-brutal-2 md:border-brutal-4 bg-white p-1 sm:p-1.5 md:p-2 shadow-brutal-sm md:shadow-brutal gpu -translate-x-px -translate-y-px md:-translate-x-0.5 md:-translate-y-0.5 shrink-0"
              >
                <PixelRobot className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12" />
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-[13px] sm:text-lg md:text-2xl leading-none truncate">
                  VAREVA<span className="text-(--color-brutal-pink)">_</span>GF
                </h1>
                <p className="font-mono text-[8px] sm:text-[10px] md:text-xs mt-1 md:mt-2 font-bold uppercase tracking-wider truncate">
                  <span className="hidden sm:inline">{"// Auto-fill Google Forms with"}</span>
                  <span className="sm:hidden">{"// Auto-fill w/"}</span>{" "}
                  <span className="rounded-[3px] bg-(--color-ink) text-(--color-brutal-yellow) px-1">
                    AI personas
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0">
              <div className="hidden sm:block rounded-md border-brutal-2 bg-white px-2 py-1 md:px-3 md:py-2 font-mono text-[10px] md:text-xs shadow-brutal-sm">
                <span className="font-bold uppercase">Status:</span>{" "}
                <span className="text-(--color-brutal-pink) font-bold">READY</span>
              </div>
              <div className="rounded-sm sm:rounded-md border-brutal-2 bg-brutal-lime px-1.5 py-0.5 sm:px-2 sm:py-1 md:px-3 md:py-2 font-mono text-[9px] sm:text-[10px] md:text-xs shadow-brutal-sm flex items-center gap-1.5 md:gap-2">
                <span
                  className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 bg-(--color-ink)"
                  style={{ animation: "var(--animate-pixel-blink)" }}
                />
                <span className="font-bold">LIVE</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================
       * MAIN CONTENT
       * Mobile: full-width vertical stack with bottom safe-area.
       * Desktop: padded canvas with floating decorations.
       * ============================================================ */}
      <main
        className="relative px-3 sm:px-4 md:px-6 lg:px-10 pt-4 md:pt-8 pb-32 md:pb-16 max-w-7xl mx-auto max-[340px]:px-4"
        style={{ animation: "var(--animate-fade-in)" }}
      >
        {appState === "setup" && (
          <BatchSetupStep onStart={handleStart} loading={false} error={error} />
        )}

        {appState === "loading" && (
          <LoadingStep
            count={pendingCount}
            formUrl={pendingUrl}
            reviewMode={pendingReviewMode}
            streamLogs={streamLogs}
            currentProvider={currentProvider}
          />
        )}

        {appState === "review" && reviewSchema && reviewResults.length > 0 && (
          <ReviewSubmitStep
            schema={reviewSchema}
            sessionId={reviewSessionId}
            formUrl={pendingUrl}
            generateResults={reviewResults}
            systemLogs={streamLogs}
            onBack={handleReset}
            onReset={handleReset}
          />
        )}

        {appState === "result" && batchResult && (
          <BatchResultStep result={batchResult} onReset={handleReset} />
        )}
      </main>

      {/* Footer (desktop only) */}
      <footer className="hidden md:block border-t-[3px] border-(--color-ink) bg-(--color-ink) text-(--color-bg)">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6 flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-3">
            <PixelSparkle size={20} />
            <span className="uppercase tracking-widest font-bold">Vareva AutoGF · Brutalist Edition</span>
          </div>
          <div className="flex gap-4 uppercase tracking-widest">
            <span>Gemini · Groq · Cerebras · OpenRouter</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
