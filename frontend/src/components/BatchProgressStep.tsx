import { useState } from "react"
import { Check, ChevronDown, ChevronUp, Pencil, RefreshCw, RotateCcw, Send, ShieldCheck, Terminal, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { LoadingOverlay } from "@/components/LoadingOverlay"
import { PixelRobot, PixelStar } from "@/components/PixelDecor"
import { api, type BatchSessionStatus } from "@/lib/api"

interface BatchProgressStepProps {
  status: BatchSessionStatus
  loading?: boolean
  onRefresh: () => void
  onReset: () => void
}

export function BatchProgressStep({ status, loading = false, onRefresh, onReset }: BatchProgressStepProps) {
  const [expandedIterations, setExpandedIterations] = useState<Record<string, boolean>>({})
  const [answerOverrides, setAnswerOverrides] = useState<Record<number, Record<string, unknown>>>({})
  const [editingAnswer, setEditingAnswer] = useState<{ iteration: number; key: string } | null>(null)
  const [editValue, setEditValue] = useState("")
  const [savingAnswer, setSavingAnswer] = useState<string | null>(null)
  const [submittingReviewed, setSubmittingReviewed] = useState(false)
  const [submittedStatus, setSubmittedStatus] = useState<BatchSessionStatus | null>(null)
  const [submitSuccessOpen, setSubmitSuccessOpen] = useState(false)
  const [submitFailedOpen, setSubmitFailedOpen] = useState(false)
  const [submitFailedMessage, setSubmitFailedMessage] = useState("")
  const [reviewSubmitDone, setReviewSubmitDone] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const activeStatus = submittedStatus ?? status
  const results = activeStatus.results.map((item) => ({ ...item, answers: answerOverrides[item.iteration] ?? item.answers }))
  const completedCount = results.length
  const isRunning = activeStatus.status === "running"
  const reviewCount = reviewSubmitDone ? 0 : results.filter((item) => item.submit_status === "pending_review").length
  const successCount = results.filter((item) => item.submit_status === "success").length
  const failCount = results.filter((item) => item.submit_status && !["success", "pending_review"].includes(item.submit_status)).length
  const allReviewResultsReady = activeStatus.mode === "review" && reviewCount > 0 && completedCount >= activeStatus.count
  const successRate = activeStatus.count > 0 ? Math.round(((activeStatus.mode === "review" ? reviewCount || successCount : successCount) / activeStatus.count) * 100) : 0
  const remainingCount = Math.max(0, activeStatus.count - completedCount)
  const fieldMap = Object.fromEntries((activeStatus.fields ?? []).map((field) => [field.entry_id, field]))
  const disabledButtonClass = "disabled:translate-x-0 disabled:translate-y-0 disabled:border-dashed disabled:opacity-70"
  const disabledButtonStyle = submittingReviewed ? { boxShadow: "7px 7px 0 0 color-mix(in srgb, currentColor 88%, var(--color-brutal-pink))" } : undefined
  function startEdit(iteration: number, key: string, value: unknown) {
    setEditingAnswer({ iteration, key })
    setEditValue(formatAnswerValue(value))
    setEditError(null)
  }

  async function saveAnswer(iteration: number, key: string) {
    const result = results.find((item) => item.iteration === iteration)
    if (!result) return
    const currentValue = result.answers[key]
    const nextValue = Array.isArray(currentValue)
      ? editValue.split(",").map((item) => item.trim()).filter(Boolean)
      : editValue.trim()
    const nextAnswers = { ...result.answers, [key]: nextValue } as Record<string, string | string[]>
    const saveKey = `${iteration}-${key}`
    setSavingAnswer(saveKey)
    setEditError(null)
    try {
      const updated = await api.updateReviewAnswers(activeStatus.session_id, iteration, nextAnswers)
      setAnswerOverrides((current) => ({ ...current, [iteration]: updated.answers }))
      setEditingAnswer(null)
      setEditValue("")
    } catch (error) {
      setEditError(error instanceof Error ? error.message : "Gagal menyimpan jawaban")
    } finally {
      setSavingAnswer(null)
    }
  }

  async function submitAllReviewed() {
    setSubmittingReviewed(true)
    setEditError(null)
    try {
      const nextStatus = await api.submitReviewedSession(activeStatus.session_id)
      const failed = nextStatus.results.filter((item) => item.submit_status && !["success", "pending_review"].includes(item.submit_status))
      setReviewSubmitDone(true)
      setSubmittedStatus(nextStatus)
      setAnswerOverrides({})
      if (failed.length > 0) {
        setSubmitFailedMessage(`${failed.length} jawaban gagal dikirim. Cek detail iterasi untuk pesan error.`)
        setSubmitFailedOpen(true)
      } else {
        setSubmitSuccessOpen(true)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal submit semua jawaban review"
      setSubmitFailedMessage(message)
      setSubmitFailedOpen(true)
      setEditError(message)
    } finally {
      setSubmittingReviewed(false)
    }
  }

  const systemLogs = [
    "Initializing AI pipeline...",
    "Loading provider chain: Gemini → Groq → Cerebras → OpenRouter",
    `Estimated time: ~${Math.max(15, activeStatus.count * 5)}s`,
    `Processing request_${activeStatus.session_id.replace(/^ses_/, "").slice(0, 4)}...`,
    `Using scanned form schema: ${activeStatus.form_title || "Google Form Submission"}`,
    `Background job ${isRunning ? "running" : activeStatus.status} on backend`,
    ...results.map((item) => {
      const label = item.submit_status === "success" ? "Submit success" : item.submit_status === "pending_review" ? "Ready for review" : "Submit failed"
      return `Iterasi ${String(item.iteration).padStart(2, "0")}: ${label} · HTTP ${item.http_code} · ${item.tokens_used} tokens · ${item.retries} retries`
    }),
    remainingCount > 0
      ? `Waiting stored results: ${completedCount}/${activeStatus.count}`
      : activeStatus.mode === "review" && reviewCount > 0
        ? `Complete: ${reviewCount}/${activeStatus.count} ready for review`
        : `Complete: ${successCount}/${activeStatus.count} success, ${failCount} failed`,
  ]

  return (
    <>
      {submittingReviewed && (
        <LoadingOverlay
          title="SUBMITTING"
          message="Mengirim semua jawaban review ke Google Form. Jangan tutup halaman dulu."
        />
      )}
      {submitSuccessOpen && (
        <SubmitOverlay
          tone="success"
          title="SUBMIT BERHASIL"
          message="Semua jawaban review sudah selesai dikirim ke Google Form."
          actionLabel="OKE"
          onAction={() => setSubmitSuccessOpen(false)}
        />
      )}
      {submitFailedOpen && (
        <SubmitOverlay
          tone="failed"
          title="SUBMIT GAGAL"
          message={submitFailedMessage || "Sebagian atau semua jawaban gagal dikirim."}
          actionLabel="OKE"
          onAction={() => setSubmitFailedOpen(false)}
        />
      )}
      <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-12" style={{ animation: "var(--animate-fade-in)" }}>
      <div className="lg:col-span-8 space-y-4 min-w-0">
        <Card tone={isRunning ? "yellow" : failCount > 0 ? "cream" : "lime"}>
          <CardContent className="p-4 min-[380px]:p-5 md:p-8">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
              <div className="border-brutal-4 bg-(--color-bg-alt) text-(--color-ink) p-3 min-[380px]:p-4 shadow-brutal gpu" style={{ animation: "var(--animate-bob)" }}>
                {isRunning ? <PixelRobot size={48} /> : <ShieldCheck className="w-12 h-12" strokeWidth={2.5} />}
              </div>

              <div className="flex-1 min-w-0 text-center md:text-left">
                <h2 className="font-display text-base min-[380px]:text-lg md:text-xl leading-tight wrap-break-word">
                  {isRunning
                    ? activeStatus.mode === "review"
                      ? "GENERATING ANSWERS FOR REVIEW..."
                      : `GENERATING & SUBMITTING ${activeStatus.count} ISIAN...`
                    : activeStatus.mode === "review" && reviewCount > 0
                      ? `${reviewCount}/${activeStatus.count} SIAP DIREVIEW`
                      : failCount > 0
                        ? `${successCount}/${activeStatus.count} BERHASIL DIKIRIM`
                        : "SEMUA BERHASIL DIKIRIM!"}
                </h2>
                <p className="font-mono text-xs mt-2 text-current wrap-break-word">{activeStatus.form_title || "Google Form Submission"}</p>
              </div>

              <div className="border-brutal bg-(--color-bg-alt) text-(--color-ink) shadow-brutal px-4 min-[380px]:px-6 py-4 text-center w-full min-[380px]:w-auto min-w-0 min-[380px]:min-w-25">
                <div className="font-display text-2xl min-[380px]:text-3xl">{successRate}%</div>
                <div className="font-mono text-[8px] uppercase tracking-widest">rate</div>
              </div>
            </div>

            <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-3 mt-6">
              <StatBlock label="TOTAL" value={String(activeStatus.count).padStart(2, "0")} tone="white" />
              <StatBlock label={activeStatus.mode === "review" ? (reviewCount > 0 ? "REVIEW" : "BERHASIL") : "BERHASIL"} value={String(activeStatus.mode === "review" && reviewCount > 0 ? reviewCount : successCount).padStart(2, "0")} tone="lime" />
              <StatBlock label="GAGAL" value={String(failCount).padStart(2, "0")} tone={failCount > 0 ? "red" : "white"} />
            </div>
          </CardContent>
        </Card>


        <Card tone="cream">
          <CardContent className="p-3 min-[380px]:p-4 font-mono text-xs overflow-hidden">
            <div className="flex items-center gap-2 border-b-2 border-dashed border-(--color-ink) pb-2 mb-2">
              <Terminal className="w-4 h-4" />
              <span className="font-bold uppercase tracking-widest">System Log</span>
              <Badge variant={isRunning ? "warning" : "success"} className="bg-(--color-bg-alt) bg-none normal-case">{activeStatus.session_id}</Badge>
            </div>
            <div className="max-h-32 md:max-h-36 overflow-y-auto space-y-1 pr-2 overscroll-contain">
              {systemLogs.map((text, index) => (
                <LogLine key={`${index}-${text}`} text={text} />
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2 w-full min-w-0">
          <h3 className="font-display text-[10px] min-[380px]:text-xs uppercase tracking-widest mb-3 flex items-center gap-2 wrap-break-word">
            <PixelRobot size={16} /> Detail Tersimpan ({results.length})
          </h3>
          {results.length > 0 ? (
            results.map((item) => {
              const itemKey = `${item.iteration}-${item.log_id ?? "log"}`
              const expanded = !!expandedIterations[itemKey]
              const answerEntries = Object.entries(item.answers ?? {})

              return (
                <div key={itemKey} className="w-full min-w-0 overflow-hidden border-brutal bg-(--color-bg-alt) text-(--color-ink) shadow-brutal-lg font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => setExpandedIterations((current) => ({ ...current, [itemKey]: !expanded }))}
                    className="flex w-full items-center justify-between gap-2 border-b-2 border-(--color-ink) bg-(--color-candy-blush) px-3 py-2 text-left"
                  >
                    <span className="flex items-center gap-2">
                      <span className="border-brutal-2 bg-(--color-ink) px-1.5 py-0.5 font-display text-[9px] text-(--color-brutal-pink)">
                        {String(item.iteration).padStart(2, "0")}
                      </span>
                      <span className="font-display text-[10px]">ITERASI</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Badge variant={item.submit_status === "success" || item.submit_status === "pending_review" ? "success" : "destructive"} className="bg-(--color-bg-alt) bg-none">{item.submit_status === "pending_review" ? "REVIEW" : item.submit_status}</Badge>
                      <span className="border-brutal-2 bg-(--color-bg-alt) p-1">
                        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </span>
                    </span>
                  </button>
                  <div className="space-y-3 p-3">
                    {item.persona_text && <div className="border-brutal-2 bg-(--color-candy-cream) px-3 py-2 font-bold wrap-break-word">{item.persona_text}</div>}
                    <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest">
                      <span className="border-brutal-2 bg-(--color-candy-mint) px-2 py-1">HTTP {item.http_code}</span>
                      <span className="border-brutal-2 bg-(--color-brutal-yellow) px-2 py-1">{item.tokens_used} tokens</span>
                      <span className="border-brutal-2 bg-(--color-bg-alt) px-2 py-1">{item.retries} retries</span>
                    </div>
                  </div>
                  {expanded && (
                    <div className="border-t-2 border-dashed border-(--color-ink) px-3 pb-3 pt-3 min-[420px]:px-4 space-y-3">
                      {editError && <div className="border-brutal-2 bg-(--color-destructive) text-(--color-destructive-foreground) bg-stripe-warn px-3 py-2 font-bold wrap-break-word">{editError}</div>}
                      {item.error_message && (
                        <div className="border-brutal-2 bg-(--color-destructive) text-(--color-destructive-foreground) bg-stripe-warn px-3 py-2 font-bold wrap-break-word">
                          {item.error_message}
                        </div>
                      )}
                      {answerEntries.length > 0 ? (
                        answerEntries.map(([key, value]) => {
                          const field = fieldMap[key]
                          const canEdit = activeStatus.mode === "review" && item.submit_status === "pending_review"
                          const isEditing = editingAnswer?.iteration === item.iteration && editingAnswer.key === key
                          const saveKey = `${item.iteration}-${key}`
                          const saving = savingAnswer === saveKey
                          return (
                            <div key={key} className="overflow-hidden border-brutal-2 bg-(--color-candy-cream) shadow-brutal-sm">
                              <div className="flex items-start justify-between gap-3 border-b-2 border-(--color-ink) bg-(--color-candy-blush) px-3 py-2 min-[420px]:px-4">
                                <div className="min-w-0 space-y-1.5">
                                  <div className="font-display text-[9px] uppercase tracking-widest wrap-break-word">
                                    {field?.question_text ?? key}
                                  </div>
                                  {field && <div className="font-mono text-[9px] text-(--color-ink-soft) wrap-break-word">{key}</div>}
                                </div>
                                {canEdit && !isEditing && (
                                  <button
                                    type="button"
                                    onClick={() => startEdit(item.iteration, key, value)}
                                    className="grid h-8 w-8 shrink-0 place-items-center border-brutal-2 bg-(--color-bg-alt) text-(--color-ink) shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                                    aria-label="Edit jawaban"
                                  >
                                    <Pencil className="h-4 w-4" strokeWidth={3} />
                                  </button>
                                )}
                              </div>
                              <div className="space-y-3 px-3 py-3 min-[420px]:px-4">
                                {isEditing ? (
                                  <div className="space-y-2">
                                    <Input value={editValue} onChange={(event) => setEditValue(event.target.value)} className="h-11 border-[3px] font-mono text-sm font-bold" disabled={saving} />
                                    {Array.isArray(value) && <div className="font-mono text-[10px] text-(--color-ink-soft)">Pisahkan beberapa jawaban dengan koma.</div>}
                                    <div className="grid grid-cols-2 gap-2">
                                      <Button type="button" size="sm" onClick={() => void saveAnswer(item.iteration, key)} disabled={saving}>
                                        <Check className="w-3.5 h-3.5" strokeWidth={3} />
                                        {saving ? "SIMPAN..." : "SIMPAN"}
                                      </Button>
                                      <Button type="button" variant="outline" size="sm" onClick={() => { setEditingAnswer(null); setEditValue(""); setEditError(null) }} disabled={saving}>
                                        <X className="w-3.5 h-3.5" strokeWidth={3} />
                                        BATAL
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="font-mono text-sm font-bold leading-relaxed wrap-break-word">{formatAnswerValue(value)}</div>
                                )}
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="text-(--color-ink-soft)">Tidak ada detail jawaban tersimpan.</div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="w-full border-brutal bg-(--color-candy-peach) text-(--color-ink) shadow-brutal-lg p-4 font-mono text-xs leading-relaxed">
              Belum ada submit sukses yang tersimpan untuk session ini.
            </div>
          )}
        </div>

        <div className="hidden md:grid w-full grid-cols-2 gap-3 pt-4">
          {allReviewResultsReady ? (
            <Button onClick={() => void submitAllReviewed()} size="xl" disabled={submittingReviewed} className={`col-span-2 ${disabledButtonClass}`} style={disabledButtonStyle}>
              <Send className="w-5 h-5" strokeWidth={3} />
              {submittingReviewed ? "SUBMITTING..." : `SUBMIT SEMUA (${reviewCount})`}
            </Button>
          ) : null}
          <Button onClick={onRefresh} variant="secondary" size="xl" disabled={loading || submittingReviewed} className={disabledButtonClass} style={disabledButtonStyle}>
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} strokeWidth={3} />
            REFRESH
          </Button>
          <Button onClick={onReset} variant="outline" size="xl" disabled={submittingReviewed} className={disabledButtonClass} style={disabledButtonStyle}>
            <RotateCcw className="w-5 h-5" strokeWidth={3} />
            KEMBALI
          </Button>
        </div>
      </div>

      <aside className="hidden lg:flex lg:col-span-4 flex-col gap-4">
        <Card tone="white" className="bg-(--color-candy-blush)">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">QUICK STATS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 font-mono text-xs">
            <QuickRow k="Session" v={activeStatus.session_id} />
            <QuickRow k="Status" v={activeStatus.status.toUpperCase()} />
            <QuickRow k="Jobs" v={String(activeStatus.count)} />
            <QuickRow k="Mode" v={activeStatus.mode.toUpperCase()} />
          </CardContent>
        </Card>

        <div className="border-brutal bg-(--color-candy-peach) text-(--color-ink) shadow-brutal-lg p-4 gpu" style={{ animation: "var(--animate-bob)" }}>
          <div className="font-display text-[10px] mb-2 flex items-center gap-2">
            <PixelStar size={16} /> TIP
          </div>
          <div className="font-mono text-xs leading-relaxed">
            Klik card iterasi untuk melihat detail jawaban yang tersimpan. Halaman ini aman direload karena progress dibaca dari session backend.
          </div>
        </div>
      </aside>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 grid grid-cols-2 gap-2 border-t-[3px] border-(--color-ink) bg-(--color-bg) p-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        {allReviewResultsReady ? (
          <Button onClick={() => void submitAllReviewed()} size="lg" disabled={submittingReviewed} className={`col-span-2 ${disabledButtonClass}`} style={disabledButtonStyle}>
            <Send className="w-5 h-5" strokeWidth={3} />
            {submittingReviewed ? "SUBMITTING..." : `SUBMIT SEMUA (${reviewCount})`}
          </Button>
        ) : null}
        <Button onClick={onRefresh} variant="secondary" size="lg" disabled={loading || submittingReviewed} className={disabledButtonClass} style={disabledButtonStyle}>
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} strokeWidth={3} />
          REFRESH
        </Button>
        <Button onClick={onReset} variant="outline" size="lg" disabled={submittingReviewed} className={disabledButtonClass} style={disabledButtonStyle}>
          <RotateCcw className="w-5 h-5" strokeWidth={3} />
          HOME
        </Button>
      </div>
      </div>
    </>
  )
}

function SubmitOverlay({ tone, title, message, actionLabel, onAction }: { tone: "success" | "failed"; title: string; message: string; actionLabel?: string; onAction?: () => void }) {
  const iconTone = tone === "success" ? "bg-(--color-candy-mint)" : "bg-(--color-destructive) text-(--color-destructive-foreground) bg-stripe-warn"
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-(--color-ink)/45 px-4 backdrop-blur-[2px]" style={{ animation: "var(--animate-fade-in)" }}>
      <div className="w-full max-w-sm border-brutal bg-(--color-bg-alt) text-(--color-ink) shadow-brutal-lg p-5 text-center" style={{ animation: "var(--animate-pop)" }}>
        <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center border-brutal-2 shadow-brutal-sm gpu ${iconTone}`}>
          {tone === "failed" ? <X className="h-9 w-9" strokeWidth={3} /> : <ShieldCheck className="h-9 w-9" strokeWidth={3} />}
        </div>
        <div className="font-display text-base leading-tight">{title}</div>
        <p className="mx-auto mt-2 max-w-64 font-mono text-[11px] leading-relaxed text-(--color-ink-soft)">{message}</p>
        {actionLabel && onAction && (
          <div className="mt-5">
            <Button type="button" className="w-full" onClick={onAction}>
              {actionLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function LogLine({ text }: { text: string }) {
  return (
    <div className="flex gap-3">
      <span>{">"}</span>
      <span className="wrap-break-word">{text}</span>
    </div>
  )
}

function formatAnswerValue(value: unknown) {
  if (Array.isArray(value)) return value.map(String).join(", ")
  if (value && typeof value === "object") return JSON.stringify(value)
  return String(value ?? "-")
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
      <span className="font-bold truncate">{v}</span>
    </div>
  )
}
