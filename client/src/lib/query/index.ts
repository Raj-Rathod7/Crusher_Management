import { apiClient } from "../common/api"
import type { Customer, CustomerSummaryResponse, DashboardChartsResponse, Expense, ExpenseCategory, ExpenseVehicleSummary, Invoice, Material, Payment, TruckEntry } from "../models"

export const truckEntryKeys = {
  all: ['truck-entries'] as const,
  detail: (id: number | string) => ['truck-entries', String(id)] as const,
}

export const materialKeys = {
  all: ['materials'] as const,
  list: (filters: { type?: 'PURCHASE' | 'SALE' } = {}) => ['materials', filters] as const,
}

export const salesKeys = {
  all: ['sales'] as const,
  detail: (id: number | string) => ['sales', String(id)] as const,
  pending: ['sales', 'pending'] as const,
}

export const customerKeys = {
  all: ['customers'] as const,
  detail: (id: number | string) => ['customers', String(id)] as const,
}

export const getAllTruckEntries = async () => {
  return apiClient.get<TruckEntry[]>('/truck-entries')
}

export const getTruckEntryById = async (id: number | string) => {
  return apiClient.get<TruckEntry>(`/truck-entries/${id}`)
}

export const getAllMaterials = async (filters: { type?: 'PURCHASE' | 'SALE' } = {}) => {
  const params = new URLSearchParams()
  if (filters.type) params.set('type', filters.type)
  const query = params.toString()
  return apiClient.get<Material[]>(`/materials${query ? `?${query}` : ''}`)
}

export const getAllSales = async () => {
  return apiClient.get<Invoice[]>('/invoices')
}

export const getSaleById = async (id: number | string) => {
  return apiClient.get<Invoice>(`/invoices/${id}`)
}

export const getPendingTotalSales = async () => {
  return apiClient.get<Invoice[]>('/invoices/pending')
}

export const getNextInvoiceNumber = async () => {
  const { invoiceNumber } = await apiClient.get<{ invoiceNumber: string }>('/invoices/next-number')
  return invoiceNumber
}

export const getAllCustomers = async () => {
  return apiClient.get<Customer[]>('/customers')
}

export const getCustomerById = async (id: number | string) => {
  return apiClient.get<Customer>(`/customers/${id}`)
}

export const expenseKeys = {
  all: ['expenses'] as const,
  detail: (id: number | string) => ['expenses', String(id)] as const,
}

export const expenseCategoryKeys = {
  all: ['expense-categories'] as const,
}

export const getAllExpenses = async () => {
  return apiClient.get<Expense[]>('/expenses')
}

export const getExpenseById = async (id: number | string) => {
  return apiClient.get<Expense>(`/expenses/${id}`)
}

export const getAllExpenseCategories = async () => {
  return apiClient.get<ExpenseCategory[]>('/expenses/categories')
}

export const getExpenseVehicleSummary = async (filters: { dateFrom?: string; dateTo?: string } = {}) => {
  const params = new URLSearchParams()
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.set('dateTo', filters.dateTo)
  const query = params.toString()
  return apiClient.get<ExpenseVehicleSummary[]>(`/expenses/vehicle-summary${query ? `?${query}` : ''}`)
}

export const receiptKeys = {
  all: ['receipts'] as const,
  list: (filters: { customerId?: number | string; dateFrom?: string; dateTo?: string }) =>
    ['receipts', filters] as const,
}

export const getAllReceipts = async (filters: { customerId?: number | string; dateFrom?: string; dateTo?: string } = {}) => {
  const params = new URLSearchParams()
  if (filters.customerId) params.set('customerId', String(filters.customerId))
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.set('dateTo', filters.dateTo)
  const query = params.toString()
  return apiClient.get<Payment[]>(`/payments${query ? `?${query}` : ''}`)
}

export const getPaymentById = async (id: number | string) => {
  return apiClient.get<Payment>(`/payments/${id}`)
}

export const getCustomerSummary = async (id: number | string) => {
  return apiClient.get<CustomerSummaryResponse>(`/customers/${id}/summary`)
}

export const customerSummaryKeys = {
  detail: (id: number | string) => ['customer-summary', String(id)] as const,
}

export const dashboardKeys = {
  summary: (filters: { dateFrom?: string; dateTo?: string } = {}) => ['dashboard', filters] as const,
  charts: (filters: { dateFrom?: string; dateTo?: string } = {}) => ['dashboard', 'charts', filters] as const,
}

export const getDashboardSummary = async (filters: { dateFrom?: string; dateTo?: string } = {}) => {
  const params = new URLSearchParams()
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.set('dateTo', filters.dateTo)
  const query = params.toString()
  return apiClient.get(`/dashboard${query ? `?${query}` : ''}`)
}

export const getDashboardCharts = async (filters: { dateFrom?: string; dateTo?: string } = {}) => {
  const params = new URLSearchParams()
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.set('dateTo', filters.dateTo)
  const query = params.toString()
  return apiClient.get<DashboardChartsResponse>(`/dashboard/charts${query ? `?${query}` : ''}`)
}
