import { useCallback, useEffect, useState } from "react"
import { ArrowLeft, History, KeyRound, Link2, Save, Trash2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { api, type AuthUser, type ProfileHistoryItem } from "@/lib/api"

interface ProfileStepProps {
  user: AuthUser
  onUserUpdated: (user: AuthUser) => void
  onBack: () => void
}

export function ProfileStep({ user, onUserUpdated, onBack }: ProfileStepProps) {
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [history, setHistory] = useState<ProfileHistoryItem[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
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
    const timeoutId = window.setTimeout(() => {
      void loadHistory()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadHistory])

  async function handleSaveProfile() {
    setSavingProfile(true)
    setError(null)
    setMessage(null)
    try {
      const result = await api.updateProfile(name.trim(), email.trim())
      onUserUpdated(result.user)
      setMessage("Profile berhasil disimpan.")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan profile")
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleChangePassword() {
    setSavingPassword(true)
    setError(null)
    setMessage(null)
    try {
      await api.changePassword(currentPassword, newPassword)
      setCurrentPassword("")
      setNewPassword("")
      setMessage("Password berhasil diganti.")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengganti password")
    } finally {
      setSavingPassword(false)
    }
  }

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
    <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-12" style={{ animation: "var(--animate-fade-in)" }}>
      <div className="lg:col-span-8 space-y-4">
        <div>
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4" strokeWidth={3} />
            BACK
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

        <Card tone="white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5" strokeWidth={3} />
              EDIT PROFILE
            </CardTitle>
            <CardDescription>Ubah nama dan email akun login.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Nama</Label>
              <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} disabled={savingProfile} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input id="profile-email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={savingProfile} />
            </div>
            <Button onClick={handleSaveProfile} disabled={savingProfile || !name.trim() || !email.trim()} className="w-full" size="lg">
              <Save className="w-5 h-5" strokeWidth={3} />
              SIMPAN PROFILE
            </Button>
          </CardContent>
        </Card>

        <Card tone="cream">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <KeyRound className="w-5 h-5" strokeWidth={3} />
              GANTI PASSWORD
            </CardTitle>
            <CardDescription>Password baru minimal 6 karakter.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Password sekarang</Label>
              <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} disabled={savingPassword} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Password baru</Label>
              <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={savingPassword} />
            </div>
            <Button onClick={handleChangePassword} disabled={savingPassword || !currentPassword || newPassword.length < 6} variant="secondary" className="w-full" size="lg">
              <KeyRound className="w-5 h-5" strokeWidth={3} />
              GANTI PASSWORD
            </Button>
          </CardContent>
        </Card>
      </div>

      <aside className="lg:col-span-4 space-y-4">
        <Card tone="white" className="bg-(--color-candy-blush)">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <History className="w-4 h-4" strokeWidth={3} />
              HISTORY FORM
            </CardTitle>
            <CardDescription>Hapus history jawaban dan nama per link Google Form.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingHistory && <div className="font-mono text-xs font-bold">Loading history...</div>}
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
      </aside>
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
