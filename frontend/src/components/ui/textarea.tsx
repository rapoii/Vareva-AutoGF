import * as React from "react"
import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[96px] w-full rounded-[6px] border-brutal bg-white px-4 py-3 text-sm font-medium font-mono text-[var(--color-ink)]",
          "placeholder:text-[var(--color-mute)] placeholder:font-body",
          "shadow-brutal-sm transition-shadow duration-150 resize-y",
          "focus-visible:outline-none focus-visible:shadow-brutal",
          "disabled:cursor-not-allowed disabled:opacity-60",
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
