import * as React from "react"
import { cn } from "@/lib/utils"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full min-w-0 rounded-md border-brutal bg-(--color-surface) px-4 py-2 text-sm font-medium font-mono text-(--color-ink) max-[360px]:px-3 max-[360px]:text-[13px]",
          "placeholder:text-(--color-ink-soft) placeholder:font-body",
          "shadow-brutal-sm transition-shadow duration-150",
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
Input.displayName = "Input"

export { Input }
