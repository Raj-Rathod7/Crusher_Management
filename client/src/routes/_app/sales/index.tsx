import { Badge } from '#/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { ConfigurableDataTable } from '@/components/data-table'
import { StatsCard } from '@/components/stats-card'
import { getAllSales, getSaleById, salesKeys } from '#/lib/query'
import type { Invoice } from '#/lib/models'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import {
  IconCalendarStats,
  IconCurrencyRupee,
  IconReceipt,
  IconWallet,
} from '@tabler/icons-react'
import { useEffect, useMemo, useState } from 'react'
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
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null)
  const { data, isLoading, isError, error } = useQuery({
    queryKey: salesKeys.all,
    queryFn: getAllSales,
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  })

  const selectedSale = useQuery({
    queryKey: salesKeys.detail(selectedSaleId ?? ''),
    queryFn: () => getSaleById(selectedSaleId as number),
    enabled: selectedSaleId !== null,
    retry: false,
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
          border: '1px solid red',
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
        onRowClick={(row) => setSelectedSaleId(row.id)}
      />

      <SaleDetailsDialog
        sale={selectedSale.data}
        isLoading={selectedSale.isLoading}
        isError={selectedSale.isError}
        open={selectedSaleId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedSaleId(null)
        }}
      />
    </div>
  )
}

function SaleDetailsDialog({
  sale,
  isLoading,
  isError,
  open,
  onOpenChange,
}: {
  sale?: Invoice
  isLoading: boolean
  isError: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] max-w-4xl overflow-hidden">
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle>{sale ? `Invoice ${sale.invoiceNumber}` : 'Invoice details'}</DialogTitle>
          <DialogDescription>
            Complete invoice record and the materials included in this sale.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="px-6 py-10 text-center text-sm text-muted-foreground">Loading invoice details...</div>
        ) : isError || !sale ? (
          <div className="px-6 py-10 text-center text-sm text-destructive">Unable to load this invoice.</div>
        ) : (
          <div className="space-y-6 overflow-y-auto px-6 py-5">
            <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
              <DetailField label="Invoice date" value={sale.invoiceDate} />
              <DetailField label="Customer" value={sale.customerName ?? '-'} />
              <DetailField label="Status" value={sale.status} />
              <DetailField label="Created by" value={sale.createdByUsername ?? '-'} />
              <DetailField label="Total" value={formatCurrency(sale.totalAmount)} />
              <DetailField label="Paid" value={formatCurrency(sale.amountPaid)} />
              <DetailField label="Balance" value={formatCurrency(sale.balance)} />
              <DetailField label="Remarks" value={sale.remarks || '-'} />
            </dl>

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium">Invoice items</h3>
                <p className="text-sm text-muted-foreground">Materials billed on this invoice.</p>
              </div>
              {sale.invoiceItems.length === 0 ? (
                <div className="rounded-md border px-4 py-8 text-center text-sm text-muted-foreground">
                  No invoice items recorded.
                </div>
              ) : (
                <ConfigurableDataTable
                  data={sale.invoiceItems}
                  columns={[
                    {
                      accessorKey: 'materialName',
                      header: 'Material',
                    },
                    {
                      accessorKey: 'quantity',
                      header: 'Quantity',
                      cell: ({ row }) => row.original.quantity,
                    },
                    {
                      accessorKey: 'rate',
                      header: 'Rate',
                      cell: ({ row }) => formatCurrency(row.original.rate),
                    },
                    {
                      accessorKey: 'truckNumber',
                      header: 'Truck',
                      cell: ({ row }) => row.original.truckNumber || '-',
                    },
                    {
                      accessorKey: 'amount',
                      header: 'Amount',
                      cell: ({ row }) => formatCurrency(row.original.amount),
                    },
                  ]}
                  getRowId={(row) => row.id.toString()}
                  enableColumnVisibility={false}
                  enablePagination
                  enableSorting={false}
                  enableGlobalSearch
                  defaultPageSize={5}
                  pageSizeOptions={[5, 10, 20]}
                  emptyMessage="No invoice items recorded."
                  className="w-full"
                />
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 truncate text-sm font-medium text-foreground">{value}</dd>
    </div>
  )
}