import * as React from "react"
import { cn } from "@/lib/utils"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Brutalist input: hard 3px border, no radius, focus = pink ring
          "flex h-12 w-full min-w-0 rounded-[6px] border-brutal bg-white px-4 py-2 text-sm font-medium font-mono text-[var(--color-ink)] max-[360px]:px-3 max-[360px]:text-[13px]",
          "placeholder:text-[var(--color-mute)] placeholder:font-body",
          "shadow-brutal-sm transition-shadow duration-150",
          "focus-visible:outline-none focus-visible:shadow-brutal focus-visible:bg-[color:color-mix(in_oklch,var(--color-brutal-yellow)_30%,white)]",
          "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-[var(--color-muted)]",
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
