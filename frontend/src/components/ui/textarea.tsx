import * as React from "react"
import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-24 w-full rounded-md border-brutal bg-(--color-surface) px-4 py-3 text-sm font-medium font-mono text-(--color-ink)",
          "placeholder:text-(--color-ink-soft) placeholder:font-body",
          "shadow-brutal-sm transition-shadow duration-150 resize-y",
          "focus-visible:outline-none focus-visible:shadow-brutal focus-visible:bg-(--color-bg-alt) focus-visible:text-(--color-ink) focus-visible:ring-4 focus-visible:ring-(--color-ring)",
          "disabled:cursor-not-allowed disabled:border-dashed disabled:bg-(--color-mute) disabled:text-(--color-ink-soft)",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
