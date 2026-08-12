import { TruckEntryForm } from '#/components/truck-entry-form'
import { createTruckEntry } from '#/lib/mutation'
import type { CreateTruckEntryPayload } from '#/lib/models'
import { truckEntryKeys } from '#/lib/query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

export const Route = createFileRoute('/_app/truck-entry/new')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: createTruckEntry,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: truckEntryKeys.all })
      toast.success('Truck entry created.')
      navigate({ to: '/truck-entry' })
    },
    onError: () => {
      toast.error('Failed to create truck entry.')
    },
  })

  return (
    <TruckEntryForm
      title="New Truck Entry"
      description="Add truck number, date, material, quantity, supplier, remarks."
      backLabel="Back to entries"
      submitLabel="Create truck entry"
      isSubmitting={createMutation.isPending}
      onSubmit={(payload: CreateTruckEntryPayload) => createMutation.mutate(payload)}
    />
  )
}


