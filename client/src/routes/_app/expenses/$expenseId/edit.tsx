import { Button } from '#/components/ui/button'
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { updateExpense } from '#/lib/mutation'
import type { CreateExpensePayload } from '#/lib/models'
import { expenseKeys, getExpenseById, getAllExpenseCategories, expenseCategoryKeys } from '#/lib/query'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate, useRouter } from '@tanstack/react-router'
import { IconArrowLeft } from '@tabler/icons-react'
import * as React from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_app/expenses/$expenseId/edit')({
  component: RouteComponent,
})

type FormState = {
  expenseDate: string
  categoryId: string
  amount: string
  notes: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

const initialFormState: FormState = {
  expenseDate: new Date().toISOString().slice(0, 10),
  categoryId: '',
  amount: '',
  notes: '',
}

function validateForm(form: FormState) {
  const errors: FormErrors = {}

  if (!form.expenseDate) {
    errors.expenseDate = 'Expense date required.'
  }

  if (!form.categoryId) {
    errors.categoryId = 'Category required.'
  }

  if (!form.amount.trim() || Number(form.amount) <= 0) {
    errors.amount = 'Amount must be greater than 0.'
  }

  return errors
}

function RouteComponent() {
  const { expenseId } = Route.useParams()
  const navigate = useNavigate()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [form, setForm] = React.useState<FormState>(initialFormState)
  const [errors, setErrors] = React.useState<FormErrors>({})

  const { data: expense } = useQuery({
    queryKey: expenseKeys.detail(expenseId),
    queryFn: () => getExpenseById(expenseId),
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  })

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: expenseCategoryKeys.all,
    queryFn: getAllExpenseCategories,
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  })

  React.useEffect(() => {
    if (expense) {
      setForm({
        expenseDate: expense.expenseDate,
        categoryId: String(expense.categoryId),
        amount: String(expense.amount),
        notes: expense.notes || '',
      })
    }
  }, [expense])

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

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors = validateForm(form)

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const payload: CreateExpensePayload = {
      expenseDate: form.expenseDate,
      categoryId: Number(form.categoryId),
      amount: Number(form.amount),
      notes: form.notes.trim() || undefined,
    }

    updateMutation.mutate(payload)
  }

  if (!expense) {
    return null
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-linear-to-b from-background via-background to-muted/20 p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-primary">
            Expense entry
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Edit Expense</h1>
            <p className="text-sm text-muted-foreground">Update expense details, category, amount, and notes.</p>
          </div>
        </div>
        <Button asChild variant="outline" className="shadow-sm">
          <Link to="/expenses">
            <IconArrowLeft />
            Back to expenses
          </Link>
        </Button>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card/90 p-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)] backdrop-blur-sm lg:p-7 max-w-2xl">
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <FieldGroup className="grid gap-4">
            <Field>
              <FieldLabel htmlFor="expenseDate">Expense date</FieldLabel>
              <FieldContent>
                <Input
                  id="expenseDate"
                  type="date"
                  value={form.expenseDate}
                  onChange={(event) => handleChange('expenseDate', event.target.value)}
                />
                <FieldError>{errors.expenseDate}</FieldError>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="categoryId">Category</FieldLabel>
              <FieldContent>
                <Select
                  value={form.categoryId}
                  onValueChange={(value) => handleChange('categoryId', value)}
                  disabled={isLoadingCategories || categories.length === 0}
                >
                  <SelectTrigger id="categoryId">
                    <SelectValue placeholder={isLoadingCategories ? 'Loading categories...' : 'Select category'} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError>{errors.categoryId}</FieldError>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="amount">Amount</FieldLabel>
              <FieldContent>
                <Input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={(event) => handleChange('amount', event.target.value)}
                  placeholder="0.00"
                />
                <FieldError>{errors.amount}</FieldError>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="notes">Notes</FieldLabel>
              <FieldContent>
                <textarea
                  id="notes"
                  value={form.notes}
                  onChange={(event) => handleChange('notes', event.target.value)}
                  placeholder="Optional notes"
                  className="min-h-20 rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </FieldContent>
            </Field>
          </FieldGroup>

          <div className="flex items-center justify-end gap-3 border-t border-border/80 pt-4">
            <Button asChild type="button" variant="outline" className="shadow-sm">
              <Link to="/expenses">
                <IconArrowLeft />
                Cancel
              </Link>
            </Button>
            <Button disabled={updateMutation.isPending} type="submit" className="shadow-[0_12px_24px_-18px_rgba(59,130,246,0.8)]">
              {updateMutation.isPending ? 'Saving...' : 'Update expense'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
