export type AuthResponse = {
  token: string;
  type: string;
  username: string;
}

export type TruckEntry = {
  id: number;
  entryDate: string;
  truckNumber: string;
  materialTypeId: number | null;
  materialName: string | null;
  quantityBrass: number;
  supplierName: string | null;
  remarks: string | null;
  createdByUsername: string | null;
  createdAt: string;
  updatedAt: string;
}

export type Material = {
  id: number;
  name: string;
  isActive: boolean | null;
  createdAt: string;
}

export type CreateTruckEntryPayload = {
  entryDate: string;
  truckNumber: string;
  materialTypeId: number;
  quantityBrass: string;
  supplierName?: string;
  remarks?: string;
}

export type Customer = {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean | null;
  createdAt: string;
}

export type Invoice = {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string | null;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  status: string;
  remarks: string | null;
  createdByUsername: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateInvoicePayload = {
  invoiceNumber: string;
  invoiceDate: string;
  customer: {
    id: number;
  };
  totalAmount: number;
  amountPaid: number;
  balance: number;
  status: string;
  remarks?: string;
}

export type CreateCustomerPayload = {
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export type ExpenseCategory = {
  id: number;
  name: string;
  createdAt: string;
}

export type Expense = {
  id: number;
  expenseDate: string;
  categoryId: number;
  categoryName: string | null;
  amount: number;
  notes: string | null;
  createdByUsername: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateExpensePayload = {
  expenseDate: string;
  categoryId: number;
  amount: number;
  notes?: string;
}