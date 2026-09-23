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
import type { Customer, CustomerLedgerEntry, Invoice, Payment } from '#/lib/models'
import { recordCustomerPayment } from '#/lib/mutation'
import { customerKeys, customerSummaryKeys, getCustomerById, getCustomerSummary } from '#/lib/query'
import { IconArrowDown, IconArrowUp, IconCash, IconPencil } from '@tabler/icons-react'
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
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
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

  const recordPaymentMutation = useMutation({
    mutationFn: ({ customerId, payload }: { customerId: number; payload: RecordPaymentFormValues }) =>
      recordCustomerPayment(customerId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: customerKeys.all }),
        queryClient.invalidateQueries({ queryKey: customerKeys.detail(customerId) }),
        queryClient.invalidateQueries({ queryKey: customerSummaryKeys.detail(customerId) }),
      ])
      toast.success('Payment recorded.')
      setIsPaymentDialogOpen(false)
    },
    onError: (mutationError: unknown) => {
      const message = mutationError instanceof Error ? mutationError.message : 'Failed to record payment.'
      toast.error(message)
    },
  })

  const customer = customerQuery.data
  const invoices = summaryQuery.data?.recentInvoices ?? []
  const payments = summaryQuery.data?.recentPayments ?? []
  const receipts = payments.filter((payment) => payment.entryType === 'CUSTOMER_PAYMENT')
  const ledger = summaryQuery.data?.ledger ?? []

  return (
    <FormPageLayout
      title={customer?.name ?? 'Customer'}
      description="Invoices, payments, and customer ledger"
      backLabel="Back to customers"
      backTo="/customer"
      badge="Customer"
    >
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          {customer ? <CustomerDetailsPanel customer={customer} /> : null}
          {customer ? (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setIsPaymentDialogOpen(true)}>
                <IconCash />
                Record payment
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/customer/$customerId/edit" params={{ customerId }}>
                  <IconPencil />
                  Edit
                </Link>
              </Button>
            </div>
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
              <TabsTrigger value="ledger">Ledger ({ledger.length})</TabsTrigger>
              <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
              <TabsTrigger value="payments">Payments ({receipts.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="ledger">
              <div className="mb-3">
                <p className="text-sm text-muted-foreground">Account activity and running balance</p>
              </div>
              <CustomerLedgerTable entries={ledger} />
            </TabsContent>

            <TabsContent value="invoices">
              {invoices.length ? (
                <div>
                  <CustomerInvoiceSummary invoices={invoices} />
                  <ExpandableInvoiceTable
                    invoices={invoices}
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

            <TabsContent value="payments">
              <ReceiptsTable receipts={receipts} />
            </TabsContent>
          </Tabs>
        )}
      </div>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
            <DialogDescription>
              Record a payment against {customer?.name ?? 'this customer'}.
            </DialogDescription>
          </DialogHeader>
          <RecordPaymentForm
            isSubmitting={recordPaymentMutation.isPending}
            onCancel={() => setIsPaymentDialogOpen(false)}
            onSubmit={(payload) => recordPaymentMutation.mutate({ customerId: Number(customerId), payload })}
          />
        </DialogContent>
      </Dialog>
    </FormPageLayout>
  )
}

function CustomerLedgerTable({ entries }: { entries: CustomerLedgerEntry[] }) {
  const totals = entries.reduce(
    (summary, entry) => ({
      debit: summary.debit + entry.debit,
      credit: summary.credit + entry.credit,
    }),
    { debit: 0, credit: 0 },
  )
  const finalBalance = entries.at(-1)?.runningBalance ?? 0

  return entries.length ? (
    <div className="space-y-4">
      <div className="grid gap-3 border-t border-border/80 pt-4 sm:grid-cols-3">
        <LedgerTotal label="Total sales" value={totals.debit} tone="debit" />
        <LedgerTotal label="Total payments" value={totals.credit} tone="credit" />
        <LedgerTotal label="Final balance" value={finalBalance} emphasized />
      </div>
      <ConfigurableDataTable
        data={entries}
        columns={[
          { accessorKey: 'entryDate', header: 'Date' },
          {
            accessorKey: 'entryType',
            header: 'Entry',
            cell: ({ row }) => {
              const isPayment = row.original.entryType === 'CUSTOMER_PAYMENT'
              return (
                <Badge
                  variant={isPayment ? 'default' : 'secondary'}
                  className="gap-1.5 whitespace-nowrap"
                >
                  {isPayment ? <IconArrowDown /> : <IconArrowUp />}
                  {isPayment ? 'Payment' : 'Sale'}
                </Badge>
              )
            },
          },
          { accessorKey: 'reference', header: 'Reference' },
          { accessorKey: 'description', header: 'Description' },
          {
            accessorKey: 'debit',
            header: 'Sale debit',
            cell: ({ row }) => row.original.debit ? (
              <span className="font-medium tabular-nums text-amber-700 dark:text-amber-400">
                {currency.format(row.original.debit)}
              </span>
            ) : '-',
          },
          {
            accessorKey: 'credit',
            header: 'Payment credit',
            cell: ({ row }) => row.original.credit ? (
              <span className="font-medium tabular-nums text-emerald-700 dark:text-emerald-400">
                {currency.format(row.original.credit)}
              </span>
            ) : '-',
          },
          {
            accessorKey: 'runningBalance',
            header: 'Running balance',
            cell: ({ row }) => (
              <span className={`font-semibold tabular-nums ${
                row.original.runningBalance < 0
                  ? 'text-destructive'
                  : 'text-amber-700 dark:text-amber-400'
              }`}>
                {currency.format(row.original.runningBalance)}
              </span>
            ),
          },
        ]}
        getRowId={(row) => `${row.entryDate}-${row.reference}`}
        enableColumnVisibility={false}
        enablePagination
        enableSorting
        className="w-full"
      />      
    </div>
  ) : (
    <Card>
      <CardContent className="p-8 text-center text-sm text-muted-foreground">
        No ledger entries recorded for this customer.
      </CardContent>
    </Card>
  )
}

function LedgerTotal({
  label,
  value,
  tone,
  emphasized = false,
}: {
  label: string
  value: number
  tone?: 'debit' | 'credit'
  emphasized?: boolean
}) {
  const valueClassName = value < 0
    ? 'text-destructive'
    : tone === 'credit'
      ? 'text-emerald-700 dark:text-emerald-400'
      : tone === 'debit' || emphasized
        ? 'text-amber-700 dark:text-amber-400'
        : ''

  return (
    <div className={emphasized ? 'rounded-md bg-muted/50 px-3 py-2.5' : 'px-3 py-2.5'}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 text-base font-semibold tabular-nums ${valueClassName}`}>
        {currency.format(value)}
      </p>
    </div>
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
      return acc
    },
    {
      totalAmount: 0,
    },
  )

  return (
    <div className="mb-4 grid gap-3 md:grid-cols-2">
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
    </div>
  )
}

function ExpandableInvoiceTable({
  invoices,
  onOpenInvoice,
}: {
  invoices: Invoice[]
  onOpenInvoice?: (invoiceId: number) => void
}) {
  return (
    <ConfigurableDataTable
      data={invoices}
      columns={[
        { accessorKey: 'invoiceNumber', header: 'Invoice' },
        { accessorKey: 'invoiceDate', header: 'Date' },
        {
          id: 'item',
          header: 'Item',
          cell: ({ row }) => row.original.invoiceItems[0]?.materialName ?? '-',
        },
        {
          id: 'quantity',
          header: 'Quantity',
          cell: ({ row }) => row.original.invoiceItems[0]
            ? `${row.original.invoiceItems[0].quantityBrass} brass`
            : '-',
        },
        {
          id: 'rate',
          header: 'Rate',
          cell: ({ row }) => row.original.invoiceItems[0]
            ? currency.format(row.original.invoiceItems[0].rate)
            : '-',
        },
        {
          accessorKey: 'totalAmount',
          header: 'Total',
          cell: ({ row }) => currency.format(row.original.totalAmount),
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
          No customer payments recorded for this customer.
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
          cell: () => <Badge variant="default">Customer payment</Badge>,
        },
        {
          accessorKey: 'amount',
          header: 'Amount',
          cell: ({ row }) => (
            <span
              className="font-medium text-emerald-700 dark:text-emerald-400"
            >
              {currency.format(row.original.amount)}
            </span>
          ),
        },
        { accessorKey: 'externalRef', header: 'Reference' },
        { accessorKey: 'paymentMode', header: 'Mode' },
        { accessorKey: 'notes', header: 'Notes' },
      ]}
      getRowId={(row) => row.id.toString()}
      enableColumnVisibility={false}
      enablePagination={false}
      enableSorting={false}
      enableGlobalSearch={false}
      emptyMessage="No customer payments recorded for this customer."
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
