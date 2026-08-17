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
import { Textarea } from '#/components/ui/textarea'
import type { CreateCustomerPayload } from '#/lib/models'
import { IconArrowLeft } from '@tabler/icons-react'
import { useForm } from '@tanstack/react-form'
import { useNavigate } from '@tanstack/react-router'
import { z } from 'zod'

const customerFormSchema = z.object({
  name: z.string().trim().min(1, 'Customer name is required.').min(2, 'Name must be at least 2 characters.'),
  phone: z.string().trim().refine(
    (value) => !value || /^[+()\d\s-]{7,20}$/.test(value),
    'Phone must be 7-20 characters using digits, spaces, +, -, or parentheses.'
  ),
  address: z.string().trim().max(500, 'Address must be 500 characters or less.'),
  notes: z.string().trim().max(1000, 'Notes must be 1000 characters or less.'),
})

type CustomerFormValues = z.infer<typeof customerFormSchema>
type CustomerFieldName = keyof CustomerFormValues

type CustomerFormProps = {
  title?: string
  description?: string
  backLabel?: string
  submitLabel: string
  isSubmitting?: boolean
  initialValues?: Partial<CustomerFormValues>
  onSubmit: (payload: CreateCustomerPayload) => void
  onCancel?: () => void
  variant?: 'page' | 'dialog'
}

const defaultFormValues: CustomerFormValues = {
  name: '',
  phone: '',
  address: '',
  notes: '',
}

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
  variant = 'page',
}: CustomerFormProps) {
  const navigate = useNavigate()
  const form = useForm({
    defaultValues: {
      ...defaultFormValues,
      ...initialValues,
    },
    validators: {
      onSubmit: customerFormSchema,
    },
    onSubmit: async ({ value }) => {
      onSubmit(toPayload(value))
    },
  })

  const isPage = variant === 'page'
  const getFieldError = (name: CustomerFieldName, value: string) => {
    const result = customerFormSchema.shape[name].safeParse(value)
    return result.success ? undefined : result.error.issues[0]?.message
  }

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
                  onBlur: ({ value }) => getFieldError('name', value),
                  onChange: ({ value }) => getFieldError('name', value),
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
                        aria-invalid={(field.state.meta.isTouched || form.state.isSubmitted) && field.state.meta.errors.length > 0}
                      />
                      {(field.state.meta.isTouched || form.state.isSubmitted) && field.state.meta.errors.length > 0 && (
                        <FieldError>{field.state.meta.errors[0]?.toString()}</FieldError>
                      )}
                    </FieldContent>
                  </Field>
                )}
              </form.Field>

              <form.Field
                name="phone"
                validators={{
                  onBlur: ({ value }) => getFieldError('phone', value),
                  onChange: ({ value }) => getFieldError('phone', value),
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
                        aria-invalid={(field.state.meta.isTouched || form.state.isSubmitted) && field.state.meta.errors.length > 0}
                      />
                      {(field.state.meta.isTouched || form.state.isSubmitted) && field.state.meta.errors.length > 0 && (
                        <FieldError>{field.state.meta.errors[0]?.toString()}</FieldError>
                      )}
                    </FieldContent>
                  </Field>
                )}
              </form.Field>

              <form.Field
                name="address"
                validators={{
                  onBlur: ({ value }) => getFieldError('address', value),
                  onChange: ({ value }) => getFieldError('address', value),
                }}
              >
                {(field) => (
                  <Field className="md:col-span-2">
                    <FieldLabel htmlFor="address">Address</FieldLabel>
                    <FieldContent>
                      <Textarea
                        id="address"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        placeholder="Optional customer address"
                        className="min-h-24"
                        aria-invalid={(field.state.meta.isTouched || form.state.isSubmitted) && field.state.meta.errors.length > 0}
                      />
                      {(field.state.meta.isTouched || form.state.isSubmitted) && field.state.meta.errors.length > 0 && (
                        <FieldError><span>
                          {field.state.meta.errors[0]?.toString()}</span></FieldError>
                      )}
                    </FieldContent>
                  </Field>
                )}
              </form.Field>

              <form.Field
                name="notes"
                validators={{
                  onBlur: ({ value }) => getFieldError('notes', value),
                  onChange: ({ value }) => getFieldError('notes', value),
                }}
              >
                {(field) => (
                  <Field className="md:col-span-2">
                    <FieldLabel htmlFor="notes">Notes</FieldLabel>
                    <FieldContent>
                      <Textarea
                        id="notes"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        placeholder="Optional notes"
                        className="min-h-28"
                        aria-invalid={(field.state.meta.isTouched || form.state.isSubmitted) && field.state.meta.errors.length > 0}
                      />
                      {(field.state.meta.isTouched || form.state.isSubmitted) && field.state.meta.errors.length > 0 && (
                        <FieldError>{field.state.meta.errors[0]?.toString()}</FieldError>
                      )}
                    </FieldContent>
                  </Field>
                )}
              </form.Field>
            </FieldGroup>

            <div className="flex items-center justify-end gap-3 border-t pt-4">
              {isPage ? (
                <Button type="button" variant="outline" onClick={() => navigate({ to: '/customer' })}>
                  <IconArrowLeft />
                  Back to Customers
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
    >
      {formContent}
    </FormPageLayout>
  )
}
