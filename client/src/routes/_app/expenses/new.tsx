import { ExpenseForm } from '#/components/expense-form'
import { createExpense } from '#/lib/mutation'
import type { CreateExpensePayload } from '#/lib/models'
import { expenseKeys } from '#/lib/query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'

export const Route = createFileRoute('/_app/expenses/new')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const router = useRouter()
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: expenseKeys.all }),
        queryClient.refetchQueries({ queryKey: expenseKeys.all, type: 'all' }),
        router.invalidate(),
      ])
      toast.success('Expense created.')
      navigate({ to: '/expenses' })
    },
    onError: () => {
      toast.error('Failed to create expense.')
    },
  })

  return (
    <ExpenseForm
      title="New Expense"
      description="Record a new expense with category, amount, and notes."
      backLabel="Back to expenses"
      submitLabel="Create expense"
      isSubmitting={createMutation.isPending}
      onSubmit={(payload: CreateExpensePayload) => createMutation.mutate(payload)}
    />
  )
}
