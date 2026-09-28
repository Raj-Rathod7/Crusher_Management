import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, onChange, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      onChange={(event) => {
        const field = event.currentTarget

        if (field.form) {
          const value = field.value
          const uppercaseValue = value.toUpperCase()

          if (value !== uppercaseValue) {
            const selectionStart = field.selectionStart
            const selectionEnd = field.selectionEnd
            field.value = uppercaseValue
            field.setSelectionRange(
              value.slice(0, selectionStart).toUpperCase().length,
              value.slice(0, selectionEnd).toUpperCase().length,
            )
          }
        }

        onChange?.(event)
      }}
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
