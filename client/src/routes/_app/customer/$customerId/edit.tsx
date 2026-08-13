import { CustomerForm } from '#/components/customer-form'
import type { CreateCustomerPayload } from '#/lib/models'
import { updateCustomer } from '#/lib/mutation'
import { customerKeys, getCustomerById } from '#/lib/query'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

export const Route = createFileRoute('/_app/customer/$customerId/edit')({
  component: RouteComponent,
})

function RouteComponent() {
  const { customerId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: customer } = useQuery({
    queryKey: customerKeys.detail(customerId),
    queryFn: () => getCustomerById(customerId),
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  })

  const updateMutation = useMutation({
    mutationFn: (payload: CreateCustomerPayload) => updateCustomer(customerId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: customerKeys.all }),
        queryClient.invalidateQueries({ queryKey: customerKeys.detail(customerId) }),
      ])
      toast.success('Customer updated.')
      navigate({ to: '/customer' })
    },
    onError: () => {
      toast.error('Failed to update customer.')
    },
  })

  if (!customer) {
    return null
  }

  return (
    <CustomerForm
      title="Edit Customer"
      description="Update customer profile details and contact information."
      backLabel="Back to customers"
      submitLabel="Update customer"
      isSubmitting={updateMutation.isPending}
      initialValues={{
        name: customer.name,
        phone: customer.phone ?? '',
        address: customer.address ?? '',
        notes: customer.notes ?? '',
      }}
      onSubmit={(payload: CreateCustomerPayload) => updateMutation.mutate(payload)}
    />
  )
}
