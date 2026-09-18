import { SummaryRow } from '#/components/summary-row'
import { FormPageLayout } from '#/components/form-page-layout'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Checkbox } from '#/components/ui/checkbox'
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
import type { CreateInvoicePayload, Customer, Invoice, InvoiceItem } from '#/lib/models'
import { customerKeys, getAllCustomers, getAllMaterials, getAllSales, materialKeys, salesKeys } from '#/lib/query'
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
  applyCredit: boolean
  creditToApply: string
  cashPaidNow: string
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
  applyCredit: false,
  creditToApply: '',
  cashPaidNow: '',
}

const initialInvoiceItemForm: InvoiceItemFormState = {
  materialTypeId: '',
  quantityBrass: '',
  rate: '',
  truckNumber: ''
}

function buildNextInvoiceNumber(invoices: Invoice[], year: number) {
  const yearText = String(year)

  const maxSequence = invoices.reduce((max, invoice) => {
    const invoiceNumber = (invoice.invoiceNumber ?? '').trim()

    if (!invoiceNumber.includes(yearText)) {
      return max
    }

    const yearSequenceMatch = invoiceNumber.match(new RegExp(`${yearText}\\D*(\\d+)$`))
    const fallbackLastNumberMatch = invoiceNumber.match(/(\d+)(?!.*\d)/)
    const sequenceText = yearSequenceMatch?.[1] ?? fallbackLastNumberMatch?.[1]
    const sequence = sequenceText ? Number(sequenceText) : NaN

    if (!Number.isFinite(sequence)) {
      return max
    }

    return Math.max(max, sequence)
  }, 0)

  return `INV-${yearText}-${String(maxSequence + 1).padStart(4, '0')}`
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

  if (form.applyCredit) {
    if (form.cashPaidNow.trim() && Number(form.cashPaidNow) < 0) {
      errors.cashPaidNow = 'Cash received cannot be negative.'
    }
    if (form.creditToApply.trim() && Number(form.creditToApply) < 0) {
      errors.creditToApply = 'Credit cap cannot be negative.'
    }
  } else {
    if (form.amountPaid.trim() && Number(form.amountPaid) < 0) {
      errors.amountPaid = 'Paid amount cannot be negative.'
    }

    // if (form.totalAmount.trim() && form.amountPaid.trim() && Number(form.amountPaid) > Number(form.totalAmount)) {
    //   errors.amountPaid = 'Paid amount cannot exceed total amount.'
    // }
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
  const shouldAutoGenerateInvoiceNumber = !initialValues?.invoiceNumber;
  console.log(shouldAutoGenerateInvoiceNumber);
  const [form, setForm] = React.useState<FormState>({ ...initialFormState, ...initialValues })
  const [errors, setErrors] = React.useState<FormErrors>({})
  const [customerDialogOpen, setCustomerDialogOpen] = React.useState(false)
  const [invoiceItemForm, setInvoiceItemForm] = React.useState<InvoiceItemFormState>(() => {
    const initialItem = initialInvoiceItems?.[0]
    return initialItem
      ? {
          materialTypeId: initialItem.materialTypeId,
          quantityBrass: initialItem.quantityBrass,
          rate: initialItem.rate,
          truckNumber: initialItem.truckNumber,
        }
      : initialInvoiceItemForm
  })
  const [invoiceItemErrors, setInvoiceItemErrors] = React.useState<InvoiceItemErrors>({})

  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({
    queryKey: customerKeys.all,
    queryFn: getAllCustomers,
    retry: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  })

  const { data: materials = [], isLoading: isLoadingMaterials } = useQuery({
    queryKey: materialKeys.all,
    queryFn: getAllMaterials,
    retry: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  })

  const { data: sales = [] } = useQuery({
    queryKey: salesKeys.all,
    queryFn: getAllSales,
    enabled: shouldAutoGenerateInvoiceNumber,
    retry: false,
    refetchOnMount: true,
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

  const handleApplyCreditToggle = (checked: boolean) => {
    setForm((current) => ({ ...current, applyCredit: checked }))
  }

  const totalAmount = Number(form.totalAmount || 0)

  const selectedCustomer = React.useMemo(
    () => customers.find((customer) => String(customer.id) === form.customerId) ?? null,
    [customers, form.customerId]
  )

  const selectedCustomerPendingBalance = React.useMemo(() => {
    if (!selectedCustomer) {
      return 0
    }

    return selectedCustomer.pendingBalance ?? 0
  }, [selectedCustomer])

  const selectedCustomerAvailableCredit = React.useMemo(() => {
    if (!selectedCustomer) {
      return 0
    }

    return selectedCustomer.availableCredit ?? 0
  }, [selectedCustomer])

  const creditAppliedPreview = React.useMemo(() => {
    if (!form.applyCredit) {
      return 0
    }

    let credit = selectedCustomerAvailableCredit
    if (form.creditToApply.trim()) {
      credit = Math.min(credit, Number(form.creditToApply))
    }
    credit = Math.min(credit, totalAmount)

    return Math.max(credit, 0)
  }, [form.applyCredit, form.creditToApply, selectedCustomerAvailableCredit, totalAmount])

  const effectiveAmountPaid = form.applyCredit
    ? creditAppliedPreview + Number(form.cashPaidNow || 0)
    : Number(form.amountPaid || 0)

  const computedPaymentStatus = React.useMemo(
    () => deriveInvoiceStatus(totalAmount, effectiveAmountPaid),
    [totalAmount, effectiveAmountPaid]
  )

  React.useEffect(() => {
    if (!shouldAutoGenerateInvoiceNumber) {
      return
    }
    console.log('in useeffeect', sales);
    setForm((current) => {
      const invoiceNumber = buildNextInvoiceNumber(sales, new Date().getFullYear());
      if(current.invoiceNumber.trim() === invoiceNumber.trim()){
        return current;
      }

      return {
        ...current,
        invoiceNumber: buildNextInvoiceNumber(sales, new Date().getFullYear()),
      }
    })
  }, [sales, shouldAutoGenerateInvoiceNumber])

  const amountPaid = effectiveAmountPaid
  const balance = Math.max(totalAmount - amountPaid, 0)
  const paymentStatusBadge = getPaymentStatusBadge(computedPaymentStatus)
  const balanceTone = getBalanceTone(computedPaymentStatus)

  const handleInvoiceItemFieldChange = (field: keyof InvoiceItemFormState, value: string) => {
    setInvoiceItemForm((current) => ({ ...current, [field]: value }))
    setInvoiceItemErrors((current) => ({ ...current, [field]: undefined }))
  }

  const validateInvoiceItem = () => {
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

    if (!invoiceItemForm.truckNumber.trim()) {
      nextErrors.truckNumber = 'Truck Number required.'
    }

    return nextErrors
  }

  const buildInvoiceItem = (): InvoiceItemEntry => {
    const material = materials.find((entry) => String(entry.id) === invoiceItemForm.materialTypeId)
    const quantity = Number(invoiceItemForm.quantityBrass)
    const rate = Number(invoiceItemForm.rate)
    const amount = quantity * rate

    return {
      id: crypto.randomUUID(),
      materialTypeId: invoiceItemForm.materialTypeId,
      quantityBrass: String(quantity),
      rate: String(rate),
      amount: String(amount),
      materialName: material?.name ?? 'Unknown material',
      truckNumber: invoiceItemForm.truckNumber,
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors = validateForm(form)
    const invoiceItemErrorsNext = validateInvoiceItem()

    if (Object.keys(invoiceItemErrorsNext).length > 0) {
      setInvoiceItemErrors(invoiceItemErrorsNext)
      setErrors(nextErrors)
      return
    }

    // if (!form.applyCredit && Number(form.amountPaid || 0) > totalAmount) {
    //   nextErrors.amountPaid = 'Paid amount cannot exceed total amount.'
    // }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const invoiceStatus = deriveInvoiceStatus(totalAmount, amountPaid)
    const invoiceItem = buildInvoiceItem()

    const payload: CreateInvoicePayload = {
      invoiceNumber: form.invoiceNumber.trim(),
      invoiceDate: form.invoiceDate,
      customerId: Number(form.customerId),
      totalAmount,
      amountPaid,
      balance,
      status: invoiceStatus,
      remarks: form.remarks.trim() || undefined,
      applyCredit: form.applyCredit,
      creditToApply: form.applyCredit && form.creditToApply.trim() ? Number(form.creditToApply) : undefined,
      cashPaidNow: form.applyCredit ? Number(form.cashPaidNow || 0) : undefined,
      invoiceItems: [
        {
          ...invoiceItem,
          id: !isNaN(Number(invoiceItem.id)) ? Number(invoiceItem.id) : 0,
          materialTypeId: Number(invoiceItem.materialTypeId),
          quantityBrass: Number(invoiceItem.quantityBrass),
          rate: Number(invoiceItem.rate),
          amount: Number(invoiceItem.amount),
        },
      ],
    }

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
            1 item
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
            {selectedCustomer ? (
              <>
                <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300">
                  Pending: {inrConverter.format(selectedCustomerPendingBalance)}
                </p>
                <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-300">
                  Available credit: {inrConverter.format(selectedCustomerAvailableCredit)}
                </p>
                {form.applyCredit ? (
                  <p className="mt-0.5 text-xs text-primary">
                    Credit to apply: {inrConverter.format(creditAppliedPreview)}
                  </p>
                ) : null}
              </>
            ) : null}
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
                    readOnly
                    placeholder="INV-YYYY-0001"
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
                              {selectedCustomer
                                ? `${selectedCustomer.name} (${inrConverter.format(selectedCustomerPendingBalance)} pending)`
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
                                  <span className="flex flex-col items-end text-xs font-medium">
                                    <span className="text-amber-700 dark:text-amber-300">
                                      {inrConverter.format(customer.pendingBalance ?? 0)} pending
                                    </span>
                                    <span className="text-emerald-700 dark:text-emerald-300">
                                      {inrConverter.format(customer.availableCredit ?? 0)} credit
                                    </span>
                                  </span>
                                </div>
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
                    className="font-semibold tabular-nums"
                  />
                  <FieldError>{errors.totalAmount}</FieldError>
                </FieldContent>
              </Field>

              <Field className="md:col-span-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="applyCredit"
                    checked={form.applyCredit}
                    onCheckedChange={(checked) => handleApplyCreditToggle(checked === true)}
                    disabled={!selectedCustomer || selectedCustomerAvailableCredit <= 0}
                  />
                  <FieldLabel htmlFor="applyCredit" className="font-normal">
                    Apply available credit
                    {selectedCustomer ? ` (${inrConverter.format(selectedCustomerAvailableCredit)} available)` : ''}
                  </FieldLabel>
                </div>
              </Field>

              {form.applyCredit ? (
                <>
                  <Field>
                    <FieldLabel htmlFor="creditToApply">Credit cap (optional)</FieldLabel>
                    <FieldContent>
                      <Input
                        id="creditToApply"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.creditToApply}
                        onChange={(event) => handleChange('creditToApply', event.target.value)}
                        placeholder={`Up to ${selectedCustomerAvailableCredit.toFixed(2)}`}
                      />
                      <FieldError>{errors.creditToApply}</FieldError>
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="cashPaidNow">Cash received now</FieldLabel>
                    <FieldContent>
                      <Input
                        id="cashPaidNow"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.cashPaidNow}
                        onChange={(event) => handleChange('cashPaidNow', event.target.value)}
                        placeholder="0.00"
                        className="font-semibold tabular-nums"
                      />
                      <FieldError>{errors.cashPaidNow}</FieldError>
                    </FieldContent>
                  </Field>

                  <Field className="md:col-span-2">
                    <p className="text-xs text-muted-foreground">
                      Credit to apply: <span className="font-semibold text-foreground">{inrConverter.format(creditAppliedPreview)}</span>
                      {' '}&middot; Total paid: <span className="font-semibold text-foreground">{inrConverter.format(effectiveAmountPaid)}</span>
                    </p>
                  </Field>
                </>
              ) : (
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
              )}
          </div>
        </div>

        <div className="py-6">
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
          </div>
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
                    <SaveIcon />
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
