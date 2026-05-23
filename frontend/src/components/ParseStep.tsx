import { useState } from "react"
import { Link2, Loader2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { api, type FormSchema, type Persona } from "@/lib/api"

interface ParseStepProps {
  personas: Persona[]
  onDone: (schema: FormSchema, sessionId: number, personaText: string, formUrl: string) => void
}

export function ParseStep({ personas, onDone }: ParseStepProps) {
  const [url, setUrl] = useState("")
  const [selectedPersonaId, setSelectedPersonaId] = useState<number | null>(null)
  const [customPersona, setCustomPersona] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedPersona = personas.find((p) => p.id === selectedPersonaId)
  const personaText = selectedPersona ? selectedPersona.system_prompt : customPersona

  async function handleParse() {
    if (!url.trim()) { setError("Masukkan URL Google Form."); return }
    if (!personaText.trim()) { setError("Pilih atau isi persona terlebih dahulu."); return }
    setError(null)
    setLoading(true)
    try {
      const result = await api.parse(url.trim())
      onDone(result.schema_, result.session_id, personaText, url.trim())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal parse form")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Link2 className="w-5 h-5 text-[hsl(var(--primary))]" />
            URL Google Form
          </CardTitle>
          <CardDescription>Masukkan URL Google Form publik yang ingin diisi otomatis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label htmlFor="form-url">Form URL</Label>
          <Input
            id="form-url"
            placeholder="https://docs.google.com/forms/d/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5 text-[hsl(var(--primary))]" />
            Persona
          </CardTitle>
          <CardDescription>Pilih persona tersimpan atau tulis persona kustom</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {personas.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {personas.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPersonaId(selectedPersonaId === p.id ? null : p.id)
                    setCustomPersona("")
                  }}
                  className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                    selectedPersonaId === p.id
                      ? "bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]"
                      : "bg-white text-[hsl(var(--foreground))] border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}

          {selectedPersona ? (
            <div className="rounded-md bg-[hsl(var(--muted))] p-3 text-sm text-[hsl(var(--muted-foreground))] font-mono whitespace-pre-wrap max-h-36 overflow-auto">
              {selectedPersona.system_prompt}
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="custom-persona">Persona Kustom</Label>
              <Textarea
                id="custom-persona"
                placeholder={"Nama: Budi Santoso\nUmur: 28\nProfesi: Software Engineer\nTone: casual dan friendly"}
                value={customPersona}
                onChange={(e) => setCustomPersona(e.target.value)}
                rows={5}
                disabled={loading}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Button onClick={handleParse} disabled={loading} className="w-full" size="lg">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Parsing form...
          </>
        ) : (
          "Parse Form"
        )}
      </Button>

      {loading && (
        <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
          Mengambil struktur form dari Google...
        </p>
      )}
    </div>
  )
}
