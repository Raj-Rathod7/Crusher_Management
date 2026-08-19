import { ConfigurableDataTable } from '#/components/data-table'
import { StatsCard } from '#/components/stats-card'
import { Button } from '#/components/ui/button'
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { IconCurrencyRupee, IconPencil, IconTrash } from '@tabler/icons-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_app/expenses/')({
  component: RouteComponent,
})

type ExpenseRow = {
  id: number
  expenseDate: string
  categoryName: string
  amount: string
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

  const { data, isLoading, isError, error } = useQuery({
    queryKey: expenseKeys.all,
    queryFn: getAllExpenses,
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  })

  const expenseRows: ExpenseRow[] = (data ?? []).map((expense) => ({
    id: expense.id,
    expenseDate: expense.expenseDate,
    categoryName: expense.categoryName ?? '-',
    amount: formatCurrency(expense.amount),
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

  const stats = useMemo(() => {
    const expenses = data ?? []
    const today = new Date()
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      today.getDate()
    ).padStart(2, '0')}`
    const todayExpenses = expenses.filter((expense) => expense.expenseDate === todayKey)
    const totalToday = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    const totalOverall = expenses.reduce((sum, expense) => sum + expense.amount, 0)

    return {
      expensesToday: todayExpenses.length,
      totalToday,
      totalOverall,
    }
  }, [data])

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

      <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatsCard
          icon={<IconCurrencyRupee className="size-4" />}
          title="Expenses today"
          value={stats.expensesToday}
          footer="Expenses recorded for today."
        />

        <StatsCard
          icon={<IconCurrencyRupee className="size-4" />}
          title="Amount today"
          value={formatCurrency(stats.totalToday)}
          footer="Total expense amount today."
        />

        <StatsCard
          icon={<IconCurrencyRupee className="size-4" />}
          title="Total expenses"
          value={formatCurrency(stats.totalOverall)}
          footer="All expenses combined."
        />
      </div>

      <ConfigurableDataTable
        data={expenseRows}
        columns={[
          {
            accessorKey: 'expenseDate',
            header: 'Date',
            meta: { filterable: true, filterType: 'date' },
          },
          {
            accessorKey: 'categoryName',
            header: 'Category',
            meta: { filterable: true, filterPlaceholder: 'Filter category' },
          },
          {
            accessorKey: 'amount',
            header: 'Amount',
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
          },
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
