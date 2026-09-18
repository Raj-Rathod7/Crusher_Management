import { ConfigurableDataTable } from '#/components/data-table'
import { FormPageLayout } from '#/components/form-page-layout'
import { RecordPaymentForm, type RecordPaymentFormValues } from '#/components/record-payment-form'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import type { Customer, Invoice, Payment } from '#/lib/models'
import { applyCreditToInvoice, recordInvoicePayment } from '#/lib/mutation'
import { customerKeys, customerSummaryKeys, getCustomerById, getCustomerSummary, receiptKeys } from '#/lib/query'
import { IconPencil } from '@tabler/icons-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_app/customer/$customerId/')({
  component: RouteComponent,
})

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

function RouteComponent() {
  const { customerId } = Route.useParams()
  const navigate = useNavigate()
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null)
  const queryClient = useQueryClient()

  const customerQuery = useQuery({
    queryKey: customerKeys.detail(customerId),
    queryFn: () => getCustomerById(customerId),
    retry: false,
  })

  const summaryQuery = useQuery({
    queryKey: customerSummaryKeys.detail(customerId),
    queryFn: () => getCustomerSummary(customerId),
    retry: false,
  })

  const applyCreditMutation = useMutation({
    mutationFn: ({ invoiceId }: { invoiceId: number }) => applyCreditToInvoice(invoiceId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: customerKeys.all }),
        queryClient.invalidateQueries({ queryKey: customerKeys.detail(customerId) }),
        queryClient.invalidateQueries({ queryKey: customerSummaryKeys.detail(customerId) }),
        queryClient.invalidateQueries({ queryKey: receiptKeys.all }),
      ])
      toast.success('Credit applied to invoice.')
    },
    onError: () => {
      toast.error('Failed to apply credit to invoice.')
    },
  })

  const recordPaymentMutation = useMutation({
    mutationFn: ({ invoiceId, payload }: { invoiceId: number; payload: RecordPaymentFormValues }) =>
      recordInvoicePayment(invoiceId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: customerKeys.all }),
        queryClient.invalidateQueries({ queryKey: customerKeys.detail(customerId) }),
        queryClient.invalidateQueries({ queryKey: customerSummaryKeys.detail(customerId) }),
      ])
      toast.success('Payment recorded.')
      setPaymentInvoice(null)
    },
    onError: (mutationError: unknown) => {
      const message = mutationError instanceof Error ? mutationError.message : 'Failed to record payment.'
      toast.error(message)
    },
  })

  const customer = customerQuery.data
  const invoices = summaryQuery.data?.recentInvoices ?? []
  const payments = summaryQuery.data?.recentPayments ?? []
  const receipts = payments.filter(
    (payment) => payment.entryType === 'ADVANCE_RECEIPT' || payment.entryType === 'CREDIT_ADJUSTMENT',
  )
  const creditUsage = payments.filter((payment) => payment.entryType === 'CREDIT_APPLIED')
  const currentAvailableCredit = summaryQuery.data?.customer.availableCredit ?? customer?.availableCredit ?? 0

  return (
    <FormPageLayout
      title={customer?.name ?? 'Customer'}
      description="Invoices, receipts, and credit usage"
      backLabel="Back to customers"
      backTo="/customer"
      badge="Customer"
    >
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          {customer ? <CustomerDetailsPanel customer={customer} /> : null}
          {customer ? (
            <Button asChild size="sm" variant="outline">
              <Link to="/customer/$customerId/edit" params={{ customerId }}>
                <IconPencil />
                Edit
              </Link>
            </Button>
          ) : null}
        </div>

        {summaryQuery.isLoading ? (
          <InvoiceModalSkeleton />
        ) : summaryQuery.isError ? (
          <Card className="border-destructive/30">
            <CardContent className="p-5 text-sm text-destructive">
              Unable to load this customer&apos;s history.
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="invoices">
            <TabsList>
              <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
              <TabsTrigger value="receipts">Receipts ({receipts.length})</TabsTrigger>
              <TabsTrigger value="credit-usage">Credit usage ({creditUsage.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="invoices">
              {invoices.length ? (
                <div>
                  <CustomerInvoiceSummary invoices={invoices} />
                  <ExpandableInvoiceTable
                    invoices={invoices}
                    availableCredit={currentAvailableCredit}
                    onApplyCredit={(invoiceId) => applyCreditMutation.mutate({ invoiceId })}
                    isApplyingCredit={applyCreditMutation.isPending}
                    onRecordPayment={(invoice) => setPaymentInvoice(invoice)}
                    onOpenInvoice={(invoiceId) =>
                      navigate({ to: '/sales/$saleId', params: { saleId: String(invoiceId) } })
                    }
                  />
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center text-sm text-muted-foreground">
                    No invoices recorded for this customer.
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="receipts">
              <ReceiptsTable receipts={receipts} />
            </TabsContent>

            <TabsContent value="credit-usage">
              <CreditUsageTable
                entries={creditUsage}
                onOpenInvoice={(invoiceId) =>
                  navigate({ to: '/sales/$saleId', params: { saleId: String(invoiceId) } })
                }
              />
            </TabsContent>
          </Tabs>
        )}
      </div>

      <Dialog open={paymentInvoice !== null} onOpenChange={(open) => !open && setPaymentInvoice(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
            <DialogDescription>
              {paymentInvoice ? `Invoice ${paymentInvoice.invoiceNumber} — outstanding ${currency.format(paymentInvoice.balance)}.` : null}
            </DialogDescription>
          </DialogHeader>
          {paymentInvoice ? (
            <RecordPaymentForm
              balance={paymentInvoice.balance}
              availableCredit={currentAvailableCredit}
              isSubmitting={recordPaymentMutation.isPending}
              onCancel={() => setPaymentInvoice(null)}
              onSubmit={(payload) => recordPaymentMutation.mutate({ invoiceId: paymentInvoice.id, payload })}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </FormPageLayout>
  )
}

function CustomerDetailsPanel({ customer }: { customer: Customer }) {
  return (
    <Card className="flex-1">
      <CardContent className="grid gap-4 p-4 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Customer name</p>
          <p className="mt-1 text-base font-semibold">{customer.name}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Pending balance</p>
          <p className="mt-1 text-base font-semibold text-amber-700 dark:text-amber-400">
            {currency.format(customer.pendingBalance ?? 0)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Phone</p>
          <p className="mt-1 text-sm">{customer.phone ?? '-'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Address</p>
          <p className="mt-1 text-sm">{customer.address ?? '-'}</p>
        </div>
        <div className="md:col-span-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Notes</p>
          <p className="mt-1 text-sm">{customer.notes ?? '-'}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function CustomerInvoiceSummary({ invoices }: { invoices: Invoice[] }) {
  const consolidated = invoices.reduce(
    (acc, invoice) => {
      acc.totalAmount += invoice.totalAmount
      acc.amountPaid += invoice.amountPaid
      acc.pendingBalance += Math.max(invoice.balance, 0)
      return acc
    },
    {
      totalAmount: 0,
      amountPaid: 0,
      pendingBalance: 0,
    },
  )

  return (
    <div className="mb-4 grid gap-3 md:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Invoices</p>
          <p className="mt-1 text-lg font-semibold">{invoices.length}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total billed</p>
          <p className="mt-1 text-lg font-semibold">{currency.format(consolidated.totalAmount)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Collected</p>
          <p className="mt-1 text-lg font-semibold text-emerald-700 dark:text-emerald-400">
            {currency.format(consolidated.amountPaid)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Pending balance</p>
          <p className="mt-1 text-lg font-semibold text-amber-700 dark:text-amber-400">
            {currency.format(consolidated.pendingBalance)}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function ExpandableInvoiceTable({
  invoices,
  availableCredit = 0,
  onApplyCredit,
  isApplyingCredit = false,
  onRecordPayment,
  onOpenInvoice,
}: {
  invoices: Invoice[]
  availableCredit?: number
  onApplyCredit?: (invoiceId: number) => void
  isApplyingCredit?: boolean
  onRecordPayment?: (invoice: Invoice) => void
  onOpenInvoice?: (invoiceId: number) => void
}) {
  return (
    <ConfigurableDataTable
      data={invoices}
      columns={[
        { accessorKey: 'invoiceNumber', header: 'Invoice' },
        { accessorKey: 'invoiceDate', header: 'Date' },
        {
          accessorKey: 'status',
          header: 'Status',
          cell: ({ row }) => (
            <Badge
              variant={
                row.original.status === 'paid'
                  ? 'default'
                  : row.original.status === 'partial'
                    ? 'secondary'
                    : 'outline'
              }
            >
              {row.original.status}
            </Badge>
          ),
        },
        {
          accessorKey: 'totalAmount',
          header: 'Total',
          cell: ({ row }) => currency.format(row.original.totalAmount),
        },
        {
          accessorKey: 'balance',
          header: 'Balance',
          cell: ({ row }) => (
            <span
              className={
                row.original.balance > 0
                  ? 'font-medium text-amber-700 dark:text-amber-400'
                  : 'font-medium text-emerald-700 dark:text-emerald-400'
              }
            >
              {currency.format(row.original.balance)}
            </span>
          ),
        },
        {
          id: 'credit-action',
          header: 'Pending balance',
          meta: { sortable: false, searchable: false },
          cell: ({ row }) =>
            row.original.balance > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {onApplyCredit && availableCredit > 0 ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isApplyingCredit}
                    onClick={(event) => {
                      event.stopPropagation()
                      onApplyCredit(row.original.id)
                    }}
                  >
                    Apply credit
                  </Button>
                ) : null}
                {onRecordPayment ? (
                  <Button
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation()
                      onRecordPayment(row.original)
                    }}
                  >
                    Record payment
                  </Button>
                ) : null}
              </div>
            ) : null,
        },
      ]}
      getRowId={(row) => row.id.toString()}
      enableColumnVisibility={false}
      enablePagination={false}
      enableSorting={false}
      enableGlobalSearch={false}
      onRowClick={onOpenInvoice ? (invoice) => onOpenInvoice(invoice.id) : undefined}
      emptyMessage="No invoices recorded for this customer."
    />
  )
}

function ReceiptsTable({ receipts }: { receipts: Payment[] }) {
  if (!receipts.length) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          No advance receipts recorded for this customer.
        </CardContent>
      </Card>
    )
  }

  return (
    <ConfigurableDataTable
      data={receipts}
      columns={[
        { accessorKey: 'paymentDate', header: 'Date' },
        {
          accessorKey: 'entryType',
          header: 'Type',
          cell: ({ row }) => (
            <Badge variant={row.original.entryType === 'CREDIT_ADJUSTMENT' ? 'outline' : 'default'}>
              {row.original.entryType === 'CREDIT_ADJUSTMENT' ? 'Reversal' : 'Advance receipt'}
            </Badge>
          ),
        },
        {
          accessorKey: 'amount',
          header: 'Amount',
          cell: ({ row }) => (
            <span
              className={
                row.original.entryType === 'CREDIT_ADJUSTMENT'
                  ? 'font-medium text-amber-700 dark:text-amber-400'
                  : 'font-medium text-emerald-700 dark:text-emerald-400'
              }
            >
              {row.original.entryType === 'CREDIT_ADJUSTMENT' ? '-' : ''}
              {currency.format(row.original.amount)}
            </span>
          ),
        },
        { accessorKey: 'receiptNumber', header: 'Receipt #' },
        { accessorKey: 'paymentMode', header: 'Mode' },
        { accessorKey: 'notes', header: 'Notes' },
      ]}
      getRowId={(row) => row.id.toString()}
      enableColumnVisibility={false}
      enablePagination={false}
      enableSorting={false}
      enableGlobalSearch={false}
      emptyMessage="No advance receipts recorded for this customer."
    />
  )
}

function CreditUsageTable({
  entries,
  onOpenInvoice,
}: {
  entries: Payment[]
  onOpenInvoice?: (invoiceId: number) => void
}) {
  if (!entries.length) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          No credit has been applied to invoices for this customer yet.
        </CardContent>
      </Card>
    )
  }

  return (
    <ConfigurableDataTable
      data={entries}
      columns={[
        { accessorKey: 'paymentDate', header: 'Date' },
        {
          accessorKey: 'invoiceNumber',
          header: 'Invoice',
          cell: ({ row }) => row.original.invoiceNumber ?? '-',
        },
        {
          accessorKey: 'sourceReceiptNumber',
          header: 'Funded by receipt',
          cell: ({ row }) => row.original.sourceReceiptNumber ?? 'Pooled credit',
        },
        {
          accessorKey: 'amount',
          header: 'Amount applied',
          cell: ({ row }) => (
            <span className="font-medium text-primary">{currency.format(row.original.amount)}</span>
          ),
        },
      ]}
      getRowId={(row) => row.id.toString()}
      enableColumnVisibility={false}
      enablePagination={false}
      enableSorting={false}
      enableGlobalSearch={false}
      onRowClick={
        onOpenInvoice ? (entry) => entry.invoiceId && onOpenInvoice(entry.invoiceId) : undefined
      }
      emptyMessage="No credit usage recorded for this customer."
    />
  )
}

function InvoiceModalSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((item) => (
        <div key={item} className="h-14 animate-pulse rounded-md bg-muted" />
      ))}
    </div>
  )
}
