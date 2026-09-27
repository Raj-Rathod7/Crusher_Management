import type { QueryClient } from '@tanstack/react-query'
import { businessSettingsKeys, customerKeys, getBusinessSettings, getCustomerById } from '#/lib/query'
import { exportInvoiceToPdf } from '#/lib/table-export'
import type { Invoice } from '#/lib/models'

export async function downloadInvoicePdf(invoice: Invoice, queryClient: QueryClient) {
  const [businessSettings, customer] = await Promise.all([
    queryClient.fetchQuery({
      queryKey: businessSettingsKeys.detail,
      queryFn: getBusinessSettings,
      staleTime: 5 * 60 * 1000,
    }),
    invoice.customerId
      ? queryClient.fetchQuery({
          queryKey: customerKeys.detail(invoice.customerId),
          queryFn: () => getCustomerById(invoice.customerId!),
          staleTime: 5 * 60 * 1000,
        })
      : Promise.resolve(undefined),
  ])

  const filename = `invoice-${invoice.invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '-')}`
  await exportInvoiceToPdf(invoice, customer, filename, businessSettings)
}