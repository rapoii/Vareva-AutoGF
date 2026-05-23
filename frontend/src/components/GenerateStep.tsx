import { useState } from "react"
import { Sparkles, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { api, type FormSchema, type GenerateResponse } from "@/lib/api"

interface GenerateStepProps {
  schema: FormSchema
  sessionId: number
  personaText: string
  formUrl: string
  onDone: (result: GenerateResponse) => void
  onBack: () => void
}

function typeLabel(type: string) {
  const map: Record<string, string> = {
    SHORT_ANSWER: "Short",
    PARAGRAPH: "Paragraf",
    MULTIPLE_CHOICE: "Pilihan Ganda",
    CHECKBOXES: "Checkbox",
    DROPDOWN: "Dropdown",
    LINEAR_SCALE: "Skala",
    GRID: "Grid",
    OTHER: "Lainnya",
  }
  return map[type] ?? type
}

function typeColor(type: string): "default" | "secondary" | "outline" | "success" | "warning" {
  if (["MULTIPLE_CHOICE", "DROPDOWN"].includes(type)) return "default"
  if (["CHECKBOXES"].includes(type)) return "secondary"
  if (["LINEAR_SCALE"].includes(type)) return "warning"
  return "outline"
}

export function GenerateStep({ schema, personaText, onDone, onBack }: GenerateStepProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [schemaExpanded, setSchemaExpanded] = useState(false)

  async function handleGenerate() {
    setError(null)
    setLoading(true)
    try {
      const result = await api.generate(schema, personaText)
      onDone(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal generate jawaban")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{schema.title}</CardTitle>
              {schema.description && (
                <CardDescription className="mt-1">{schema.description}</CardDescription>
              )}
            </div>
            <Badge variant="secondary">{schema.fields.length} pertanyaan</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <button
            onClick={() => setSchemaExpanded((v) => !v)}
            className="flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            {schemaExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {schemaExpanded ? "Sembunyikan" : "Lihat"} semua pertanyaan
          </button>
          {schemaExpanded && (
            <div className="mt-4 space-y-3">
              {schema.fields.map((field, i) => (
                <div key={field.entry_id} className="flex items-start gap-3 py-2 border-b border-[hsl(var(--border))] last:border-0">
                  <span className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 w-5 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{field.question_text}</span>
                      {field.required && <span className="text-red-500 text-xs">*</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={typeColor(field.question_type)} className="text-xs">
                        {typeLabel(field.question_type)}
                      </Badge>
                      {field.options.length > 0 && (
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">
                          {field.options.slice(0, 3).join(", ")}{field.options.length > 3 ? ` +${field.options.length - 3}` : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-[hsl(var(--primary))]" />
            Generate Jawaban AI
          </CardTitle>
          <CardDescription>
            AI akan membuat jawaban untuk semua {schema.fields.length} pertanyaan menggunakan persona yang dipilih.
            Jawaban akan divalidasi otomatis sebelum ditampilkan.
          </CardDescription>
        </CardHeader>
      </Card>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} disabled={loading} className="flex-1">
          Kembali
        </Button>
        <Button onClick={handleGenerate} disabled={loading} className="flex-2" size="lg">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Jawaban
            </>
          )}
        </Button>
      </div>

      {loading && (
        <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
          Mengirim prompt ke AI dan memvalidasi jawaban...
        </p>
      )}
    </div>
  )
}
