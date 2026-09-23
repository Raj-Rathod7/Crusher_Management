import { Badge } from '#/components/ui/badge'
import { FormPageLayout } from '#/components/form-page-layout'
import { Button } from '#/components/ui/button'
import { Separator } from '#/components/ui/separator'
import { getSaleById, salesKeys } from '#/lib/query'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { IconPencil } from '@tabler/icons-react'
import { Truck } from 'lucide-react'

export const Route = createFileRoute('/_app/sales/$saleId/')({
  component: RouteComponent,
})

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value)
}

function RouteComponent() {
  const { saleId } = Route.useParams()

  const saleQuery = useQuery({
    queryKey: salesKeys.detail(saleId),
    queryFn: () => getSaleById(saleId),
    retry: false,
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
            <DetailField label="Created by" value={sale.createdByUsername ?? '-'} />
            <DetailField label="Total" value={formatCurrency(sale.totalAmount)} />
            <DetailField label="Payment received" value={sale.payment ? formatCurrency(sale.payment.amount) : 'Not received'} />
            <DetailField label="Remarks" value={sale.remarks || '-'} />
          </dl>
          <Separator />
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium">Linked receipt</h3>
              <p className="text-sm text-muted-foreground">Receipt recorded with this invoice.</p>
            </div>
            {sale.payment ? (
              <div className="grid gap-4 rounded-md border p-4 sm:grid-cols-3">
                <DetailField label="Receipt date" value={sale.payment.paymentDate} />
                <DetailField label="Amount" value={formatCurrency(sale.payment.amount)} />
                <DetailField label="Payment mode" value={sale.payment.paymentMode ?? '-'} />
              </div>
            ) : (
              <div className="rounded-md border px-4 py-8 text-center text-sm text-muted-foreground">
                No payment received for this invoice.
              </div>
            )}
          </div>
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
        </div>
      )}
    </FormPageLayout>

  )
}

function DetailField({
  label,
  value,
  linkTo,
}: {
  label: string
  value: string
  linkTo?: { to: string; params: Record<string, string> }
}) {
  const content = <>{value}</>

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
