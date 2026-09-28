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
  externalRef?: string
  notes?: string
}

export function RecordPaymentForm({
  isSubmitting = false,
  onSubmit,
  onCancel,
}: {
  isSubmitting?: boolean
  onSubmit: (payload: RecordPaymentFormValues) => void
  onCancel?: () => void
}) {
  const [amount, setAmount] = React.useState('')
  const [paymentMode, setPaymentMode] = React.useState('cash')
  const [chequeNumber, setChequeNumber] = React.useState('')
  const [externalRef, setExternalRef] = React.useState('')
  const [paymentDate, setPaymentDate] = React.useState(() => new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const numericAmount = Number(amount)

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Payment amount must be greater than 0.')
      return
    }
    if (!paymentDate) {
      setError('Payment date is required.')
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
      externalRef: externalRef.trim() || undefined,
      notes: notes.trim() || undefined,
    })
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
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
        <div className="space-y-1.5">
          <Label htmlFor="payment-reference">Reference</Label>
          <Input
            id="payment-reference"
            value={externalRef}
            onChange={(event) => setExternalRef(event.target.value)}
            placeholder="UPI, bank, or receipt reference"
          />
        </div>
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
