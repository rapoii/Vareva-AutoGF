import { useState } from "react"
import { ChevronDown, ChevronUp, Download, FileJson, FileSpreadsheet, RotateCcw, Trophy, Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PixelRobot, PixelStar, PixelHeart, PixelCheck, PixelCross } from "@/components/PixelDecor"
import type { BatchRunResponse, IterationResult } from "@/lib/api"
import { exportBatchCsv, exportBatchExcel, exportBatchJson } from "@/lib/export"

interface BatchResultStepProps {
  result: BatchRunResponse
  onReset: () => void
}

function IterationCard({ item }: { item: IterationResult }) {
  const [expanded, setExpanded] = useState(false)
  const success = item.submit_status === "success"

  return (
    <div
      className={`press border-brutal gpu transition-all ${
        success ? "bg-brutal-lime shadow-brutal" : "bg-(--color-brutal-red)/10 shadow-brutal-sm"
      }`}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        {/* Number badge */}
        <div className={`shrink-0 w-9 h-9 border-brutal-2 flex items-center justify-center font-display text-xs ${
          success ? "bg-(--color-ink) text-white" : "bg-white text-(--color-ink)"
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
            <span className={`font-mono text-xs font-bold ${success ? "text-(--color-ink)" : "text-(--color-brutal-red)"}`}>
              {success ? `HTTP ${item.http_code}` : item.error_message ?? "FAILED"}
            </span>
            {item.tokens_used > 0 && (
              <span className="text-xs text-ink-soft">
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
            <p className="font-mono text-sm whitespace-pre-wrap leading-relaxed border-brutal-2 bg-white p-3">
              {item.persona_text}
            </p>
          </div>
          {Object.keys(item.answers).length > 0 && (
            <div>
              <p className="font-display text-[10px] uppercase mb-2">Jawaban</p>
              <div className="space-y-1.5">
                {Object.entries(item.answers).map(([key, val]) => (
                  <div key={key} className="flex gap-2 text-sm border-brutal-2 bg-white p-2">
                    <span className="text-(--color-mute) font-mono text-xs shrink-0 pt-0.5">{key.replace("entry.", "#")}</span>
                    <span className="font-medium">{Array.isArray(val) ? val.join(", ") : val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {item.error_message && (
            <div className="font-mono text-xs border-brutal bg-(--color-brutal-red) text-white px-3 py-2">
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
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Big status icon */}
              <div
                className={`border-brutal-4 p-4 shadow-brutal gpu ${
                  allSuccess ? "bg-brutal-lime" : allFail ? "bg-(--color-brutal-red)" : "bg-white"
                }`}
                style={{ animation: "var(--animate-bob)" }}
              >
                {allSuccess ? (
                  <Trophy className="w-12 h-12 text-(--color-ink)" strokeWidth={2} />
                ) : allFail ? (
                  <PixelCross size={48} />
                ) : (
                  <PixelStar size={48} />
                )}
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className="font-display text-xs mb-2 flex items-center justify-center md:justify-start gap-2">
                  <span className={`bg-(--color-ink) text-white px-2 py-0.5 ${allSuccess ? "text-brutal-lime" : ""}`}>
                    {allSuccess ? "MISSION COMPLETE" : allFail ? "ALL FAILED" : "PARTIAL SUCCESS"}
                  </span>
                </div>
                <h2 className="font-display text-lg md:text-xl leading-tight">
                  {allSuccess ? "SELESAI!" : allFail ? "SEMUA GAGAL" : `${result.success_count}/${result.count} BERHASIL`}
                </h2>
                <p className="font-mono text-xs mt-2 text-ink-soft">
                  {result.form_title || "Google Form Submission"}
                </p>
              </div>

              {/* Success rate badge */}
              <div className={`border-brutal shadow-brutal px-6 py-4 text-center min-w-25 ${
                allSuccess ? "bg-brutal-lime" : allFail ? "bg-(--color-brutal-red) text-white" : "bg-white"
              }`}>
                <div className="font-display text-3xl">{successRate}%</div>
                <div className="font-mono text-[8px] uppercase tracking-widest">rate</div>
              </div>
            </div>

            {/* Chunky stats row */}
            <div className="grid grid-cols-3 gap-3 mt-6">
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
        <Card tone="cream" flat>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={() => exportBatchCsv(result)} variant="secondary" size="lg" className="flex-1">
                <Download className="w-5 h-5" strokeWidth={3} />
                EXPORT CSV
              </Button>
              <Button onClick={() => exportBatchJson(result)} variant="outline" size="lg" className="flex-1">
                <FileJson className="w-5 h-5" strokeWidth={3} />
                EXPORT JSON
              </Button>
              <Button onClick={() => exportBatchExcel(result)} variant="outline" size="lg" className="flex-1">
                <FileSpreadsheet className="w-5 h-5" strokeWidth={3} />
                EXPORT EXCEL
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Terminal log */}
        <Card tone="cream" flat>
          <CardContent className="p-4 font-mono text-xs space-y-1">
            <div className="flex items-center gap-2 border-b-2 border-dashed border-(--color-ink) pb-2 mb-2">
              <Terminal className="w-4 h-4" />
              <span className="font-bold uppercase tracking-widest">Batch Log</span>
              <Badge variant={allSuccess ? "success" : allFail ? "destructive" : "warning"}>
                {result.session_id}
              </Badge>
            </div>
            <div className="flex gap-3">
              <span className="text-(--color-brutal-pink)">{">"}</span>
              <span>Session ID: {result.session_id}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-(--color-brutal-pink)">{">"}</span>
              <span>Total requests: {result.count}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-(--color-brutal-pink)">{">"}</span>
              <span>Success: {result.success_count} | Fail: {result.fail_count}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-(--color-brutal-pink)">{">"}</span>
              <span>Success rate: {successRate}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Per-iteration results */}
        <div className="space-y-2">
          <h3 className="font-display text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
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
        <Card tone="violet">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <PixelHeart size={20} />
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
        <div className="border-brutal bg-(--color-brutal-yellow) shadow-brutal-lg p-4 gpu" style={{ animation: "var(--animate-bob)" }}>
          <div className="font-display text-[10px] mb-2 flex items-center gap-2">
            <PixelStar size={16} /> TIP
          </div>
          <div className="font-mono text-xs leading-relaxed">
            {allSuccess
              ? "Semua berhasil! Data sudah tersimpan di Google Form."
              : "Ada yang gagal? Coba periksa koneksi atau status form (mungkin sudah closed)."}
          </div>
        </div>

        {/* Big decorative block */}
        <div className="border-brutal bg-white shadow-brutal-lg p-6 flex items-center justify-center">
          {allSuccess ? (
            <PixelHeart size={64} />
          ) : (
            <PixelRobot size={64} />
          )}
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
    white: "bg-white",
    lime: "bg-brutal-lime",
    red: "bg-(--color-brutal-red) text-white",
  }[tone]

  return (
    <div className={`border-brutal shadow-brutal-sm p-3 text-center gpu ${toneBg}`}>
      <div className="font-display text-2xl md:text-3xl tabular-nums">{value}</div>
      <div className="font-mono text-[10px] uppercase tracking-widest font-bold mt-1">{label}</div>
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
