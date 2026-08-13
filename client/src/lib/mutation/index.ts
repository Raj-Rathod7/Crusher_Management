import { apiClient } from "../common/api";
import type { AuthResponse, CreateCustomerPayload, CreateInvoicePayload, CreateTruckEntryPayload, Customer, Invoice, TruckEntry } from "../models";

export const login = async (username: string, password: string) => {
  return apiClient.post<AuthResponse>("/auth/login", {username, password}, {auth: false});
}

export const createCustomer = async (payload: CreateCustomerPayload) => {
  return apiClient.post<Customer>("/customers", payload);
}

export const updateCustomer = async (id: number | string, payload: CreateCustomerPayload) => {
  return apiClient.put<Customer>(`/customers/${id}`, payload);
}

export const createTruckEntry = async (payload: CreateTruckEntryPayload) => {
  return apiClient.post<TruckEntry>("/truck-entries", payload);
}

export const updateTruckEntry = async (id: number | string, payload: CreateTruckEntryPayload) => {
  return apiClient.put<TruckEntry>(`/truck-entries/${id}`, payload);
}

export const deleteTruckEntry = async (id: number | string) => {
  return apiClient.delete<void>(`/truck-entries/${id}`);
}

export const createSale = async (payload: CreateInvoicePayload) => {
  return apiClient.post<Invoice>("/invoices", payload);
}