import { ComponentProps, ReactNode } from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface FormFieldProps extends ComponentProps<"div"> {
  label?: string
  helper?: string
  error?: string
  required?: boolean
  children: ReactNode
}

function FormField({
  label,
  helper,
  error,
  required,
  children,
  className,
  ...props
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      {children}
      {helper && !error && (
        <p className="text-sm text-muted-foreground">{helper}</p>
      )}
      {error && (
        <p className="text-sm text-destructive font-medium">{error}</p>
      )}
    </div>
  )
}

export { FormField }
