import { ConfigurableDataTable } from '#/components/data-table'
import { FilterChip, StatsCard } from '#/components/stats-card'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { deleteExpense } from '#/lib/mutation'
import { getAllExpenses, expenseKeys } from '#/lib/query'
import { matchesPeriod, matchesRange, QUICK_PERIODS, type QuickPeriod } from '#/lib/date-filters'
import { DateRangePicker, type DateRangeValue } from '#/components/date-range-picker'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { IconCalendarStats, IconCategory, IconCurrencyRupee, IconPencil, IconTrash } from '@tabler/icons-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { isManager } from '#/lib/common/api'

export const Route = createFileRoute('/_app/expenses/')({
  component: RouteComponent,
})

type ExpenseRow = {
  id: number
  expenseDate: string
  categoryName: string
  truckNumber: string
  amount: string
  amountValue: number
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

function RouteComponent() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseRow | null>(null)
  const [selectedVehicle, setSelectedVehicle] = useState('all')
  const [quickFilter, setQuickFilter] = useState<QuickPeriod>('all')
  const [dateRange, setDateRange] = useState<DateRangeValue>()
  const [spentTotal, setSpentTotal] = useState(0)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: expenseKeys.all,
    queryFn: getAllExpenses,
    retry: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  })
  
  const vehicleExpenses = useMemo(() => {
    if (selectedVehicle === 'all') return data ?? []
    if (selectedVehicle === 'unassigned') return (data ?? []).filter((expense) => !expense.truckNumber)
    return (data ?? []).filter((expense) => expense.truckNumber === selectedVehicle)
  }, [data, selectedVehicle])

  const selectedExpenses = useMemo(
    () => vehicleExpenses.filter((expense) =>
      matchesPeriod(expense.expenseDate, quickFilter) && matchesRange(expense.expenseDate, dateRange)),
    [quickFilter, dateRange, vehicleExpenses]
  )

  const expenseRows: ExpenseRow[] = selectedExpenses.map((expense) => ({
    id: expense.id,
    expenseDate: expense.expenseDate,
    categoryName: expense.categoryName ?? '-',
    truckNumber: expense.truckNumber ?? '-',
    amount: formatCurrency(expense.amount),
    amountValue: expense.amount,
    notes: expense.notes ?? '-',
  }))

  const deleteMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: expenseKeys.all }),
        queryClient.refetchQueries({ queryKey: expenseKeys.all, type: 'all' }),
        router.invalidate(),
      ])
      setExpenseToDelete(null)
      toast.success('Expense deleted.')
    },
    onError: () => {
      toast.error('Failed to delete expense.')
    },
  })

  const periodStats = useMemo(() => {
    const stats = {} as Record<QuickPeriod, { count: number; total: number }>
    for (const period of QUICK_PERIODS) {
      const matched = vehicleExpenses.filter((expense) => matchesPeriod(expense.expenseDate, period))
      stats[period] = {
        count: matched.length,
        total: matched.reduce((sum, expense) => sum + expense.amount, 0),
      }
    }
    return stats
  }, [vehicleExpenses])

  useEffect(() => {
    if (isError) {
      console.error('Error loading expenses:', error)
      toast.error('Failed to load expenses. Please try again later.', {
        
      })
    }
  }, [isError, error])

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col p-6">
      <div className="mb-6 flex shrink-0 items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Expenses</h1>
          <p className="text-sm text-muted-foreground">All expense records.</p>
        </div>
      </div>


      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:max-w-xl">
        <StatsCard
          icon={<IconCurrencyRupee className="size-4" />}
          title="Spent"
          value={formatCurrency(spentTotal)}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FilterChip
          icon={<IconCurrencyRupee className="size-4" />}
          title="All expenses"
          value={periodStats.all.count}
          active={quickFilter === 'all' && !dateRange}
          onClick={() => { setQuickFilter('all'); setDateRange(undefined) }}
        />
        <FilterChip
          icon={<IconCalendarStats className="size-4" />}
          title="Today"
          value={periodStats.today.count}
          active={quickFilter === 'today'}
          onClick={() => { setQuickFilter('today'); setDateRange(undefined) }}
        />
        {!isManager() && (
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
        data={expenseRows}
        onFilteredDataChange={(rows) => setSpentTotal(rows.reduce((sum, row) => sum + row.amountValue, 0))}
        columns={[
          {
            accessorKey: 'expenseDate',
            header: 'Date',
          },
          {
            accessorKey: 'categoryName',
            header: 'Category',
            meta: { filterable: true, filterPlaceholder: 'Filter category' },
            cell: ({ row }) => (
              <Badge variant="outline" className="gap-1.5">
                <IconCategory />
                {row.original.categoryName}
              </Badge>
            ),
          },
          {
            accessorKey: 'amount',
            header: 'Amount',
            cell: ({ row }) => (
              <span className="font-medium tabular-nums text-destructive">
                {row.original.amount}
              </span>
            ),
          },
          {
            accessorKey: 'truckNumber',
            header: 'Vehicle number',
            meta: { filterable: true, filterPlaceholder: 'Filter vehicle' },
          },
          {
            accessorKey: 'notes',
            header: 'Notes',
          },
          ...(isManager() ? [] : [{
            id: 'actions',
            header: 'Actions',
            meta: { sortable: false, searchable: false },
            cell: ({ row }: { row: { original: ExpenseRow } }) => (
              <div className="flex items-center gap-2">
                <Button asChild size="icon-sm" variant="outline">
                  <Link
                    to="/expenses/$expenseId/edit"
                    params={{ expenseId: String(row.original.id) }}
                  >
                    <IconPencil />
                    <span className="sr-only">Edit expense</span>
                  </Link>
                </Button>
                <Button
                  size="icon-sm"
                  variant="destructive"
                  onClick={() => setExpenseToDelete(row.original)}
                >
                  <IconTrash />
                  <span className="sr-only">Delete expense</span>
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
        loadingMessage="Loading expenses"
        emptyMessage="No expenses found."
        className="w-full flex-1"
        tableClassName="flex-1"
        enableAddButton
        addButtonLink="/expenses/new"
        addButtonText="Add Expense"
        exportFileName="expenses-report"
        exportTitle="Expenses report"
      />

      <Dialog open={Boolean(expenseToDelete)} onOpenChange={(open) => !open && setExpenseToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete expense</DialogTitle>
            <DialogDescription>
              {expenseToDelete
                ? `Delete ${expenseToDelete.categoryName} expense of ${expenseToDelete.amount} from ${expenseToDelete.expenseDate}? This action cannot be undone.`
                : 'Delete this expense? This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpenseToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (!expenseToDelete) return
                deleteMutation.mutate(expenseToDelete.id)
              }}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
