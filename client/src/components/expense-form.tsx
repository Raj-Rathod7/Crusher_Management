import { ExpenseSummary } from '#/components/expense-summary'
import { FormPageLayout } from '#/components/form-page-layout'
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
import type { CreateExpensePayload } from '#/lib/models'
import { getAllExpenseCategories, expenseCategoryKeys } from '#/lib/query'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import * as React from 'react'

export type ExpenseFormValues = {
  expenseDate: string
  categoryId: string
  amount: string
  notes: string
}

type FormErrors = Partial<Record<keyof ExpenseFormValues, string>>

type ExpenseFormProps = {
  title: string
  description: string
  backLabel: string
  submitLabel: string
  isSubmitting?: boolean
  initialValues?: Partial<ExpenseFormValues>
  onSubmit: (payload: CreateExpensePayload) => void
}

const defaultFormValues: ExpenseFormValues = {
  expenseDate: new Date().toISOString().slice(0, 10),
  categoryId: '',
  amount: '',
  notes: '',
}

function validateForm(form: ExpenseFormValues) {
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

export function ExpenseForm({
  title,
  description,
  backLabel,
  submitLabel,
  isSubmitting = false,
  initialValues,
  onSubmit,
}: ExpenseFormProps) {
  const navigate = useNavigate()
  const [form, setForm] = React.useState<ExpenseFormValues>({
    ...defaultFormValues,
    ...initialValues,
  })
  const [errors, setErrors] = React.useState<FormErrors>({})

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: expenseCategoryKeys.all,
    queryFn: getAllExpenseCategories,
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  })

  React.useEffect(() => {
    if (initialValues) {
      setForm({ ...defaultFormValues, ...initialValues })
    }
  }, [initialValues])

  const handleChange = (field: keyof ExpenseFormValues, value: string) => {
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

    onSubmit({
      expenseDate: form.expenseDate,
      categoryId: Number(form.categoryId),
      amount: Number(form.amount),
      notes: form.notes.trim() || undefined,
    })
  }

  const formContent = (
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
        <Button type="button" variant="outline" onClick={() => navigate({ to: '/expenses' })}>
          Back
        </Button>
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  )

  return (
    <FormPageLayout
      title={title}
      description={description}
      backLabel={backLabel}
      backTo="/expenses"
      badge="Expense entry"
      sidebar={<ExpenseSummary form={form} categories={categories} />}
    >
      {formContent}
    </FormPageLayout>
  )
}
