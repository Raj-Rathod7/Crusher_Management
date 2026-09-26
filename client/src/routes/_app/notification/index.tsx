import { ConfigurableDataTable } from '#/components/data-table'
import { StatsCard } from '#/components/stats-card'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { customerKeys, getAllCustomers } from '#/lib/query'
import type { Customer } from '#/lib/models'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { IconArrowDown, IconArrowUp, IconRefresh } from '@tabler/icons-react'
import { useMemo, useState } from 'react'

export const Route = createFileRoute('/_app/notification/')({
  component: RouteComponent,
})

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
})

function RouteComponent() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: customerKeys.all,
    queryFn: getAllCustomers,
    retry: false,
  })

  const { collections, payables } = useMemo(() => {
    const customers = data ?? []
    const collections = customers
      .filter((customer) => (customer.pendingBalance ?? 0) > 0)
      .sort((a, b) => (b.pendingBalance ?? 0) - (a.pendingBalance ?? 0))
    const payables = customers
      .filter((customer) => (customer.pendingBalance ?? 0) < 0)
      .sort((a, b) => (a.pendingBalance ?? 0) - (b.pendingBalance ?? 0))

    return { collections, payables }
  }, [data])

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col p-6">
      <div className="mb-6 flex shrink-0 items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Customers who owe the business money, and customers the business owes money to.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <IconRefresh className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>

      {isError ? (
        <p className="text-sm text-destructive">Failed to load customer balances. Please try again.</p>
      ) : (
        <Tabs defaultValue="pending" className="min-h-0 flex-1 mt-1">
          <TabsList>
            <TabsTrigger value="pending">Pending amount ({collections.length})</TabsTrigger>
            <TabsTrigger value="overdue">Overdue amount ({payables.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="flex min-h-0 flex-1 flex-col space-y-4">
            <BalanceTable
              customers={collections}
              isLoading={isLoading}
              emptyMessage="No customer currently owes the business money."
              amountClassName="text-amber-700 dark:text-amber-400"
              totalIcon={<IconArrowUp className="size-4 text-amber-600" />}
              totalTitle="Total to collect"
              totalDescription="Sum of pending balances owed by customers."
            />
          </TabsContent>

          <TabsContent value="overdue" className="flex min-h-0 flex-1 flex-col space-y-4">
            <BalanceTable
              customers={payables}
              isLoading={isLoading}
              emptyMessage="The business does not owe money to any customer."
              amountClassName="text-emerald-700 dark:text-emerald-400"
              totalIcon={<IconArrowDown className="size-4 text-emerald-600" />}
              totalTitle="Total to pay back"
              totalDescription="Sum of credit balances owed to customers (overpayments)."
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

function BalanceTable({
  customers,
  isLoading,
  emptyMessage,
  amountClassName,
  totalIcon,
  totalTitle,
  totalDescription,
}: {
  customers: Customer[]
  isLoading: boolean
  emptyMessage: string
  amountClassName: string
  totalIcon: React.ReactNode
  totalTitle: string
  totalDescription: string
}) {
  const [total, setTotal] = useState(0)

  return (
    <>
    <StatsCard
      className="max-w-sm"
      icon={totalIcon}
      title={totalTitle}
      value={currency.format(total)}
      description={totalDescription}
    />
    <ConfigurableDataTable
      data={customers}
      onFilteredDataChange={(rows) =>
        setTotal(rows.reduce((sum, customer) => sum + Math.abs(customer.pendingBalance ?? 0), 0))}
      columns={[
        {
          accessorKey: 'name',
          header: 'Customer',
          meta: { filterable: true, filterPlaceholder: 'Filter customer' },
          cell: ({ row }) => (
            <Link
              to="/customer/$customerId"
              params={{ customerId: String(row.original.id) }}
              className="font-medium hover:underline"
            >
              {row.original.name}
            </Link>
          ),
        },
        {
          accessorKey: 'phone',
          header: 'Phone',
          cell: ({ row }) => row.original.phone ?? '-',
        },
        {
          id: 'amount',
          header: 'Amount',
          accessorFn: (row) => Math.abs(row.pendingBalance ?? 0),
          cell: ({ row }) => (
            <span className={`font-semibold tabular-nums ${amountClassName}`}>
              {currency.format(Math.abs(row.original.pendingBalance ?? 0))}
            </span>
          ),
        },
        {
          id: 'status',
          header: 'Status',
          meta: { sortable: false, searchable: false },
          cell: () => <Badge variant="outline">Active</Badge>,
        },
      ]}
      getRowId={(row) => row.id.toString()}
      enableColumnVisibility={false}
      enableSorting
      isLoading={isLoading}
      loadingMessage="Loading balances"
      emptyMessage={emptyMessage}
      className="w-full flex-1"
      tableClassName="flex-1"
      enableExport
      exportFileName="notifications-report"
      exportTitle="Customer balances"
    />
    </>
  )
}
