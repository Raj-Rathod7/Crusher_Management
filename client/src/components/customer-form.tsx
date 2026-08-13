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
import { Link } from '@tanstack/react-router'
import { IconArrowLeft } from '@tabler/icons-react'

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

  return (
    <div className={isPage ? 'min-h-[calc(100vh-5rem)] p-6' : 'w-full'}>
      {isPage && (
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/customer">
              <IconArrowLeft />
              {backLabel}
            </Link>
          </Button>
        </div>
      )}

      <div className={isPage ? 'grid min-h-[calc(100vh-10rem)] gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]' : 'w-full'}>
        <div className={isPage ? 'rounded-xl border p-6 lg:p-8' : 'w-full'}>
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
                <Button asChild type="button" variant="outline">
                  <Link to="/customer">
                    <IconArrowLeft />
                    {backLabel}
                  </Link>
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
        </div>

        {isPage && showSummary && (
          <aside className="h-fit rounded-xl border p-5 lg:sticky lg:top-6">
            <div className="mb-5 border-b pb-4">
              <h2 className="text-base font-semibold">Customer summary</h2>
              <p className="text-sm text-muted-foreground">Live snapshot before save.</p>
            </div>

            <div className="rounded-lg border px-4 py-3">
              <div className="grid grid-cols-[6rem_minmax(0,1fr)] gap-3 border-t py-3 first:border-t-0 first:pt-0 last:pb-0">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Name</span>
                <span className="text-sm font-medium leading-5 wrap-break-word">{form.state.values.name.trim() || 'Not set'}</span>
              </div>
              <div className="grid grid-cols-[6rem_minmax(0,1fr)] gap-3 border-t py-3 first:border-t-0 first:pt-0 last:pb-0">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Phone</span>
                <span className="text-sm font-medium leading-5 wrap-break-word">{form.state.values.phone.trim() || 'Not set'}</span>
              </div>
              <div className="grid grid-cols-[6rem_minmax(0,1fr)] gap-3 border-t py-3 first:border-t-0 first:pt-0 last:pb-0">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Address</span>
                <span className="text-sm font-medium leading-5 wrap-break-word">{form.state.values.address.trim() || 'Not set'}</span>
              </div>
              <div className="grid grid-cols-[6rem_minmax(0,1fr)] gap-3 border-t py-3 first:border-t-0 first:pt-0 last:pb-0">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notes</span>
                <span className="text-sm font-medium leading-5 wrap-break-word">{form.state.values.notes.trim() || 'None'}</span>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
