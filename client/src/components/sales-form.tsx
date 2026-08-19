import { SummaryRow } from '#/components/summary-row'
import { FormPageLayout } from '#/components/form-page-layout'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList, ComboboxTrigger } from '#/components/ui/combobox'
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
import { Textarea } from '#/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { createCustomer } from '#/lib/mutation'
import type { CreateInvoicePayload, Customer, InvoiceItem } from '#/lib/models'
import { customerKeys, getAllCustomers, getAllMaterials, materialKeys } from '#/lib/query'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { IconArrowLeft, IconCurrencyRupee, IconPlus, IconReceipt, IconUser } from '@tabler/icons-react'
import { SaveIcon } from 'lucide-react'
import * as React from 'react'
import { toast } from 'sonner'
import { CustomerForm } from './customer-form'

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
  truckNumber: string
}

type InvoiceItemFormState = {
  materialTypeId: string
  quantityBrass: string
  rate: string
  truckNumber: string
}

type InvoiceItemErrors = Partial<Record<keyof InvoiceItemFormState, string>>

type FormErrors = Partial<Record<keyof FormState, string>>

type SalesFormProps = {
  title?: string
  description?: string
  backLabel?: string
  submitLabel: string
  isSubmitting?: boolean
  initialValues?: Partial<FormState>
  initialInvoiceItems?: InvoiceItemEntry[]
  onSubmit: (payload: CreateInvoicePayload) => void
  showSummary?: boolean
  variant?: 'page' | 'dialog'
}

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
  truckNumber: ''
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

function getPaymentStatusBadge(status: string) {
  if (status === 'paid') {
    return {
      label: 'Paid',
      className: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    }
  }

  if (status === 'partial') {
    return {
      label: 'Partial',
      className: 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    }
  }

  return {
    label: 'Pending',
    className: 'border-border bg-muted text-muted-foreground',
  }
}

function getBalanceTone(status: string) {
  if (status === 'paid') {
    return {
      container: 'border-emerald-500/20 bg-emerald-500/5',
      label: 'text-emerald-700/80 dark:text-emerald-300/80',
      value: 'text-emerald-800 dark:text-emerald-200',
    }
  }

  if (status === 'partial') {
    return {
      container: 'border-amber-500/20 bg-amber-500/5',
      label: 'text-amber-700/80 dark:text-amber-300/80',
      value: 'text-amber-800 dark:text-amber-200',
    }
  }

  return {
    container: 'border-border bg-muted/40',
    label: 'text-muted-foreground',
    value: 'text-foreground',
  }
}

const inrConverter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
})

export function SalesForm({
  title,
  description,
  backLabel,
  submitLabel,
  isSubmitting = false,
  initialValues,
  initialInvoiceItems,
  onSubmit,
  showSummary = true,
  variant = 'page',
}: SalesFormProps) {
  const queryClient = useQueryClient()
  const [form, setForm] = React.useState<FormState>({ ...initialFormState, ...initialValues })
  const [errors, setErrors] = React.useState<FormErrors>({})
  const [customerDialogOpen, setCustomerDialogOpen] = React.useState(false)
  const [invoiceItemForm, setInvoiceItemForm] = React.useState<InvoiceItemFormState>(initialInvoiceItemForm)
  const [invoiceItemErrors, setInvoiceItemErrors] = React.useState<InvoiceItemErrors>({})
  const [invoiceItems, setInvoiceItems] = React.useState<InvoiceItemEntry[]>(initialInvoiceItems || [])
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

  const isPage = variant === 'page'
  const backTo = '/sales'

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
  const paymentStatusBadge = getPaymentStatusBadge(computedPaymentStatus)
  const balanceTone = getBalanceTone(computedPaymentStatus)

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

    if(!invoiceItemForm.truckNumber.trim()){
      nextErrors.truckNumber = 'Truck Number required.'
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
      truckNumber: invoiceItemForm.truckNumber
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
      truckNumber: item.truckNumber
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
      customerId: Number(form.customerId),
      totalAmount: computedTotalAmount,
      amountPaid,
      balance,
      status: invoiceStatus,
      remarks: form.remarks.trim() || undefined,
      invoiceItems: invoiceItems.map(item => {
        return {
          ...item, 
          quantity: Number(item.quantityBrass),
          id: !isNaN(Number(item.id)) ? Number(item.id) : 0,
          materialTypeId: Number(item.materialTypeId),
          rate: Number(item.rate),
          amount: Number(item.amount)
        }
      })
    }
    console.log(invoiceItems);
    console.log(payload);

    onSubmit(payload)
  }

  const handleCustomerSelect = (customer: Customer) => {
    handleChange('customerId', String(customer.id))
  }

  const sidebarContent = isPage && showSummary ? (
    <>
      <div className="flex items-start justify-between gap-3 border-b border-border/80 pb-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Invoice review</p>
          <h2 className="mt-1 text-lg font-semibold tracking-normal">Sales summary</h2>
        </div>
        <Badge variant="outline" className={paymentStatusBadge.className}>
          {paymentStatusBadge.label}
        </Badge>
      </div>

      <div className="mt-4 border-l-2 border-primary bg-primary/5 py-3 pr-3 pl-4">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary">
          <IconCurrencyRupee className="size-4" />
          Invoice total
        </div>
        <div className="mt-1 flex items-end justify-between gap-3">
          <span className="text-3xl font-semibold tracking-normal tabular-nums text-foreground">
            {inrConverter.format(totalAmount)}
          </span>
          <span className="mb-1 text-xs font-medium text-muted-foreground">
            {invoiceItems.length} item{invoiceItems.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 divide-x divide-border/80 border-y border-border/80 py-3">
          <div className="pr-3">
            <div className="text-[11px] font-medium uppercase tracking-wide text-emerald-700/80 dark:text-emerald-300/80">
              Paid
            </div>
            <div className="mt-1 text-sm font-semibold tabular-nums text-emerald-800 dark:text-emerald-200">
              {inrConverter.format(amountPaid)}
            </div>
          </div>
          <div className="pl-3">
            <div className={`text-[11px] font-medium uppercase tracking-wide ${balanceTone.label}`}>
              Balance
            </div>
            <div className={`mt-1 text-sm font-semibold tabular-nums ${balanceTone.value}`}>
              {inrConverter.format(balance)}
            </div>
          </div>
      </div>

      <div className="mt-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <IconReceipt className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Invoice</p>
            <p className="mt-1 truncate text-sm font-semibold">{form.invoiceNumber.trim() || 'Not set'}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{form.invoiceDate || 'Date not set'}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <IconUser className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Customer</p>
            <p className="mt-1 truncate text-sm font-semibold">{selectedCustomer?.name ?? 'Not set'}</p>
          </div>
        </div>
      </div>
    </>
  ) : undefined

  const formContent = (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <FieldGroup className="gap-0">
        <div className="border-b border-border/80 pb-6">
          <div className="grid gap-4 md:grid-cols-2">
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
          </div>
        </div>

        <div className="border-b border-border/80 py-6">
          <div className="grid gap-4 md:grid-cols-2">
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
                    className="font-semibold tabular-nums"
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
                    className="font-semibold tabular-nums"
                  />
                  <FieldError>{errors.amountPaid}</FieldError>
                </FieldContent>
              </Field>
          </div>
        </div>

        <div className="py-6">
          <div className="mb-4 flex justify-end">
            <Badge variant="secondary" className="shrink-0 tabular-nums">
              {invoiceItems.length} item{invoiceItems.length === 1 ? '' : 's'}
            </Badge>
          </div>
          <div className="border border-border/80 bg-muted/20 p-4">
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
                    <div className="mt-2">
                      <Field>
                        <FieldLabel htmlFor="item-truck-number">Tuck Number</FieldLabel>
                        <FieldContent>
                          <Input
                            id="item-rate"
                            type="text"
                            value={invoiceItemForm.truckNumber}
                            onChange={(event) => handleInvoiceItemFieldChange('truckNumber', event.target.value)}
                            placeholder="Enter Truck Number"
                          />
                          {invoiceItemErrors.truckNumber && <FieldError>{invoiceItemErrors.truckNumber}</FieldError>}
                        </FieldContent>
                      </Field>
                    </div>

                    <div className="mt-4 flex justify-end border-t border-border/70 pt-4">
                      <Button type="button" onClick={handleSaveInvoiceItem}>
                        <SaveIcon />
                        {editingInvoiceItemId ? 'Update item' : 'Save item'}
                      </Button>
                    </div>
          </div>

          {invoiceItems.length > 0 && (
                    <div className="mt-4 overflow-x-auto border border-border/80 bg-card">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-muted/60 text-[11px] uppercase tracking-wide text-muted-foreground">
                          <tr>
                            <th className="px-3 py-2.5 font-semibold">Material</th>
                            <th className="px-3 py-2.5 font-semibold">Truck Number</th>
                            <th className="px-3 py-2.5 font-semibold">Qty</th>
                            <th className="px-3 py-2.5 font-semibold">Rate</th>
                            <th className="px-3 py-2.5 font-semibold">Amount</th>
                            <th className="px-3 py-2.5 font-semibold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoiceItems.map((item) => (
                            <tr key={item.id} className="border-t hover:bg-muted/30">
                              <td className="px-3 py-3 font-medium">{item.materialName}</td>
                              <td className="px-3 py-3 font-medium">{item.truckNumber}</td>
                              <td className="px-3 py-3 tabular-nums">{item.quantityBrass}</td>
                              <td className="px-3 py-3 tabular-nums">{item.rate}</td>
                              <td className="px-3 py-3 font-medium tabular-nums">{item.amount}</td>
                              <td className="px-3 py-3">
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
        </div>

        <div className="border-t border-border/80 pt-6">
              <Field>
                <FieldLabel htmlFor="remarks">Remarks</FieldLabel>
                <FieldContent>
                  <Textarea
                    id="remarks"
                    value={form.remarks}
                    onChange={(event) => handleChange('remarks', event.target.value)}
                    placeholder="Optional invoice notes"
                    className="min-h-28"
                  />
                </FieldContent>
              </Field>
        </div>
      </FieldGroup>

            <div className="flex items-center justify-end gap-3 border-t border-border/80 pt-4">
              {isPage ? (
                <Button asChild type="button" variant="outline" className="shadow-sm">
                  <Link to={backTo}>
                    <IconArrowLeft />
                    {backLabel || 'Back'}
                  </Link>
                </Button>
              ) : (
                <Button type="button" variant="outline">
                  Back
                </Button>
              )}
              <Button disabled={isSubmitting} type="submit" className="shadow-[0_12px_24px_-18px_rgba(59,130,246,0.8)]">
                {isSubmitting ? (
                  'Saving...'
                ) : (
                  <>
                    <IconPlus />
                    {submitLabel}
                  </>
                )}
              </Button>
            </div>
          </form>
    )

  if (!isPage) {
    return formContent
  }

  return (
    <FormPageLayout
      title={title || 'New Sale'}
      description={description || 'Create invoice with customer, amount, payment, and status.'}
      backLabel={backLabel || 'Back to sales'}
      backTo={backTo}
      badge="Sales entry"
      sidebar={sidebarContent}
    >
      {formContent}
    </FormPageLayout>
  )
}
