import { apiClient } from "../common/api"
import type { Customer, Invoice, Material, TruckEntry } from "../models"

export const truckEntryKeys = {
  all: ['truck-entries'] as const,
  detail: (id: number | string) => ['truck-entries', String(id)] as const,
}

export const materialKeys = {
  all: ['materials'] as const,
}

export const salesKeys = {
  all: ['sales'] as const,
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

export const getAllMaterials = async () => {
  return apiClient.get<Material[]>('/materials')
}

export const getAllSales = async () => {
  return apiClient.get<Invoice[]>('/invoices')
}

export const getAllCustomers = async () => {
  return apiClient.get<Customer[]>('/customers')
}

export const getCustomerById = async (id: number | string) => {
  return apiClient.get<Customer>(`/customers/${id}`)
}
