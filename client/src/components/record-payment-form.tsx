import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import * as React from 'react'

export type RecordPaymentFormValues = {
  amount: number
  paymentDate: string
  paymentMode: string
  chequeNumber?: string
  notes?: string
}

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export function RecordPaymentForm({
  balance,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: {
  balance: number
  isSubmitting?: boolean
  onSubmit: (payload: RecordPaymentFormValues) => void
  onCancel?: () => void
}) {
  const [amount, setAmount] = React.useState(String(balance))
  const [paymentMode, setPaymentMode] = React.useState('cash')
  const [chequeNumber, setChequeNumber] = React.useState('')
  const [paymentDate, setPaymentDate] = React.useState(() => new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const numericAmount = Number(amount)

    if (!numericAmount || numericAmount <= 0) {
      setError('Amount must be greater than 0.')
      return
    }
    if (numericAmount > balance) {
      setError(`Amount cannot exceed the outstanding balance of ${currency.format(balance)}.`)
      return
    }
    if (paymentMode === 'cheque' && !chequeNumber.trim()) {
      setError('Cheque number is required for cheque payments.')
      return
    }

    setError(null)
    onSubmit({
      amount: numericAmount,
      paymentDate,
      paymentMode,
      chequeNumber: chequeNumber.trim() || undefined,
      notes: notes.trim() || undefined,
    })
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="payment-amount">Amount</Label>
          <Input
            id="payment-amount"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="payment-date">Date</Label>
          <Input
            id="payment-date"
            type="date"
            value={paymentDate}
            onChange={(event) => setPaymentDate(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="payment-mode">Mode</Label>
          <Select value={paymentMode} onValueChange={setPaymentMode}>
            <SelectTrigger id="payment-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="upi">UPI</SelectItem>
              <SelectItem value="bank_transfer">Bank transfer</SelectItem>
              <SelectItem value="cheque">Cheque</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {paymentMode === 'cheque' && (
          <div className="space-y-1.5">
            <Label htmlFor="payment-cheque">Cheque number</Label>
            <Input
              id="payment-cheque"
              value={chequeNumber}
              onChange={(event) => setChequeNumber(event.target.value)}
            />
          </div>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="payment-notes">Notes</Label>
        <Input id="payment-notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save payment'}
        </Button>
      </div>
    </form>
  )
}
