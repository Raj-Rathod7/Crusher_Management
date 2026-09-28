import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, onChange, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      onChange={(event) => {
        const field = event.currentTarget
        const textTypes = ["text", "email", "search", "tel", "url"]

        if (field.form && textTypes.includes(field.type)) {
          const value = field.value
          const uppercaseValue = value.toUpperCase()

          if (value !== uppercaseValue) {
            const selectionStart = field.selectionStart
            const selectionEnd = field.selectionEnd
            field.value = uppercaseValue

            if (selectionStart !== null && selectionEnd !== null) {
              field.setSelectionRange(
                value.slice(0, selectionStart).toUpperCase().length,
                value.slice(0, selectionEnd).toUpperCase().length,
              )
            }
          }
        }

        onChange?.(event)
      }}
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
