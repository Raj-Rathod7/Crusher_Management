import { apiClient } from "../common/api"
import type { TruckEntry } from "../models"

export const truckEntryKeys = {
  all: ['truck-entries'] as const,
}

export const getAllTruckEntries = async () => {
  return apiClient.get<TruckEntry[]>('/truck-entries')
}
