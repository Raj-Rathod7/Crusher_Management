import { FormPageLayout } from '#/components/form-page-layout'
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
import { isManager } from '#/lib/common/api'
import type { CreateInvoicePayload, Customer } from '#/lib/models'
import { customerKeys, getAllCustomers, getAllMaterials, getNextInvoiceNumber, materialKeys, salesKeys } from '#/lib/query'
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
  paymentAmount: string
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
  requireRate?: boolean
}

const todayLocal = () => new Date().toLocaleDateString('en-CA')

const initialFormState: FormState = {
  invoiceNumber: '',
  invoiceDate: todayLocal(),
  customerId: '',
  totalAmount: '',
  paymentAmount: '',
  remarks: '',
}

const initialInvoiceItemForm: InvoiceItemFormState = {
  materialTypeId: '',
  quantityBrass: '',
  rate: '',
  truckNumber: ''
}

function validateForm(form: FormState, manager: boolean) {
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

  if (manager) {
    return errors
  }

  if (!form.totalAmount.trim() || Number(form.totalAmount) <= 0) {
    errors.totalAmount = 'Total amount must be greater than 0.'
  }

  if (form.paymentAmount.trim() && Number(form.paymentAmount) <= 0) {
    errors.paymentAmount = 'Payment amount must be greater than 0.'
  }

  return errors
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
  requireRate = false,
}: SalesFormProps) {
  const queryClient = useQueryClient()
  const manager = isManager()
  const shouldAutoGenerateInvoiceNumber = !initialValues?.invoiceNumber;
  const [form, setForm] = React.useState<FormState>({
    ...initialFormState,
    ...initialValues,
    ...(manager ? { invoiceDate: todayLocal() } : {}),
  })
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
    queryKey: materialKeys.list({ type: 'SALE' }),
    queryFn: () => getAllMaterials({ type: 'SALE' }),
    retry: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  })

  const { data: nextInvoiceNumber } = useQuery({
    queryKey: [...salesKeys.all, 'next-number'],
    queryFn: getNextInvoiceNumber,
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

  React.useEffect(() => {
    if (!shouldAutoGenerateInvoiceNumber || !nextInvoiceNumber) {
      return
    }
    setForm((current) =>
      current.invoiceNumber === nextInvoiceNumber ? current : { ...current, invoiceNumber: nextInvoiceNumber })
  }, [nextInvoiceNumber, shouldAutoGenerateInvoiceNumber])

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

    if (!invoiceItemForm.truckNumber.trim()) {
      nextErrors.truckNumber = 'Truck Number required.'
    }

    if (requireRate && !manager && !(Number(invoiceItemForm.rate) > 0)) {
      nextErrors.rate = 'Rate must be greater than 0.'
    }

    return nextErrors
  }

  const buildInvoiceItem = (): InvoiceItemEntry => {
    const material = materials.find((entry) => String(entry.id) === invoiceItemForm.materialTypeId)
    const quantity = Number(invoiceItemForm.quantityBrass)
    const rate = Number(invoiceItemForm.rate) ?? 1;
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

    const nextErrors = validateForm(form, manager)
    const invoiceItemErrorsNext = validateInvoiceItem()

    if (Object.keys(invoiceItemErrorsNext).length > 0) {
      setInvoiceItemErrors(invoiceItemErrorsNext)
      setErrors(nextErrors)
      return
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const invoiceItem = buildInvoiceItem()

    if (manager) {
      onSubmit({
        invoiceNumber: form.invoiceNumber.trim(),
        invoiceDate: form.invoiceDate,
        customerId: Number(form.customerId),
        remarks: form.remarks.trim() || undefined,
        invoiceItems: [
          {
            ...invoiceItem,
            id: 0,
            materialTypeId: Number(invoiceItem.materialTypeId),
            quantityBrass: Number(invoiceItem.quantityBrass),
            rate: null,
            amount: 0,
          },
        ],
      })
      return
    }

    const payload: CreateInvoicePayload = {
      invoiceNumber: form.invoiceNumber.trim(),
      invoiceDate: form.invoiceDate,
      customerId: Number(form.customerId),
      totalAmount,
      ...(form.paymentAmount.trim()
        ? { paymentAmount: Number(form.paymentAmount) }
        : {}),
      remarks: form.remarks.trim() || undefined,
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

  const sidebarContent = isPage && showSummary && !manager ? (
    <>
      <div className="flex items-start justify-between gap-3 border-b border-border/80 pb-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Invoice review</p>
          <h2 className="mt-1 text-lg font-semibold tracking-normal">Sales summary</h2>
        </div>
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

      <div className="mt-4 flex items-center justify-between border-b border-border/80 pb-4 text-sm">
        <span className="text-muted-foreground">Payment received</span>
        <span className="font-semibold tabular-nums">
          {form.paymentAmount.trim() ? inrConverter.format(Number(form.paymentAmount)) : 'Not received'}
        </span>
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
                <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300">
                  Pending: {inrConverter.format(selectedCustomerPendingBalance)}
                </p>
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
                    placeholder="INV-YY/YY-0001"
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
                    readOnly={manager}
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

        {!manager && (
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

              <Field>
                  <FieldLabel htmlFor="paymentAmount">Payment received (optional)</FieldLabel>
                  <FieldContent>
                    <Input
                      id="paymentAmount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.paymentAmount}
                      onChange={(event) => handleChange('paymentAmount', event.target.value)}
                      placeholder="0.00"
                      className="font-semibold tabular-nums"
                    />
                    <FieldError>{errors.paymentAmount}</FieldError>
                  </FieldContent>
              </Field>

          </div>
        </div>
        )}

        <div className="py-6">
          <div className="border border-border/80 bg-muted/20 p-4">
                    <div className={`grid gap-4 ${manager ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
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

                      {!manager && (
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
                      )}
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
      description={description || 'Record the customer, material, truck, quantity, and sale total.'}
      backLabel={backLabel || 'Back to sales'}
      backTo={backTo}
      badge="Sales entry"
      sidebar={sidebarContent}
    >
      {formContent}
    </FormPageLayout>
  )
}
