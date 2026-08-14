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
import { Textarea } from '#/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import type { CreateTruckEntryPayload } from '#/lib/models'
import { getAllMaterials, materialKeys } from '#/lib/query'
import { useForm } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { IconCheck } from '@tabler/icons-react'
import * as React from 'react'
import { z } from 'zod'

const truckEntryFormSchema = z.object({
  entryDate: z.string().min(1, 'Entry date is required.'),
  truckNumber: z.string().trim().min(1, 'Truck number is required.'),
  materialTypeId: z.string().min(1, 'Material is required.'),
  quantityBrass: z.string().trim().min(1, 'Quantity is required.').refine(
    (value) => Number(value) > 0,
    'Quantity must be greater than 0.'
  ),
  supplierName: z.string(),
  remarks: z.string(),
})

type TruckEntryFormValues = z.infer<typeof truckEntryFormSchema>
type TruckEntryFieldName = keyof TruckEntryFormValues

function getErrorMessage(errors: readonly unknown[]): string | undefined {
  const error = errors.find(Boolean)

  if (typeof error === 'string') {
    return error
  }

  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
}

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
  const form = useForm({
    defaultValues: {
      ...defaultFormValues,
      ...initialValues,
    },
    validators: {
      onSubmit: truckEntryFormSchema,
    },
    onSubmit: async ({ value }) => {
      onSubmit(toPayload(value))
    },
  })

  const {
    data: materials = [],
    isError: isMaterialsError,
    isLoading: isLoadingMaterials,
    refetch: refetchMaterials,
  } = useQuery({
    queryKey: materialKeys.all,
    queryFn: getAllMaterials,
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  })

  const activeMaterials = materials.filter((material) => material.isActive !== false)

  React.useEffect(() => {
    if (form.state.values.materialTypeId || !initialMaterialName || activeMaterials.length === 0) {
      return
    }

    const matchedMaterial = activeMaterials.find(
      (material) => material.name.trim().toLowerCase() === initialMaterialName.trim().toLowerCase()
    )

    if (!matchedMaterial) {
      return
    }

    form.setFieldValue('materialTypeId', String(matchedMaterial.id))
  }, [activeMaterials, form, initialMaterialName])

  const getFieldError = (name: TruckEntryFieldName, value: string) => {
    const result = truckEntryFormSchema.shape[name].safeParse(value)
    return result.success ? undefined : result.error.issues[0]?.message
  }

  const sidebarContent = (
    <form.Subscribe selector={(state) => state.values}>
      {(values) => {
        const selectedMaterial = activeMaterials.find(
          (material) => String(material.id) === values.materialTypeId
        )
        const isReadyToSave = Boolean(values.entryDate && values.truckNumber.trim() && values.materialTypeId && values.quantityBrass.trim() && Number(values.quantityBrass) > 0)
        const entryStatus = isReadyToSave ? 'Ready to save' : 'Needs details'
        const entryStatusClassName = isReadyToSave
          ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
          : 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300'

        return (
          <>
            <div className="mb-5 border-b border-border/80 pb-4">
              <h2 className="text-base font-semibold">Entry summary</h2>
              <p className="text-sm text-muted-foreground">Live snapshot from current form values.</p>
            </div>

            <div className="mb-4 inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium">
              <IconCheck className="size-4 text-muted-foreground" />
              Ready to review before save
            </div>

            <div className="rounded-lg border px-4 py-3">
              <div className="mb-3 flex items-center justify-between gap-3 border-b pb-3">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Entry status</p>
                  <p className="mt-1 text-sm font-semibold">{values.truckNumber.trim() || 'New truck entry'}</p>
                </div>
                <Badge variant="outline" className={entryStatusClassName}>{entryStatus}</Badge>
              </div>
              <SummaryRow label="Truck" value={values.truckNumber.trim() || 'Not set'} />
              <SummaryRow label="Date" value={values.entryDate || 'Not set'} />
              <SummaryRow label="Material" value={selectedMaterial?.name ?? 'Not set'} />
              <SummaryRow
                label="Quantity"
                value={values.quantityBrass.trim() ? `${values.quantityBrass} brass` : 'Not set'}
                isBadge={Boolean(values.quantityBrass.trim())}
                badgeVariant="secondary"
              />
              <SummaryRow label="Supplier" value={values.supplierName.trim() || 'Not set'} />
              <SummaryRow label="Remarks" value={values.remarks.trim() || 'None'} />
            </div>

            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              Amount not calculated here. Truck entry API only stores quantity and material.
            </p>
          </>
        )
      }}
    </form.Subscribe>
  )

  const formContent = (
          <form
            className="flex flex-col gap-6"
            onSubmit={(event) => {
              event.preventDefault()
              event.stopPropagation()
              void form.handleSubmit()
            }}
          >
            <FieldGroup className="grid gap-4 md:grid-cols-2">
              <form.Field name="entryDate" validators={{ onBlur: ({ value }) => getFieldError('entryDate', value), onChange: ({ value }) => getFieldError('entryDate', value) }}>
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="entryDate">Entry date</FieldLabel>
                    <FieldContent>
                      <Input id="entryDate" type="date" value={field.state.value} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)} aria-invalid={(field.state.meta.isTouched || form.state.isSubmitted) && field.state.meta.errors.length > 0} />
                      {(field.state.meta.isTouched || form.state.isSubmitted) && <FieldError>{getErrorMessage(field.state.meta.errors)}</FieldError>}
                    </FieldContent>
                  </Field>
                )}
              </form.Field>

              <form.Field name="truckNumber" validators={{ onBlur: ({ value }) => getFieldError('truckNumber', value), onChange: ({ value }) => getFieldError('truckNumber', value) }}>
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="truckNumber">Truck number</FieldLabel>
                    <FieldContent>
                      <Input id="truckNumber" value={field.state.value} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)} placeholder="Enter truck number" aria-invalid={(field.state.meta.isTouched || form.state.isSubmitted) && field.state.meta.errors.length > 0} />
                      {(field.state.meta.isTouched || form.state.isSubmitted) && <FieldError>{getErrorMessage(field.state.meta.errors)}</FieldError>}
                    </FieldContent>
                  </Field>
                )}
              </form.Field>

              <form.Field name="materialTypeId" validators={{ onBlur: ({ value }) => getFieldError('materialTypeId', value), onChange: ({ value }) => getFieldError('materialTypeId', value) }}>
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="materialTypeId">Material type</FieldLabel>
                    <FieldContent>
                      <Select value={field.state.value} onValueChange={field.handleChange} disabled={isLoadingMaterials || isMaterialsError || activeMaterials.length === 0}>
                        <SelectTrigger id="materialTypeId" className="w-full" aria-invalid={(field.state.meta.isTouched || form.state.isSubmitted) && field.state.meta.errors.length > 0}>
                          <SelectValue placeholder={isLoadingMaterials ? 'Loading materials...' : isMaterialsError ? 'Materials unavailable' : activeMaterials.length === 0 ? 'No active materials' : 'Select material'} />
                        </SelectTrigger>
                        <SelectContent>
                          {activeMaterials.map((material) => (
                            <SelectItem key={material.id} value={String(material.id)}>
                              {material.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isMaterialsError && (
                        <div className="flex items-center gap-2 text-sm text-destructive" role="alert">
                          <span>Unable to load materials.</span>
                          <Button type="button" variant="link" size="sm" className="h-auto px-0 text-destructive" onClick={() => void refetchMaterials()}>
                            Retry
                          </Button>
                        </div>
                      )}
                      {!isLoadingMaterials && !isMaterialsError && activeMaterials.length === 0 && (
                        <p className="text-sm text-muted-foreground">No active materials are available.</p>
                      )}
                      {(field.state.meta.isTouched || form.state.isSubmitted) && <FieldError>{getErrorMessage(field.state.meta.errors)}</FieldError>}
                    </FieldContent>
                  </Field>
                )}
              </form.Field>

              <form.Field name="quantityBrass" validators={{ onBlur: ({ value }) => getFieldError('quantityBrass', value), onChange: ({ value }) => getFieldError('quantityBrass', value) }}>
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="quantityBrass">Quantity (Brass)</FieldLabel>
                    <FieldContent>
                      <Input id="quantityBrass" type="number" min="0.01" step="0.01" value={field.state.value} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)} placeholder="0.00" aria-invalid={(field.state.meta.isTouched || form.state.isSubmitted) && field.state.meta.errors.length > 0} />
                      {(field.state.meta.isTouched || form.state.isSubmitted) && <FieldError>{getErrorMessage(field.state.meta.errors)}</FieldError>}
                    </FieldContent>
                  </Field>
                )}
              </form.Field>

              <form.Field name="supplierName">
                {(field) => (
                  <Field className="md:col-span-2">
                    <FieldLabel htmlFor="supplierName">Supplier name</FieldLabel>
                    <FieldContent>
                      <Input id="supplierName" value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} placeholder="Optional supplier name" />
                    </FieldContent>
                  </Field>
                )}
              </form.Field>

              <form.Field name="remarks">
                {(field) => (
                  <Field className="md:col-span-2">
                    <FieldLabel htmlFor="remarks">Remarks</FieldLabel>
                    <FieldContent>
                      <Textarea id="remarks" value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} placeholder="Optional notes" className="min-h-32" />
                    </FieldContent>
                  </Field>
                )}
              </form.Field>
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