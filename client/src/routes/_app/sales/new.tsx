import { SalesForm } from '#/components/sales-form'
import { createSale } from '#/lib/mutation'
import type { CreateInvoicePayload } from '#/lib/models'
import { salesKeys } from '#/lib/query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

export const Route = createFileRoute('/_app/sales/new')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: createSale,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: salesKeys.all })
      toast.success('Sale created.')
      navigate({ to: '/sales' })
    },
    onError: () => {
      toast.error('Failed to create sale.')
    },
  })

  const handleSubmit = (payload: CreateInvoicePayload) => {
    createMutation.mutate(payload)
  }

  return (
    <SalesForm
      title="New Sale"
      description="Create invoice with customer, amount, payment, and status."
      backLabel="Back to sales"
      submitLabel="Create sale"
      isSubmitting={createMutation.isPending}
      onSubmit={handleSubmit}
      showSummary={true}
      variant="page"
    />
  )
}