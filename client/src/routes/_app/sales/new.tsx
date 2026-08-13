import { CustomerForm } from '#/components/customer-form'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'
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
import { createCustomer, createSale } from '#/lib/mutation'
import type { CreateInvoicePayload, Customer } from '#/lib/models'
import { customerKeys, getAllCustomers, salesKeys } from '#/lib/query'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { IconArrowLeft, IconPlus, IconReceipt } from '@tabler/icons-react'
import * as React from 'react'
import { toast } from 'sonner'
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from '#/components/ui/combobox'

export const Route = createFileRoute('/_app/sales/new')({
  component: RouteComponent,
})

type FormState = {
  invoiceNumber: string
  invoiceDate: string
  customerId: string
  totalAmount: string
  amountPaid: string
  status: string
  remarks: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

const initialFormState: FormState = {
  invoiceNumber: '',
  invoiceDate: new Date().toISOString().slice(0, 10),
  customerId: '',
  totalAmount: '',
  amountPaid: '',
  status: 'UNPAID',
  remarks: '',
}

function validateForm(form: FormState) {
  const errors: FormErrors = {}

  if (!form.invoiceNumber.trim()) {
    errors.invoiceNumber = 'Invoice number required.'
  }

  if (!form.invoiceDate) {
    errors.invoiceDate = 'Invoice date required.'
  }

  if (!form.customerId) {
    errors.customerId = 'Customer required.'
  }

  if (!form.totalAmount.trim() || Number(form.totalAmount) <= 0) {
    errors.totalAmount = 'Total amount must be greater than 0.'
  }

  if (form.amountPaid.trim() && Number(form.amountPaid) < 0) {
    errors.amountPaid = 'Paid amount cannot be negative.'
  }

  if (form.totalAmount.trim() && form.amountPaid.trim() && Number(form.amountPaid) > Number(form.totalAmount)) {
    errors.amountPaid = 'Paid amount cannot exceed total amount.'
  }

  return errors
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[6rem_minmax(0,1fr)] gap-3 border-t py-3 first:border-t-0 first:pt-0 last:pb-0">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm font-medium leading-5 wrap-break-word">{value}</span>
    </div>
  )
}

function RouteComponent() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = React.useState<FormState>(initialFormState)
  const [errors, setErrors] = React.useState<FormErrors>({})
  const [customerDialogOpen, setCustomerDialogOpen] = React.useState(false)

  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({
    queryKey: customerKeys.all,
    queryFn: getAllCustomers,
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  })

  const createMutation = useMutation({
    mutationFn: createSale,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: salesKeys.all })
      toast.success('Sale created.')
      navigate({ to: '/sales' })
    },
    onError: () => {
      toast.error('Failed to create sale.')
    },
  })

  const createCustomerMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: async (customer) => {
      await queryClient.invalidateQueries({ queryKey: customerKeys.all })
      setForm((current) => ({ ...current, customerId: String(customer.id) }))
      setCustomerDialogOpen(false)
      toast.success('Customer created.')
    },
    onError: () => {
      toast.error('Failed to create customer.')
    },
  })

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const totalAmount = Number(form.totalAmount || 0)
  const amountPaid = Number(form.amountPaid || 0)
  const balance = Math.max(totalAmount - amountPaid, 0)
  const selectedCustomer = customers.find((customer) => String(customer.id) === form.customerId)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validateForm(form)

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const payload: CreateInvoicePayload = {
      invoiceNumber: form.invoiceNumber.trim(),
      invoiceDate: form.invoiceDate,
      customer: {
        id: Number(form.customerId),
      },
      totalAmount,
      amountPaid,
      balance,
      status: form.status,
      remarks: form.remarks.trim() || undefined,
    }

    createMutation.mutate(payload)
  }

  const activeCustomers = customers.filter((customer) => customer.isActive !== false)

  return (
    <div className="min-h-[calc(100vh-5rem)] p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">New Sale</h1>
          <p className="text-sm text-muted-foreground">
            Create invoice with customer, amount, payment, and status.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/sales">
            <IconArrowLeft />
            Back to sales
          </Link>
        </Button>
      </div>

      <div className="grid min-h-[calc(100vh-10rem)] gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="rounded-xl border p-6 lg:p-8">
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <FieldGroup className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="invoiceNumber">Invoice number</FieldLabel>
                <FieldContent>
                  <Input
                    id="invoiceNumber"
                    value={form.invoiceNumber}
                    onChange={(event) => handleChange('invoiceNumber', event.target.value)}
                    placeholder="INV-001"
                  />
                  <FieldError>{errors.invoiceNumber}</FieldError>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="invoiceDate">Invoice date</FieldLabel>
                <FieldContent>
                  <Input
                    id="invoiceDate"
                    type="date"
                    value={form.invoiceDate}
                    onChange={(event) => handleChange('invoiceDate', event.target.value)}
                  />
                  <FieldError>{errors.invoiceDate}</FieldError>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="customerId">Customer</FieldLabel>
                <FieldContent>
                  <div className="flex gap-2">
                    <div className="flex-1">
                     <Combobox
                        items={customers}
                        itemToStringValue={(customer: Customer) => customer.name}
                      >
                        <ComboboxInput placeholder="Select a customer" />
                        <ComboboxContent>
                          <ComboboxEmpty>No items found.</ComboboxEmpty>
                          <ComboboxList>
                            {(customer) => (
                              <ComboboxItem key={customer.value} value={customer}>
                                {customer.name}
                              </ComboboxItem>
                            )}
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox> 
                    </div>

                    <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" className="shrink-0">
                          New customer
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl p-6">
                        <DialogHeader className="mb-4 p-0">
                          <DialogTitle>New customer</DialogTitle>
                        </DialogHeader>
                        <CustomerForm
                          submitLabel="Add customer"
                          isSubmitting={createCustomerMutation.isPending}
                          showSummary={false}
                          variant="dialog"
                          onCancel={() => setCustomerDialogOpen(false)}
                          onSubmit={(payload) => createCustomerMutation.mutate(payload)}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                  <FieldError>{errors.customerId}</FieldError>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="status">Status</FieldLabel>
                <FieldContent>
                  <Select value={form.status} onValueChange={(value) => handleChange('status', value)}>
                    <SelectTrigger id="status" className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNPAID">UNPAID</SelectItem>
                      <SelectItem value="PARTIAL">PARTIAL</SelectItem>
                      <SelectItem value="PAID">PAID</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="totalAmount">Total amount</FieldLabel>
                <FieldContent>
                  <Input
                    id="totalAmount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.totalAmount}
                    onChange={(event) => handleChange('totalAmount', event.target.value)}
                    placeholder="0.00"
                  />
                  <FieldError>{errors.totalAmount}</FieldError>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="amountPaid">Amount paid</FieldLabel>
                <FieldContent>
                  <Input
                    id="amountPaid"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amountPaid}
                    onChange={(event) => handleChange('amountPaid', event.target.value)}
                    placeholder="0.00"
                  />
                  <FieldError>{errors.amountPaid}</FieldError>
                </FieldContent>
              </Field>

              <Field className="md:col-span-2">
                <FieldLabel htmlFor="remarks">Remarks</FieldLabel>
                <FieldContent>
                  <textarea
                    id="remarks"
                    value={form.remarks}
                    onChange={(event) => handleChange('remarks', event.target.value)}
                    placeholder="Optional notes"
                    className="min-h-32 rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                </FieldContent>
              </Field>
            </FieldGroup>

            <div className="flex items-center justify-end gap-3 border-t pt-4">
              <Button asChild type="button" variant="outline">
                <Link to="/sales">
                  <IconArrowLeft />
                  Cancel
                </Link>
              </Button>
              <Button disabled={createMutation.isPending} type="submit">
                {createMutation.isPending ? (
                  'Saving...'
                ) : (
                  <>
                    <IconPlus />
                    Create sale
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        <aside className="h-fit rounded-xl border p-5 lg:sticky lg:top-6">
          <div className="mb-5 border-b pb-4">
            <h2 className="text-base font-semibold">Invoice summary</h2>
            <p className="text-sm text-muted-foreground">Live snapshot from current form values.</p>
          </div>

          <div className="mb-4 inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium">
            <IconReceipt className="size-4 text-muted-foreground" />
            Review before save
          </div>

          <div className="rounded-lg border px-4 py-3">
            <SummaryRow label="Invoice" value={form.invoiceNumber.trim() || 'Not set'} />
            <SummaryRow label="Date" value={form.invoiceDate || 'Not set'} />
            <SummaryRow label="Customer" value={selectedCustomer?.name ?? 'Not set'} />
            <SummaryRow label="Total" value={form.totalAmount.trim() || '0.00'} />
            <SummaryRow label="Paid" value={form.amountPaid.trim() || '0.00'} />
            <SummaryRow label="Balance" value={balance.toFixed(2)} />
            <SummaryRow label="Status" value={form.status} />
          </div>

          <div className="mt-4">
            <Badge variant="outline">Backend uses exact invoice entity payload</Badge>
          </div>
        </aside>
      </div>
    </div>
  )
}