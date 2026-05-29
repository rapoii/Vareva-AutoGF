const BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? "" : "http://127.0.0.1:8000")
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

export type CustomAnswerValue = string | string[]

export interface GenerationConfig {
  persona_description: string
  economic_class: "" | "lower" | "middle" | "upper"
  answer_instructions: string
  custom_answers: Record<string, CustomAnswerValue>
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

export interface BatchSessionStatus extends BatchRunResponse {
  form_url: string
  mode: string
  status: string
  fields?: FormField[]
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

const API_LOADING_EVENT = "vareva-api-loading"
const SILENT_LOADING_PATHS = ["/api/batch/sessions/"]
let activeLoadingRequests = 0

export interface ApiLoadingEventDetail {
  active: boolean
  path: string
}

function shouldShowApiLoading(path: string) {
  return !SILENT_LOADING_PATHS.some((prefix) => path.startsWith(prefix) && path.endsWith("/process"))
}

function emitApiLoading(active: boolean, path: string) {
  window.dispatchEvent(new CustomEvent<ApiLoadingEventDetail>(API_LOADING_EVENT, { detail: { active, path } }))
}

export function subscribeApiLoading(listener: (detail: ApiLoadingEventDetail) => void) {
  const handler = (event: Event) => listener((event as CustomEvent<ApiLoadingEventDetail>).detail)
  window.addEventListener(API_LOADING_EVENT, handler)
  return () => window.removeEventListener(API_LOADING_EVENT, handler)
}

function translateApiError(message: string) {
  const normalized = message.toLowerCase()
  if (normalized.includes("email") && normalized.includes("valid")) return "Alamat email tidak valid. Pastikan email memakai format nama@domain.com."
  if (normalized.includes("field required")) return "Ada data wajib yang belum diisi."
  if (normalized.includes("string should have at least")) return "Input terlalu pendek. Periksa lagi data yang kamu isi."
  if (normalized.includes("string should have at most")) return "Input terlalu panjang. Periksa lagi data yang kamu isi."
  return message
}

function formatErrorDetail(detail: unknown) {
  if (typeof detail === "string") return translateApiError(detail)
  if (Array.isArray(detail)) {
    const first = detail[0]
    if (first && typeof first === "object" && "msg" in first && typeof first.msg === "string") {
      return translateApiError(first.msg)
    }
  }
  return "Permintaan gagal"
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken()
  const showLoading = shouldShowApiLoading(path)
  if (showLoading) {
    activeLoadingRequests += 1
    emitApiLoading(true, path)
  }
  try {
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
      throw new Error(formatErrorDetail(data?.detail))
    }

    return data as T
  } finally {
    if (showLoading) {
      activeLoadingRequests = Math.max(0, activeLoadingRequests - 1)
      if (activeLoadingRequests === 0) emitApiLoading(false, path)
    }
  }
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


  async startBatchJob(
    form_url: string,
    count: number,
    skip_submit: boolean,
    session_id?: string,
    generation_config?: GenerationConfig | null,
  ): Promise<BatchSessionStatus> {
    return requestJson<BatchSessionStatus>("/api/batch/jobs", {
      method: "POST",
      body: JSON.stringify({ form_url, count, skip_submit, session_id, generation_config }),
    })
  },

  async getBatchSession(sessionId: string): Promise<BatchSessionStatus> {
    return requestJson<BatchSessionStatus>(`/api/batch/sessions/${encodeURIComponent(sessionId)}`)
  },

  async processBatchSession(sessionId: string, maxIterations = 1): Promise<BatchSessionStatus> {
    return requestJson<BatchSessionStatus>(`/api/batch/sessions/${encodeURIComponent(sessionId)}/process`, {
      method: "POST",
      body: JSON.stringify({ max_iterations: maxIterations }),
    })
  },

  async updateReviewAnswers(
    sessionId: string,
    iteration: number,
    answers: Record<string, string | string[]>,
  ): Promise<IterationResult> {
    return requestJson<IterationResult>(`/api/batch/sessions/${encodeURIComponent(sessionId)}/iterations/${iteration}/answers`, {
      method: "PATCH",
      body: JSON.stringify({ answers }),
    })
  },

  async submitReviewedSession(sessionId: string): Promise<BatchSessionStatus> {
    return requestJson<BatchSessionStatus>(`/api/batch/sessions/${encodeURIComponent(sessionId)}/submit-reviewed`, {
      method: "POST",
    })
  },
}
