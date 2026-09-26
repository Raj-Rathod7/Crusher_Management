import { ConfigurableDataTable } from '#/components/data-table'
import { FilterChip } from '#/components/stats-card'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { deleteCustomerPayment } from '#/lib/mutation'
import { getAllReceipts, receiptKeys } from '#/lib/query'
import { matchesPeriod, QUICK_PERIOD_LABELS, QUICK_PERIODS, type QuickPeriod } from '#/lib/date-filters'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate, useRouter } from '@tanstack/react-router'
import { IconCalendarStats, IconCreditCard, IconCurrencyRupee, IconPencil, IconReceipt, IconTrash } from '@tabler/icons-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { isManager } from '#/lib/common/api'

export const Route = createFileRoute('/_app/receipt/')({
  component: RouteComponent,
})

type ReceiptRow = {
  id: number
  paymentDate: string
  customerName: string
  customerId: number | null
  invoiceId: number | null
  invoiceNumber: string | null
  amount: string
  entryType: string
  paymentMode: string
  externalRef: string
  notes: string
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value)
}

function formatEntryType(entryType: string) {
  return entryType === 'CUSTOMER_PAYMENT' ? 'Customer payment' : entryType
}

function RouteComponent() {
  const navigate = useNavigate()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [paymentToDelete, setPaymentToDelete] = useState<ReceiptRow | null>(null)
  const [quickFilter, setQuickFilter] = useState<QuickPeriod>('all')
  const { data, isLoading, isError, error } = useQuery({
    queryKey: receiptKeys.list({}),
    queryFn: () => getAllReceipts(),
    retry: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCustomerPayment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: receiptKeys.all })
      await router.invalidate()
      setPaymentToDelete(null)
      toast.success('Payment deleted and reversed.')
    },
    onError: () => toast.error('Failed to delete payment.'),
  })

  const filteredPayments = useMemo(
    () => (data ?? []).filter((payment) => matchesPeriod(payment.paymentDate, quickFilter)),
    [data, quickFilter]
  )

  const receiptRows: ReceiptRow[] = filteredPayments.map((payment) => ({
    id: payment.id,
    paymentDate: payment.paymentDate,
    customerName: payment.customerName ?? '-',
    customerId: payment.customerId,
    invoiceId: payment.invoiceId,
    invoiceNumber: payment.invoiceNumber,
    amount: formatCurrency(payment.amount),
    entryType: formatEntryType(payment.entryType ?? ''),
    paymentMode: payment.paymentMode ?? '-',
    externalRef: payment.externalRef ?? '-',
    notes: payment.notes ?? '-',
  }))

  const periodStats = useMemo(() => {
    const customerPayments = (data ?? []).filter((payment) => payment.entryType === 'CUSTOMER_PAYMENT')
    const stats = {} as Record<QuickPeriod, { count: number; total: number }>
    for (const period of QUICK_PERIODS) {
      const matched = customerPayments.filter((payment) => matchesPeriod(payment.paymentDate, period))
      stats[period] = {
        count: matched.length,
        total: matched.reduce((sum, payment) => sum + payment.amount, 0),
      }
    }
    return stats
  }, [data])

  useEffect(() => {
    if (isError) {
      console.error('Error loading receipts:', error)
      toast.error('Failed to load receipts. Please try again later.')
    }
  }, [isError, error])

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col p-6">
      <div className="mb-6 flex shrink-0 items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Receipts</h1>
          <p className="text-sm text-muted-foreground">Payments received from customers.</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FilterChip
          icon={<IconReceipt className="size-4" />}
          title="All receipts"
          value={periodStats.all.count}
          active={quickFilter === 'all'}
          onClick={() => setQuickFilter('all')}
        />
        <FilterChip
          icon={<IconCalendarStats className="size-4" />}
          title="Today"
          value={periodStats.today.count}
          active={quickFilter === 'today'}
          onClick={() => setQuickFilter('today')}
        />
        <FilterChip
          icon={<IconCalendarStats className="size-4" />}
          title="This week"
          value={periodStats.week.count}
          active={quickFilter === 'week'}
          onClick={() => setQuickFilter('week')}
        />
        <FilterChip
          icon={<IconCalendarStats className="size-4" />}
          title="This month"
          value={periodStats.month.count}
          active={quickFilter === 'month'}
          onClick={() => setQuickFilter('month')}
        />
        <FilterChip
          icon={<IconCurrencyRupee className="size-4" />}
          title={`Received (${QUICK_PERIOD_LABELS[quickFilter]})`}
          value={formatCurrency(periodStats[quickFilter].total)}
          active
          onClick={() => setQuickFilter(quickFilter)}
        />
      </div>

      <ConfigurableDataTable
        data={receiptRows}
        columns={[
          {
            accessorKey: 'paymentDate',
            header: 'Date',
            meta: { filterable: true, filterType: 'date' },
          },
          {
            accessorKey: 'customerName',
            header: 'Customer',
            meta: { filterable: true, filterPlaceholder: 'Filter customer' },
          },
          {
            accessorKey: 'invoiceNumber',
            header: 'Invoice',
            cell: ({ row }) => row.original.invoiceId ? (
              <Link
                to="/sales/$saleId"
                params={{ saleId: String(row.original.invoiceId) }}
                className="text-primary hover:underline"
                onClick={(event) => event.stopPropagation()}
              >
                {row.original.invoiceNumber ?? 'View invoice'}
              </Link>
            ) : (
              <span className="text-muted-foreground">Standalone</span>
            ),
          },
          {
            accessorKey: 'amount',
            header: 'Amount',
            cell: ({ row }) => (
              <span className="font-medium tabular-nums text-emerald-700 dark:text-emerald-400">
                {row.original.amount}
              </span>
            ),
          },
          {
            accessorKey: 'entryType',
            header: 'Type',
            meta: { filterable: true, filterPlaceholder: 'Filter type' },
          },
          {
            accessorKey: 'paymentMode',
            header: 'Mode',
            cell: ({ row }) => (
              <Badge variant="outline" className="gap-1.5 capitalize">
                <IconCreditCard />
                {row.original.paymentMode.replace('_', ' ')}
              </Badge>
            ),
          },
          {
            accessorKey: 'externalRef',
            header: 'Reference',
          },
          {
            accessorKey: 'notes',
            header: 'Notes',
          },
          ...(isManager() ? [] : [{
            id: 'actions',
            header: 'Actions',
            meta: { sortable: false, searchable: false },
            cell: ({ row }: { row: { original: ReceiptRow } }) => (
              <div className="flex items-center gap-2">
                <Button asChild size="icon-sm" variant="outline" onClick={(event) => event.stopPropagation()}>
                  <Link to="/receipt/$paymentId/edit" params={{ paymentId: String(row.original.id) }}>
                    <IconPencil />
                    <span className="sr-only">Edit payment</span>
                  </Link>
                </Button>
                <Button
                  size="icon-sm"
                  variant="destructive"
                  onClick={(event) => {
                    event.stopPropagation()
                    setPaymentToDelete(row.original)
                  }}
                >
                  <IconTrash />
                  <span className="sr-only">Delete payment</span>
                </Button>
              </div>
            ),
          }]),
        ]}
        getRowId={(row) => row.id.toString()}
        enableColumnVisibility
        enablePagination
        enableSorting
        isLoading={isLoading}
        loadingMessage="Loading receipts"
        emptyMessage="No receipts found."
        className="w-full flex-1"
        tableClassName="flex-1"
        enableAddButton
        addButtonLink="/receipt/new"
        addButtonText="Add Receipt"
        exportFileName="receipts-report"
        exportTitle="Receipts report"
        onRowClick={(row) => {
          if (row.customerId && !isManager()) {
            navigate({ to: '/customer/$customerId', params: { customerId: String(row.customerId) } })
          }
        }}
      />

      {paymentToDelete ? (
        <div className="mt-3 flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
          <span>Delete payment {paymentToDelete.amount}? It will be reversed in the ledger.</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setPaymentToDelete(null)}>Cancel</Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(paymentToDelete.id)}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
