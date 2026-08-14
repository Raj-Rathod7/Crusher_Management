import { SalesForm } from '#/components/sales-form'
import type { CreateInvoicePayload } from '#/lib/models'
import { updateSale } from '#/lib/mutation'
import { getAllCustomers, getSaleById, salesKeys, customerKeys } from '#/lib/query'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import * as React from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_app/sales/$saleId/edit')({
  component: RouteComponent,
})

function RouteComponent() {
  const { saleId } = Route.useParams()
  const navigate = useNavigate()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: sale } = useQuery({
    queryKey: salesKeys.detail(saleId),
    queryFn: () => getSaleById(saleId),
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  })

  const { data: customers = [] } = useQuery({
    queryKey: customerKeys.all,
    queryFn: getAllCustomers,
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  })

  const updateMutation = useMutation({
    mutationFn: (payload: CreateInvoicePayload) => updateSale(saleId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: salesKeys.all }),
        queryClient.invalidateQueries({ queryKey: salesKeys.detail(saleId) }),
        queryClient.refetchQueries({ queryKey: salesKeys.all, type: 'all' }),
        queryClient.refetchQueries({ queryKey: salesKeys.detail(saleId), type: 'all' }),
        router.invalidate(),
      ])
      toast.success('Sale updated.')
      navigate({ to: '/sales' })
    },
    onError: () => {
      toast.error('Failed to update sale.')
    },
  })

  const customerId = React.useMemo(() => {
    if (!sale?.customerName || customers.length === 0) return ''
    const customer = customers.find(
      (c) => c.name.toLowerCase() === sale.customerName?.toLowerCase()
    )
    return customer ? String(customer.id) : ''
  }, [sale?.customerName, customers])

  if (!sale) {
    return null
  }

  return (
    <SalesForm
      title="Edit Sale"
      description="Update invoice details, customer, amount, payment, and status."
      backLabel="Back to sales"
      submitLabel="Update sale"
      isSubmitting={updateMutation.isPending}
      initialValues={{
        invoiceNumber: sale.invoiceNumber,
        invoiceDate: sale.invoiceDate,
        customerId,
        totalAmount: String(sale.totalAmount),
        amountPaid: String(sale.amountPaid),
        remarks: sale.remarks || '',
      }}
      onSubmit={updateMutation.mutate}
      showSummary={true}
      variant="page"
    />
  )
}
