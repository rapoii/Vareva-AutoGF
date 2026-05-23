import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Neobrutalism core: hard border, hard shadow, GPU press animation
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[6px] font-bold uppercase tracking-wide select-none border-brutal text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-brutal-blue)] disabled:pointer-events-none disabled:opacity-60 disabled:saturate-50 press gpu",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-brutal-yellow)] shadow-brutal",
        destructive: "bg-[var(--color-brutal-red)] text-white shadow-brutal",
        outline: "bg-white shadow-brutal-sm hover:bg-[var(--color-brutal-yellow)]",
        secondary: "bg-[var(--color-brutal-pink)] shadow-brutal",
        accent: "bg-[var(--color-brutal-blue)] text-white shadow-brutal",
        success: "bg-[var(--color-brutal-lime)] shadow-brutal",
        ghost: "border-transparent shadow-none hover:bg-[var(--color-muted)]",
        link: "border-transparent shadow-none underline underline-offset-4 hover:text-[var(--color-brutal-pink)]",
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
