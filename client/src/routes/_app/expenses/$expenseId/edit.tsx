import { ExpenseForm } from '#/components/expense-form'
import { updateExpense } from '#/lib/mutation'
import type { CreateExpensePayload } from '#/lib/models'
import { expenseKeys, getExpenseById } from '#/lib/query'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'

export const Route = createFileRoute('/_app/expenses/$expenseId/edit')({
  component: RouteComponent,
})

function RouteComponent() {
  const { expenseId } = Route.useParams()
  const navigate = useNavigate()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: expense } = useQuery({
    queryKey: expenseKeys.detail(expenseId),
    queryFn: () => getExpenseById(expenseId),
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  })

  const updateMutation = useMutation({
    mutationFn: (payload: CreateExpensePayload) => updateExpense(expenseId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: expenseKeys.all }),
        queryClient.invalidateQueries({ queryKey: expenseKeys.detail(expenseId) }),
        queryClient.refetchQueries({ queryKey: expenseKeys.all, type: 'all' }),
        queryClient.refetchQueries({ queryKey: expenseKeys.detail(expenseId), type: 'all' }),
        router.invalidate(),
      ])
      toast.success('Expense updated.')
      navigate({ to: '/expenses' })
    },
    onError: () => {
      toast.error('Failed to update expense.')
    },
  })

  if (!expense) {
    return null
  }

  return (
    <ExpenseForm
      title="Edit Expense"
      description="Update expense details, category, amount, and notes."
      backLabel="Back to expenses"
      submitLabel="Update expense"
      isSubmitting={updateMutation.isPending}
      initialValues={{
        expenseDate: expense.expenseDate,
        categoryId: String(expense.categoryId),
        amount: String(expense.amount),
        notes: expense.notes ?? '',
      }}
      onSubmit={(payload: CreateExpensePayload) => updateMutation.mutate(payload)}
    />
  )
}
