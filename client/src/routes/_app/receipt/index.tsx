import { ConfigurableDataTable } from '#/components/data-table'
import { StatsCard } from '#/components/stats-card'
import { getAllReceipts, receiptKeys } from '#/lib/query'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { IconCurrencyRupee, IconReceipt } from '@tabler/icons-react'
import { useEffect, useMemo } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_app/receipt/')({
  component: RouteComponent,
})

type ReceiptRow = {
  id: number
  paymentDate: string
  customerName: string
  customerId: number | null
  amount: string
  entryType: string
  paymentMode: string
  receiptNumber: string
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
  if (entryType === 'CREDIT_ADJUSTMENT') {
    return 'Reversal'
  }
  return 'Advance receipt'
}

function RouteComponent() {
  const navigate = useNavigate()
  const { data, isLoading, isError, error } = useQuery({
    queryKey: receiptKeys.list({}),
    queryFn: () => getAllReceipts(),
    retry: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  })

  const receiptRows: ReceiptRow[] = (data ?? []).map((payment) => ({
    id: payment.id,
    paymentDate: payment.paymentDate,
    customerName: payment.customerName ?? '-',
    customerId: payment.customerId,
    amount: formatCurrency(payment.amount),
    entryType: formatEntryType(payment.entryType ?? ''),
    paymentMode: payment.paymentMode ?? '-',
    receiptNumber: payment.receiptNumber ?? '-',
    notes: payment.notes ?? '-',
  }))

  const stats = useMemo(() => {
    const payments = data ?? []
    const today = new Date()
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      today.getDate()
    ).padStart(2, '0')}`
    const advanceReceipts = payments.filter((payment) => payment.entryType === 'ADVANCE_RECEIPT')
    const todayReceipts = advanceReceipts.filter((payment) => payment.paymentDate === todayKey)
    const totalToday = todayReceipts.reduce((sum, payment) => sum + payment.amount, 0)
    const totalOverall = advanceReceipts.reduce((sum, payment) => sum + payment.amount, 0)

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
          <p className="text-sm text-muted-foreground">Advance payments received from customers.</p>
        </div>
      </div>

      <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatsCard
          icon={<IconReceipt className="size-4" />}
          title="Receipts today"
          value={stats.receiptsToday}
          footer="Advance receipts recorded today."
        />

        <StatsCard
          icon={<IconCurrencyRupee className="size-4" />}
          title="Amount today"
          value={formatCurrency(stats.totalToday)}
          footer="Total advance received today."
        />

        <StatsCard
          icon={<IconCurrencyRupee className="size-4" />}
          title="Total receipts"
          value={formatCurrency(stats.totalOverall)}
          footer="All advance receipts combined."
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
            accessorKey: 'amount',
            header: 'Amount',
          },
          {
            accessorKey: 'entryType',
            header: 'Type',
            meta: { filterable: true, filterPlaceholder: 'Filter type' },
          },
          {
            accessorKey: 'paymentMode',
            header: 'Mode',
          },
          {
            accessorKey: 'receiptNumber',
            header: 'Receipt #',
          },
          {
            accessorKey: 'notes',
            header: 'Notes',
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
    </div>
  )
}
