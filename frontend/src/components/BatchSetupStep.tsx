import { useState } from "react"
import { Link2, Sparkles, Minus, Plus, Eye, Zap, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PixelBolt, PixelHeart, PixelSparkle, PixelStar } from "@/components/PixelDecor"

interface BatchSetupStepProps {
  onStart: (formUrl: string, count: number, reviewMode: boolean) => void
  loading: boolean
  error: string | null
}

/**
 * Static lookup tables — Tailwind JIT requires full class strings to be present
 * in the source so classes like `bg-[var(--color-brutal-${x})]` are NOT detected.
 * Always pre-resolve to a static class.
 */
const MODE_BG = {
  lime: "bg-[var(--color-brutal-lime)]",
  violet: "bg-[var(--color-brutal-violet)]",
} as const

const STACK_PROVIDERS = [
  { n: "1", name: "Gemini", model: "2.5-flash-lite", bg: "bg-[var(--color-brutal-yellow)]" },
  { n: "2", name: "Groq", model: "llama-3.3-70b", bg: "bg-[var(--color-brutal-pink)]" },
  { n: "3", name: "Cerebras", model: "qwen-3-235b", bg: "bg-[var(--color-brutal-blue)] text-white" },
  { n: "4", name: "OpenRouter", model: "laguna → free router", bg: "bg-[var(--color-brutal-lime)]" },
] as const

export function BatchSetupStep({ onStart, loading, error }: BatchSetupStepProps) {
  const [url, setUrl] = useState("")
  const [count, setCount] = useState(3)
  const [reviewMode, setReviewMode] = useState(false)

  function adjust(delta: number) {
    setCount((c) => Math.min(50, Math.max(1, c + delta)))
  }

  function handleSubmit() {
    if (!url.trim()) return
    onStart(url.trim(), count, reviewMode)
  }

  const cta = reviewMode
    ? "PARSE & REVIEW"
    : `LAUNCH ${count} ISIAN`

  return (
    <div
      className="grid grid-cols-1 min-w-0 gap-4 md:gap-6 lg:grid-cols-12"
      style={{ animation: "var(--animate-fade-up)" }}
    >
      {/* ======================================================
       * LEFT / MAIN COLUMN — form (col-span-8 on lg)
       * ====================================================== */}
      <div className="min-w-0 space-y-4 md:space-y-5 lg:col-span-8">
        {/* Step 1 — URL */}
        <Card tone="white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2.5">
                <span className="font-display text-xs bg-[var(--color-brutal-yellow)] border-brutal-2 px-2 py-1.5 leading-none">
                  01
                </span>
                <Link2 className="w-5 h-5" />
                URL FORM
              </CardTitle>
            </div>
            <CardDescription>
              Tempel URL Google Form publik. Auto-resolve untuk{" "}
              <span className="font-mono bg-[var(--color-muted)] border-brutal-2 px-1">forms.gle/...</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="form-url">/* form url */</Label>
              <Input
                id="form-url"
                placeholder="https://docs.google.com/forms/d/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          </CardContent>
        </Card>

        {/* Step 2 — Count */}
        <Card tone="white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5">
              <span className="font-display text-xs bg-[var(--color-brutal-blue)] text-white border-brutal-2 px-2 py-1.5 leading-none">
                02
              </span>
              <Sparkles className="w-5 h-5" />
              JUMLAH PERSONA
            </CardTitle>
            <CardDescription>
              Setiap persona = identitas unik dengan nama Indonesia, umur, kota, pekerjaan, hobi.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Counter */}
            <div className="flex items-stretch gap-3 md:gap-4 max-[360px]:gap-2">
              <button
                onClick={() => adjust(-1)}
                disabled={count <= 1 || loading}
                className="press border-brutal bg-white shadow-brutal-sm w-14 md:w-16 flex shrink-0 items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed gpu max-[360px]:w-11"
                aria-label="kurangi"
              >
                <Minus className="w-5 h-5" strokeWidth={3} />
              </button>

              <div className="min-w-0 flex-1 border-brutal bg-[var(--color-brutal-yellow)] shadow-brutal-sm flex flex-col items-center justify-center py-3 md:py-4 gpu max-[360px]:py-2">
                <div className="font-display text-3xl md:text-5xl leading-none tabular-nums max-[360px]:text-2xl" key={count} style={{ animation: "var(--animate-pop)" }}>
                  {String(count).padStart(2, "0")}
                </div>
                <div className="font-mono text-[10px] md:text-xs mt-2 uppercase tracking-widest font-bold text-center max-[360px]:text-[8px] max-[360px]:tracking-normal">
                  persona{count > 1 ? "s" : ""} · max 50
                </div>
              </div>

              <button
                onClick={() => adjust(1)}
                disabled={count >= 50 || loading}
                className="press border-brutal bg-[var(--color-brutal-lime)] shadow-brutal-sm w-14 md:w-16 flex shrink-0 items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed gpu max-[360px]:w-11"
                aria-label="tambah"
              >
                <Plus className="w-5 h-5" strokeWidth={3} />
              </button>
            </div>

            {/* Quick presets */}
            <div className="flex gap-2 flex-wrap max-[360px]:gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-widest font-bold pt-2 mr-1 hidden md:inline">
                preset:
              </span>
              {[1, 3, 5, 10, 20, 50].map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  disabled={loading}
                  className={`press border-brutal-2 px-3 py-1.5 text-xs font-display gpu transition-colors max-[360px]:px-2.5 max-[360px]:text-[10px] ${
                    count === n
                      ? "bg-[var(--color-ink)] text-[var(--color-brutal-yellow)] shadow-brutal-sm"
                      : "bg-white shadow-brutal-sm hover:bg-[var(--color-brutal-yellow)]"
                  }`}
                >
                  {String(n).padStart(2, "0")}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step 3 — Mode */}
        <Card tone="white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5">
              <span className="font-display text-xs bg-[var(--color-brutal-pink)] border-brutal-2 px-2 py-1.5 leading-none">
                03
              </span>
              MODE
            </CardTitle>
            <CardDescription>Pilih cara kirim — auto langsung, atau review dulu.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid min-w-0 grid-cols-1 sm:grid-cols-2 gap-3">
              <ModeButton
                active={!reviewMode}
                onClick={() => setReviewMode(false)}
                disabled={loading}
                icon={<Zap className="w-5 h-5" strokeWidth={3} />}
                label="AUTO SUBMIT"
                desc={`Kirim ${count}x langsung ke form`}
                color="lime"
              />
              <ModeButton
                active={reviewMode}
                onClick={() => setReviewMode(true)}
                disabled={loading}
                icon={<Eye className="w-5 h-5" strokeWidth={3} />}
                label="REVIEW DULU"
                desc="Edit jawaban sebelum kirim"
                color="violet"
              />
            </div>
          </CardContent>
        </Card>

        {/* Error banner */}
        {error && (
          <div
            className="border-brutal bg-[var(--color-brutal-red)] text-white shadow-brutal flex items-start gap-3 p-4"
            style={{ animation: "var(--animate-glitch)" }}
          >
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" strokeWidth={3} />
            <div className="flex-1 font-mono text-sm font-bold leading-tight">
              <div className="font-display text-[10px] mb-1">!! ERROR</div>
              {error}
            </div>
          </div>
        )}

        {/* CTA — desktop inline, mobile in-flow to avoid covering mode cards */}
        <div className="hidden md:block">
          <Button
            onClick={handleSubmit}
            disabled={loading || !url.trim()}
            className="w-full"
            size="xl"
            variant={reviewMode ? "secondary" : "default"}
          >
            <PixelBolt size={28} />
            <span>{cta}</span>
            <PixelSparkle size={20} />
          </Button>
        </div>
      </div>

      {/* ======================================================
       * RIGHT SIDEBAR — desktop only (col-span-4 on lg)
       * ====================================================== */}
      <aside className="hidden lg:flex lg:col-span-4 flex-col gap-5">
        {/* Live preview card */}
        <Card tone="violet">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              SUMMARY
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 font-mono text-xs">
            <SummaryRow k="URL" v={url ? truncate(url, 28) : "—"} accent={!!url} />
            <SummaryRow k="COUNT" v={String(count).padStart(2, "0")} accent />
            <SummaryRow k="MODE" v={reviewMode ? "REVIEW" : "AUTO"} accent />
            <SummaryRow k="ETA" v={`~${Math.max(15, count * 5)}s`} />
          </CardContent>
        </Card>

        {/* Stack info */}
        <Card tone="cream">
          <CardHeader>
            <CardTitle className="text-sm">AI STACK</CardTitle>
            <CardDescription>AI provider retry chain</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs font-mono">
            {STACK_PROVIDERS.map((p) => (
              <div key={p.name} className="flex items-center gap-2">
                <span className={`border-brutal-2 px-1.5 py-0.5 font-display text-[9px] ${p.bg}`}>
                  {p.n}
                </span>
                <span className="font-bold">{p.name}</span>
                <span className="text-[var(--color-mute)] truncate">{p.model}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Floating tip */}
        <div
          className="border-brutal bg-[var(--color-brutal-yellow)] shadow-brutal-lg p-4 gpu"
          style={{ animation: "var(--animate-bob)" }}
        >
          <div className="font-display text-[10px] mb-2 flex items-center gap-2">
            <PixelHeart size={16} /> TIP
          </div>
          <div className="font-mono text-xs leading-relaxed">
            Form harus <span className="bg-[var(--color-ink)] text-[var(--color-brutal-yellow)] px-1">PUBLIC</span> & accept multiple responses agar bisa di-batch.
          </div>
        </div>
      </aside>

      {/* ======================================================
       * MOBILE CTA — visible <md only
       * ====================================================== */}
      <div className="md:hidden -mx-3 sm:-mx-4 mt-3 border-y-[3px] border-[var(--color-ink)] bg-[var(--color-bg)] p-3 pb-[calc(env(safe-area-inset-bottom)+12px)] max-[340px]:-mx-4">
        <Button
          onClick={handleSubmit}
          disabled={loading || !url.trim()}
          className="w-full"
          size="lg"
          variant={reviewMode ? "secondary" : "default"}
        >
          <PixelBolt size={24} />
          {cta}
        </Button>
      </div>
    </div>
  )
}

/* -------- Subcomponents -------- */

function ModeButton({
  active,
  onClick,
  disabled,
  icon,
  label,
  desc,
  color,
}: {
  active: boolean
  onClick: () => void
  disabled?: boolean
  icon: React.ReactNode
  label: string
  desc: string
  color: "lime" | "violet"
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`press min-w-0 border-brutal p-4 text-left gpu transition-shadow flex flex-col gap-2 max-[360px]:p-3 ${
        active ? `${MODE_BG[color]} shadow-brutal` : "bg-white shadow-brutal-sm"
      } disabled:opacity-50`}
    >
      <div className="flex items-center gap-2 justify-between">
        <div
          className={`border-brutal-2 w-9 h-9 flex items-center justify-center ${
            active ? "bg-white" : "bg-[var(--color-bg)]"
          }`}
        >
          {icon}
        </div>
        {active && (
          <span className="border-brutal-2 bg-[var(--color-ink)] text-[var(--color-brutal-yellow)] font-display text-[8px] px-2 py-1">
            ACTIVE
          </span>
        )}
      </div>
      <div className="font-display text-xs leading-tight wrap-break-word max-[360px]:text-[10px]">{label}</div>
      <div className="font-mono text-[10px] text-[var(--color-ink-soft)] wrap-break-word max-[360px]:text-[9px]">{desc}</div>
    </button>
  )
}

function SummaryRow({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex justify-between items-center gap-2 border-b-2 border-dashed border-[var(--color-ink)] pb-2 last:border-0 last:pb-0">
      <span className="font-bold uppercase text-[10px] tracking-widest">{k}</span>
      <span className={`truncate font-bold ${accent ? "text-[var(--color-ink)]" : "text-[var(--color-ink-soft)]"}`}>
        {v}
      </span>
    </div>
  )
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "…" : s
}
