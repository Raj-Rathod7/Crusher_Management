import { SummaryRow } from '#/components/summary-row'
import { FormPageLayout } from '#/components/form-page-layout'
import { Button } from '#/components/ui/button'
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import type { CreateCustomerPayload } from '#/lib/models'
import { useForm } from '@tanstack/react-form'
import { useNavigate } from '@tanstack/react-router'

type CustomerFormValues = {
  name: string
  phone: string
  address: string
  notes: string
}

type CustomerFormProps = {
  title?: string
  description?: string
  backLabel?: string
  submitLabel: string
  isSubmitting?: boolean
  initialValues?: Partial<CustomerFormValues>
  onSubmit: (payload: CreateCustomerPayload) => void
  onCancel?: () => void
  showSummary?: boolean
  variant?: 'page' | 'dialog'
}

const defaultFormValues: CustomerFormValues = {
  name: '',
  phone: '',
  address: '',
  notes: '',
}

const phonePattern = /^[+()\d\s-]{7,20}$/

function toPayload(form: CustomerFormValues): CreateCustomerPayload {
  return {
    name: form.name.trim(),
    phone: form.phone.trim() || undefined,
    address: form.address.trim() || undefined,
    notes: form.notes.trim() || undefined,
  }
}

export function CustomerForm({
  title,
  description,
  backLabel,
  submitLabel,
  isSubmitting = false,
  initialValues,
  onSubmit,
  onCancel,
  showSummary = true,
  variant = 'page',
}: CustomerFormProps) {
  const navigate = useNavigate()
  const form = useForm({
    defaultValues: {
      ...defaultFormValues,
      ...initialValues,
    },
    onSubmit: async ({ value }) => {
      onSubmit(toPayload(value))
    },
  })

  const isPage = variant === 'page'

  const sidebarContent = isPage && showSummary ? (
    <>
      <div className="mb-5 border-b border-border/80 pb-4">
        <h2 className="text-base font-semibold">Customer summary</h2>
        <p className="text-sm text-muted-foreground">Live snapshot before save.</p>
      </div>

      <div className="rounded-lg border px-4 py-3">
        <SummaryRow label="Name" value={form.state.values.name.trim() || 'Not set'} />
        <SummaryRow label="Phone" value={form.state.values.phone.trim() || 'Not set'} />
        <SummaryRow label="Address" value={form.state.values.address.trim() || 'Not set'} />
        <SummaryRow label="Notes" value={form.state.values.notes.trim() || 'None'} />
      </div>
    </>
  ) : undefined

  const formContent = (
          <form
            className="flex flex-col gap-6"
            onSubmit={(event) => {
              event.preventDefault()
              event.stopPropagation()
              void form.handleSubmit()
            }}
          >
            <FieldGroup className="grid gap-4 md:grid-cols-2">
              <form.Field
                name="name"
                validators={{
                  onChange: ({ value }) => {
                    if (!value.trim()) return 'Customer name is required.'
                    if (value.trim().length < 2) return 'Name must be at least 2 characters.'
                    return undefined
                  },
                }}
              >
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="name">Customer name</FieldLabel>
                    <FieldContent>
                      <Input
                        id="name"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        placeholder="Enter customer name"
                      />
                      {field.state.meta.errors.length > 0 && (
                        <FieldError>{field.state.meta.errors[0]}</FieldError>
                      )}
                    </FieldContent>
                  </Field>
                )}
              </form.Field>

              <form.Field
                name="phone"
                validators={{
                  onChange: ({ value }) => {
                    if (!value.trim()) return undefined
                    if (!phonePattern.test(value.trim())) {
                      return 'Phone must be 7-20 characters using digits, spaces, +, -, or parentheses.'
                    }
                    return undefined
                  },
                }}
              >
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="phone">Phone number</FieldLabel>
                    <FieldContent>
                      <Input
                        id="phone"
                        type="tel"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        placeholder="Optional phone"
                      />
                      {field.state.meta.errors.length > 0 && (
                        <FieldError>{field.state.meta.errors[0]}</FieldError>
                      )}
                    </FieldContent>
                  </Field>
                )}
              </form.Field>

              <form.Field
                name="address"
                validators={{
                  onChange: ({ value }) => {
                    if (!value.trim()) return undefined
                    if (value.trim().length > 500) return 'Address must be 500 characters or less.'
                    return undefined
                  },
                }}
              >
                {(field) => (
                  <Field className="md:col-span-2">
                    <FieldLabel htmlFor="address">Address</FieldLabel>
                    <FieldContent>
                      <textarea
                        id="address"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        placeholder="Optional customer address"
                        className="min-h-24 rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      />
                      {field.state.meta.errors.length > 0 && (
                        <FieldError>{field.state.meta.errors[0]}</FieldError>
                      )}
                    </FieldContent>
                  </Field>
                )}
              </form.Field>

              <form.Field
                name="notes"
                validators={{
                  onChange: ({ value }) => {
                    if (!value.trim()) return undefined
                    if (value.trim().length > 1000) return 'Notes must be 1000 characters or less.'
                    return undefined
                  },
                }}
              >
                {(field) => (
                  <Field className="md:col-span-2">
                    <FieldLabel htmlFor="notes">Notes</FieldLabel>
                    <FieldContent>
                      <textarea
                        id="notes"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        placeholder="Optional notes"
                        className="min-h-28 rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      />
                      {field.state.meta.errors.length > 0 && (
                        <FieldError>{field.state.meta.errors[0]}</FieldError>
                      )}
                    </FieldContent>
                  </Field>
                )}
              </form.Field>
            </FieldGroup>

            <div className="flex items-center justify-end gap-3 border-t pt-4">
              {isPage ? (
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : submitLabel}
              </Button>
            </div>
          </form>
  )

  if (!isPage) {
    return formContent
  }

  return (
    <FormPageLayout
      title={title}
      description={description}
      backLabel={backLabel}
      backTo="/customer"
      badge="Customer entry"
      sidebar={sidebarContent}
    >
      {formContent}
    </FormPageLayout>
  )
}
