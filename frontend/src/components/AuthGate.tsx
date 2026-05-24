import { useState } from "react"
import { LogIn, UserPlus, Shield } from "lucide-react"
import { api, type AuthUser } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PixelRobot, PixelSparkle } from "@/components/PixelDecor"

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

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) return
    if (mode === "register" && !name.trim()) return

    setLoading(true)
    setError(null)
    try {
      const result = mode === "register"
        ? await api.register(name.trim(), email.trim(), password)
        : await api.login(email.trim(), password)
      onAuthenticated(result.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auth gagal")
    } finally {
      setLoading(false)
    }
  }

  const isRegister = mode === "register"

  return (
    <div className="grid min-h-[calc(100vh-12rem)] place-items-center py-8">
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
          <div className="border-brutal bg-(--color-bg-alt) shadow-brutal-sm p-4 flex items-center gap-3">
            <PixelRobot className="w-10 h-10 shrink-0" />
            <div>
              <div className="font-display text-[10px] mb-1">VAREVA ACCOUNT</div>
              <div className="font-mono text-xs text-current">Data user disimpan via Google Sheets storage.</div>
            </div>
          </div>

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
            <div className="border-brutal bg-(--color-destructive) text-(--color-destructive-foreground) bg-stripe-warn p-3 font-mono text-xs font-bold">
              {error}
            </div>
          )}

          <Button onClick={handleSubmit} disabled={loading || !email.trim() || !password.trim() || (isRegister && !name.trim())} className="w-full" size="lg">
            {isRegister ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
            {loading ? "LOADING..." : isRegister ? "REGISTER" : "LOGIN"}
            <PixelSparkle size={18} />
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
