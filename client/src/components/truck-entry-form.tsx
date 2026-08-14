import { SummaryRow } from '#/components/summary-row'
import { FormPageLayout } from '#/components/form-page-layout'
import { Badge } from '#/components/ui/badge'
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
import type { CreateTruckEntryPayload } from '#/lib/models'
import { getAllMaterials, materialKeys } from '#/lib/query'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { IconCheck } from '@tabler/icons-react'
import * as React from 'react'

type TruckEntryFormValues = {
  entryDate: string
  truckNumber: string
  materialTypeId: string
  quantityBrass: string
  supplierName: string
  remarks: string
}

type FormErrors = Partial<Record<keyof TruckEntryFormValues, string>>

type TruckEntryFormProps = {
  title: string
  description: string
  backLabel: string
  submitLabel: string
  isSubmitting?: boolean
  initialValues?: Partial<TruckEntryFormValues>
  initialMaterialName?: string
  onSubmit: (payload: CreateTruckEntryPayload) => void
}

const defaultFormValues: TruckEntryFormValues = {
  entryDate: new Date().toISOString().slice(0, 10),
  truckNumber: '',
  materialTypeId: '',
  quantityBrass: '',
  supplierName: '',
  remarks: '',
}

function validateForm(form: TruckEntryFormValues) {
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

function toPayload(form: TruckEntryFormValues): CreateTruckEntryPayload {
  return {
    entryDate: form.entryDate,
    truckNumber: form.truckNumber.trim(),
    materialTypeId: Number(form.materialTypeId),
    quantityBrass: form.quantityBrass,
    supplierName: form.supplierName.trim() || undefined,
    remarks: form.remarks.trim() || undefined,
  }
}

export function TruckEntryForm({
  title,
  description,
  backLabel,
  submitLabel,
  isSubmitting = false,
  initialValues,
  initialMaterialName,
  onSubmit,
}: TruckEntryFormProps) {
  const navigate = useNavigate()
  const [form, setForm] = React.useState<TruckEntryFormValues>({
    ...defaultFormValues,
    ...initialValues,
  })
  const [errors, setErrors] = React.useState<FormErrors>({})

  const { data: materials = [], isLoading: isLoadingMaterials } = useQuery({
    queryKey: materialKeys.all,
    queryFn: getAllMaterials,
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  })

  React.useEffect(() => {
    setForm({
      ...defaultFormValues,
      ...initialValues,
    })
  }, [initialValues])

  const activeMaterials = materials.filter((material) => material.isActive !== false)

  React.useEffect(() => {
    if (form.materialTypeId || !initialMaterialName || activeMaterials.length === 0) {
      return
    }

    const matchedMaterial = activeMaterials.find(
      (material) => material.name.trim().toLowerCase() === initialMaterialName.trim().toLowerCase()
    )

    if (!matchedMaterial) {
      return
    }

    setForm((current) => ({
      ...current,
      materialTypeId: String(matchedMaterial.id),
    }))
  }, [activeMaterials, form.materialTypeId, initialMaterialName])

  const handleChange = (field: keyof TruckEntryFormValues, value: string) => {
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

    onSubmit(toPayload(form))
  }

  const selectedMaterial = activeMaterials.find(
    (material) => String(material.id) === form.materialTypeId
  )
  const isReadyToSave = Boolean(form.entryDate && form.truckNumber.trim() && form.materialTypeId && form.quantityBrass.trim() && Number(form.quantityBrass) > 0)
  const entryStatus = isReadyToSave ? 'Ready to save' : 'Needs details'
  const entryStatusClassName = isReadyToSave
    ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
    : 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300'

  const sidebarContent = (
    <>
      <div className="mb-5 border-b border-border/80 pb-4">
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
        <div className="mb-3 flex items-center justify-between gap-3 border-b pb-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Entry status</p>
            <p className="mt-1 text-sm font-semibold">{form.truckNumber.trim() || 'New truck entry'}</p>
          </div>
          <Badge variant="outline" className={entryStatusClassName}>{entryStatus}</Badge>
        </div>
        <SummaryRow label="Truck" value={form.truckNumber.trim() || 'Not set'} />
        <SummaryRow label="Date" value={form.entryDate || 'Not set'} />
        <SummaryRow label="Material" value={selectedMaterial?.name ?? 'Not set'} />
        <SummaryRow
          label="Quantity"
          value={form.quantityBrass.trim() ? `${form.quantityBrass} brass` : 'Not set'}
          isBadge={Boolean(form.quantityBrass.trim())}
          badgeVariant="secondary"
        />
        <SummaryRow label="Supplier" value={form.supplierName.trim() || 'Not set'} />
        <SummaryRow label="Remarks" value={form.remarks.trim() || 'None'} />
      </div>

      <p className="mt-4 text-xs leading-5 text-muted-foreground">
        Amount not calculated here. Truck entry API only stores quantity and material.
      </p>
    </>
  )

  const formContent = (
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
              <Button type="button" variant="outline" onClick={() => navigate({ to: '/truck-entry' })}>
                Back
              </Button>
              <Button disabled={isSubmitting} type="submit">
                {isSubmitting ? 'Saving...' : submitLabel}
              </Button>
            </div>
          </form>
  )

  return (
    <FormPageLayout
      title={title}
      description={description}
      backLabel={backLabel}
      backTo="/truck-entry"
      badge="Truck entry"
      sidebar={sidebarContent}
    >
      {formContent}
    </FormPageLayout>
  )
}