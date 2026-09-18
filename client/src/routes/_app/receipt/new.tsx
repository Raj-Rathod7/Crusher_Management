import { ReceiptForm } from '#/components/receipt-form'
import { createAdvanceReceipt } from '#/lib/mutation'
import type { CreateAdvanceReceiptPayload } from '#/lib/models'
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
    mutationFn: createAdvanceReceipt,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: receiptKeys.all }),
        queryClient.invalidateQueries({ queryKey: customerKeys.all }),
      ])
      await router.invalidate(),

      toast.success('Receipt recorded.')
      navigate({ to: '/receipt' })
    },
    onError: () => {
      toast.error('Failed to record receipt.')
    },
  })

  return (
    <ReceiptForm
      title="New Receipt"
      description="Record an advance payment received from a customer."
      backLabel="Back to receipts"
      submitLabel="Save receipt"
      isSubmitting={createMutation.isPending}
      onSubmit={(payload: CreateAdvanceReceiptPayload) => createMutation.mutate(payload)}
    />
  )
}
