import { useState } from "react"
import { ArrowLeft, KeyRound, Save, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingOverlay } from "@/components/LoadingOverlay"
import { api, type AuthUser } from "@/lib/api"

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
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const overlayMessage = savingProfile
    ? { title: "SIMPAN PROFILE", message: "Menyimpan perubahan nama dan email." }
    : savingPassword
      ? { title: "GANTI PASSWORD", message: "Memperbarui password akun." }
      : null

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


  return (
    <div className="mx-auto w-full max-w-6xl space-y-4" style={{ animation: "var(--animate-fade-in)" }}>
      {overlayMessage && <LoadingOverlay title={overlayMessage.title} message={overlayMessage.message} />}
      <div className="space-y-4">
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

        <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
          <Card tone="white" className="h-full">
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

          <Card tone="cream" className="h-full">
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
      </div>
    </div>
  )
}
