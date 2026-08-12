import { Badge } from '#/components/ui/badge'
import { ConfigurableDataTable } from '@/components/data-table'
import { StatsCard } from '@/components/stats-card'
import { getAllSales, salesKeys } from '#/lib/query'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import {
  IconCalendarStats,
  IconCurrencyRupee,
  IconReceipt,
  IconWallet,
} from '@tabler/icons-react'
import { useEffect, useMemo } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_app/sales/')({
  component: RouteComponent,
})

type SalesRow = {
  id: number
  invoiceNumber: string
  invoiceDate: string
  customerName: string
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

function RouteComponent() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: salesKeys.all,
    queryFn: getAllSales,
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  })

  const salesRows: SalesRow[] = (data ?? []).map((invoice) => ({
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate,
    customerName: invoice.customerName ?? '-',
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
        style: {
          color: 'red',
        },
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

      <ConfigurableDataTable
        data={salesRows}
        columns={[
          {
            accessorKey: 'invoiceNumber',
            header: 'Invoice no',
          },
          {
            accessorKey: 'invoiceDate',
            header: 'Date',
          },
          {
            accessorKey: 'customerName',
            header: 'Customer',
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
            cell: ({ row }) => (
              <Badge variant={getStatusVariant(row.original.status)}>{row.original.status}</Badge>
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
      />
    </div>
  )
}