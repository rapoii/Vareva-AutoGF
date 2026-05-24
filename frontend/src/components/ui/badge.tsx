import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-[4px] border-brutal-2 px-2 py-0.5 text-[10px] md:text-xs font-bold uppercase tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-(--color-bg-alt) text-(--color-ink)",
        secondary: "bg-(--color-candy-blush) text-(--color-ink)",
        accent: "bg-(--color-brutal-yellow) text-(--color-ink)",
        destructive: "bg-(--color-destructive) text-(--color-destructive-foreground) bg-stripe-warn",
        outline: "bg-(--color-surface) text-(--color-ink)",
        success: "bg-(--color-candy-mint) text-(--color-ink)",
        warning: "bg-(--color-candy-peach) text-(--color-ink) bg-stripe-warn",
        violet: "bg-(--color-candy-lavender) text-(--color-ink) bg-checker-pink",
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
