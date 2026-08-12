import { TruckEntryForm } from '#/components/truck-entry-form'
import type { CreateTruckEntryPayload } from '#/lib/models'
import { updateTruckEntry } from '#/lib/mutation'
import { getTruckEntryById, truckEntryKeys } from '#/lib/query'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'

export const Route = createFileRoute('/_app/truck-entry/$entryId/edit')({
  component: RouteComponent,
})

function RouteComponent() {
  const { entryId } = Route.useParams()
  const numericEntryId = Number(entryId)
  const navigate = useNavigate()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: entry } = useQuery({
    queryKey: truckEntryKeys.detail(entryId),
    queryFn: () => getTruckEntryById(entryId),
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  })

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateTruckEntry>[1]) =>
      updateTruckEntry(entryId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: truckEntryKeys.all }),
        queryClient.invalidateQueries({ queryKey: truckEntryKeys.detail(entryId) }),
        queryClient.refetchQueries({ queryKey: truckEntryKeys.all, type: 'all' }),
        queryClient.refetchQueries({ queryKey: truckEntryKeys.detail(entryId), type: 'all' }),
        router.invalidate(),
      ])
      toast.success('Truck entry updated.')
      navigate({ to: '/truck-entry' })
    },
    onError: () => {
      toast.error('Failed to update truck entry.')
    },
  })

  if (!entry || Number.isNaN(numericEntryId)) {
    return null
  }

  return (
    <TruckEntryForm
      title="Edit Truck Entry"
      description="Update truck number, date, material, quantity, supplier, remarks."
      backLabel="Back to entries"
      submitLabel="Update truck entry"
      isSubmitting={updateMutation.isPending}
      initialMaterialName={entry.materialName ?? undefined}
      initialValues={{
        entryDate: entry.entryDate,
        truckNumber: entry.truckNumber,
        materialTypeId: entry.materialTypeId ? String(entry.materialTypeId) : '',
        quantityBrass: String(entry.quantityBrass),
        supplierName: entry.supplierName ?? '',
        remarks: entry.remarks ?? '',
      }}
      onSubmit={(payload: CreateTruckEntryPayload) => updateMutation.mutate(payload)}
    />
  )
}
