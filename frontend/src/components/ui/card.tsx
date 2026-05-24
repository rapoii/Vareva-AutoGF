import * as React from "react"
import { cn } from "@/lib/utils"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: "white" | "yellow" | "pink" | "blue" | "lime" | "violet" | "cream"
  flat?: boolean
}

const TONE_BG: Record<NonNullable<CardProps["tone"]>, string> = {
  white: "bg-(--color-surface) text-(--color-ink)",
  yellow: "bg-(--color-brutal-yellow) text-(--color-ink)",
  pink: "bg-(--color-candy-blush) text-(--color-ink) bg-pixel-dots",
  blue: "bg-(--color-bg-alt) text-(--color-ink)",
  lime: "bg-(--color-candy-mint) text-(--color-ink)",
  violet: "bg-(--color-bg-alt) text-(--color-ink)",
  cream: "bg-(--color-candy-cream) text-(--color-ink)",
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, tone = "white", flat = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "min-w-0 rounded-md border-brutal",
        TONE_BG[tone],
        flat ? "" : "shadow-brutal-lg",
        className
      )}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-1.5 p-5 md:p-6 border-b-[3px] border-(--color-ink) max-[360px]:p-4 max-[320px]:p-3", className)} {...props} />
  )
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-lg md:text-xl font-bold leading-tight tracking-normal uppercase wrap-break-word max-[360px]:text-base", className)} {...props} />
  )
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm font-medium text-(--color-ink-soft) wrap-break-word max-[360px]:text-[13px]", className)} {...props} />
  )
)
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-5 md:p-6 max-[360px]:p-4 max-[320px]:p-3", className)} {...props} />
  )
)
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-5 md:p-6 border-t-[3px] border-(--color-ink)", className)} {...props} />
  )
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
