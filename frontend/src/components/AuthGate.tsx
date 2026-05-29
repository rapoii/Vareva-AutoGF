import { useEffect, useState } from "react"
import { LogIn, UserPlus, Shield } from "lucide-react"
import { api, type AuthUser } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingOverlay } from "@/components/LoadingOverlay"

interface AuthGateProps {
  onAuthenticated: (user: AuthUser) => void
}

export function AuthGate({ onAuthenticated }: AuthGateProps) {
  const [mode, setMode] = useState<"login" | "register">("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const [now, setNow] = useState(0)
  const cooldownSeconds = Math.max(0, Math.ceil((cooldownUntil - now) / 1000))

  useEffect(() => {
    if (cooldownSeconds <= 0) return
    const intervalId = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(intervalId)
  }, [cooldownSeconds])

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) return
    if (mode === "register" && !name.trim()) return
    if (!isRegister && cooldownSeconds > 0) return

    setLoading(true)
    setError(null)
    try {
      const result = mode === "register"
        ? await api.register(name.trim(), email.trim(), password)
        : await api.login(email.trim(), password)
      onAuthenticated(result.user)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Auth gagal"
      const match = message.match(/(\d+)\s*detik/i)
      if (!isRegister && match) {
        const currentTime = Date.now()
        setNow(currentTime)
        setCooldownUntil(currentTime + Number(match[1]) * 1000)
      }
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const isRegister = mode === "register"

  return (
    <div className="grid min-h-[calc(100vh-12rem)] place-items-center py-8">
      {loading && (
        <LoadingOverlay
          title={isRegister ? "REGISTER AKUN" : "LOGIN AKUN"}
          message={isRegister ? "Membuat akun dan menyiapkan session." : "Memverifikasi akun dan menyiapkan session."}
        />
      )}

      <Card tone="cream" className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5">
            <span className="font-display text-xs bg-(--color-bg-alt) text-(--color-ink) border-brutal-2 px-2 py-1.5 leading-none">
              <Shield className="w-4 h-4" />
            </span>
            {isRegister ? "REGISTER" : "LOGIN"}
          </CardTitle>
          <CardDescription>
            Masuk dulu sebelum menjalankan batch Google Form.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isRegister && (
            <div className="space-y-2">
              <Label htmlFor="auth-name">/* nama */</Label>
              <Input id="auth-name" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} placeholder="Nama kamu" />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="auth-email">/* email */</Label>
            <Input id="auth-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} placeholder="email@example.com" autoComplete="email" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="auth-password">/* password */</Label>
            <Input id="auth-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} placeholder="Password" autoComplete={isRegister ? "new-password" : "current-password"} />
          </div>

          {error && (
            <div className="border-brutal bg-(--color-destructive) text-(--color-destructive-foreground) shadow-[2px_2px_0_0_var(--color-ink)] p-3 text-center font-mono text-xs font-bold" style={{ borderColor: "var(--color-ink)" }}>
              {error}
            </div>
          )}

          <Button onClick={handleSubmit} disabled={loading || cooldownSeconds > 0 || !email.trim() || !password.trim() || (isRegister && !name.trim())} className="w-full !shadow-[2px_2px_0_0_currentColor] hover:!shadow-[2px_2px_0_0_currentColor] disabled:!shadow-[2px_2px_0_0_currentColor]" size="lg">
            {isRegister ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
            {!isRegister && cooldownSeconds > 0 ? `COOLDOWN ${cooldownSeconds}s` : isRegister ? "REGISTER" : "LOGIN"}
          </Button>

          <button
            type="button"
            onClick={() => {
              setMode(isRegister ? "login" : "register")
              setError(null)
            }}
            className="w-full font-mono text-xs font-bold underline underline-offset-4"
          >
            {isRegister ? "Sudah punya akun? Login" : "Belum punya akun? Register"}
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
