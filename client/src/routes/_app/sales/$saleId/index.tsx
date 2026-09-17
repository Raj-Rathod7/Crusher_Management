import { Badge } from '#/components/ui/badge'
import { ConfigurableDataTable } from '@/components/data-table'
import { FormPageLayout } from '#/components/form-page-layout'
import { RecordPaymentForm, type RecordPaymentFormValues } from '#/components/record-payment-form'
import { Button } from '#/components/ui/button'
import { Separator } from '#/components/ui/separator'
import { getSaleById, salesKeys } from '#/lib/query'
import { recordInvoicePayment } from '#/lib/mutation'
import type { Payment } from '#/lib/models'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { IconCircleCheck, IconCircleDashedCheck, IconCircleLetterX, IconPencil } from '@tabler/icons-react'
import { Truck } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_app/sales/$saleId/')({
  component: RouteComponent,
})

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value)
}

function getStatusClass(status: string) {
  const normalizedStatus = status.toUpperCase()
  if (normalizedStatus === 'PAID') {
    return 'text-green-700' as const
  }
  if (normalizedStatus === 'PARTIAL') {
    return 'text-yellow-700' as const
  }
  return 'text-orange-700' as const
}

function getStatusIcon(status: string) {
  const normalizedStatus = status.toUpperCase()
  const className = `${getStatusClass(status)} mr-2`
  if (normalizedStatus === 'PAID') {
    return <IconCircleCheck className={className} />
  }
  if (normalizedStatus === 'PARTIAL') {
    return <IconCircleDashedCheck className={className} />
  }
  return <IconCircleLetterX className={className} />
}

function formatPaymentType(payment: Payment) {
  if (payment.entryType === 'CREDIT_APPLIED') {
    return 'Credit applied'
  }
  if (payment.notes === 'Recorded at invoice creation') {
    return 'Initial payment'
  }
  return 'Direct payment'
}

function formatPaymentDetails(payment: Payment) {
  if (payment.entryType === 'CREDIT_APPLIED') {
    return payment.sourceReceiptNumber ? `From receipt ${payment.sourceReceiptNumber}` : 'Pooled credit'
  }
  const mode = payment.paymentMode ?? 'cash'
  return payment.chequeNumber ? `${mode} (cheque #${payment.chequeNumber})` : mode
}

function RouteComponent() {
  const { saleId } = Route.useParams()
  const queryClient = useQueryClient()

  const saleQuery = useQuery({
    queryKey: salesKeys.detail(saleId),
    queryFn: () => getSaleById(saleId),
    retry: false,
  })

  const recordPaymentMutation = useMutation({
    mutationFn: (payload: RecordPaymentFormValues) => recordInvoicePayment(saleId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: salesKeys.all }),
        queryClient.invalidateQueries({ queryKey: salesKeys.detail(saleId) }),
      ])
      toast.success('Payment recorded.')
    },
    onError: (mutationError: unknown) => {
      const message = mutationError instanceof Error ? mutationError.message : 'Failed to record payment.'
      toast.error(message)
    },
  })

  const sale = saleQuery.data
  const invoiceItems = sale?.invoiceItems ?? []

  return (
    <FormPageLayout
      title={sale ? `Invoice ${sale.invoiceNumber}` : 'Invoice details'}
      description="Complete invoice record and the material included in this sale."
      backLabel="Back to sales"
      backTo="/sales"
      badge="Invoice"
    >
      {sale ? (
        <div className="mb-4 flex justify-end">
          <Button asChild size="sm" variant="outline">
            <Link to="/sales/$saleId/edit" params={{ saleId }}>
              <IconPencil />
              Edit
            </Link>
          </Button>
        </div>
      ) : null}

      {saleQuery.isLoading ? (
        <div className="py-10 text-center text-sm text-muted-foreground">Loading invoice details...</div>
      ) : saleQuery.isError || !sale ? (
        <div className="py-10 text-center text-sm text-destructive">Unable to load this invoice.</div>
      ) : (
        <div className="space-y-6">
          <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
            <DetailField label="Invoice date" value={sale.invoiceDate} />
            <DetailField
              label="Customer"
              value={sale.customerName ?? '-'}
              linkTo={sale.customerId ? { to: '/customer/$customerId', params: { customerId: String(sale.customerId) } } : undefined}
            />
            <DetailField label="Status" isBadge value={sale.status} />
            <DetailField label="Created by" value={sale.createdByUsername ?? '-'} />
            <DetailField label="Total" value={formatCurrency(sale.totalAmount)} />
            <DetailField label="Paid" value={formatCurrency(sale.amountPaid)} />
            <DetailField label="Balance" value={formatCurrency(sale.balance)} />
            <DetailField label="Remarks" value={sale.remarks || '-'} />
          </dl>
          {sale.balance > 0 && (
            <RecordPaymentSection
              balance={sale.balance}
              isSubmitting={recordPaymentMutation.isPending}
              onSubmit={(payload) => recordPaymentMutation.mutate(payload)}
            />
          )}
          <Separator />
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium">Invoice item</h3>
              <p className="text-sm text-muted-foreground">Material billed on this invoice.</p>
            </div>
            {invoiceItems.length === 0 ? (
              <div className="rounded-md border px-4 py-8 text-center text-sm text-muted-foreground">
                No invoice item recorded.
              </div>
            ) : (
              <div className="space-y-3">
                {invoiceItems.map((item) => (
                  <div
                    key={item.id}
                    className="grid gap-4 rounded-md border p-4 sm:grid-cols-2 lg:grid-cols-4"
                  >
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Material</p>
                      <p className="mt-1 truncate text-sm font-medium">{item.materialName ?? '-'}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Truck</p>
                      <div className="mt-1">
                        {item.truckNumber ? (
                          <Badge variant="secondary" className={`uppercase p-3 font-bold`}>
                            <Truck className="mr-2" />
                            {item.truckNumber}
                          </Badge>
                        ) : (
                          <p className="text-sm font-medium">-</p>
                        )}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Quantity x Rate</p>
                      <p className="mt-1 text-sm font-medium">
                        {item.quantityBrass} &times; {formatCurrency(item.rate)}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Amount</p>
                      <p className="mt-1 text-sm font-semibold">{formatCurrency(item.amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Separator />
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium">Payments</h3>
              <p className="text-sm text-muted-foreground">
                Every payment recorded against this invoice, including credit applied and direct payments.
              </p>
            </div>
            {sale.payments.length === 0 ? (
              <div className="rounded-md border px-4 py-8 text-center text-sm text-muted-foreground">
                No payments have been recorded for this invoice.
              </div>
            ) : (
              <ConfigurableDataTable
                data={sale.payments}
                columns={[
                  {
                    accessorKey: 'paymentDate',
                    header: 'Date',
                  },
                  {
                    id: 'type',
                    header: 'Type',
                    cell: ({ row }) => (
                      <Badge variant="outline" className="capitalize">
                        {formatPaymentType(row.original)}
                      </Badge>
                    ),
                  },
                  {
                    accessorKey: 'amount',
                    header: 'Amount',
                    cell: ({ row }) => formatCurrency(row.original.amount),
                  },
                  {
                    id: 'details',
                    header: 'Details',
                    cell: ({ row }) => formatPaymentDetails(row.original),
                  },
                ]}
                getRowId={(row) => `${row.id ?? 'initial'}-${row.paymentDate}-${row.amount}`}
                enableColumnVisibility={false}
                enablePagination={false}
                enableSorting={false}
                className="w-full"
              />
            )}
            {sale.payments.length > 0 && (
              <div className="flex justify-end text-sm font-medium">
                Total paid: {formatCurrency(sale.payments.reduce((sum, payment) => sum + payment.amount, 0))}
              </div>
            )}
          </div>
        </div>
      )}
    </FormPageLayout>

  )
}

function RecordPaymentSection({
  balance,
  isSubmitting,
  onSubmit,
}: {
  balance: number
  isSubmitting: boolean
  onSubmit: (payload: RecordPaymentFormValues) => void
}) {
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <div className="flex items-center justify-between rounded-md border border-dashed p-4">
        <p className="text-sm text-muted-foreground">Outstanding balance of {formatCurrency(balance)}.</p>
        <Button size="sm" onClick={() => setIsOpen(true)}>
          Record payment
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-md border p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Record payment</p>
      </div>
      <RecordPaymentForm
        balance={balance}
        isSubmitting={isSubmitting}
        onCancel={() => setIsOpen(false)}
        onSubmit={(payload) => {
          onSubmit(payload)
          setIsOpen(false)
        }}
      />
    </div>
  )
}

function DetailField({
  label,
  value,
  isBadge = false,
  linkTo,
}: {
  label: string
  value: string
  isBadge?: boolean
  linkTo?: { to: string; params: Record<string, string> }
}) {
  const content = isBadge ? (
    <Badge variant="outline" className={`capitalize border p-3 items-center justify-start font-bold`}>
      {getStatusIcon(value)}
      {value}
    </Badge>
  ) : (
    <>{value}</>
  )

  return (
    <div className="min-w-0">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 truncate text-sm font-medium text-foreground">
        {linkTo ? (
          <Link to={linkTo.to} params={linkTo.params} className="text-primary hover:underline">
            {content}
          </Link>
        ) : (
          content
        )}
      </dd>
    </div>
  )
}
