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
    const ok = window.confirm(`Hapus semua history jawaban dan nama untuk form ini?\n\n${item.form_title || item.form_url}`)
    if (!ok) return
    setDeletingUrl(item.form_url)
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
                  onClick={() => handleDeleteHistory(item)}
                  disabled={deletingUrl === item.form_url}
                  variant="outline"
                  size="default"
                  className="w-full !bg-(--color-destructive) !text-(--color-ink) shadow-brutal hover:!bg-(--color-bg-alt) hover:!text-(--color-destructive)"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={3} />
                  HAPUS HISTORY
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
