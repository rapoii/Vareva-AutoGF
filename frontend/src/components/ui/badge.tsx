import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-[4px] border-brutal-2 px-2 py-0.5 text-[10px] md:text-xs font-bold uppercase tracking-wide text-[var(--color-ink)]",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-brutal-yellow)]",
        secondary: "bg-[var(--color-brutal-pink)]",
        accent: "bg-[var(--color-brutal-blue)] text-white",
        destructive: "bg-[var(--color-brutal-red)] text-white",
        outline: "bg-white",
        success: "bg-[var(--color-brutal-lime)]",
        warning: "bg-[var(--color-brutal-orange)]",
        violet: "bg-[var(--color-brutal-violet)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge }
