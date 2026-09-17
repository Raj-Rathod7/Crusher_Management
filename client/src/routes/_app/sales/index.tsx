import { Badge } from '#/components/ui/badge'
import { ConfigurableDataTable } from '@/components/data-table'
import { StatsCard } from '@/components/stats-card'
import { getAllSales, salesKeys } from '#/lib/query'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  IconCalendarStats,
  IconCircleCheck,
  IconCircleDashedCheck,
  IconCircleLetterX,
  IconCurrencyRupee,
  IconReceipt,
  IconWallet,
} from '@tabler/icons-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '#/components/ui/button'

export const Route = createFileRoute('/_app/sales/')({
  component: RouteComponent,
})

type QuickFilter = 'all' | 'pending' | 'partial' | 'paid' | 'outstanding'

type SalesRow = {
  id: number
  invoiceNumber: string
  invoiceDate: string
  customerName: string
  customerId: number | null
  totalAmount: string
  amountPaid: string
  balance: string
  status: string
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value)
}

function getStatusVariant(status: string) {
  const normalizedStatus = status.toUpperCase()

  if (normalizedStatus === 'PAID') {
    return 'default' as const
  }

  if (normalizedStatus === 'PARTIAL') {
    return 'secondary' as const
  }

  return 'outline' as const
}

function getStatusClass(status: string){
  const normalizedStatus = status.toUpperCase();
  if (normalizedStatus === 'PAID') {
    return 'text-green-700' as const
  }

  if (normalizedStatus === 'PARTIAL') {
    return 'text-yellow-700' as const
  }

  return 'text-orange-700' as const
}

function getStatusIcon(status: string) {
  const normalizedStatus = status.toUpperCase();
  const className = `${getStatusClass(status)} mr-2`
  if (normalizedStatus === 'PAID') {
    return <IconCircleCheck className={className} />
  }

  if (normalizedStatus === 'PARTIAL') {
    return <IconCircleDashedCheck className={className}/>
  }

  return <IconCircleLetterX className={className}/>
}

function RouteComponent() {
  const navigate = useNavigate()
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all')
  const { data, isLoading, isError, error } = useQuery({
    queryKey: salesKeys.all,
    queryFn: getAllSales,
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  })

  const quickFilterCounts = useMemo(() => {
    const invoices = data ?? []
    return {
      all: invoices.length,
      pending: invoices.filter((invoice) => invoice.status.toLowerCase() === 'pending').length,
      partial: invoices.filter((invoice) => invoice.status.toLowerCase() === 'partial').length,
      paid: invoices.filter((invoice) => invoice.status.toLowerCase() === 'paid').length,
      outstanding: invoices.filter((invoice) => invoice.balance > 0).length,
    }
  }, [data])

  const filteredInvoices = useMemo(() => {
    const invoices = data ?? []
    switch (quickFilter) {
      case 'pending':
        return invoices.filter((invoice) => invoice.status.toLowerCase() === 'pending')
      case 'partial':
        return invoices.filter((invoice) => invoice.status.toLowerCase() === 'partial')
      case 'paid':
        return invoices.filter((invoice) => invoice.status.toLowerCase() === 'paid')
      case 'outstanding':
        return invoices.filter((invoice) => invoice.balance > 0)
      default:
        return invoices
    }
  }, [data, quickFilter])

  const salesRows: SalesRow[] = filteredInvoices.map((invoice) => ({
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate,
    customerName: invoice.customerName ?? '-',
    customerId: invoice.customerId,
    totalAmount: formatCurrency(invoice.totalAmount),
    amountPaid: formatCurrency(invoice.amountPaid),
    balance: formatCurrency(invoice.balance),
    status: invoice.status,
  }))

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
      collectedToday: todayInvoices.reduce((sum, invoice) => sum + invoice.amountPaid, 0),
      outstanding: invoices.reduce((sum, invoice) => sum + invoice.balance, 0),
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
          icon={<IconWallet className="size-4" />}
          title="Collected today"
          value={formatCurrency(stats.collectedToday)}
          footer="Amount paid on today&apos;s invoices."
        />

        <StatsCard
          icon={<IconCalendarStats className="size-4" />}
          title="Outstanding balance"
          value={formatCurrency(stats.outstanding)}
          footer="Open balance across all invoices."
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <QuickFilterChip label="All" count={quickFilterCounts.all} active={quickFilter === 'all'} onClick={() => setQuickFilter('all')} />
        <QuickFilterChip label="Pending" count={quickFilterCounts.pending} active={quickFilter === 'pending'} onClick={() => setQuickFilter('pending')} />
        <QuickFilterChip label="Partial" count={quickFilterCounts.partial} active={quickFilter === 'partial'} onClick={() => setQuickFilter('partial')} />
        <QuickFilterChip label="Paid" count={quickFilterCounts.paid} active={quickFilter === 'paid'} onClick={() => setQuickFilter('paid')} />
        <QuickFilterChip label="Outstanding balance" count={quickFilterCounts.outstanding} active={quickFilter === 'outstanding'} onClick={() => setQuickFilter('outstanding')} />
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
            accessorKey: 'totalAmount',
            header: 'Total',
          },
          {
            accessorKey: 'amountPaid',
            header: 'Paid',
          },
          {
            accessorKey: 'balance',
            header: 'Balance',
          },
          {
            accessorKey: 'status',
            header: 'Status',
            meta: {
              filterable: true,
              filterType: 'select',
              filterOptions: [
                { label: 'Paid', value: 'PAID' },
                { label: 'Partial', value: 'PARTIAL' },
                { label: 'Pending', value: 'PENDING' },
              ],
            },
            cell: ({ row }) => (
              <Badge 
                variant='outline'
                className={`capitalize border p-3 items-center justify-start font-bold`}>
                  {getStatusIcon(row.original.status)}
                  {row.original.status}
              </Badge>
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
