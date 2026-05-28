import { useState } from "react"
import { Send, Pencil, RotateCcw, Eye, ArrowLeft, Terminal, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PixelStar, PixelCheck, PixelCross, PixelBolt } from "@/components/PixelDecor"
import { LoadingOverlay } from "@/components/LoadingOverlay"
import { api, type FormSchema, type GenerateResponse, type SubmitResponse } from "@/lib/api"
import { getAnswerWarnings } from "@/lib/reviewQuality"

interface ReviewSubmitStepProps {
  schema: FormSchema
  sessionId: string
  formUrl: string
  generateResults: GenerateResponse[]
  systemLogs?: string[]
  onBack: () => void
  onReset: () => void
}

export function ReviewSubmitStep({ schema, sessionId, formUrl, generateResults, systemLogs = [], onBack, onReset }: ReviewSubmitStepProps) {
  // State for each persona's answers
  const [allAnswers, setAllAnswers] = useState<Record<string, string | string[]>[]>(
    generateResults.map((r) => Object.fromEntries(
      Object.entries(r.answers).map(([key, value]) => [
        key,
        Array.isArray(value) ? value.map(String) : String(value ?? ""),
      ])
    ))
  )
  const [activeIndex, setActiveIndex] = useState(0)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [submitResults, setSubmitResults] = useState<SubmitResponse[]>([])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [currentSubmitIndex, setCurrentSubmitIndex] = useState<number | null>(null)

  const fieldMap = Object.fromEntries(schema.fields.map((f) => [f.entry_id, f]))
  const activeResult = generateResults[activeIndex]

  function getActiveAnswers() {
    return allAnswers[activeIndex]
  }

  function setActiveAnswers(updater: (prev: Record<string, string | string[]>) => Record<string, string | string[]>) {
    setAllAnswers((prev) => {
      const next = [...prev]
      next[activeIndex] = updater(next[activeIndex])
      return next
    })
  }

  function startEdit(key: string) {
    const val = getActiveAnswers()[key]
    setEditValue(Array.isArray(val) ? val.join(", ") : val)
    setEditingKey(key)
  }

  function saveEdit(key: string) {
    const field = fieldMap[key]
    if (field?.question_type === "CHECKBOXES") {
      setActiveAnswers((prev) => ({ ...prev, [key]: editValue.split(",").map((s) => s.trim()).filter(Boolean) }))
    } else {
      setActiveAnswers((prev) => ({ ...prev, [key]: editValue }))
    }
    setEditingKey(null)
  }

  async function handleSubmit() {
    if (submitting) return
    setSubmitting(true)
    setError(null)
    const results: SubmitResponse[] = []
    for (let i = 0; i < allAnswers.length; i++) {
      setCurrentSubmitIndex(i)
      setActiveIndex(i)
      try {
        const result = await api.submit(formUrl, allAnswers[i], sessionId, schema.page_count ?? 1)
        results.push(result)
      } catch (e) {
        results.push({
          status: "error",
          http_code: 0,
          session_id: sessionId,
          log_id: "0",
          error_message: e instanceof Error ? e.message : "Gagal mengirim",
        })
      }
    }
    setCurrentSubmitIndex(null)
    setSubmitting(false)
    setSubmitResults(results)
  }

  // Success/failure state after submit
  if (submitResults.length > 0) {
    const successCount = submitResults.filter((r) => r.status === "success").length
    const failCount = submitResults.length - successCount
    const allSuccess = failCount === 0

    return (
      <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-12" style={{ animation: "var(--animate-fade-in)" }}>
        <div className="lg:col-span-12 space-y-4">
          <Card tone={allSuccess ? "lime" : "yellow"}>
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div
                  className={`border-brutal-4 p-4 shadow-brutal gpu ${
                    allSuccess ? "bg-(--color-bg-alt) text-(--color-ink)" : "bg-(--color-destructive) text-(--color-destructive-foreground) bg-stripe-warn"
                  }`}
                  style={{ animation: "var(--animate-bob)" }}
                >
                  {allSuccess ? <PixelCheck size={48} /> : <PixelCross size={48} />}
                </div>

                <div className="flex-1 text-center md:text-left">
                  <div className="font-display text-xs mb-2 flex items-center justify-center md:justify-start gap-2">
                    <span className="bg-(--color-ink) text-(--color-brutal-pink) px-2 py-0.5">
                      {allSuccess ? "SUBMITTED" : "PARTIAL FAIL"}
                    </span>
                  </div>
                  <h2 className="font-display text-lg md:text-xl leading-tight">
                    {allSuccess ? "SEMUA BERHASIL DIKIRIM!" : `${successCount}/${submitResults.length} BERHASIL`}
                  </h2>
                  <p className="font-mono text-xs mt-2 text-(--color-ink-soft)">
                    {allSuccess
                      ? "Semua pengisian berhasil disubmit ke Google Form."
                      : `${failCount} gagal — cek detail di bawah.`}
                  </p>
                </div>

                <div className={`border-brutal shadow-brutal px-6 py-4 text-center min-w-25 ${
                  allSuccess ? "bg-(--color-bg-alt) text-(--color-ink)" : "bg-(--color-bg-alt) text-(--color-ink) bg-pixel-dots"
                }`}>
                  <div className="font-display text-3xl">{Math.round((successCount / submitResults.length) * 100)}%</div>
                  <div className="font-mono text-[8px] uppercase tracking-widest">rate</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-6">
                <div className="border-brutal bg-(--color-bg-alt) shadow-brutal-sm p-3 text-center">
                  <div className="font-display text-2xl">{submitResults.length}</div>
                  <div className="font-mono text-[10px] uppercase font-bold">Total</div>
                </div>
                <div className="border-brutal bg-(--color-bg-alt) text-(--color-ink) shadow-brutal-sm p-3 text-center">
                  <div className="font-display text-2xl">{successCount}</div>
                  <div className="font-mono text-[10px] uppercase font-bold">Success</div>
                </div>
                <div className={`border-brutal shadow-brutal-sm p-3 text-center ${failCount > 0 ? "bg-(--color-destructive) text-(--color-destructive-foreground) bg-stripe-warn" : "bg-(--color-bg-alt) text-(--color-ink)"}`}>
                  <div className="font-display text-2xl">{failCount}</div>
                  <div className="font-mono text-[10px] uppercase font-bold">Fail</div>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <Button onClick={onReset} variant="outline" size="lg">
                  <RotateCcw className="w-5 h-5" strokeWidth={3} />
                  MULAI BARU
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div
      className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-12"
      style={{ animation: "var(--animate-fade-in)" }}
    >
      {/* =========================================================
       * LEFT COLUMN — Review content
       * ========================================================= */}
      <div className="lg:col-span-8 space-y-4">
        {/* Persona Selector — chunky pills */}
        {generateResults.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pt-2 pb-3 px-1 scrollbar-hide">
            {generateResults.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                disabled={submitting}
                className={`press border-brutal px-4 py-2 text-sm font-display gpu whitespace-nowrap ${
                  activeIndex === idx
                    ? "bg-(--color-primary) text-(--color-primary-foreground) shadow-brutal"
                    : "bg-(--color-bg-alt) text-(--color-ink) shadow-brutal-sm hover:bg-(--color-candy-blush) hover:text-(--color-ink)"
                } disabled:border-dashed disabled:shadow-none`}
              >
                <span className="font-display text-xs">P{idx + 1}</span>
              </button>
            ))}
          </div>
        )}

        {/* Review Card */}
        <Card tone="white">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Eye className="w-5 h-5" strokeWidth={3} />
                  REVIEW PERSONA {activeIndex + 1}/{generateResults.length}
                </CardTitle>
                <div className="font-mono text-xs mt-1 text-(--color-ink-soft) flex items-center gap-2">
                  <span>Tokens: {activeResult?.tokens_used ?? 0}</span>
                  <span className="w-1 h-1 bg-(--color-ink)" />
                  <span>{Object.keys(getActiveAnswers()).length} answers</span>
                </div>
              </div>
              <Badge variant="secondary" className="shrink-0">
                {schema.fields.length} fields
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {schema.fields.map((field, i) => {
              const val = getActiveAnswers()[field.entry_id]
              const displayVal = Array.isArray(val) ? val.join(", ") : val ?? "-"
              const isEditing = editingKey === field.entry_id
              const otherKey = `${field.entry_id}.other_option_response`
              const otherVal = getActiveAnswers()[otherKey]
              const hasOtherDetail = val === "Yang lain:" && otherVal
              const warnings = getAnswerWarnings(field, val, allAnswers, activeIndex)

              return (
                <div
                  key={field.entry_id}
                  className={`press border-brutal gpu transition-all ${
                    isEditing
                      ? "bg-(--color-primary) text-(--color-primary-foreground) shadow-brutal"
                      : warnings.length > 0
                        ? "bg-(--color-bg-alt) text-(--color-ink) bg-stripe-warn shadow-brutal-sm"
                        : "bg-(--color-bg-alt) text-(--color-ink) shadow-brutal-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 p-3">
                    <div className="flex-1 min-w-0">
                      {/* Question label */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-display text-[10px] bg-(--color-ink) text-(--color-brutal-pink) px-1.5 py-0.5">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-sm font-bold leading-tight">
                          {field.question_text}
                        </span>
                        {field.required && (
                          <span className="border-brutal-2 bg-(--color-primary) px-1 text-[10px] text-(--color-primary-foreground)">REQ</span>
                        )}
                        {warnings.length > 0 && (
                          <Badge variant="warning" className="text-[10px]">
                            {warnings.length} warning{warnings.length > 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>

                      {/* Edit mode */}
                      {isEditing ? (
                        <div className="flex gap-2 mt-2">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") saveEdit(field.entry_id) }}
                            autoFocus
                            className="flex-1"
                          />
                          <Button size="sm" onClick={() => saveEdit(field.entry_id)}>
                            SAVE
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingKey(null)}>
                            CANCEL
                          </Button>
                        </div>
                      ) : (
                        /* Display mode */
                        <div className="border-brutal-2 bg-muted px-3 py-2 text-sm font-mono">
                          <span className="font-bold">{displayVal}</span>
                          {hasOtherDetail && (
                            <span className="ml-2 border-brutal-2 bg-(--color-bg-alt) px-1 text-(--color-ink)">
                              → {otherVal}
                            </span>
                          )}
                        </div>
                      )}
                      {warnings.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {warnings.map((warning) => (
                            <div key={warning} className="font-mono text-xs font-bold border-brutal-2 bg-(--color-primary) px-2 py-1 text-(--color-primary-foreground)">
                              ! {warning}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Edit button */}
                    {!isEditing && (
                      <button
                        onClick={() => startEdit(field.entry_id)}
                        className="press border-brutal-2 w-9 h-9 flex items-center justify-center bg-(--color-bg-alt) text-(--color-ink) hover:bg-(--color-candy-blush) hover:text-(--color-ink) shrink-0"
                        title="Edit answer"
                      >
                        <Pencil className="w-4 h-4" strokeWidth={3} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Error banner */}
        {error && (
          <div
            className="border-brutal bg-(--color-destructive) text-(--color-destructive-foreground) bg-stripe-warn shadow-brutal flex items-start gap-3 p-4"
            style={{ animation: "var(--animate-glitch)" }}
          >
            <XCircle className="w-5 h-5 shrink-0 mt-0.5" strokeWidth={3} />
            <div className="flex-1 font-mono text-sm font-bold">{error}</div>
          </div>
        )}

        {submitting && (
          <LoadingOverlay
            title="SUBMIT FORM"
            message={`Mengirim persona ${currentSubmitIndex !== null ? currentSubmitIndex + 1 : 1} dari ${allAnswers.length} ke Google Form.`}
          />
        )}

        {/* Desktop action buttons */}
        <div className="hidden md:flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={submitting}
            className="flex-1"
            size="lg"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={3} />
            BACK
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-2"
            size="xl"
          >
            <PixelBolt size={24} />
            <span>SUBMIT {allAnswers.length} TO FORM</span>
            <PixelStar size={20} />
          </Button>
        </div>
      </div>

      {/* =========================================================
       * RIGHT SIDEBAR — Info & tips (desktop only)
       * ========================================================= */}
      <aside className="hidden lg:flex lg:col-span-4 flex-col gap-4">
        <Card tone="white" className="bg-(--color-candy-blush)">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Terminal className="w-4 h-4" />
              INFO
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 font-mono text-xs">
            <InfoRow k="Session" v={String(sessionId)} />
            <InfoRow k="Fields" v={String(schema.fields.length)} />
            <InfoRow k="Pages" v={String(schema.page_count ?? 1)} />
            <InfoRow k="Personas" v={String(generateResults.length)} />
          </CardContent>
        </Card>

        <Card tone="cream">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Terminal className="w-4 h-4" strokeWidth={3} />
              SYSTEM LOG
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-40 overflow-y-auto space-y-1 overscroll-contain font-mono text-[11px] leading-relaxed">
            {(systemLogs.length > 0 ? systemLogs : ["No generation logs available."]).slice(-20).map((log, i) => (
              <div key={`${i}-${log}`} className="flex gap-2">
                <span className="shrink-0">&gt;</span>
                <span>{log}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="border-brutal bg-(--color-candy-peach) text-(--color-ink) shadow-brutal-lg p-4 gpu" style={{ animation: "var(--animate-bob)" }}>
          <div className="font-display text-[10px] mb-2 flex items-center gap-2">
            <PixelStar size={16} /> TIP
          </div>
          <div className="font-mono text-xs leading-relaxed">
            Click <span className="border-brutal-2 bg-(--color-bg-alt) px-1">✎</span> to edit any answer. All changes are saved locally before submit.
          </div>
        </div>
      </aside>

      {/* Mobile sticky CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t-[3px] border-(--color-ink) bg-(--color-bg) p-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack} disabled={submitting} className="flex-1" size="lg">
            <ArrowLeft className="w-5 h-5" strokeWidth={3} />
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} className="flex-3" size="lg">
            <Send className="w-5 h-5" strokeWidth={3} />
            SUBMIT {allAnswers.length}
          </Button>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between items-center gap-2 border-b-2 border-dashed border-(--color-ink) pb-2 last:border-0 last:pb-0">
      <span className="font-bold uppercase text-[10px] tracking-widest">{k}</span>
      <span className="font-bold">{v}</span>
    </div>
  )
}
