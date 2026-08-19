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
import { IconArrowLeft, IconCheck, IconCube, IconTruck, IconWeight } from '@tabler/icons-react'
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
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
          : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'

        return (
          <>
            <div className="flex items-start justify-between gap-3 border-b border-border/80 pb-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Load ticket</p>
                <h2 className="mt-1 text-lg font-semibold tracking-normal">Truck entry</h2>
              </div>
              <Badge variant="outline" className={entryStatusClassName}>{entryStatus}</Badge>
            </div>

            <div className="mt-4 border-l-2 border-primary bg-primary/5 py-3 pr-3 pl-4">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary">
                <IconWeight className="size-4" />
                Recorded quantity
              </div>
              <div className="mt-1 flex items-end justify-between gap-3">
                <span className="text-3xl font-semibold tracking-normal text-foreground">
                  {values.quantityBrass.trim() || '0.00'}
                </span>
                <span className="mb-1 text-sm font-medium text-muted-foreground">brass</span>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <IconTruck className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Truck</p>
                  <p className="mt-1 truncate text-sm font-semibold">{values.truckNumber.trim() || 'Not set'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <IconCube className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Material</p>
                  <p className="mt-1 truncate text-sm font-semibold">{selectedMaterial?.name ?? 'Not set'}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 border-y border-border/80 py-1">
              <SummaryRow label="Date" value={values.entryDate || 'Not set'} />
              <SummaryRow label="Supplier" value={values.supplierName.trim() || 'Not set'} />
              <SummaryRow label="Remarks" value={values.remarks.trim() || 'None'} />
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs leading-5 text-muted-foreground">
              <IconCheck className="size-4 shrink-0 text-primary" />
              {isReadyToSave ? 'Entry is ready to save.' : 'Complete the required entry details to save.'}
            </div>
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
            <FieldGroup className="grid gap-5 md:grid-cols-2">
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
                        <Input id="truckNumber" value={field.state.value} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)} placeholder="MH 31 AB 1234" aria-invalid={(field.state.meta.isTouched || form.state.isSubmitted) && field.state.meta.errors.length > 0} />
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
                      <FieldLabel htmlFor="quantityBrass">Quantity (brass)</FieldLabel>
                      <FieldContent>
                        <Input id="quantityBrass" type="number" min="0.01" step="0.01" value={field.state.value} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)} placeholder="0.00" className="text-base font-semibold tabular-nums" aria-invalid={(field.state.meta.isTouched || form.state.isSubmitted) && field.state.meta.errors.length > 0} />
                        {(field.state.meta.isTouched || form.state.isSubmitted) && <FieldError>{getErrorMessage(field.state.meta.errors)}</FieldError>}
                      </FieldContent>
                    </Field>
                  )}
                </form.Field>

                <div aria-hidden="true" className="border-t border-border/70 md:col-span-2" />

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
                        <Textarea id="remarks" value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} placeholder="Optional delivery notes" className="min-h-28" />
                      </FieldContent>
                    </Field>
                  )}
                </form.Field>
            </FieldGroup>

            <div className="flex flex-col-reverse gap-3 border-t border-border/80 pt-5 sm:flex-row sm:items-center sm:justify-end">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => navigate({ to: '/truck-entry' })}>
                <IconArrowLeft />
                Back to Truck Entry
              </Button>
              <Button disabled={isSubmitting} type="submit" className="w-full sm:w-auto">
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