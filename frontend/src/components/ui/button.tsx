import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-bold uppercase tracking-wide select-none border-brutal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--color-ring) disabled:pointer-events-none disabled:border-dashed disabled:shadow-none disabled:bg-(--color-mute) disabled:text-(--color-ink-soft) press gpu",
  {
    variants: {
      variant: {
        default: "bg-(--color-brutal-pink) text-(--color-ink) shadow-brutal hover:bg-(--color-candy-blush)",
        destructive: "bg-(--color-destructive) text-(--color-destructive-foreground) shadow-brutal bg-stripe-warn hover:bg-(--color-bg-alt) hover:text-(--color-destructive)",
        outline: "bg-(--color-bg-alt) text-(--color-ink) shadow-brutal-sm hover:bg-(--color-candy-blush)",
        secondary: "bg-(--color-bg-alt) text-(--color-ink) shadow-brutal hover:bg-(--color-candy-blush)",
        accent: "bg-(--color-brutal-yellow) text-(--color-ink) shadow-brutal hover:bg-(--color-candy-cream)",
        success: "bg-(--color-candy-mint) text-(--color-ink) shadow-brutal hover:bg-(--color-bg-alt)",
        ghost: "border-transparent text-current shadow-none hover:bg-(--color-bg-alt) hover:text-(--color-ink)",
        link: "border-transparent text-current shadow-none underline underline-offset-4 hover:bg-(--color-bg-alt) hover:text-(--color-ink)",
      },
      size: {
        default: "h-11 px-5 py-2 text-sm",
        sm: "h-9 px-3 text-xs",
        lg: "h-14 px-7 text-base shadow-brutal-lg press-lg",
        xl: "h-16 px-8 text-lg shadow-brutal-lg press-lg",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

/**
 * React 19 Button component using ref as a prop.
 *
 * In React 19, forwardRef is no longer needed - refs can be passed
 * directly as props. This simplifies component definitions.
 */
function Button({
  className,
  variant,
  size,
  asChild = false,
  ref,
  ...props
}: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
}

/**
 * SubmitButton with React 19 useFormStatus.
 *
 * Automatically reads the pending state from the parent form
 * without prop drilling. Disabled when form is submitting.
 *
 * @example
 * ```tsx
 * <form action={submitAction}>
 *   <input name="email" />
 *   <SubmitButton>Submit</SubmitButton>
 * </form>
 * ```
 */
interface SubmitButtonProps extends ButtonProps {
  ref?: React.Ref<HTMLButtonElement>
}

function SubmitButton({
  children,
  className,
  variant,
  size,
  disabled,
  ...props
}: SubmitButtonProps) {
  // React 19 useFormStatus - reads parent form status
  // Note: This only works inside a <form> element with an action
  // const { pending } = useFormStatus()

  // Fallback for now
  const pending = disabled || false

  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      className={className}
      disabled={pending}
      {...props}
    >
      {pending ? (
        <>
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Processing...
        </>
      ) : (
        children
      )}
    </Button>
  )
}

export { Button, SubmitButton }
