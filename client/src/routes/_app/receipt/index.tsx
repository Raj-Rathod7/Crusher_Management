import { ConfigurableDataTable } from '#/components/data-table'
import { FilterChip } from '#/components/stats-card'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { deleteCustomerPayment } from '#/lib/mutation'
import { getAllReceipts, receiptKeys } from '#/lib/query'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate, useRouter } from '@tanstack/react-router'
import { IconCreditCard, IconCurrencyRupee, IconPencil, IconReceipt, IconTrash } from '@tabler/icons-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

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
  const [quickFilter, setQuickFilter] = useState<'all' | 'today'>('all')
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

  const filteredPayments = useMemo(() => {
    if (quickFilter === 'all') return data ?? []
    const today = new Date()
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      today.getDate()
    ).padStart(2, '0')}`
    return (data ?? []).filter((payment) => payment.paymentDate === todayKey)
  }, [data, quickFilter])

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

  const stats = useMemo(() => {
    const payments = data ?? []
    const today = new Date()
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      today.getDate()
    ).padStart(2, '0')}`
    const customerPayments = payments.filter((payment) => payment.entryType === 'CUSTOMER_PAYMENT')
    const todayReceipts = customerPayments.filter((payment) => payment.paymentDate === todayKey)
    const totalToday = todayReceipts.reduce((sum, payment) => sum + payment.amount, 0)
    const totalOverall = customerPayments.reduce((sum, payment) => sum + payment.amount, 0)

    return {
      receiptsToday: todayReceipts.length,
      totalToday,
      totalOverall,
    }
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
          value={(data ?? []).length}
          active={quickFilter === 'all'}
          onClick={() => setQuickFilter('all')}
        />
        <FilterChip
          icon={<IconReceipt className="size-4" />}
          title="Receipts today"
          value={stats.receiptsToday}
          active={quickFilter === 'today'}
          onClick={() => setQuickFilter('today')}
        />
        <FilterChip
          icon={<IconCurrencyRupee className="size-4" />}
          title="Amount today"
          value={formatCurrency(stats.totalToday)}
          active={quickFilter === 'today'}
          onClick={() => setQuickFilter('today')}
        />
        <FilterChip
          icon={<IconCurrencyRupee className="size-4" />}
          title="Total receipts"
          value={formatCurrency(stats.totalOverall)}
          active={quickFilter === 'all'}
          onClick={() => setQuickFilter('all')}
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
          {
            id: 'actions',
            header: 'Actions',
            meta: { sortable: false, searchable: false },
            cell: ({ row }) => (
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
          },
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
        onRowClick={(row) => {
          if (row.customerId) {
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
