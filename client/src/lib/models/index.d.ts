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
  quantity?: number;
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
  pendingBalance?: number;
  availableCredit?: number;
  isActive: boolean | null;
  createdAt: string;
}

export type Invoice = {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string | null;
  customerId: number | null;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  status: string;
  remarks: string | null;
  createdByUsername: string | null;
  createdAt: string;
  updatedAt: string;
  invoiceItems: InvoiceItem[];
  appliedReceipts: Payment[];
  payments: Payment[];
  creditApplied?: number;
  cashPaid?: number;
  customerAvailableCreditAfterTxn?: number;
}

export type InvoiceItem = {
  id: number;
  materialTypeId: number | null;
  materialName: string | null;
  quantityBrass: number;
  rate: number;
  amount: number;
  truckNumber: string | null;
}

export type CreateInvoicePayload = {
  invoiceNumber: string;
  invoiceDate: string;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  status: string;
  remarks?: string;
  customerId: number;
  invoiceItems: InvoiceItem[];
  applyCredit?: boolean;
  creditToApply?: number;
  cashPaidNow?: number;
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

export type Payment = {
  id: number;
  paymentDate: string;
  invoiceNumber: string | null;
  invoiceId: number | null;
  customerName: string | null;
  customerId: number | null;
  amount: number;
  paymentMode: string | null;
  chequeNumber: string | null;
  notes: string | null;
  entryType: string | null;
  direction: string | null;
  receiptNumber: string | null;
  externalRef: string | null;
  sourceReceiptId: number | null;
  sourceReceiptNumber: string | null;
  createdByUsername: string | null;
}

export type CreateAdvanceReceiptPayload = {
  customerId: number;
  amount: number;
  paymentDate: string;
  paymentMode?: string;
  receiptNumber?: string;
  externalRef?: string;
  notes?: string;
}

export type RecordInvoicePaymentPayload = {
  amount: number;
  paymentDate: string;
  paymentMode?: string;
  chequeNumber?: string;
  externalRef?: string;
  notes?: string;
}

export type AdvanceReceiptResponse = {
  payment: Payment;
  customerAvailableCredit: number;
}

export type CustomerSummaryResponse = {
  customer: Customer;
  recentPayments: Payment[];
  recentInvoices: Invoice[];
}