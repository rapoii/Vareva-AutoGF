import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronDown, History, LogOut, User, WandSparkles } from "lucide-react"
import { AuthGate } from "@/components/AuthGate"
import { Button } from "@/components/ui/button"
import { BatchSetupStep } from "@/components/BatchSetupStep"
import { LoadingOverlay } from "@/components/LoadingOverlay"
import { BatchProgressStep } from "@/components/BatchProgressStep"
import { ProfileStep } from "@/components/ProfileStep"
import { HistoryStep } from "@/components/HistoryStep"
import { ScanConfigStep } from "@/components/ScanConfigStep"
import { FloatingPixels, PixelSparkle } from "@/components/PixelDecor"
import { api, clearAuthToken, getAuthToken, subscribeApiLoading, type AuthUser, type BatchSessionStatus, type FormSchema, type GenerationConfig, type ProfileHistoryItem } from "@/lib/api"

type AppState = "setup" | "profile" | "history" | "scanConfig" | "progress"

type ScannedForm = {
  url: string
  schema: FormSchema
  sessionId: string
}

const DEFAULT_GENERATION_CONFIG: GenerationConfig = {
  persona_description: "",
  economic_class: "",
  answer_instructions: "",
  custom_answers: {},
}

const PROGRESS_STATUS_CACHE_KEY = "vareva_progress_status"

function normalizeGenerationConfig(config: GenerationConfig): GenerationConfig | null {
  const custom_answers = Object.fromEntries(
    Object.entries(config.custom_answers)
      .map(([entryId, value]) => {
        if (Array.isArray(value)) {
          return [entryId, value.map((item) => item.trim()).filter(Boolean)]
        }
        return [entryId, value.trim()]
      })
      .filter(([, value]) => Array.isArray(value) ? value.length > 0 : !!value)
  ) as GenerationConfig["custom_answers"]
  const normalized: GenerationConfig = {
    persona_description: config.persona_description.trim(),
    economic_class: config.economic_class,
    answer_instructions: config.answer_instructions.trim(),
    custom_answers,
  }
  return normalized.persona_description || normalized.economic_class || normalized.answer_instructions || Object.keys(normalized.custom_answers).length > 0 ? normalized : null
}

function getGenerateSessionIdFromPath() {
  const match = window.location.pathname.match(/^\/generate\/([^/]+)$/)
  return match ? decodeURIComponent(match[1]) : ""
}

function loadCachedProgressStatus(sessionId: string): BatchSessionStatus | null {
  try {
    const raw = sessionStorage.getItem(PROGRESS_STATUS_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as BatchSessionStatus
    return parsed.session_id === sessionId ? parsed : null
  } catch {
    return null
  }
}

function cacheProgressStatus(status: BatchSessionStatus) {
  sessionStorage.setItem(PROGRESS_STATUS_CACHE_KEY, JSON.stringify(status))
}

function goHomePath() {
  window.history.pushState({}, "", "/")
}

function goGeneratePath(sessionId: string) {
  window.history.pushState({}, "", `/generate/${encodeURIComponent(sessionId)}`)
}

function App() {
  const [appState, setAppState] = useState<AppState>("setup")
  const [setupUrl, setSetupUrl] = useState("")
  const [progressStatus, setProgressStatus] = useState<BatchSessionStatus | null>(null)
  const [progressLoading, setProgressLoading] = useState(false)
  const [processRetryTick, setProcessRetryTick] = useState(0)
  const [showProgressOverlay, setShowProgressOverlay] = useState(false)
  const [globalApiLoading, setGlobalApiLoading] = useState(false)
  const [startingGenerate, setStartingGenerate] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmStart, setConfirmStart] = useState<{ formUrl: string; count: number; reviewMode: boolean } | null>(null)
  const [scannedForm, setScannedForm] = useState<ScannedForm | null>(null)
  const [scanLoading, setScanLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyItems, setHistoryItems] = useState<ProfileHistoryItem[] | null>(null)
  const [generationConfig, setGenerationConfig] = useState<GenerationConfig>(DEFAULT_GENERATION_CONFIG)
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [authReady, setAuthReady] = useState(() => !getAuthToken())
  const [accountOpen, setAccountOpen] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement | null>(null)
  const progressRequestInFlightRef = useRef(false)
  const processRequestInFlightRef = useRef(false)

  const loadProgressSession = useCallback(async (sessionId: string, options: { showLoading?: boolean; redirectOnError?: boolean } = {}) => {
    if (progressRequestInFlightRef.current) return
    const showLoading = options.showLoading ?? true
    const redirectOnError = options.redirectOnError ?? true
    progressRequestInFlightRef.current = true
    if (showLoading) {
      setProgressLoading(true)
      setShowProgressOverlay(true)
    }
    setError(null)
    try {
      const status = await api.getBatchSession(sessionId)
      cacheProgressStatus(status)
      setProgressStatus(status)
      setAppState("progress")
    } catch (e) {
      setProgressStatus((current) => current ?? null)
      setError(e instanceof Error ? e.message : "Gagal memuat status generate")
      if (redirectOnError) {
        setAppState("setup")
        goHomePath()
      }
    } finally {
      progressRequestInFlightRef.current = false
      if (showLoading) {
        setProgressLoading(false)
        setShowProgressOverlay(false)
      }
    }
  }, [])

  useEffect(() => {
    return subscribeApiLoading((detail) => setGlobalApiLoading(detail.active))
  }, [])

  useEffect(() => {
    if (!getAuthToken()) return

    async function bootstrapAuth() {
      try {
        const sessionId = getGenerateSessionIdFromPath()
        if (sessionId) {
          const cachedStatus = loadCachedProgressStatus(sessionId)
          if (cachedStatus) {
            setProgressStatus(cachedStatus)
          }
          setAppState("progress")
        }
        const user = await api.me()
        setAuthUser(user)
        if (sessionId) {
          void loadProgressSession(sessionId, { showLoading: true, redirectOnError: true })
        }
      } catch {
        clearAuthToken()
      } finally {
        setAuthReady(true)
      }
    }

    void bootstrapAuth()
  }, [loadProgressSession])

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setAccountOpen(false)
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  function handleLogout() {
    clearAuthToken()
    setAuthUser(null)
    handleReset()
  }

  async function handleOpenHistory() {
    setAccountOpen(false)
    setHistoryLoading(true)
    setError(null)
    try {
      const items = await api.getProfileHistory()
      setHistoryItems(items)
      setAppState("history")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat history")
    } finally {
      setHistoryLoading(false)
    }
  }

  async function handleRefreshProgress() {
    const sessionId = progressStatus?.session_id || getGenerateSessionIdFromPath()
    if (!sessionId) return
    await loadProgressSession(sessionId, { showLoading: false })
    setProcessRetryTick((tick) => tick + 1)
  }

  useEffect(() => {
    function resumeProcessingWhenVisible() {
      if (document.visibilityState === "visible") {
        setProcessRetryTick((tick) => tick + 1)
      }
    }

    window.addEventListener("focus", resumeProcessingWhenVisible)
    document.addEventListener("visibilitychange", resumeProcessingWhenVisible)
    return () => {
      window.removeEventListener("focus", resumeProcessingWhenVisible)
      document.removeEventListener("visibilitychange", resumeProcessingWhenVisible)
    }
  }, [])

  useEffect(() => {
    if (appState !== "progress" || !progressStatus || !["queued", "running"].includes(progressStatus.status)) return
    if (progressStatus.results.length >= progressStatus.count) return

    let cancelled = false
    const timerId = window.setTimeout(async () => {
      if (processRequestInFlightRef.current) return
      processRequestInFlightRef.current = true
      setError(null)
      try {
        const nextStatus = await api.processBatchSession(progressStatus.session_id, 1)
        if (cancelled) return
        cacheProgressStatus(nextStatus)
        setProgressStatus(nextStatus)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Gagal memproses session generate")
          setProcessRetryTick((tick) => tick + 1)
        }
      } finally {
        processRequestInFlightRef.current = false
      }
    }, processRetryTick > 0 ? 3500 : progressStatus.results.length > 0 ? 900 : 150)

    return () => {
      cancelled = true
      window.clearTimeout(timerId)
    }
  }, [appState, progressStatus, processRetryTick])

  async function handleScan(formUrl: string) {
    const trimmedUrl = formUrl.trim()
    if (!trimmedUrl) return
    setScanLoading(true)
    setError(null)
    try {
      const result = await api.parse(trimmedUrl)
      setScannedForm({
        url: trimmedUrl,
        schema: result.schema_,
        sessionId: result.session_id,
      })
    } catch (e) {
      setScannedForm(null)
      setError(e instanceof Error ? e.message : "Gagal scan Google Form")
    } finally {
      setScanLoading(false)
    }
  }

  function handleClearScan() {
    setScannedForm(null)
    setGenerationConfig(DEFAULT_GENERATION_CONFIG)
  }

  function handleResetConfig() {
    setGenerationConfig(DEFAULT_GENERATION_CONFIG)
  }

  function handleOpenScanConfig() {
    if (!scannedForm) return
    setAppState("scanConfig")
  }

  function handleStart(formUrl: string, count: number, reviewMode: boolean) {
    const activeScan = scannedForm
    if (!activeScan || activeScan.url !== formUrl.trim()) {
      setError("Scan Google Form dulu sebelum generate")
      return
    }
    setConfirmStart({ formUrl, count, reviewMode })
  }

  async function confirmGenerate() {
    const pending = confirmStart
    const activeScan = scannedForm
    if (!pending || !activeScan || activeScan.url !== pending.formUrl.trim()) {
      setConfirmStart(null)
      setError("Scan Google Form dulu sebelum generate")
      return
    }

    setConfirmStart(null)
    setError(null)
    setStartingGenerate(true)

    try {
      const status = await api.startBatchJob(
        pending.formUrl,
        pending.count,
        pending.reviewMode,
        activeScan.sessionId,
        normalizeGenerationConfig(generationConfig),
      )
      goGeneratePath(status.session_id)
      cacheProgressStatus(status)
      setProgressStatus(status)
      setAppState("progress")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memulai session generate")
      setAppState("setup")
    } finally {
      setStartingGenerate(false)
    }
  }

  function handleReset() {
    goHomePath()
    setAppState("setup")
    setProgressStatus(null)
    setHistoryItems(null)
    setError(null)
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <FloatingPixels />

      {/* ============================================================
       * HEADER
       * Wide marquee strip + chunky brand row with mascot.
       * ============================================================ */}
      <header className="sticky top-0 z-30 bg-(--color-bg)/95 backdrop-blur">
        {/* marquee strip */}
        <div className="marquee-shell bg-(--color-ink) text-(--color-brutal-pink) font-mono text-xs py-1.5 border-b-[3px] border-(--color-ink)">
          <div className="marquee-track" aria-hidden="true">
            {Array.from({ length: 3 }).map((_, repeat) => (
              <div key={repeat} className="marquee-group">
                {[
                  "★ AUTO FILL GOOGLE FORMS",
                  "▲ POWERED BY AI",
                  "● 100% INDONESIAN PERSONAS",
                  "■ NEOBRUTALIST × PIXEL EDITION",
                  "◆ MULTI-PROVIDER FALLBACK",
                  "✱ BUILT FOR SPEED",
                ].map((t) => (
                  <span key={`${repeat}-${t}`} className="font-bold uppercase tracking-widest leading-none flex items-center">
                    {t}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* brand row */}
        <div className="border-b-[3px] border-(--color-ink) pixel-glass">
          <div className="brutal-center h-14 sm:h-16 md:h-20 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
              <div
                className="rounded-md md:rounded-lg border-brutal-2 md:border-brutal-4 bg-(--color-bg-alt) text-(--color-ink) shadow-brutal-sm md:shadow-brutal gpu -translate-x-px -translate-y-px md:-translate-x-0.5 md:-translate-y-0.5 shrink-0 overflow-hidden flex items-center justify-center"
              >
                <img src="/logo.png" alt="Vareva Logo" className="w-8 h-8 sm:w-11 sm:h-11 md:w-16 md:h-16 object-cover" />
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-[13px] sm:text-lg md:text-2xl leading-none truncate">
                  VAREVA<span className="text-(--color-brutal-pink)">_</span>GF
                </h1>
                <p className="font-mono text-[8px] sm:text-[10px] md:text-xs mt-1 md:mt-2 font-bold uppercase tracking-wider truncate">
                  <span className="hidden sm:inline">{"// Auto-fill Google Forms with"}</span>
                  <span className="sm:hidden">{"// Auto-fill w/"}</span>{" "}
                  <span className="rounded-[3px] bg-(--color-brutal-yellow) text-(--color-ink) px-1">
                    AI personas
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0">
              {authUser && (
                <div ref={accountMenuRef} className="relative hidden min-[420px]:block">
                  <button
                    onClick={() => setAccountOpen((open) => !open)}
                    aria-haspopup="menu"
                    aria-expanded={accountOpen}
                    className="press flex max-w-36 items-center gap-1.5 rounded-sm sm:rounded-md border-brutal-2 bg-(--color-bg-alt) px-1.5 py-0.5 sm:px-2 sm:py-1 md:px-3 md:py-2 font-mono text-[9px] text-(--color-ink) sm:text-[10px] md:text-xs shadow-brutal-sm font-bold"
                  >
                    <span className="truncate">{authUser.name || authUser.email}</span>
                    <ChevronDown className={`h-3 w-3 shrink-0 transition-transform ${accountOpen ? "rotate-180" : ""}`} strokeWidth={3} />
                  </button>

                  {accountOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 border-brutal bg-(--color-bg-alt) shadow-brutal font-mono text-xs"
                      style={{ animation: "var(--animate-pop)" }}
                    >
                      <div className="border-b-[3px] border-(--color-ink) bg-(--color-bg-alt) text-(--color-ink) px-3 py-2">
                        <div className="font-bold truncate">{authUser.name || "Profile"}</div>
                        <div className="text-[10px] text-(--color-ink-soft) truncate">{authUser.email}</div>
                      </div>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setAccountOpen(false)
                          setAppState("profile")
                        }}
                        className="flex w-full items-center gap-2 border-b-2 border-solid border-(--color-ink) px-3 py-2 text-left font-bold text-(--color-ink) hover:bg-(--color-candy-blush) focus-visible:outline-none focus-visible:bg-(--color-candy-blush)"
                      >
                        <User className="h-4 w-4" strokeWidth={3} />
                        PROFILE
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          void handleOpenHistory()
                        }}
                        className="flex w-full items-center gap-2 border-b-2 border-solid border-(--color-ink) px-3 py-2 text-left font-bold text-(--color-ink) hover:bg-(--color-candy-blush) focus-visible:outline-none focus-visible:bg-(--color-candy-blush)"
                      >
                        <History className="h-4 w-4" strokeWidth={3} />
                        HISTORY
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left font-bold bg-(--color-destructive) text-(--color-destructive-foreground) hover:bg-(--color-bg-alt) hover:text-(--color-destructive) focus-visible:outline-none focus-visible:bg-(--color-bg-alt) focus-visible:text-(--color-destructive)"
                      >
                        <LogOut className="h-4 w-4" strokeWidth={3} />
                        LOGOUT
                      </button>
                    </div>
                  )}
                </div>
              )}
              <div className={`rounded-sm sm:rounded-md border-brutal-2 px-1.5 py-0.5 sm:px-2 sm:py-1 md:px-3 md:py-2 font-mono text-[9px] sm:text-[10px] md:text-xs shadow-brutal-sm flex items-center gap-1.5 md:gap-2 ${error ? "bg-(--color-destructive) text-(--color-destructive-foreground) bg-stripe-warn" : "bg-(--color-bg-alt) text-(--color-ink)"}`}>
                <span
                  className={`w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 ${error ? "bg-(--color-bg-alt)" : "bg-(--color-brutal-pink) motion-safe-blink"}`}
                />
                <span className="font-bold">{error ? "ERROR" : "LIVE"}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================
       * MAIN CONTENT
       * Mobile: full-width vertical stack with bottom safe-area.
       * Desktop: padded canvas with floating decorations.
       * ============================================================ */}
      <main
        className="relative brutal-center flex-1 pt-4 md:pt-8 pb-32 md:pb-16 max-[340px]:px-4"
        style={{ animation: "var(--animate-fade-in)" }}
      >
        {!authReady && getGenerateSessionIdFromPath() && loadCachedProgressStatus(getGenerateSessionIdFromPath()) && (
          <BatchProgressStep
            status={loadCachedProgressStatus(getGenerateSessionIdFromPath()) as BatchSessionStatus}
            loading={false}
            onRefresh={() => void handleRefreshProgress()}
            onReset={handleReset}
          />
        )}

        {!authReady && getGenerateSessionIdFromPath() && !loadCachedProgressStatus(getGenerateSessionIdFromPath()) && (
          <div className="min-h-[42vh]" />
        )}

        {!authReady && !getGenerateSessionIdFromPath() && getAuthToken() && (
          <BatchSetupStep
            url={setupUrl}
            onUrlChange={setSetupUrl}
            onScan={handleScan}
            onClearScan={handleClearScan}
            onStart={handleStart}
            onOpenConfig={handleOpenScanConfig}
            loading={false}
            scanLoading={scanLoading}
            error={error}
            scannedForm={scannedForm}
          />
        )}

        {!authReady && !getGenerateSessionIdFromPath() && !getAuthToken() && (
          <div className="min-h-[42vh]" />
        )}

        {authReady && !authUser && (
          <AuthGate onAuthenticated={setAuthUser} />
        )}

        {authReady && authUser && appState === "setup" && (
          <BatchSetupStep
            url={setupUrl}
            onUrlChange={setSetupUrl}
            onScan={handleScan}
            onClearScan={handleClearScan}
            onStart={handleStart}
            onOpenConfig={handleOpenScanConfig}
            loading={false}
            scanLoading={scanLoading}
            error={error}
            scannedForm={scannedForm}
          />
        )}

        {authReady && authUser && appState === "profile" && (
          <ProfileStep
            user={authUser}
            onUserUpdated={setAuthUser}
            onBack={() => setAppState("setup")}
          />
        )}

        {authReady && authUser && appState === "history" && (
          <HistoryStep initialHistory={historyItems ?? undefined} onBack={() => setAppState("setup")} />
        )}

        {authReady && authUser && appState === "scanConfig" && scannedForm && (
          <ScanConfigStep
            scannedForm={scannedForm}
            config={generationConfig}
            onConfigChange={setGenerationConfig}
            onResetConfig={handleResetConfig}
            onBack={() => setAppState("setup")}
          />
        )}

        {authReady && authUser && appState === "progress" && !progressStatus && (
          <div className="min-h-[42vh]" />
        )}

        {authReady && authUser && appState === "progress" && progressStatus && (
          <BatchProgressStep
            status={progressStatus}
            loading={progressLoading}
            onRefresh={() => void handleRefreshProgress()}
            onReset={handleReset}
          />
        )}

      </main>

      {!authReady && !getGenerateSessionIdFromPath() && <LoadingOverlay title="MEMUAT AKUN" message="Mengambil data login dari backend." />}

      {globalApiLoading && !startingGenerate && !scanLoading && !historyLoading && !showProgressOverlay && <LoadingOverlay title="SINKRONISASI DATA" message="Mengambil atau menyimpan data ke storage. Mohon tunggu sebentar." />}

      {showProgressOverlay && <BatchProgressShell />}

      {startingGenerate && <LoadingOverlay title="MULAI GENERATE" message="Menyiapkan session tersimpan. Setelah siap, halaman akan pindah ke progress." />}

      {historyLoading && <LoadingOverlay title="MEMUAT HISTORY" message="Mengambil history form dari storage." />}

      {scanLoading && <LoadingOverlay title="SCAN FORM" message="Membaca struktur Google Form dan menyiapkan konfigurasi." />}

      {confirmStart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-(--color-ink)/55 px-4 backdrop-blur-sm" onClick={() => setConfirmStart(null)}>
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm border-brutal bg-(--color-bg-alt) text-(--color-ink) shadow-brutal-lg p-5 text-center"
            style={{ animation: "var(--animate-pop)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border-brutal-2 bg-(--color-candy-blush) text-(--color-brutal-pink) shadow-brutal-sm">
              <WandSparkles className="h-7 w-7" strokeWidth={3} />
            </div>
            <div className="font-display text-lg leading-tight">LANJUT GENERATE?</div>
            <div className="mx-auto mt-2 max-w-64 font-mono text-[11px] leading-relaxed text-(--color-ink-soft)">
              Pastikan konfigurasi scan sekarang sudah sesuai sebelum AI mulai membuat jawaban.
            </div>
            <div className="mt-5 space-y-2">
              <Button onClick={confirmGenerate} variant="default" size="lg" className="w-full">
                YA, LANJUT
              </Button>
              <Button onClick={() => setConfirmStart(null)} variant="outline" size="lg" className="w-full">
                BATAL
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer (desktop only) */}
      <footer className="hidden md:block border-t-[3px] border-(--color-ink) bg-(--color-ink) text-(--color-bg-alt)">
        <div className="brutal-center py-6 flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-3">
            <PixelSparkle size={20} />
            <span className="uppercase tracking-widest font-bold">Vareva AutoGF · Candy Edition</span>
          </div>
          <div className="flex gap-4 uppercase tracking-widest">
            <span>Gemini · Groq · Cerebras · OpenRouter</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

function BatchProgressShell() {
  return <LoadingOverlay title="MEMUAT PROGRESS" message="Mengambil session tersimpan. Progress akan lanjut otomatis saat halaman terbuka." />
}
export default App

