export type AuthResponse = {
  token: string;
  type: string;
  username: string;
}

export type TruckEntry = {
  id: number;
  entryDate: string;
  truckNumber: string;
  materialName: string | null;
  quantityBrass: number;
  supplierName: string | null;
  remarks: string | null;
  createdByUsername: string | null;
  createdAt: string;
  updatedAt: string;
}