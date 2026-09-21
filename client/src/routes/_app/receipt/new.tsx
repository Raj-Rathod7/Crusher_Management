import { ReceiptForm } from '#/components/receipt-form'
import { recordCustomerPayment } from '#/lib/mutation'
import type { CreateCustomerPaymentPayload } from '#/lib/models'
import { customerKeys, receiptKeys } from '#/lib/query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'

export const Route = createFileRoute('/_app/receipt/new')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const router = useRouter()
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: (payload: CreateCustomerPaymentPayload) => {
      const { customerId, ...payment } = payload
      return recordCustomerPayment(customerId, payment)
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: receiptKeys.all }),
        queryClient.invalidateQueries({ queryKey: customerKeys.all }),
      ])
      await router.invalidate(),

      toast.success('Customer payment recorded.')
      navigate({ to: '/receipt' })
    },
    onError: () => {
      toast.error('Failed to record customer payment.')
    },
  })

  return (
    <ReceiptForm
      title="New payment"
      description="Record a payment received from a customer."
      backLabel="Back to receipts"
      submitLabel="Save payment"
      isSubmitting={createMutation.isPending}
      onSubmit={(payload: CreateCustomerPaymentPayload) => createMutation.mutate(payload)}
    />
  )
}
