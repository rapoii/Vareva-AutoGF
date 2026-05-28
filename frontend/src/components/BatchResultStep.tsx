import { useState } from "react"
import { ChevronDown, ChevronUp, Download, FileJson, FileSpreadsheet, RotateCcw, Trophy, Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PixelRobot, PixelStar, PixelCheck, PixelCross } from "@/components/PixelDecor"
import type { BatchRunResponse, IterationResult } from "@/lib/api"
import { exportBatchCsv, exportBatchExcel, exportBatchJson } from "@/lib/export"

interface BatchResultStepProps {
  result: BatchRunResponse
  onReset: () => void
}

const ITERATION_BADGE_COLORS = [
  "bg-(--color-bg-alt) text-(--color-ink)",
  "bg-(--color-candy-blush) text-(--color-ink)",
  "bg-(--color-brutal-yellow) text-(--color-ink)",
  "bg-(--color-candy-peach) text-(--color-ink)",
]

function IterationCard({ item }: { item: IterationResult }) {
  const [expanded, setExpanded] = useState(false)
  const success = item.submit_status === "success"
  const badgeColor = ITERATION_BADGE_COLORS[(item.iteration - 1) % ITERATION_BADGE_COLORS.length]

  return (
    <div
      className={`press border-brutal gpu transition-all ${
        success ? "bg-(--color-bg-alt) text-(--color-ink) shadow-brutal-lg" : "bg-(--color-destructive) text-(--color-destructive-foreground) bg-stripe-warn shadow-brutal-lg"
      }`}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        {/* Number badge */}
        <div className={`shrink-0 w-9 h-9 border-brutal-2 flex items-center justify-center font-display text-xs ${
          success ? badgeColor : "bg-(--color-destructive) text-(--color-ink)"
        }`}>
          {String(item.iteration).padStart(2, "0")}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate leading-tight">
            {item.persona_text.split("\n")[0].replace(/^Nama:\s*/i, "") || "Persona"}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {success ? (
              <PixelCheck size={16} />
            ) : (
              <PixelCross size={16} />
            )}
            <span className="font-mono text-xs font-bold">
              {success ? `HTTP ${item.http_code}` : item.error_message ?? "FAILED"}
            </span>
            {item.tokens_used > 0 && (
              <span className="text-xs text-current">
                · {item.tokens_used} tokens{item.retries > 0 ? ` · ${item.retries} retry${item.retries > 1 ? "s" : ""}` : ""}
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0">
          {expanded ? <ChevronUp className="w-5 h-5" strokeWidth={3} /> : <ChevronDown className="w-5 h-5" strokeWidth={3} />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t-[3px] border-(--color-ink) pt-3 space-y-3">
          <div>
            <p className="font-display text-[10px] uppercase mb-2 flex items-center gap-1">
              <PixelRobot size={12} /> Persona
            </p>
            <p className="font-mono text-sm whitespace-pre-wrap leading-relaxed border-brutal-2 bg-(--color-bg-alt) p-3">
              {item.persona_text}
            </p>
          </div>
          {Object.keys(item.answers).length > 0 && (
            <div>
              <p className="font-display text-[10px] uppercase mb-2">Jawaban</p>
              <div className="space-y-1.5">
                {Object.entries(item.answers).map(([key, val]) => (
                  <div key={key} className="grid grid-cols-[6.5rem_1fr] gap-3 text-sm border-brutal-2 bg-(--color-bg-alt) p-2 max-[420px]:grid-cols-1 max-[420px]:gap-1">
                    <span className="text-(--color-ink-soft) font-mono text-xs shrink-0 pt-0.5">{key.replace("entry.", "#")}</span>
                    <span className="font-medium min-w-0 wrap-break-word">{Array.isArray(val) ? val.map(String).join(", ") : String(val ?? "")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {item.error_message && (
            <div className="font-mono text-xs border-brutal bg-(--color-destructive) text-(--color-destructive-foreground) bg-stripe-warn px-3 py-2">
              {item.error_message}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function BatchResultStep({ result, onReset }: BatchResultStepProps) {
  const successRate = Math.round((result.success_count / result.count) * 100)
  const allSuccess = result.fail_count === 0
  const allFail = result.success_count === 0

  return (
    <div
      className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-12"
      style={{ animation: "var(--animate-fade-in)" }}
    >
      {/* =========================================================
       * MAIN COLUMN
       * ========================================================= */}
      <div className="lg:col-span-8 space-y-4">
        {/* Big Result Card */}
        <Card tone={allSuccess ? "lime" : allFail ? "cream" : "yellow"}>
          <CardContent className="p-4 min-[380px]:p-5 md:p-8">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
              {/* Big status icon */}
              <div
                className={`border-brutal-4 p-3 min-[380px]:p-4 shadow-brutal gpu ${
                  allSuccess ? "bg-(--color-bg-alt) text-(--color-ink)" : allFail ? "bg-(--color-destructive) text-(--color-destructive-foreground) bg-stripe-warn" : "bg-(--color-bg-alt) text-(--color-ink) bg-pixel-dots"
                }`}
                style={{ animation: "var(--animate-bob)" }}
              >
                {allSuccess ? (
                  <Trophy className="w-12 h-12" strokeWidth={2} />
                ) : allFail ? (
                  <PixelCross size={48} />
                ) : (
                  <PixelStar size={48} />
                )}
              </div>

              <div className="flex-1 min-w-0 text-center md:text-left">
                <h2 className="font-display text-base min-[380px]:text-lg md:text-xl leading-tight wrap-break-word">
                  {allSuccess ? "SELESAI!" : allFail ? "SEMUA GAGAL" : `${result.success_count}/${result.count} BERHASIL`}
                </h2>
                <p className="font-mono text-xs mt-2 text-current wrap-break-word">
                  {result.form_title || "Google Form Submission"}
                </p>
              </div>

              {/* Success rate badge */}
              <div className={`border-brutal shadow-brutal px-4 min-[380px]:px-6 py-4 text-center w-full min-[380px]:w-auto min-w-0 min-[380px]:min-w-25 ${
                allSuccess ? "bg-(--color-bg-alt) text-(--color-ink)" : allFail ? "bg-(--color-destructive) text-(--color-destructive-foreground) bg-stripe-warn" : "bg-(--color-bg-alt) text-(--color-ink) bg-pixel-dots"
              }`}>
                <div className="font-display text-2xl min-[380px]:text-3xl">{successRate}%</div>
                <div className="font-mono text-[8px] uppercase tracking-widest">rate</div>
              </div>
            </div>

            {/* Chunky stats row */}
            <div className="grid grid-cols-1 min-[380px]:grid-cols-3 gap-3 mt-6">
              <StatBlock
                label="TOTAL"
                value={String(result.count).padStart(2, "0")}
                tone="white"
              />
              <StatBlock
                label="BERHASIL"
                value={String(result.success_count).padStart(2, "0")}
                tone="lime"
              />
              <StatBlock
                label="GAGAL"
                value={String(result.fail_count).padStart(2, "0")}
                tone={result.fail_count > 0 ? "red" : "white"}
              />
            </div>
          </CardContent>
        </Card>

        {/* Export actions */}
        <Card tone="cream">
          <CardContent className="p-3 min-[380px]:p-4">
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <Button onClick={() => exportBatchCsv(result)} variant="secondary" size="lg" className="w-full sm:flex-1 sm:min-w-40 whitespace-nowrap">
                <Download className="w-5 h-5 shrink-0" strokeWidth={3} />
                <span className="truncate">EXPORT CSV</span>
              </Button>
              <Button onClick={() => exportBatchJson(result)} variant="outline" size="lg" className="w-full sm:flex-1 sm:min-w-40 whitespace-nowrap">
                <FileJson className="w-5 h-5 shrink-0" strokeWidth={3} />
                <span className="truncate">EXPORT JSON</span>
              </Button>
              <Button onClick={() => exportBatchExcel(result)} variant="outline" size="lg" className="w-full sm:flex-1 sm:min-w-40 whitespace-nowrap">
                <FileSpreadsheet className="w-5 h-5 shrink-0" strokeWidth={3} />
                <span className="truncate">EXPORT EXCEL</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Terminal log */}
        <Card tone="cream">
          <CardContent className="p-3 min-[380px]:p-4 font-mono text-xs space-y-1 overflow-hidden">
            <div className="flex items-center gap-2 border-b-2 border-dashed border-(--color-ink) pb-2 mb-2">
              <Terminal className="w-4 h-4" />
              <span className="font-bold uppercase tracking-widest">Batch Log</span>
              <Badge variant={allSuccess ? "success" : allFail ? "destructive" : "warning"}>
                {result.session_id}
              </Badge>
            </div>
            <div className="flex gap-3">
              <span className="text-current">{">"}</span>
              <span>Session ID: {result.session_id}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-current">{">"}</span>
              <span>Total requests: {result.count}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-current">{">"}</span>
              <span className="wrap-break-word">Success: {result.success_count} | Fail: {result.fail_count}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-current">{">"}</span>
              <span>Success rate: {successRate}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Per-iteration results */}
        <div className="space-y-2">
          <h3 className="font-display text-[10px] min-[380px]:text-xs uppercase tracking-widest mb-3 flex items-center gap-2 wrap-break-word">
            <PixelRobot size={16} />
            Detail Per-Persona ({result.results.length})
          </h3>
          {result.results.map((item) => (
            <IterationCard key={item.iteration} item={item} />
          ))}
        </div>

        {/* Reset button — desktop */}
        <div className="hidden md:block pt-4">
          <Button onClick={onReset} variant="outline" size="xl" className="w-full">
            <RotateCcw className="w-5 h-5" strokeWidth={3} />
            MULAI BARU
          </Button>
        </div>
      </div>

      {/* =========================================================
       * SIDEBAR — desktop only
       * ========================================================= */}
      <aside className="hidden lg:flex lg:col-span-4 flex-col gap-4">
        <Card tone="white" className="bg-(--color-candy-blush)">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              QUICK STATS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 font-mono text-xs">
            <QuickRow k="Session" v={String(result.session_id)} />
            <QuickRow k="Jobs" v={String(result.count)} />
            <QuickRow k="Success" v={String(result.success_count)} />
            <QuickRow k="Failed" v={String(result.fail_count)} />
            <QuickRow k="Rate" v={`${successRate}%`} />
          </CardContent>
        </Card>

        {/* Tips card */}
        <div className="border-brutal bg-(--color-candy-peach) text-(--color-ink) shadow-brutal-lg p-4 gpu" style={{ animation: "var(--animate-bob)" }}>
          <div className="font-display text-[10px] mb-2 flex items-center gap-2">
            <PixelStar size={16} /> TIP
          </div>
          <div className="font-mono text-xs leading-relaxed">
            {allSuccess
              ? "Review hasilnya, lalu export CSV/JSON/Excel kalau data perlu disimpan lokal."
              : "Cek detail error di tiap persona, lalu coba ulangi hanya setelah koneksi dan status form aman."}
          </div>
        </div>
      </aside>

      {/* Mobile sticky reset */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t-[3px] border-(--color-ink) bg-(--color-bg) p-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <Button onClick={onReset} variant="outline" size="lg" className="w-full">
          <RotateCcw className="w-5 h-5" strokeWidth={3} />
          MULAI BARU
        </Button>
      </div>
    </div>
  )
}

function StatBlock({ label, value, tone }: { label: string; value: string; tone: "white" | "lime" | "red" }) {
  const toneBg = {
    white: "bg-(--color-bg-alt) text-(--color-ink)",
    lime: "bg-(--color-bg-alt) text-(--color-ink)",
    red: "bg-(--color-destructive) text-(--color-destructive-foreground) bg-stripe-warn",
  }[tone]

  return (
    <div className={`min-w-0 border-brutal shadow-brutal-sm p-3 text-center gpu ${toneBg}`}>
      <div className="font-display text-2xl md:text-3xl tabular-nums">{value}</div>
      <div className="font-mono text-[9px] min-[380px]:text-[10px] uppercase tracking-widest font-bold mt-1 truncate">{label}</div>
    </div>
  )
}

function QuickRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between items-center gap-2 border-b-2 border-dashed border-(--color-ink) pb-2 last:border-0 last:pb-0">
      <span className="font-bold uppercase text-[10px] tracking-widest">{k}</span>
      <span className="font-bold">{v}</span>
    </div>
  )
}
