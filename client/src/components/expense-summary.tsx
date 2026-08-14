import { SummaryRow } from '#/components/summary-row'
import { Badge } from '#/components/ui/badge'
import type { ExpenseCategory } from '#/lib/models'

type ExpenseSummaryForm = {
  expenseDate: string
  categoryId: string
  amount: string
  notes: string
}

type ExpenseSummaryProps = {
  form: ExpenseSummaryForm
  categories: ExpenseCategory[]
}

export function ExpenseSummary({ form, categories }: ExpenseSummaryProps) {
  const categoryName = categories.find((category) => String(category.id) === form.categoryId)?.name
  const amount = Number(form.amount || 0)
  const isReadyToSave = Boolean(form.expenseDate && form.categoryId && amount > 0)
  const status = isReadyToSave ? 'Ready to save' : 'Needs details'
  const statusClassName = isReadyToSave
    ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
    : 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300'

  return (
    <>
      <div className="mb-5 border-b border-border/80 pb-4">
        <h2 className="text-base font-semibold">Expense summary</h2>
        <p className="text-sm text-muted-foreground">Live snapshot before save.</p>
      </div>

      <div className="mb-4 flex items-center justify-between gap-3 rounded-md border px-3 py-2.5">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Entry status</p>
          <p className="mt-1 text-sm font-semibold">{categoryName || 'New expense'}</p>
        </div>
        <Badge variant="outline" className={statusClassName}>{status}</Badge>
      </div>

      <div className="rounded-lg border px-4 py-3">
        <SummaryRow label="Date" value={form.expenseDate || 'Not set'} />
        <SummaryRow label="Category" value={categoryName || 'Not set'} />
        <SummaryRow label="Notes" value={form.notes.trim() || 'None'} />

        <div className={`mt-4 rounded-lg border px-3 py-3 ${
          amount > 0
            ? 'border-rose-500/20 bg-rose-500/5'
            : 'border-border bg-muted/40'
        }`}>
          <div className={`text-[10px] font-medium uppercase tracking-wide ${
            amount > 0
              ? 'text-rose-700/80 dark:text-rose-300/80'
              : 'text-muted-foreground'
          }`}>
            Amount
          </div>
          <div className={`mt-1 text-lg font-semibold ${
            amount > 0
              ? 'text-rose-800 dark:text-rose-200'
              : 'text-foreground'
          }`}>
            {amount > 0 ? amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
          </div>
        </div>
      </div>
    </>
  )
}
