import { useState } from "react"
import { Link2, Sparkles, Minus, Plus, Eye, Zap, AlertTriangle, ScanLine, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PixelBolt, PixelSparkle, PixelStar } from "@/components/PixelDecor"
import type { FormSchema } from "@/lib/api"

type ScannedForm = {
  url: string
  schema: FormSchema
  sessionId: string
}

interface BatchSetupStepProps {
  url: string
  onUrlChange: (url: string) => void
  onScan: (formUrl: string) => void
  onClearScan: () => void
  onStart: (formUrl: string, count: number, reviewMode: boolean) => void
  onOpenConfig: () => void
  loading: boolean
  scanLoading: boolean
  error: string | null
  scannedForm: ScannedForm | null
}

/**
 * Static lookup tables — Tailwind JIT requires full class strings to be present
 * in the source, so always pre-resolve dynamic visual states to static classes.
 */
const STACK_PROVIDERS = [
  { n: "1", name: "Gemini", model: "2.5-flash-lite", bg: "bg-(--color-bg-alt) text-(--color-ink)" },
  { n: "2", name: "Groq", model: "llama-3.3-70b", bg: "bg-(--color-candy-blush) text-(--color-ink)" },
  { n: "3", name: "Cerebras", model: "qwen-3-235b", bg: "bg-(--color-brutal-yellow) text-(--color-ink)" },
  { n: "4", name: "OpenRouter", model: "laguna → free router", bg: "bg-(--color-candy-peach) text-(--color-ink)" },
] as const

export function BatchSetupStep({ url, onUrlChange, onScan, onClearScan, onStart, onOpenConfig, loading, scanLoading, error, scannedForm }: BatchSetupStepProps) {
  const [count, setCount] = useState(3)
  const [reviewMode, setReviewMode] = useState(false)

  function adjust(delta: number) {
    setCount((c) => Math.min(50, Math.max(1, c + delta)))
  }

  const trimmedUrl = url.trim()
  const scanCurrent = !!scannedForm && scannedForm.url === trimmedUrl
  const canGenerate = !!trimmedUrl && scanCurrent && !loading && !scanLoading

  function handleScan() {
    if (!trimmedUrl) return
    onScan(trimmedUrl)
  }

  function handleSubmit() {
    if (!canGenerate) return
    onStart(trimmedUrl, count, reviewMode)
  }

  const cta = reviewMode
    ? "GENERATE REVIEW"
    : `GENERATE ${count} ISIAN`

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
                <span className="font-display text-xs bg-(--color-bg-alt) text-(--color-ink) border-brutal-2 px-2 py-1.5 leading-none">
                  01
                </span>
                <Link2 className="w-5 h-5" />
                URL FORM
              </CardTitle>
            </div>
            <CardDescription>
              Tempel URL Google Form publik. Auto-resolve untuk{" "}
              <span className="font-mono bg-(--color-primary) text-(--color-ink) border-brutal-2 px-1">forms.gle/...</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="form-url">/* form url */</Label>
                <Input
                  id="form-url"
                  placeholder="https://docs.google.com/forms/d/..."
                  value={url}
                  onChange={(e) => onUrlChange(e.target.value)}
                  disabled={loading || scanLoading}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <div className="space-y-2">
                <Button
                  onClick={handleScan}
                  disabled={!trimmedUrl || loading || scanLoading}
                  variant="accent"
                  size="lg"
                  className="w-full !shadow-[2px_2px_0_0_currentColor] disabled:!shadow-[2px_2px_0_0_currentColor]"                >
                  <ScanLine className="w-5 h-5" strokeWidth={3} />
                  SCAN FORM
                </Button>
                {scannedForm && (
                  <Button
                    onClick={onClearScan}
                    disabled={loading || scanLoading}
                    variant="outline"
                    size="lg"
                    className="w-full !shadow-[2px_2px_0_0_currentColor] disabled:!shadow-[2px_2px_0_0_currentColor]"                  >
                    <X className="w-5 h-5" strokeWidth={3} />
                    HAPUS SCAN
                  </Button>
                )}
              </div>
              {scannedForm && (
                <div className={`border-brutal-2 p-3 font-mono text-xs shadow-brutal-sm ${scanCurrent ? "bg-(--color-candy-mint) text-(--color-ink)" : "bg-(--color-brutal-yellow) text-(--color-ink)"}`}>
                  <div className="font-display text-[10px] mb-2 uppercase">
                    {scanCurrent ? "SCAN READY" : "URL BERUBAH"}
                  </div>
                  {scanCurrent ? (
                    <div className="space-y-2">
                      <div className="font-bold wrap-break-word">{scannedForm.schema.title}</div>
                      <div>{scannedForm.schema.fields.length} fields · {scannedForm.schema.page_count ?? 1} page</div>
                      <Button
                        onClick={onOpenConfig}
                        disabled={loading || scanLoading}
                        variant="outline"
                        size="sm"
                        className="w-full !shadow-[2px_2px_0_0_currentColor] disabled:!shadow-[2px_2px_0_0_currentColor]"
                      >
                        LIHAT DETAIL / KONFIGURASI
                      </Button>
                    </div>
                  ) : (
                    <div className="font-bold leading-relaxed">
                      Link sudah berubah. Scan ulang sebelum generate, atau hapus scan ini.
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Step 2 — Count */}
        <Card tone="white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 max-[360px]:gap-1.5 wrap-break-word">
              <span className="font-display text-[10px] min-[360px]:text-xs bg-(--color-candy-blush) text-(--color-ink) border-brutal-2 px-2 py-1.5 leading-none shrink-0">
                02
              </span>
              <Sparkles className="w-4 h-4 min-[360px]:w-5 min-[360px]:h-5 shrink-0" />
              <span className="min-w-0 leading-snug">JUMLAH PERSONA</span>
            </CardTitle>
            <CardDescription>
              Setiap persona = identitas unik dengan nama Indonesia, umur, kota, pekerjaan, hobi.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 min-[380px]:space-y-5">
            {/* Counter */}
            <div className="grid grid-cols-2 min-[420px]:grid-cols-[56px_minmax(0,1fr)_56px] md:grid-cols-[64px_minmax(0,1fr)_64px] items-stretch gap-2 min-[420px]:gap-3 md:gap-4">
              <button
                onClick={() => adjust(-1)}
                disabled={count <= 1 || loading}
                className="press border-brutal bg-(--color-bg-alt) text-(--color-ink) shadow-brutal-sm enabled:hover:bg-(--color-brutal-pink) enabled:active:bg-(--color-brutal-pink) disabled:pointer-events-none disabled:border-dashed disabled:shadow-none disabled:cursor-not-allowed disabled:bg-(--color-bg-alt) disabled:text-(--color-ink-soft) min-w-0 h-12 min-[420px]:h-auto flex items-center justify-center gpu order-2 min-[420px]:order-0"
                aria-label="kurangi"
              >
                <Minus className="w-5 h-5" strokeWidth={3} />
              </button>

              <div className="min-w-0 col-span-2 min-[420px]:col-span-1 border-brutal bg-(--color-bg-alt) text-(--color-ink) shadow-brutal-sm flex flex-col items-center justify-center py-3 md:py-4 gpu order-1 min-[420px]:order-0">
                <div className="font-display text-3xl md:text-5xl leading-none tabular-nums" key={count} style={{ animation: "var(--animate-pop)" }}>
                  {String(count).padStart(2, "0")}
                </div>
                <div className="font-mono text-[8px] min-[380px]:text-[10px] md:text-xs mt-2 uppercase tracking-normal min-[380px]:tracking-widest font-bold text-center leading-tight">
                  persona{count > 1 ? "s" : ""} · max 50
                </div>
              </div>

              <button
                onClick={() => adjust(1)}
                disabled={count >= 50 || loading}
                className="press border-brutal bg-(--color-bg-alt) text-(--color-ink) shadow-brutal-sm hover:bg-(--color-brutal-pink) active:bg-(--color-brutal-pink) min-w-0 h-12 min-[420px]:h-auto flex items-center justify-center disabled:border-dashed disabled:shadow-none disabled:cursor-not-allowed gpu order-3 min-[420px]:order-0"
                aria-label="tambah"
              >
                <Plus className="w-5 h-5" strokeWidth={3} />
              </button>
            </div>

            {/* Quick presets */}
            <div className="grid grid-cols-3 min-[420px]:flex gap-2 max-[360px]:gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-widest font-bold pt-2 mr-1 hidden md:inline">
                preset:
              </span>
              {[1, 3, 5, 10, 20, 50].map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  disabled={loading}
                  className={`press border-brutal-2 px-2 min-[420px]:px-3 py-1.5 text-[10px] min-[420px]:text-xs font-display gpu transition-colors text-center ${
                    count === n
                      ? "bg-(--color-primary) text-(--color-ink) shadow-brutal-sm"
                      : "bg-(--color-bg-alt) text-(--color-ink) shadow-brutal-sm hover:bg-(--color-candy-blush) hover:text-(--color-ink)"
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
              <span className="font-display text-xs bg-(--color-brutal-yellow) text-(--color-ink) border-brutal-2 px-2 py-1.5 leading-none">
                03
              </span>
              <Eye className="w-5 h-5" />
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
              />
              <ModeButton
                active={reviewMode}
                onClick={() => setReviewMode(true)}
                disabled={loading}
                icon={<Eye className="w-5 h-5" strokeWidth={3} />}
                label="REVIEW DULU"
                desc="Edit jawaban sebelum kirim"
              />
            </div>
          </CardContent>
        </Card>

        {/* Error banner */}
        {error && (
          <div
            className="border-brutal bg-(--color-destructive) text-(--color-destructive-foreground) shadow-brutal flex items-start gap-3 p-4"
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
            disabled={!canGenerate}
            className="w-full disabled:!shadow-[7px_7px_0_0_currentColor] hover:!translate-x-0 hover:!translate-y-0 hover:!shadow-[7px_7px_0_0_currentColor]"
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
        <Card tone="white" className="overflow-hidden bg-(--color-candy-blush)">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              SUMMARY
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 font-mono text-xs text-(--color-ink)">
            <SummaryRow k="URL" v={url ? truncate(url, 28) : "—"} accent={!!url} />
            <SummaryRow k="SCAN" v={scanCurrent ? "READY" : scannedForm ? "STALE" : "NEEDED"} accent={scanCurrent} />
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
                <span className="font-bold">{p.name} <span className="text-(--color-ink-soft)">({p.model})</span></span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Floating tip */}
        <div
          className="border-brutal bg-(--color-candy-peach) text-(--color-ink) shadow-brutal-lg p-4 gpu"
          style={{ animation: "var(--animate-bob)" }}
        >
          <div className="font-display text-[10px] mb-2 flex items-center gap-2">
            <PixelStar size={16} /> TIP
          </div>
          <div className="font-mono text-xs leading-relaxed">
            Form harus <span className="font-bold text-(--color-ink)">PUBLIC</span> & accept multiple responses agar bisa di-batch.
          </div>
        </div>
      </aside>

      {/* ======================================================
       * MOBILE CTA — visible <md only
       * ====================================================== */}
      <div className="md:hidden mt-3 border-y-[3px] border-(--color-ink) bg-(--color-bg) py-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <Button
          onClick={handleSubmit}
          disabled={loading || !url.trim()}
          className="w-[calc(100%+14px)] disabled:shadow-brutal"
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
}: {
  active: boolean
  onClick: () => void
  disabled?: boolean
  icon: React.ReactNode
  label: string
  desc: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`press min-w-0 border-brutal p-4 text-left gpu transition-shadow flex flex-col gap-2 max-[360px]:p-3 ${
        active ? "bg-(--color-brutal-pink) text-(--color-ink) shadow-brutal" : "bg-(--color-bg-alt) shadow-brutal-sm hover:bg-(--color-candy-blush)"
      } disabled:border-dashed disabled:shadow-none`}
    >
      <div className="flex items-center gap-2 justify-between">
        <div
          className={`border-brutal-2 w-9 h-9 flex items-center justify-center ${
            active ? "bg-(--color-bg-alt)" : "bg-(--color-surface)"
          }`}
        >
          {icon}
        </div>
        {active && (
          <span className="border-brutal-2 bg-(--color-ink) text-(--color-bg-alt) font-display text-[8px] px-2 py-1 shadow-brutal-sm">
            ACTIVE
          </span>
        )}
      </div>
      <div className="font-display text-xs leading-tight wrap-break-word max-[360px]:text-[10px]">{label}</div>
      <div className="font-mono text-[10px] text-current wrap-break-word max-[360px]:text-[9px]">{desc}</div>
    </button>
  )
}

function SummaryRow({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex justify-between items-center gap-2 border-b-2 border-dashed border-(--color-ink) pb-2 last:border-0 last:pb-0">
      <span className="font-bold uppercase text-[10px] tracking-widest">{k}</span>
      <span className={`truncate font-bold ${accent ? "text-(--color-ink)" : "text-current"}`}>
        {v}
      </span>
    </div>
  )
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "…" : s
}














