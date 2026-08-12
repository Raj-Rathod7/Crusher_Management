import { TruckEntryForm } from '#/components/truck-entry-form'
import { createTruckEntry } from '#/lib/mutation'
import type { CreateTruckEntryPayload } from '#/lib/models'
import { truckEntryKeys } from '#/lib/query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'

export const Route = createFileRoute('/_app/truck-entry/new')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const router = useRouter()
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: createTruckEntry,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: truckEntryKeys.all }),
        queryClient.refetchQueries({ queryKey: truckEntryKeys.all, type: 'all' }),
        router.invalidate(),
      ])
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


