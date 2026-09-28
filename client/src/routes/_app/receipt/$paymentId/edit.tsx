import { ReceiptForm } from '#/components/receipt-form'
import type { CreateCustomerPaymentPayload } from '#/lib/models'
import { updateCustomerPayment } from '#/lib/mutation'
import { customerKeys, getPaymentById, receiptKeys } from '#/lib/query'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useMemo } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_app/receipt/$paymentId/edit')({
  component: RouteComponent,
})

function RouteComponent() {
  const { paymentId } = Route.useParams()
  const navigate = useNavigate()
  const router = useRouter()
  const queryClient = useQueryClient()

  const paymentQuery = useQuery({
    queryKey: ['payments', paymentId],
    queryFn: () => getPaymentById(paymentId),
    retry: false,
  })

  const updateMutation = useMutation({
    mutationFn: (payload: CreateCustomerPaymentPayload) => {
      const { customerId, ...payment } = payload
      return updateCustomerPayment(paymentId, payment)
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: receiptKeys.all }),
        queryClient.invalidateQueries({ queryKey: customerKeys.all }),
      ])
      await router.invalidate()
      toast.success('Payment updated and ledger adjusted.')
      navigate({ to: '/receipt' })
    },
    onError: () => toast.error('Failed to update payment.'),
  })

  const initialValues = useMemo(() => ({
    customerId: paymentQuery.data?.customerId ? String(paymentQuery.data.customerId) : '',
    amount: paymentQuery.data ? String(paymentQuery.data.amount) : '',
    paymentDate: paymentQuery.data?.paymentDate ?? '',
    paymentMode: paymentQuery.data?.paymentMode ?? 'cash',
    externalRef: paymentQuery.data?.externalRef ?? '',
    notes: paymentQuery.data?.notes ?? '',
  }), [paymentQuery.data])

  const payment = paymentQuery.data
  if (!payment) return null

  return (
    <ReceiptForm
      title="Edit payment"
      description="Update the customer payment. The ledger will retain the adjustment history."
      backLabel="Back to receipts"
      submitLabel="Update payment"
      isSubmitting={updateMutation.isPending}
      initialValues={initialValues}
      onSubmit={updateMutation.mutate}
    />
  )
}
