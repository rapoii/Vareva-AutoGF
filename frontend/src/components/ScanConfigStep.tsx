import { ArrowLeft, FileQuestion, ListChecks, RotateCcw, Settings2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PixelSparkle, PixelStar } from "@/components/PixelDecor"
import type { CustomAnswerValue, FormField, FormSchema, GenerationConfig } from "@/lib/api"

type ScannedForm = {
  url: string
  schema: FormSchema
  sessionId: string
}

interface ScanConfigStepProps {
  scannedForm: ScannedForm
  config: GenerationConfig
  onConfigChange: (config: GenerationConfig) => void
  onResetConfig: () => void
  onBack: () => void
}

const ECONOMIC_OPTIONS = [
  { value: "", label: "DEFAULT", desc: "AI variasikan natural" },
  { value: "lower", label: "BAWAH", desc: "lebih sensitif harga" },
  { value: "middle", label: "MENENGAH", desc: "harga vs value" },
  { value: "upper", label: "ATAS", desc: "lebih toleran premium" },
] as const

export function ScanConfigStep({ scannedForm, config, onConfigChange, onResetConfig, onBack }: ScanConfigStepProps) {
  const schema = scannedForm.schema

  function update<K extends keyof GenerationConfig>(key: K, value: GenerationConfig[K]) {
    onConfigChange({ ...config, [key]: value })
  }

  function updateCustomAnswer(entryId: string, value: CustomAnswerValue) {
    const nextAnswers = { ...config.custom_answers }
    if (Array.isArray(value)) {
      if (value.length > 0) {
        nextAnswers[entryId] = value
      } else {
        delete nextAnswers[entryId]
      }
    } else if (value.trim()) {
      nextAnswers[entryId] = value
    } else {
      delete nextAnswers[entryId]
    }
    onConfigChange({ ...config, custom_answers: nextAnswers })
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-12" style={{ animation: "var(--animate-fade-in)" }}>
      <div className="lg:col-span-8 space-y-4">
        <Card tone="white" className="bg-(--color-candy-blush)">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <CardTitle className="flex items-center gap-2 wrap-break-word">
                  <FileQuestion className="w-5 h-5 shrink-0" strokeWidth={3} />
                  DETAIL SCAN FORM
                </CardTitle>
                <CardDescription className="wrap-break-word">
                  {schema.title}
                </CardDescription>
              </div>
              <Button onClick={onBack} variant="outline" size="sm" className="shrink-0">
                <ArrowLeft className="w-4 h-4" strokeWidth={3} />
                KEMBALI
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 font-mono text-xs">
            {schema.description && (
              <div className="border-brutal-2 bg-(--color-bg-alt) p-3 shadow-brutal-sm leading-relaxed wrap-break-word">
                {schema.description}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatBox k="FIELDS" v={String(schema.fields.length)} />
              <StatBox k="PAGES" v={String(schema.page_count ?? 1)} />
              <StatBox k="SCAN" v="READY" />
            </div>
          </CardContent>
        </Card>

        <Card tone="white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="w-5 h-5" strokeWidth={3} />
              PERTANYAAN TER-SCAN
            </CardTitle>
            <CardDescription>Semua field yang akan dipakai AI untuk generate jawaban.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {schema.fields.map((field, index) => (
              <div key={field.entry_id} className="border-brutal bg-(--color-bg-alt) p-3 shadow-brutal-sm">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="font-display text-[10px] bg-(--color-ink) text-(--color-brutal-pink) px-1.5 py-0.5">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <Badge variant="secondary">{field.question_type}</Badge>
                  {field.required && <Badge variant="accent">REQ</Badge>}
                </div>
                <div className="font-bold text-sm leading-snug wrap-break-word">{field.question_text}</div>
                <div className="font-mono text-[10px] text-(--color-ink-soft) mt-1 wrap-break-word">{field.entry_id}</div>
                <CustomAnswerControl
                  field={field}
                  value={config.custom_answers[field.entry_id]}
                  otherValue={config.custom_answers[`${field.entry_id}.other_option_response`]}
                  onChange={(value) => updateCustomAnswer(field.entry_id, value)}
                  onOtherChange={(value) => updateCustomAnswer(`${field.entry_id}.other_option_response`, value)}
                />
                {field.question_type === "LINEAR_SCALE" && (
                  <div className="mt-3 font-mono text-[10px] font-bold text-(--color-ink-soft)">
                    SCALE {field.scale_low ?? "?"}–{field.scale_high ?? "?"}
                    {field.scale_low_label ? ` · ${field.scale_low_label}` : ""}
                    {field.scale_high_label ? ` → ${field.scale_high_label}` : ""}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <aside className="lg:col-span-4 space-y-4">
        <Card tone="cream">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="w-5 h-5" strokeWidth={3} />
              KONFIGURASI
            </CardTitle>
            <CardDescription>Kosongkan kalau mau pakai default AI.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 px-5 pb-5">
            <div className="space-y-2.5">
              <Label htmlFor="persona-description" className="block pl-1">/* deskripsi persona */</Label>
              <Textarea
                id="persona-description"
                value={config.persona_description}
                onChange={(e) => update("persona_description", e.target.value)}
                placeholder="Contoh: buat persona mahasiswa hemat yang sering beli minuman promo..."
                className="mx-auto min-h-24"
              />
            </div>

            <div className="space-y-2.5">
              <Label className="block pl-1">/* kelas ekonomi */</Label>
              <div className="grid grid-cols-1 gap-2">
                {ECONOMIC_OPTIONS.map((option) => (
                  <button
                    key={option.value || "default"}
                    type="button"
                    onClick={() => update("economic_class", option.value)}
                    className={`press border-brutal p-3 text-left shadow-brutal-sm transition-colors ${
                      config.economic_class === option.value
                        ? "bg-(--color-primary) text-(--color-ink)"
                        : "bg-(--color-bg-alt) text-(--color-ink) hover:bg-(--color-candy-blush)"
                    }`}
                  >
                    <div className="font-display text-xs">{option.label}</div>
                    <div className="font-mono text-[10px] mt-1">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="answer-instructions" className="block pl-1">/* instruksi jawaban */</Label>
              <Textarea
                id="answer-instructions"
                value={config.answer_instructions}
                onChange={(e) => update("answer_instructions", e.target.value)}
                placeholder="Contoh: untuk pertanyaan harga, jawab lebih realistis dan jangan terlalu setuju kalau mahal..."
                className="mx-auto min-h-28"
              />
            </div>

            <Button onClick={onResetConfig} variant="outline" size="lg" className="w-full">
              <RotateCcw className="w-5 h-5" strokeWidth={3} />
              RESET KONFIGURASI
            </Button>
          </CardContent>
        </Card>

        <div className="border-brutal bg-(--color-candy-peach) text-(--color-ink) shadow-brutal-lg p-4 gpu" style={{ animation: "var(--animate-bob)" }}>
          <div className="font-display text-[10px] mb-2 flex items-center gap-2">
            <PixelStar size={16} /> CATATAN
          </div>
          <div className="font-mono text-xs leading-relaxed">
            Config ini opsional. Kalau kosong, AI tetap pakai persona default dan validasi opsi form tetap jalan.
          </div>
        </div>

        <Button onClick={onBack} variant="default" size="lg" className="w-full">
          <PixelSparkle size={18} />
          SIMPAN & KEMBALI
        </Button>
      </aside>
    </div>
  )
}

function CustomAnswerControl({
  field,
  value,
  otherValue,
  onChange,
  onOtherChange,
}: {
  field: FormField
  value?: CustomAnswerValue
  otherValue?: CustomAnswerValue
  onChange: (value: CustomAnswerValue) => void
  onOtherChange: (value: CustomAnswerValue) => void
}) {
  if (field.question_type === "MULTIPLE_CHOICE" || field.question_type === "DROPDOWN" || field.question_type === "LINEAR_SCALE") {
    const selected = Array.isArray(value) ? "" : value ?? ""
    const otherText = Array.isArray(otherValue) ? otherValue.join(", ") : otherValue ?? ""
    return (
      <div className="mt-3 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {field.options.map((option) => (
            <AnswerChip key={option} active={selected === option} onClick={() => onChange(selected === option ? "" : option)}>
              {option}
            </AnswerChip>
          ))}
        </div>
        {selected === "Yang lain:" && (
          <OtherInput field={field} value={otherText} onChange={onOtherChange} />
        )}
      </div>
    )
  }

  if (field.question_type === "CHECKBOXES") {
    const selected = Array.isArray(value) ? value : []
    const otherText = Array.isArray(otherValue) ? otherValue.join(", ") : otherValue ?? ""
    return (
      <div className="mt-3 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {field.options.map((option) => (
            <AnswerChip
              key={option}
              active={selected.includes(option)}
              onClick={() => onChange(selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option])}
            >
              {option}
            </AnswerChip>
          ))}
        </div>
        {selected.includes("Yang lain:") && (
          <OtherInput field={field} value={otherText} onChange={onOtherChange} />
        )}
      </div>
    )
  }

  const textValue = Array.isArray(value) ? value.join(", ") : value ?? ""
  return (
    <div className="mt-4 border-t-2 border-dashed border-(--color-ink) pt-3 space-y-2">
      <Label htmlFor={`custom-${field.entry_id}`}>/* custom jawaban opsional */</Label>
      <Textarea
        id={`custom-${field.entry_id}`}
        value={textValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Kosongkan untuk default AI..."
        className="min-h-18 text-xs"
      />
    </div>
  )
}

function OtherInput({ field, value, onChange }: { field: FormField; value: string; onChange: (value: string) => void }) {
  return (
    <div className="max-w-xl space-y-1">
      <Label htmlFor={`other-${field.entry_id}`}>/* isi Yang lain */</Label>
      <Textarea
        id={`other-${field.entry_id}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Tulis jawaban lainnya..."
        className="min-h-16 text-xs"
      />
    </div>
  )
}

function AnswerChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`press border-brutal-2 px-2 py-1.5 font-mono text-[10px] font-bold shadow-brutal-sm transition-colors ${
        active ? "bg-(--color-primary) text-(--color-ink)" : "bg-(--color-surface) text-(--color-ink) hover:bg-(--color-candy-blush)"
      }`}
    >
      {children}
    </button>
  )
}

function StatBox({ k, v }: { k: string; v: string }) {
  return (
    <div className="border-brutal bg-(--color-bg-alt) shadow-brutal-sm p-3 text-center">
      <div className="font-display text-xl">{v}</div>
      <div className="font-mono text-[9px] uppercase tracking-widest font-bold">{k}</div>
    </div>
  )
}
