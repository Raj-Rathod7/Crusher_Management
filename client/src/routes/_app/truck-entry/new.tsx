import { Button } from '#/components/ui/button'
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { createTruckEntry } from '#/lib/mutation'
import type { CreateTruckEntryPayload } from '#/lib/models'
import { getAllMaterials, materialKeys, truckEntryKeys } from '#/lib/query'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { IconArrowLeft, IconCheck, IconPlus } from '@tabler/icons-react'
import * as React from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_app/truck-entry/new')({
  component: RouteComponent,
})

type FormState = {
  entryDate: string
  truckNumber: string
  materialTypeId: string
  quantityBrass: string
  supplierName: string
  remarks: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

const initialFormState: FormState = {
  entryDate: new Date().toISOString().slice(0, 10),
  truckNumber: '',
  materialTypeId: '',
  quantityBrass: '',
  supplierName: '',
  remarks: '',
}

function validateForm(form: FormState) {
  const errors: FormErrors = {}

  if (!form.entryDate) {
    errors.entryDate = 'Entry date required.'
  }

  if (!form.truckNumber.trim()) {
    errors.truckNumber = 'Truck number required.'
  }

  if (!form.materialTypeId) {
    errors.materialTypeId = 'Material required.'
  }

  if (!form.quantityBrass.trim()) {
    errors.quantityBrass = 'Quantity required.'
  } else if (Number(form.quantityBrass) <= 0) {
    errors.quantityBrass = 'Quantity must be greater than 0.'
  }

  return errors
}

function toPayload(form: FormState): CreateTruckEntryPayload {
  return {
    entryDate: form.entryDate,
    truckNumber: form.truckNumber.trim(),
    materialTypeId: Number(form.materialTypeId),
    quantityBrass: form.quantityBrass,
    supplierName: form.supplierName.trim() || undefined,
    remarks: form.remarks.trim() || undefined,
  }
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3 border-t py-3 first:border-t-0 first:pt-0 last:pb-0">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-medium leading-5 wrap-break-word">{value}</span>
    </div>
  )
}

function RouteComponent() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = React.useState<FormState>(initialFormState)
  const [errors, setErrors] = React.useState<FormErrors>({})

  const { data: materials = [], isLoading: isLoadingMaterials } = useQuery({
    queryKey: materialKeys.all,
    queryFn: getAllMaterials,
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  })

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

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validateForm(form)

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    createMutation.mutate(toPayload(form))
  }

  const activeMaterials = materials.filter((material) => material.isActive !== false)
  const selectedMaterial = activeMaterials.find(
    (material) => String(material.id) === form.materialTypeId
  )

  return (
    <div className="min-h-[calc(100vh-5rem)] p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">New Truck Entry</h1>
          <p className="text-sm text-muted-foreground">
            Add truck number, date, material, quantity, supplier, remarks.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/truck-entry">
            <IconArrowLeft />
            Back to entries
          </Link>
        </Button>
      </div>

      <div className="grid min-h-[calc(100vh-10rem)] gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="rounded-xl border p-6 lg:p-8">
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <FieldGroup className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="entryDate">Entry date</FieldLabel>
                <FieldContent>
                  <Input
                    id="entryDate"
                    type="date"
                    value={form.entryDate}
                    onChange={(event) => handleChange('entryDate', event.target.value)}
                  />
                  <FieldError>{errors.entryDate}</FieldError>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="truckNumber">Truck number</FieldLabel>
                <FieldContent>
                  <Input
                    id="truckNumber"
                    value={form.truckNumber}
                    onChange={(event) => handleChange('truckNumber', event.target.value)}
                    placeholder="Enter truck number"
                  />
                  <FieldError>{errors.truckNumber}</FieldError>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="materialTypeId">Material type</FieldLabel>
                <FieldContent>
                  <Select
                    value={form.materialTypeId}
                    onValueChange={(value) => handleChange('materialTypeId', value)}
                    disabled={isLoadingMaterials || activeMaterials.length === 0}
                  >
                    <SelectTrigger id="materialTypeId" className="w-full">
                      <SelectValue placeholder={isLoadingMaterials ? 'Loading materials' : 'Select material'} />
                    </SelectTrigger>
                    <SelectContent>
                      {activeMaterials.map((material) => (
                        <SelectItem key={material.id} value={String(material.id)}>
                          {material.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError>{errors.materialTypeId}</FieldError>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="quantityBrass">Quantity (Brass)</FieldLabel>
                <FieldContent>
                  <Input
                    id="quantityBrass"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.quantityBrass}
                    onChange={(event) => handleChange('quantityBrass', event.target.value)}
                    placeholder="0.00"
                  />
                  <FieldError>{errors.quantityBrass}</FieldError>
                </FieldContent>
              </Field>

              <Field className="md:col-span-2">
                <FieldLabel htmlFor="supplierName">Supplier name</FieldLabel>
                <FieldContent>
                  <Input
                    id="supplierName"
                    value={form.supplierName}
                    onChange={(event) => handleChange('supplierName', event.target.value)}
                    placeholder="Optional supplier name"
                  />
                </FieldContent>
              </Field>

              <Field className="md:col-span-2">
                <FieldLabel htmlFor="remarks">Remarks</FieldLabel>
                <FieldContent>
                  <textarea
                    id="remarks"
                    value={form.remarks}
                    onChange={(event) => handleChange('remarks', event.target.value)}
                    placeholder="Optional notes"
                    className="min-h-32 rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                </FieldContent>
              </Field>
            </FieldGroup>

            <div className="flex items-center justify-end gap-3 border-t pt-4">
              <Button asChild type="button" variant="outline">
                <Link to="/truck-entry">
                  <IconArrowLeft />
                  Cancel
                </Link>
              </Button>
              <Button disabled={createMutation.isPending} type="submit">
                {createMutation.isPending ? (
                  'Saving...'
                ) : (
                  <>
                    <IconPlus />
                    Create truck entry
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        <aside className="h-fit rounded-xl border p-5 lg:sticky lg:top-6">
          <div className="mb-5 border-b pb-4">
            <h2 className="text-base font-semibold">Entry summary</h2>
            <p className="text-sm text-muted-foreground">
              Live snapshot from current form values.
            </p>
          </div>

          <div className="mb-4 inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium">
            <IconCheck className="size-4 text-muted-foreground" />
            Ready to review before save
          </div>

          <div className="rounded-lg border px-4 py-3">
            <SummaryRow label="Truck" value={form.truckNumber.trim() || 'Not set'} />
            <SummaryRow label="Date" value={form.entryDate || 'Not set'} />
            <SummaryRow label="Material" value={selectedMaterial?.name ?? 'Not set'} />
            <SummaryRow label="Quantity" value={form.quantityBrass.trim() ? `${form.quantityBrass} brass` : 'Not set'} />
            <SummaryRow label="Supplier" value={form.supplierName.trim() || 'Not set'} />
            <SummaryRow label="Remarks" value={form.remarks.trim() || 'None'} />
          </div>

          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            Amount not calculated here. Truck entry API only stores quantity and material.
          </p>
        </aside>
      </div>
    </div>
  )
}


