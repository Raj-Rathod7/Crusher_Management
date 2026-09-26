import { ReceiptSummary } from '#/components/receipt-summary'
import { FormPageLayout } from '#/components/form-page-layout'
import { Button } from '#/components/ui/button'
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList, ComboboxTrigger } from '#/components/ui/combobox'
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import type { Customer, CreateCustomerPaymentPayload } from '#/lib/models'
import { isManager } from '#/lib/common/api'
import { dateKey } from '#/lib/date-filters'
import { customerKeys, getAllCustomers } from '#/lib/query'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { SaveIcon } from 'lucide-react'
import * as React from 'react'

export type ReceiptFormValues = {
  customerId: string
  amount: string
  paymentDate: string
  paymentMode: string
  externalRef: string
  notes: string
}

type FormErrors = Partial<Record<keyof ReceiptFormValues, string>>

type ReceiptFormProps = {
  title: string
  description: string
  backLabel: string
  submitLabel: string
  isSubmitting?: boolean
  initialValues?: Partial<ReceiptFormValues>
  onSubmit: (payload: CreateCustomerPaymentPayload) => void
}

const defaultFormValues: ReceiptFormValues = {
  customerId: '',
  amount: '',
  paymentDate: dateKey(),
  paymentMode: 'cash',
  externalRef: '',
  notes: '',
}

function validateForm(form: ReceiptFormValues) {
  const errors: FormErrors = {}

  if (!form.customerId) {
    errors.customerId = 'Customer required.'
  }

  if (!form.paymentDate) {
    errors.paymentDate = 'Date required.'
  }

  if (!form.amount.trim() || Number(form.amount) <= 0) {
    errors.amount = 'Amount must be greater than 0.'
  }

  return errors
}

const inrConverter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
})

export function ReceiptForm({
  title,
  description,
  backLabel,
  submitLabel,
  isSubmitting = false,
  initialValues,
  onSubmit,
}: ReceiptFormProps) {
  const navigate = useNavigate()
  const [form, setForm] = React.useState<ReceiptFormValues>({ ...defaultFormValues, ...initialValues })
  const [errors, setErrors] = React.useState<FormErrors>({})

  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({
    queryKey: customerKeys.all,
    queryFn: getAllCustomers,
    retry: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  })

  const selectedCustomer = React.useMemo(
    () => customers.find((customer) => String(customer.id) === form.customerId) ?? null,
    [customers, form.customerId]
  )

  React.useEffect(() => {
    if (initialValues) {
      setForm((current) => ({ ...current, ...initialValues }))
    }
  }, [initialValues])

  const handleChange = (field: keyof ReceiptFormValues, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleCustomerSelect = (customer: Customer) => {
    handleChange('customerId', String(customer.id))
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validateForm(form)

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    onSubmit({
      customerId: Number(form.customerId),
      amount: Number(form.amount),
      paymentDate: form.paymentDate,
      paymentMode: form.paymentMode,
      externalRef: form.externalRef.trim() || undefined,
      notes: form.notes.trim() || undefined,
    })
  }

  const formContent = (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <FieldGroup className="grid gap-4">
        <Field>
          <FieldLabel htmlFor="customerId">Customer</FieldLabel>
          <FieldContent>
            <Combobox
              items={customers}
              itemToStringValue={(customer: Customer) => customer.name}
              onValueChange={(value) => handleCustomerSelect(value as Customer)}
            >
              <ComboboxTrigger
                render={
                  <Button
                    variant="outline"
                    className="w-full justify-between font-normal"
                    disabled={isLoadingCustomers}
                  >
                    {selectedCustomer
                      ? `${selectedCustomer.name} (${inrConverter.format(selectedCustomer.pendingBalance ?? 0)} pending)`
                      : (isLoadingCustomers ? 'Loading customers...' : 'Select a customer')}
                  </Button>
                }
              />
              <ComboboxContent>
                <ComboboxInput showTrigger={false} placeholder={isLoadingCustomers ? 'Loading customers...' : 'Select a customer'} />
                <ComboboxEmpty>No items found.</ComboboxEmpty>
                <ComboboxList>
                  {(customer) => (
                    <ComboboxItem key={customer.id} value={customer}>
                      <div className="flex w-full items-center justify-between gap-3">
                        <span>{customer.name}</span>
                        <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                          {inrConverter.format(customer.pendingBalance ?? 0)} pending
                        </span>
                      </div>
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            <FieldError>{errors.customerId}</FieldError>
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="paymentDate">Receipt date</FieldLabel>
          <FieldContent>
            <Input
              id="paymentDate"
              type="date"
              value={form.paymentDate}
              readOnly={isManager()}
              onChange={(event) => handleChange('paymentDate', event.target.value)}
            />
            <FieldError>{errors.paymentDate}</FieldError>
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="amount">Amount</FieldLabel>
          <FieldContent>
            <Input
              id="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(event) => handleChange('amount', event.target.value)}
              placeholder="0.00"
            />
            <FieldError>{errors.amount}</FieldError>
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="paymentMode">Payment mode</FieldLabel>
          <FieldContent>
            <Select
              value={form.paymentMode}
              onValueChange={(value) => handleChange('paymentMode', value)}
            >
              <SelectTrigger id="paymentMode">
                <SelectValue placeholder="Select payment mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="externalRef">Bank / UPI / cheque ref</FieldLabel>
          <FieldContent>
            <Input
              id="externalRef"
              value={form.externalRef}
              onChange={(event) => handleChange('externalRef', event.target.value)}
              placeholder="Optional"
            />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="notes">Notes</FieldLabel>
          <FieldContent>
            <textarea
              id="notes"
              value={form.notes}
              onChange={(event) => handleChange('notes', event.target.value)}
              placeholder="Optional notes"
              className="min-h-20 rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </FieldContent>
        </Field>
      </FieldGroup>

      <div className="flex items-center justify-end gap-3 border-t border-border/80 pt-4">
        <Button type="button" variant="outline" onClick={() => navigate({ to: '/receipt' })}>
          Back
        </Button>
        <Button disabled={isSubmitting} type="submit">
          <SaveIcon />
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  )

  return (
    <FormPageLayout
      title={title}
      description={description}
      backLabel={backLabel}
      backTo="/receipt"
      badge="Receipt entry"
      sidebar={<ReceiptSummary form={form} customer={selectedCustomer} />}
    >
      {formContent}
    </FormPageLayout>
  )
}
