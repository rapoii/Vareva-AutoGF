import { useCallback, useEffect, useState } from "react"
import { ArrowLeft, History, Link2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingOverlay } from "@/components/LoadingOverlay"
import { api, type ProfileHistoryItem } from "@/lib/api"

interface HistoryStepProps {
  initialHistory?: ProfileHistoryItem[]
  onBack: () => void
}

export function HistoryStep({ initialHistory, onBack }: HistoryStepProps) {
  const [history, setHistory] = useState<ProfileHistoryItem[]>(initialHistory ?? [])
  const [loadingHistory, setLoadingHistory] = useState(!initialHistory)
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<ProfileHistoryItem | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true)
    setError(null)
    try {
      setHistory(await api.getProfileHistory())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat history")
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  useEffect(() => {
    if (initialHistory) return
    const timeoutId = window.setTimeout(() => {
      void loadHistory()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [initialHistory, loadHistory])

  async function handleDeleteHistory(item: ProfileHistoryItem) {
    setDeletingUrl(item.form_url)
    setConfirmDelete(null)
    setError(null)
    setMessage(null)
    try {
      const deleted = await api.deleteFormHistory(item.form_url)
      setHistory((items) => items.filter((entry) => entry.form_url !== item.form_url))
      setMessage(`History dihapus: ${deleted.deleted_submission_logs} jawaban, ${deleted.deleted_generated_persona_logs} nama/persona.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menghapus history")
    } finally {
      setDeletingUrl(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4" style={{ animation: "var(--animate-fade-in)" }}>
      {loadingHistory && <LoadingOverlay title="MEMUAT HISTORY" message="Mengambil history form dari storage." />}
      {deletingUrl && <LoadingOverlay title="HAPUS HISTORY" message="Menghapus history jawaban dan persona form ini." />}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-(--color-ink)/55 px-4 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm border-brutal bg-(--color-bg-alt) text-(--color-ink) shadow-brutal-lg p-5 text-center"
            style={{ animation: "var(--animate-pop)" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-(--color-destructive) text-(--color-destructive-foreground) gpu">
              <Trash2 className="h-8 w-8" strokeWidth={3} />
            </div>
            <div className="font-display text-base leading-tight">HAPUS HISTORY?</div>
            <p className="mx-auto mt-2 max-w-64 font-mono text-[11px] leading-relaxed text-(--color-ink-soft)">
              Semua jawaban dan nama/persona form ini akan dihapus dari storage.
            </p>
            <div className="mt-4 border-brutal-2 bg-(--color-candy-cream) px-3 py-2 text-left font-mono text-[11px] font-bold leading-relaxed wrap-break-word">
              {confirmDelete.form_title || confirmDelete.form_url}
            </div>
            <div className="mt-5 space-y-2">
              <button
                type="button"
                className="relative inline-flex h-14 w-full items-center justify-center gap-2 rounded-md border-[3px] border-(--color-ink) bg-(--color-destructive) px-7 py-2 font-bold uppercase tracking-wide text-(--color-destructive-foreground) select-none transition-transform hover:-translate-x-[2px] hover:-translate-y-[2px] hover:bg-(--color-destructive)/90 hover:[box-shadow:9px_9px_0_0_color-mix(in_srgb,var(--color-ink)_88%,var(--color-brutal-pink))] active:translate-x-[7px] active:translate-y-[7px] active:[box-shadow:0_0_0_0_var(--color-ink)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--color-ink)"
                style={{ boxShadow: "7px 7px 0 0 color-mix(in srgb, var(--color-ink) 88%, var(--color-brutal-pink))" }}
                onClick={() => void handleDeleteHistory(confirmDelete)}
              >
                <Trash2 className="w-4 h-4" strokeWidth={3} />
                HAPUS HISTORY
              </button>
              <Button type="button" variant="outline" size="lg" className="w-full" onClick={() => setConfirmDelete(null)}>
                BATAL
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4 min-w-0">
        <div>
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4" strokeWidth={3} />
            KEMBALI
          </Button>
        </div>

        {message && (
          <div className="border-brutal bg-(--color-bg-alt) text-(--color-ink) shadow-brutal-sm px-4 py-3 font-mono text-sm font-bold">
            {message}
          </div>
        )}
        {error && (
          <div className="border-brutal bg-(--color-destructive) text-(--color-destructive-foreground) bg-stripe-warn shadow-brutal-sm px-4 py-3 font-mono text-sm font-bold">
            {error}
          </div>
        )}

        <Card tone="white" className="bg-(--color-candy-blush)">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="w-5 h-5" strokeWidth={3} />
              HISTORY FORM
            </CardTitle>
            <CardDescription>Hapus history jawaban dan nama per link Google Form.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!loadingHistory && history.length === 0 && (
              <div className="border-brutal-2 bg-(--color-bg-alt) p-3 font-mono text-xs font-bold text-(--color-ink-soft)">
                Belum ada history form.
              </div>
            )}
            {history.map((item) => (
              <div key={item.form_url} className="border-brutal bg-(--color-bg-alt) shadow-brutal-sm p-3 space-y-3">
                <div className="flex items-start gap-2">
                  <Link2 className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={3} />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm wrap-break-word">{item.form_title || "Google Form"}</div>
                    <div className="font-mono text-[10px] text-(--color-ink-soft) wrap-break-word">{item.form_url}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 font-mono text-[10px]">
                  <MiniStat label="SESI" value={item.session_count} />
                  <MiniStat label="JAWAB" value={item.submission_count} />
                  <MiniStat label="NAMA" value={item.persona_count} />
                </div>
                <Button
                  onClick={() => setConfirmDelete(item)}
                  disabled={deletingUrl === item.form_url}
                  variant="outline"
                  size="default"
                  className="group w-full !border-(--color-ink) !bg-(--color-destructive) !text-(--color-ink) shadow-brutal hover:!border-(--color-ink) hover:!bg-(--color-bg-alt) hover:!text-(--color-ink) hover:!shadow-[6px_6px_0_0_color-mix(in_srgb,var(--color-ink)_88%,var(--color-brutal-pink))]"
                >
                  <Trash2 className="w-4 h-4 text-(--color-destructive-foreground) group-hover:text-(--color-destructive)" strokeWidth={3} />
                  <span className="text-(--color-destructive-foreground) group-hover:text-(--color-destructive)">HAPUS HISTORY</span>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-brutal-2 bg-(--color-bg-alt) text-(--color-ink) px-2 py-1 text-center">
      <div className="font-display text-sm">{value}</div>
      <div className="font-bold">{label}</div>
    </div>
  )
}
