import { Badge } from '#/components/ui/badge'
import { deleteSale } from '#/lib/mutation'
import { ConfigurableDataTable } from '@/components/data-table'
import { FilterChip, StatsCard } from '@/components/stats-card'
import { getAllSales, salesKeys } from '#/lib/query'
import { matchesPeriod, matchesRange, QUICK_PERIODS, type QuickPeriod } from '#/lib/date-filters'
import { DateRangePicker, type DateRangeValue } from '@/components/date-range-picker'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate, useRouter } from '@tanstack/react-router'
import {
  IconAlertTriangle,
  IconCalendarStats,
  IconCube,
  IconCurrencyRupee,
  IconPencil,
  IconReceipt,
  IconTrash,
} from '@tabler/icons-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '#/components/ui/button'
import { isManager } from '#/lib/common/api'

export const Route = createFileRoute('/_app/sales/')({
  validateSearch: (search: Record<string, unknown>): { pending?: boolean } =>
    search.pending === true || search.pending === 'true' ? { pending: true } : {},
  component: RouteComponent,
})

type SalesRow = {
  id: number
  invoiceNumber: string
  invoiceDate: string
  customerName: string
  customerId: number | null
  materialName: string
  quantityBrass: string
  rate: string
  totalAmount: string,
  totalValue: number
  receivedValue: number
  totalPending: boolean
  payment? : {
    amount: number
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value)
}

function RouteComponent() {
  const navigate = useNavigate()
  const router = useRouter()
  const queryClient = useQueryClient()
  const manager = isManager()
  const { pending: pendingOnly = false } = Route.useSearch()
  // primitives so setState bails out when the table re-reports the same totals
  const [billedTotal, setBilledTotal] = useState(0)
  const [pendingAmount, setPendingAmount] = useState(0)
  const handleFilteredRows = (rows: SalesRow[]) => {
    setBilledTotal(rows.reduce((sum, row) => sum + row.totalValue, 0))
    setPendingAmount(rows.reduce((sum, row) => sum + Math.max(row.totalValue - row.receivedValue, 0), 0))
  }
  const [quickFilter, setQuickFilter] = useState<QuickPeriod>('all')
  const [dateRange, setDateRange] = useState<DateRangeValue>()
  const [saleToDelete, setSaleToDelete] = useState<SalesRow | null>(null)
  const { data, isLoading, isError, error } = useQuery({
    queryKey: salesKeys.all,
    queryFn: getAllSales,
    retry: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSale,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: salesKeys.all })
      await router.invalidate()
      setSaleToDelete(null)
      toast.success('Sale deleted and reversed.')
    },
    onError: () => toast.error('Failed to delete sale.'),
  })

  const quickFilterCounts = useMemo(() => {
    const invoices = data ?? []
    const stats = {} as Record<QuickPeriod, { count: number; total: number }>
    for (const period of QUICK_PERIODS) {
      const matched = invoices.filter((invoice) => matchesPeriod(invoice.invoiceDate, period))
      stats[period] = {
        count: matched.length,
        total: matched.reduce((sum, invoice) => sum + invoice.totalAmount, 0),
      }
    }
    return stats
  }, [data])

  const filteredInvoices = useMemo(
    () => (data ?? []).filter((invoice) =>
      matchesPeriod(invoice.invoiceDate, quickFilter) && matchesRange(invoice.invoiceDate, dateRange)
        && (!pendingOnly || invoice.totalPending)),
    [data, quickFilter, dateRange, pendingOnly]
  )

  const pendingCount = useMemo(() => (data ?? []).filter((invoice) => invoice.totalPending).length, [data])

  const salesRows: SalesRow[] = filteredInvoices.map((invoice) => ({
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate,
    customerName: invoice.customerName ?? '-',
    customerId: invoice.customerId,
    materialName: invoice.invoiceItems[0]?.materialName ?? '-',
    quantityBrass: invoice.invoiceItems[0]
      ? `${invoice.invoiceItems[0].quantityBrass} brass`
      : '-',
    rate: invoice.invoiceItems[0]?.rate != null
      ? formatCurrency(invoice.invoiceItems[0].rate)
      : '-',
    totalAmount: formatCurrency(invoice.totalAmount),
    totalValue: invoice.totalAmount,
    receivedValue: invoice.payment?.amount ?? 0,
    totalPending: invoice.totalPending,
    payment: invoice.payment ? { amount: invoice.payment.amount } : undefined,
  }));

  useEffect(() => {
    if (isError) {
      console.error('Error loading sales:', error)
      toast.error('Failed to load sales. Please try again later.', {
        
      })
    }
  }, [isError, error])

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col p-6">
      <div className="mb-6 flex shrink-0 items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Sales</h1>
          <p className="text-sm text-muted-foreground">All invoice records from backend.</p>
        </div>
      </div>

      {!manager && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:max-w-xl">
          <StatsCard
            icon={<IconCurrencyRupee className="size-4" />}
            title="Billed total"
            value={formatCurrency(billedTotal)}
          />
          <StatsCard
            icon={<IconAlertTriangle className="size-4" />}
            title="Pending amount"
            value={formatCurrency(pendingAmount)}
          />
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FilterChip
          icon={<IconReceipt className="size-4" />}
          title="All sales"
          value={quickFilterCounts.all.count}
          active={quickFilter === 'all' && !dateRange}
          onClick={() => { setQuickFilter('all'); setDateRange(undefined) }}
        />
        <FilterChip
          icon={<IconCalendarStats className="size-4" />}
          title="Today"
          value={quickFilterCounts.today.count}
          active={quickFilter === 'today'}
          onClick={() => { setQuickFilter('today'); setDateRange(undefined) }}
        />
        {!manager && (
          <FilterChip
            icon={<IconAlertTriangle className="size-4" />}
            title="Pending total"
            value={pendingCount}
            active={pendingOnly}
            onClick={() => navigate({ to: '/sales', search: pendingOnly ? {} : { pending: true } })}
          />
        )}
        {!manager && (
          <DateRangePicker
            className="ml-auto"
            showPresets={false}
            value={dateRange}
            onChange={(range) => { setDateRange(range); setQuickFilter('all') }}
            onClear={() => setDateRange(undefined)}
          />
        )}
      </div>

      <ConfigurableDataTable
        data={salesRows}
        columns={[
          {
            accessorKey: 'invoiceNumber',
            header: 'Invoice no',
            meta: { filterable: true, filterPlaceholder: 'Filter invoice' },
            cell: ({ row }) => (
              <Button variant={'link'} className='curosor-pointer'>
                {row.original.invoiceNumber}
              </Button>
            ),
          },
          {
            accessorKey: 'invoiceDate',
            header: 'Date',
          },
          {
            accessorKey: 'customerName',
            header: 'Customer',
            meta: { filterable: true, filterPlaceholder: 'Filter customer' },
            cell: ({ row }) =>
              row.original.customerId && !manager ? (
                <Link
                  to="/customer/$customerId"
                  params={{ customerId: String(row.original.customerId) }}
                  onClick={(event) => event.stopPropagation()}
                >
                  <Badge variant="secondary" className={`capitalize p-3 font-bold hover:underline`}>
                    {row.original.customerName}
                  </Badge>
                </Link>
              ) : (
                <Badge variant="secondary" className={`capitalize p-3 font-bold`}>
                  {row.original.customerName}
                </Badge>
              ),
          },
          {
            accessorKey: 'materialName',
            header: 'Item',
            meta: { filterable: true, filterPlaceholder: 'Filter item' },
            cell: ({ row }) => (
              <Badge variant="outline" className="gap-1.5 whitespace-nowrap">
                <IconCube />
                {row.original.materialName}
              </Badge>
            ),
          },
          {
            accessorKey: 'quantityBrass',
            header: 'Quantity',
            cell: ({ row }) => (
              <span className="tabular-nums text-muted-foreground">
                {row.original.quantityBrass}
              </span>
            ),
          },
          {
            accessorKey: 'payment.amount',
            header: 'Recieved',
            cell: ({ row }) => (
              <span className="font-medium tabular-nums text-green-700 dark:text-green-300">
                {row.original.payment?.amount ? formatCurrency(row.original.payment.amount) : '0.00'}
              </span>
            ),
          },
          ...(manager ? [] : [{
            accessorKey: 'totalAmount',
            header: 'Total',
            cell: ({ row }: { row: { original: SalesRow } }) => row.original.totalPending ? (
              <Badge variant="destructive">Pending total</Badge>
            ) : (
              <span className="font-medium tabular-nums text-amber-700 dark:text-amber-400">
                {row.original.totalAmount}
              </span>
            ),
          }]),
          ...(manager ? [] : [{
            id: 'actions',
            header: 'Actions',
            meta: { sortable: false, searchable: false },
            cell: ({ row }: { row: { original: SalesRow } }) => (
              <div className="flex items-center gap-2">
                <Button asChild size="icon-sm" variant="outline" onClick={(event) => event.stopPropagation()}>
                  <Link to="/sales/$saleId/edit" params={{ saleId: String(row.original.id) }}>
                    <IconPencil />
                    <span className="sr-only">Edit sale</span>
                  </Link>
                </Button>
                <Button
                  size="icon-sm"
                  variant="destructive"
                  onClick={(event) => {
                    event.stopPropagation()
                    setSaleToDelete(row.original)
                  }}
                >
                  <IconTrash />
                  <span className="sr-only">Delete sale</span>
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
        loadingMessage="Loading sales"
        emptyMessage="No sales found."
        className="w-full flex-1"
        tableClassName="flex-1"
        enableAddButton
        addButtonLink="/sales/new"
        addButtonText="Add Sale"
        exportFileName="sales-report"
        exportTitle="Sales report"
        onRowClick={(row) => navigate({ to: '/sales/$saleId', params: { saleId: String(row.id) } })}
        onFilteredDataChange={handleFilteredRows}
      />

      {saleToDelete ? (
        <div className="mt-3 flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
          <span>Delete {saleToDelete.invoiceNumber}? It will be reversed in the ledger.</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSaleToDelete(null)}>Cancel</Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(saleToDelete.id)}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

