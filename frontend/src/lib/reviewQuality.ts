import type { FormField } from "@/lib/api"

const OCCUPATION_KEYWORDS = ["pekerjaan", "profesi", "occupation"]
const SPECIFIC_OCCUPATION_WORDS = ["semester", "digital marketing", "it", "programmer", "developer", "company", "perusahaan", "jurusan"]
const RISKY_FEMALE_NAME_PARTS = ["andi", "irawan", "wicaksono", "saputra", "putra", "prasetyo", "santoso"]

function normalize(value: unknown): string {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ")
}

function fieldIncludes(field: FormField, keywords: string[]): boolean {
  const text = normalize(field.question_text)
  return keywords.some((keyword) => text.includes(keyword))
}

export function getAnswerWarnings(
  field: FormField,
  value: string | string[] | undefined,
  allPersonaAnswers: Record<string, string | string[]>[],
  activeIndex: number,
): string[] {
  const warnings: string[] = []
  const normalized = normalize(Array.isArray(value) ? value.join(" ") : value)

  if (field.required && !normalized) {
    warnings.push("Required answer is empty")
  }

  if (fieldIncludes(field, OCCUPATION_KEYWORDS)) {
    const hasSpecificWord = SPECIFIC_OCCUPATION_WORDS.some((word) => normalized.includes(word))
    if (hasSpecificWord) {
      warnings.push("Occupation looks too specific")
    }
  }

  if (fieldIncludes(field, ["nama", "name"])) {
    const parts = normalized.split(" ")
    if (parts.some((part) => RISKY_FEMALE_NAME_PARTS.includes(part))) {
      warnings.push("Name contains a potentially gender-confusing part")
    }
  }

  const duplicateCount = allPersonaAnswers.filter((answers, index) => {
    if (index === activeIndex) return false
    const other = answers[field.entry_id]
    return normalize(Array.isArray(other) ? other.join("|") : other) === normalize(Array.isArray(value) ? value.join("|") : value)
  }).length

  if (duplicateCount > 0 && !fieldIncludes(field, ["nama", "name", "usia", "umur", "age"])) {
    warnings.push(`Same answer as ${duplicateCount} other persona(s)`)
  }

  return warnings
}
