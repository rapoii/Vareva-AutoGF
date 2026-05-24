import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

const STEPS = ["Parse Form", "Generate Answers", "Review & Submit"]

interface StepIndicatorProps {
  currentStep: number
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((label, i) => {
        const stepNum = i + 1
        const isDone = stepNum < currentStep
        const isActive = stepNum === currentStep
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all",
                  isDone && "bg-(--color-candy-mint) border-(--color-ink) text-(--color-ink) shadow-brutal-sm",
                  isActive && "bg-(--color-candy-blush) border-(--color-primary) text-(--color-ink) shadow-brutal-sm",
                  !isDone && !isActive && "bg-(--color-surface) border-(--color-candy-blush) text-(--color-muted-foreground)"
                )}
              >
                {isDone ? <Check className="w-4 h-4" /> : stepNum}
              </div>
              <span
                className={cn(
                  "text-xs font-medium whitespace-nowrap",
                  isActive && "text-(--color-ink)",
                  !isActive && "text-(--color-ink-soft)"
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-3 mb-5 transition-all",
                  stepNum < currentStep ? "bg-(--color-candy-mint)" : "bg-(--color-candy-blush)"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
