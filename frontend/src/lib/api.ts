const BASE = "http://127.0.0.1:8000"
const TOKEN_KEY = "vareva_auth_token"

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export type QuestionType =
  | "SHORT_ANSWER"
  | "PARAGRAPH"
  | "MULTIPLE_CHOICE"
  | "CHECKBOXES"
  | "DROPDOWN"
  | "LINEAR_SCALE"
  | "GRID"
  | "OTHER"

export interface FormField {
  entry_id: string
  question_text: string
  question_type: QuestionType
  required: boolean
  options: string[]
  scale_low?: number | null
  scale_high?: number | null
  scale_low_label?: string | null
  scale_high_label?: string | null
  page_index?: number
}

export interface FormSchema {
  form_id: string
  title: string
  description?: string | null
  fields: FormField[]
  page_count?: number
}

export interface Persona {
  id?: number
  name: string
  description?: string
  tone?: string
  system_prompt?: string
}

export interface GenerateResponse {
  answers: Record<string, unknown>
  tokens_used: number
  retries: number
}

export interface SubmitResponse {
  status: string
  http_code: number
  session_id?: string
  log_id?: string
  error_message?: string | null
}

export interface IterationResult {
  iteration: number
  persona_text: string
  answers: Record<string, unknown>
  tokens_used: number
  retries: number
  submit_status: string
  http_code: number
  log_id?: string | null
  error_message?: string | null
}

export interface BatchRunResponse {
  session_id: string
  form_title: string
  count: number
  success_count: number
  fail_count: number
  results: IterationResult[]
}

export interface ParseResponse {
  schema_: FormSchema
  session_id: string
  form_id?: string
  title?: string
  description?: string | null
  fields?: FormField[]
  page_count?: number
}

export interface AuthUser {
  id: string
  name: string
  email: string
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

export interface ProfileHistoryItem {
  form_url: string
  form_title: string
  session_count: number
  submission_count: number
  persona_count: number
  last_activity_at: string
}

export interface DeleteFormHistoryResponse {
  deleted_sessions: number
  deleted_form_schemas: number
  deleted_submission_logs: number
  deleted_generated_persona_logs: number
}

export interface SSELogEvent {
  type: "log"
  data: {
    phase: "init" | "parse" | "generate" | "submit"
    message: string
  }
}

export interface SSEProviderEvent {
  type: "provider"
  data: {
    phase: "generate" | "submit"
    provider: string
    iteration?: number
  }
}

export interface SSEIterationResultEvent {
  type: "iteration_result"
  data: IterationResult
}

export interface SSECompleteEvent {
  type: "complete"
  data: BatchRunResponse
}

export interface SSEErrorEvent {
  type: "error"
  data: {
    message: string
  }
}

export type SSEEvent = SSELogEvent | SSEProviderEvent | SSEIterationResultEvent | SSECompleteEvent | SSEErrorEvent

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken()
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const detail = typeof data?.detail === "string" ? data.detail : "Request failed"
    throw new Error(detail)
  }

  return data as T
}

function normalizeParseResponse(data: FormSchema | ParseResponse): ParseResponse {
  if ("schema_" in data) {
    return data
  }

  return {
    schema_: data,
    session_id: "",
    form_id: data.form_id,
    title: data.title,
    description: data.description,
    fields: data.fields,
    page_count: data.page_count,
  }
}

export const api = {
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const result = await requestJson<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    })
    setAuthToken(result.token)
    return result
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const result = await requestJson<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
    setAuthToken(result.token)
    return result
  },

  async me(): Promise<AuthUser> {
    const result = await requestJson<{ user: AuthUser }>("/api/auth/me")
    return result.user
  },

  async updateProfile(name: string, email: string): Promise<AuthResponse> {
    const result = await requestJson<AuthResponse>("/api/auth/profile", {
      method: "PATCH",
      body: JSON.stringify({ name, email }),
    })
    setAuthToken(result.token)
    return result
  },

  async changePassword(current_password: string, new_password: string): Promise<void> {
    await requestJson<{ user: AuthUser }>("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ current_password, new_password }),
    })
  },

  async getProfileHistory(): Promise<ProfileHistoryItem[]> {
    const result = await requestJson<{ items: ProfileHistoryItem[] }>("/api/auth/history")
    return result.items
  },

  async deleteFormHistory(form_url: string): Promise<DeleteFormHistoryResponse> {
    return requestJson<DeleteFormHistoryResponse>("/api/auth/history/delete", {
      method: "POST",
      body: JSON.stringify({ form_url }),
    })
  },

  async parse(url: string): Promise<ParseResponse> {
    const data = await requestJson<FormSchema | ParseResponse>("/api/parse/", {
      method: "POST",
      body: JSON.stringify({ url }),
    })
    return normalizeParseResponse(data)
  },

  async generate(schema: FormSchema, persona_text: string): Promise<GenerateResponse> {
    return requestJson<GenerateResponse>("/api/generate/", {
      method: "POST",
      body: JSON.stringify({ schema, persona_text }),
    })
  },

  async submit(
    form_url: string,
    answers: Record<string, unknown>,
    session_id = "",
    page_count = 1,
  ): Promise<SubmitResponse> {
    return requestJson<SubmitResponse>("/api/submit/", {
      method: "POST",
      body: JSON.stringify({ form_url, answers, session_id, page_count }),
    })
  },

  async batchRun(form_url: string, count: number, skip_submit: boolean): Promise<BatchRunResponse> {
    return requestJson<BatchRunResponse>("/api/batch/run", {
      method: "POST",
      body: JSON.stringify({ form_url, count, skip_submit }),
    })
  },
}

export async function batchRunStream(
  form_url: string,
  count: number,
  skip_submit: boolean,
  onEvent: (event: SSEEvent) => void | Promise<void>,
): Promise<void> {
  const response = await fetch(`${BASE}/api/batch/run-stream`, {
    method: "POST",
    headers: {
      "Accept": "text/event-stream",
      "Content-Type": "application/json",
      ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
    },
    body: JSON.stringify({ form_url, count, skip_submit }),
  })

  if (!response.ok || !response.body) {
    const data = await response.json().catch(() => null)
    const detail = typeof data?.detail === "string" ? data.detail : "Gagal membuka stream batch"
    throw new Error(detail)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const events = buffer.split("\n\n")
    buffer = events.pop() ?? ""

    for (const rawEvent of events) {
      const event = parseSseEvent(rawEvent)
      if (event) {
        await onEvent(event)
      }
    }
  }
}

function parseSseEvent(rawEvent: string): SSEEvent | null {
  const eventLine = rawEvent.split("\n").find((line) => line.startsWith("event:"))
  const dataLine = rawEvent.split("\n").find((line) => line.startsWith("data:"))

  if (!eventLine || !dataLine) return null

  const type = eventLine.replace("event:", "").trim()
  const data = JSON.parse(dataLine.replace("data:", "").trim())

  if (type === "log" || type === "provider" || type === "iteration_result" || type === "complete" || type === "error") {
    return { type, data } as SSEEvent
  }

  return null
}
