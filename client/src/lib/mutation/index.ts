import { apiClient } from "../common/api";
import type { AuthResponse, CreateCustomerPayload, CreateCustomerPaymentPayload, CreateExpensePayload, CreateInvoicePayload, CreateTruckEntryPayload, Customer, CustomerPaymentPayload, CustomerPaymentResponse, Expense, Invoice, TruckEntry } from "../models";

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

export const updateSale = async (id: number | string, payload: CreateInvoicePayload) => {
  return apiClient.put<Invoice>(`/invoices/${id}`, payload);
}

export const deleteSale = async (id: number | string) => {
  return apiClient.delete<void>(`/invoices/${id}`);
}

export const createExpense = async (payload: CreateExpensePayload) => {
  return apiClient.post<Expense>("/expenses", payload);
}

export const updateExpense = async (id: number | string, payload: CreateExpensePayload) => {
  return apiClient.put<Expense>(`/expenses/${id}`, payload);
}

export const deleteExpense = async (id: number | string) => {
  return apiClient.delete<void>(`/expenses/${id}`);
}

export const createCustomerPayment = async (payload: CreateCustomerPaymentPayload) => {
  return apiClient.post<CustomerPaymentResponse>(`/customers/${payload.customerId}/payments`, payload);
}

export const recordCustomerPayment = async (customerId: number | string, payload: CustomerPaymentPayload) => {
  return apiClient.post<CustomerPaymentResponse>(`/customers/${customerId}/payments`, payload);
}

export const updateCustomerPayment = async (id: number | string, payload: CustomerPaymentPayload) => {
  return apiClient.put<CustomerPaymentResponse>(`/payments/${id}`, payload);
}

export const deleteCustomerPayment = async (id: number | string) => {
  return apiClient.delete<void>(`/payments/${id}`);
}
