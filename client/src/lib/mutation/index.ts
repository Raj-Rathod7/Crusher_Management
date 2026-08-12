import { apiClient } from "../common/api";
import type { AuthResponse, CreateInvoicePayload, CreateTruckEntryPayload, Invoice, TruckEntry } from "../models";

export const login = async (username: string, password: string) => {
  return apiClient.post<AuthResponse>("/auth/login", {username, password}, {auth: false});
}

export const createTruckEntry = async (payload: CreateTruckEntryPayload) => {
  return apiClient.post<TruckEntry>("/truck-entries", payload);
}

export const createSale = async (payload: CreateInvoicePayload) => {
  return apiClient.post<Invoice>("/invoices", payload);
}