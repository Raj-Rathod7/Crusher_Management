import { CustomerForm } from '#/components/customer-form'
import { createCustomer } from '#/lib/mutation'
import type { CreateCustomerPayload } from '#/lib/models'
import { customerKeys } from '#/lib/query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

export const Route = createFileRoute('/_app/customer/new')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: customerKeys.all })
      toast.success('Customer created.')
      navigate({ to: '/customer' })
    },
    onError: () => {
      toast.error('Failed to create customer.')
    },
  })

  return (
    <CustomerForm
      title="New Customer"
      description="Create a customer profile with name, contact, and notes."
      backLabel="Back to customers"
      submitLabel="Create customer"
      isSubmitting={createMutation.isPending}
      onSubmit={(payload: CreateCustomerPayload) => createMutation.mutate(payload)}
    />
  )
}
