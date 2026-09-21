import { Badge } from '#/components/ui/badge'
import { deleteSale } from '#/lib/mutation'
import { ConfigurableDataTable } from '@/components/data-table'
import { StatsCard } from '@/components/stats-card'
import { getAllSales, salesKeys } from '#/lib/query'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
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
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/sales/')({
  component: RouteComponent,
})

type QuickFilter = 'all'

type SalesRow = {
  id: number
  invoiceNumber: string
  invoiceDate: string
  customerName: string
  customerId: number | null
  materialName: string
  quantityBrass: string
  rate: string
  totalAmount: string
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
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all')
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
    return {
      all: invoices.length,
    }
  }, [data])

  const filteredInvoices = useMemo(() => {
    const invoices = data ?? []
    return invoices
  }, [data, quickFilter])

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
    rate: invoice.invoiceItems[0]
      ? formatCurrency(invoice.invoiceItems[0].rate)
      : '-',
    totalAmount: formatCurrency(invoice.totalAmount),
  })).sort((a, b) => b.invoiceNumber.localeCompare(a.invoiceNumber, undefined));

  const stats = useMemo(() => {
    const invoices = data ?? []
    const today = new Date()
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      today.getDate()
    ).padStart(2, '0')}`
    const todayInvoices = invoices.filter((invoice) => invoice.invoiceDate === todayKey)

    return {
      invoicesToday: todayInvoices.length,
      billedToday: todayInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0),
    }
  }, [data])

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

      <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          icon={<IconReceipt className="size-4" />}
          title="Sales today"
          value={stats.invoicesToday}
          footer="Invoices created for today."
        />

        <StatsCard
          icon={<IconCurrencyRupee className="size-4" />}
          title="Billed today"
          value={formatCurrency(stats.billedToday)}
          footer="Total amount from today&apos;s sales."
        />

        <StatsCard
          icon={<IconCalendarStats className="size-4" />}
          title="Sales record"
          value={stats.invoicesToday}
          footer="Sales are settled through customer payments."
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <QuickFilterChip label="All" count={quickFilterCounts.all} active={quickFilter === 'all'} onClick={() => setQuickFilter('all')} />
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
            meta: { filterable: true, filterType: 'date' },
          },
          {
            accessorKey: 'customerName',
            header: 'Customer',
            meta: { filterable: true, filterPlaceholder: 'Filter customer' },
            cell: ({ row }) =>
              row.original.customerId ? (
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
            accessorKey: 'rate',
            header: 'Rate',
            cell: ({ row }) => (
              <span className="font-medium tabular-nums text-sky-700 dark:text-sky-300">
                {row.original.rate}
              </span>
            ),
          },
          {
            accessorKey: 'totalAmount',
            header: 'Total',
            cell: ({ row }) => (
              <span className="font-medium tabular-nums text-amber-700 dark:text-amber-400">
                {row.original.totalAmount}
              </span>
            ),
          },
          {
            id: 'actions',
            header: 'Actions',
            meta: { sortable: false, searchable: false },
            cell: ({ row }) => (
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
          },
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
        onRowClick={(row) => navigate({ to: '/sales/$saleId', params: { saleId: String(row.id) } })}
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

function QuickFilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? 'default' : 'outline'}
      onClick={onClick}
      className="gap-2"
    >
      {label}
      <Badge variant={active ? 'secondary' : 'outline'} className="px-1.5 font-mono">
        {count}
      </Badge>
    </Button>
  )
}
