import { CustomerForm } from '#/components/customer-form'
import { SummaryRow } from '#/components/summary-row'
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
import { customerKeys, getAllCustomers, getAllMaterials, materialKeys, salesKeys } from '#/lib/query'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { IconArrowLeft, IconPlus, IconReceipt } from '@tabler/icons-react'
import * as React from 'react'
import { toast } from 'sonner'
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList, ComboboxTrigger } from '#/components/ui/combobox'
import { SaveIcon } from 'lucide-react'

export const Route = createFileRoute('/_app/sales/new')({
  component: RouteComponent,
})

type FormState = {
  invoiceNumber: string
  invoiceDate: string
  customerId: string
  totalAmount: string
  amountPaid: string
  remarks: string
}

type InvoiceItemEntry = {
  id: string
  materialTypeId: string
  quantityBrass: string
  rate: string
  amount: string
  materialName: string
}

type InvoiceItemFormState = {
  materialTypeId: string
  quantityBrass: string
  rate: string
}

type InvoiceItemErrors = Partial<Record<keyof InvoiceItemFormState, string>>

type FormErrors = Partial<Record<keyof FormState, string>>

const initialFormState: FormState = {
  invoiceNumber: '',
  invoiceDate: new Date().toISOString().slice(0, 10),
  customerId: '',
  totalAmount: '',
  amountPaid: '',
  remarks: '',
}

const initialInvoiceItemForm: InvoiceItemFormState = {
  materialTypeId: '',
  quantityBrass: '',
  rate: '',
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

function deriveInvoiceStatus(totalAmount: number, amountPaid: number) {
  if (totalAmount <= 0) {
    return 'pending'
  }

  if (amountPaid === 0) {
    return 'pending'
  }

  if (amountPaid >= totalAmount) {
    return 'paid'
  }

  return 'partial'
}

const inrConverter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
})

function RouteComponent() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = React.useState<FormState>(initialFormState)
  const [errors, setErrors] = React.useState<FormErrors>({})
  const [customerDialogOpen, setCustomerDialogOpen] = React.useState(false)
  const [invoiceItemForm, setInvoiceItemForm] = React.useState<InvoiceItemFormState>(initialInvoiceItemForm)
  const [invoiceItemErrors, setInvoiceItemErrors] = React.useState<InvoiceItemErrors>({})
  const [invoiceItems, setInvoiceItems] = React.useState<InvoiceItemEntry[]>([])
  const [editingInvoiceItemId, setEditingInvoiceItemId] = React.useState<string | null>(null)

  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({
    queryKey: customerKeys.all,
    queryFn: getAllCustomers,
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  })

  const { data: materials = [], isLoading: isLoadingMaterials } = useQuery({
    queryKey: materialKeys.all,
    queryFn: getAllMaterials,
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: customerKeys.all })
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

  const computedTotalAmount = React.useMemo(
    () =>
      invoiceItems.reduce((sum, item) => {
        const amount = Number(item.amount || 0)
        return sum + amount
      }, 0),
    [invoiceItems]
  )

  const computedPaymentStatus = React.useMemo(
    () => {
      const amountPaidValue = Number(form.amountPaid || 0)
      return deriveInvoiceStatus(computedTotalAmount, amountPaidValue)
    },
    [computedTotalAmount, form.amountPaid]
  )

  const selectedCustomer = React.useMemo(
    () => customers.find((customer) => String(customer.id) === form.customerId) ?? null,
    [customers, form.customerId]
  )

  React.useEffect(() => {
    setForm((current) => ({
      ...current,
      totalAmount: invoiceItems.length > 0 ? computedTotalAmount.toFixed(2) : '0.00',
    }))
  }, [computedTotalAmount, invoiceItems.length])

  const totalAmount = Number(form.totalAmount || 0)
  const amountPaid = Number(form.amountPaid || 0)
  const balance = Math.max(totalAmount - amountPaid, 0)

  const handleInvoiceItemFieldChange = (field: keyof InvoiceItemFormState, value: string) => {
    setInvoiceItemForm((current) => ({ ...current, [field]: value }))
    setInvoiceItemErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSaveInvoiceItem = () => {
    const nextErrors: InvoiceItemErrors = {}

    if (!invoiceItemForm.materialTypeId) {
      nextErrors.materialTypeId = 'Material required.'
    }

    if (!invoiceItemForm.quantityBrass.trim()) {
      nextErrors.quantityBrass = 'Quantity required.'
    } else if (Number(invoiceItemForm.quantityBrass) <= 0) {
      nextErrors.quantityBrass = 'Quantity must be greater than 0.'
    }

    if (!invoiceItemForm.rate.trim()) {
      nextErrors.rate = 'Rate required.'
    } else if (Number(invoiceItemForm.rate) <= 0) {
      nextErrors.rate = 'Rate must be greater than 0.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setInvoiceItemErrors(nextErrors)
      return
    }

    const material = materials.find((entry) => String(entry.id) === invoiceItemForm.materialTypeId)
    const quantity = Number(invoiceItemForm.quantityBrass)
    const rate = Number(invoiceItemForm.rate)
    const amount = quantity * rate

    const row: InvoiceItemEntry = {
      id: editingInvoiceItemId ?? crypto.randomUUID(),
      materialTypeId: invoiceItemForm.materialTypeId,
      quantityBrass: String(quantity),
      rate: String(rate),
      amount: String(amount),
      materialName: material?.name ?? 'Unknown material',
    }

    setInvoiceItems((current) => {
      if (editingInvoiceItemId) {
        return current.map((item) => (item.id === editingInvoiceItemId ? row : item))
      }

      return [...current, row]
    })

    setEditingInvoiceItemId(null)
    setInvoiceItemForm(initialInvoiceItemForm)
    setInvoiceItemErrors({})
  }

  const handleEditInvoiceItem = (item: InvoiceItemEntry) => {
    setEditingInvoiceItemId(item.id)
    setInvoiceItemForm({
      materialTypeId: item.materialTypeId,
      quantityBrass: item.quantityBrass,
      rate: item.rate,
    })
    setInvoiceItemErrors({})
  }

  const handleDeleteInvoiceItem = (itemId: string) => {
    setInvoiceItems((current) => current.filter((item) => item.id !== itemId))

    if (editingInvoiceItemId === itemId) {
      setEditingInvoiceItemId(null)
      setInvoiceItemForm(initialInvoiceItemForm)
      setInvoiceItemErrors({})
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors = validateForm(form)

    if (invoiceItems.length === 0) {
      toast.error('Add at least one invoice item before creating the sale.')
      return
    }

    if (Number(form.amountPaid || 0) > computedTotalAmount) {
      nextErrors.amountPaid = 'Paid amount cannot exceed total amount.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const invoiceStatus = deriveInvoiceStatus(computedTotalAmount, amountPaid)

    const payload: CreateInvoicePayload = {
      invoiceNumber: form.invoiceNumber.trim(),
      invoiceDate: form.invoiceDate,
      customer: {
        id: Number(form.customerId),
      },
      totalAmount: computedTotalAmount,
      amountPaid,
      balance,
      status: invoiceStatus,
      remarks: form.remarks.trim() || undefined,
    }

    createMutation.mutate(payload)
  }

  const handleCustomerSelect = (customer: Customer) => {
    handleChange('customerId', String(customer.id))
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-linear-to-b from-background via-background to-muted/20 p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-primary">
            Sales entry
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">New Sale</h1>
            <p className="text-sm text-muted-foreground">
              Create invoice with customer, amount, payment, and status.
            </p>
          </div>
        </div>
        <Button asChild variant="outline" className="shadow-sm">
          <Link to="/sales">
            <IconArrowLeft />
            Back to sales
          </Link>
        </Button>
      </div>

      <div className="grid min-h-[calc(100vh-10rem)] gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="rounded-2xl border border-border/80 bg-card/90 p-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)] backdrop-blur-sm lg:p-7">
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

              <Field className="md:col-span-2">
                <FieldLabel htmlFor="customerId">Customer</FieldLabel>
                <FieldContent>
                  <div className="flex gap-2">
                    <div className="flex-1">
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
                              {selectedCustomer?.name || (isLoadingCustomers ? 'Loading customers...' : 'Select a customer')}
                            </Button>
                          }
                        />
                        <ComboboxContent>
                          <ComboboxInput showTrigger={false} placeholder={isLoadingCustomers ? 'Loading customers...' : 'Select a customer'} />
                          <ComboboxEmpty>No items found.</ComboboxEmpty>
                          <ComboboxList>
                            {(customer) => (
                              <ComboboxItem key={customer.id} value={customer}>
                                {customer.name}
                              </ComboboxItem>
                            )}
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                    </div>

                    <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="shrink-0 shadow-sm"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            setCustomerDialogOpen(true)
                          }}
                        >
                          <IconPlus />
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
                    disabled
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
                <FieldLabel>Invoice items</FieldLabel>
                <FieldContent>
                  <div className="rounded-2xl border border-dashed border-border bg-linear-to-br from-muted/40 via-muted/20 to-background p-4 shadow-inner shadow-muted/30">
                    <div className="mb-3 flex items-center justify-end gap-3">
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary">
                        {invoiceItems.length} saved
                      </span>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <Field>
                        <FieldLabel htmlFor="item-material">Material</FieldLabel>
                        <FieldContent>
                          <Select
                            value={invoiceItemForm.materialTypeId}
                            onValueChange={(value) => handleInvoiceItemFieldChange('materialTypeId', value)}
                            disabled={isLoadingMaterials || materials.length === 0}
                          >
                            <SelectTrigger id="item-material" className="w-full">
                              <SelectValue placeholder={isLoadingMaterials ? 'Loading materials' : 'Select material'} />
                            </SelectTrigger>
                            <SelectContent>
                              {materials
                                .filter((material) => material.isActive !== false)
                                .map((material) => (
                                  <SelectItem key={material.id} value={String(material.id)}>
                                    {material.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          {invoiceItemErrors.materialTypeId && <FieldError>{invoiceItemErrors.materialTypeId}</FieldError>}
                        </FieldContent>
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="item-quantity">Quantity (Brass)</FieldLabel>
                        <FieldContent>
                          <Input
                            id="item-quantity"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={invoiceItemForm.quantityBrass}
                            onChange={(event) => handleInvoiceItemFieldChange('quantityBrass', event.target.value)}
                            placeholder="0.00"
                          />
                          {invoiceItemErrors.quantityBrass && <FieldError>{invoiceItemErrors.quantityBrass}</FieldError>}
                        </FieldContent>
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="item-rate">Rate</FieldLabel>
                        <FieldContent>
                          <Input
                            id="item-rate"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={invoiceItemForm.rate}
                            onChange={(event) => handleInvoiceItemFieldChange('rate', event.target.value)}
                            placeholder="0.00"
                          />
                          {invoiceItemErrors.rate && <FieldError>{invoiceItemErrors.rate}</FieldError>}
                        </FieldContent>
                      </Field>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <Button type="button" onClick={handleSaveInvoiceItem} className="shadow-sm">
                        <SaveIcon />
                        {editingInvoiceItemId ? 'Update item' : 'Save item'}
                      </Button>
                    </div>
                  </div>

                  {invoiceItems.length > 0 && (
                    <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-muted/40">
                          <tr>
                            <th className="px-3 py-2 font-medium">Material</th>
                            <th className="px-3 py-2 font-medium">Qty</th>
                            <th className="px-3 py-2 font-medium">Rate</th>
                            <th className="px-3 py-2 font-medium">Amount</th>
                            <th className="px-3 py-2 font-medium text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoiceItems.map((item) => (
                            <tr key={item.id} className="border-t">
                              <td className="px-3 py-2">{item.materialName}</td>
                              <td className="px-3 py-2">{item.quantityBrass}</td>
                              <td className="px-3 py-2">{item.rate}</td>
                              <td className="px-3 py-2">{item.amount}</td>
                              <td className="px-3 py-2">
                                <div className="flex justify-end gap-2">
                                  <Button type="button" variant="outline" size="sm" onClick={() => handleEditInvoiceItem(item)}>
                                    Edit
                                  </Button>
                                  <Button type="button" variant="destructive" size="sm" onClick={() => handleDeleteInvoiceItem(item.id)}>
                                    Delete
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
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

            <div className="flex items-center justify-end gap-3 border-t border-border/80 pt-4">
              <Button asChild type="button" variant="outline" className="shadow-sm">
                <Link to="/sales">
                  <IconArrowLeft />
                  Cancel
                </Link>
              </Button>
              <Button disabled={createMutation.isPending} type="submit" className="shadow-[0_12px_24px_-18px_rgba(59,130,246,0.8)]">
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

        <aside className="h-fit rounded-2xl border border-border/80 bg-card/90 p-5 shadow-[0_16px_32px_-28px_rgba(15,23,42,0.35)] lg:sticky lg:top-6">
          <div className="mb-5 border-b border-border/80 pb-4">
            <h2 className="text-base font-semibold">Invoice summary</h2>
            <p className="text-sm text-muted-foreground">Live snapshot from current form values.</p>
          </div>

          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-2 text-sm font-medium text-primary">
            <IconReceipt className="size-4" />
            Review before save
          </div>

          <div className="rounded-xl border border-border/80 bg-muted/20 px-4 py-3">
            <SummaryRow label="Invoice" value={form.invoiceNumber.trim() || 'Not set'} />
            <SummaryRow label="Date" value={form.invoiceDate || 'Not set'} />
            <SummaryRow label="Customer" value={selectedCustomer?.name ?? 'Not set'} />
            <SummaryRow label="Paid" value={form.amountPaid.trim() || '0.00'} />
            <SummaryRow label="Balance" value={balance.toFixed(2)} />
            <SummaryRow isBadge label="Status" value={computedPaymentStatus} />
            <div className="mt-2 p-1">
                <div className="flex flex-col dark:bg-accent bg-primary/10 p-2 text-primary dark:text-white rounded border border-primary/10">
                  <div className="text-primary/80">
                    Total
                  </div>
                  <div className="text-2xl font-bold">
                    {inrConverter.format(Number(form.totalAmount.trim() || '0.00'))}
                  </div>
                </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}