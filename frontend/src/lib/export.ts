import type { BatchRunResponse } from "@/lib/api"

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function csvCell(value: unknown): string {
  const text = Array.isArray(value) ? value.join("; ") : String(value ?? "")
  return `"${text.replaceAll('"', '""')}"`
}

function safeFilename(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "batch-result"
}

function escapeHtml(value: unknown): string {
  const text = Array.isArray(value) ? value.join("; ") : String(value ?? "")
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

export function exportBatchJson(result: BatchRunResponse) {
  const filename = `${safeFilename(result.form_title)}-${result.session_id}.json`
  downloadFile(filename, JSON.stringify(result, null, 2), "application/json;charset=utf-8")
}

function batchRows(result: BatchRunResponse): unknown[][] {
  const answerKeys = Array.from(new Set(result.results.flatMap((item) => Object.keys(item.answers)))).sort()
  const headers = [
    "iteration",
    "persona_text",
    "submit_status",
    "http_code",
    "tokens_used",
    "retries",
    "log_id",
    "error_message",
    ...answerKeys,
  ]

  const rows = result.results.map((item) => [
    item.iteration,
    item.persona_text,
    item.submit_status,
    item.http_code,
    item.tokens_used,
    item.retries ?? 0,
    item.log_id ?? "",
    item.error_message ?? "",
    ...answerKeys.map((key) => item.answers[key] ?? ""),
  ])

  return [headers, ...rows]
}

export function exportBatchCsv(result: BatchRunResponse) {
  const csv = batchRows(result)
    .map((row) => row.map(csvCell).join(","))
    .join("\n")

  const filename = `${safeFilename(result.form_title)}-${result.session_id}.csv`
  downloadFile(filename, csv, "text/csv;charset=utf-8")
}

export function exportBatchExcel(result: BatchRunResponse) {
  const rows = batchRows(result)
  const tableRows = rows
    .map((row, rowIndex) => {
      const cell = rowIndex === 0 ? "th" : "td"
      return `<tr>${row.map((value) => `<${cell}>${escapeHtml(value)}</${cell}>`).join("")}</tr>`
    })
    .join("")
  const html = `<!doctype html><html><head><meta charset="utf-8" /></head><body><table>${tableRows}</table></body></html>`
  const filename = `${safeFilename(result.form_title)}-${result.session_id}.xls`
  downloadFile(filename, html, "application/vnd.ms-excel;charset=utf-8")
}
