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
  type: 'PURCHASE' | 'SALE';
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
  remarks: string | null;
  createdByUsername: string | null;
  createdAt: string;
  updatedAt: string;
  invoiceItems: InvoiceItem[];
  payment: Payment | null;
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
  paymentAmount?: number;
  remarks?: string;
  customerId: number;
  invoiceItems: InvoiceItem[];
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
  truckNumber: string | null;
  notes: string | null;
  createdByUsername: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateExpensePayload = {
  expenseDate: string;
  categoryId: number;
  amount: number;
  truckNumber?: string;
  notes?: string;
}

export type ExpenseVehicleSummary = {
  truckNumber: string;
  totalAmount: number;
  expenseCount: number;
}

export type Payment = {
  id: number;
  paymentDate: string;
  customerName: string | null;
  customerId: number | null;
  amount: number;
  paymentMode: string | null;
  chequeNumber: string | null;
  notes: string | null;
  entryType: string | null;
  externalRef: string | null;
  createdByUsername: string | null;
  invoiceId: number | null;
  invoiceNumber: string | null;
}

export type CreateCustomerPaymentPayload = {
  customerId: number;
  amount: number;
  paymentDate: string;
  paymentMode?: string;
  externalRef?: string;
  notes?: string;
}

export type CustomerPaymentPayload = {
  amount: number;
  paymentDate: string;
  paymentMode?: string;
  chequeNumber?: string;
  externalRef?: string;
  notes?: string;
}

export type CustomerPaymentResponse = Payment;

export type CustomerSummaryResponse = {
  customer: Customer;
  recentPayments: Payment[];
  recentInvoices: Invoice[];
  ledger: CustomerLedgerEntry[];
}

export type CustomerLedgerEntry = {
  entryDate: string;
  entryType: 'SALE' | 'CUSTOMER_PAYMENT' | string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export type SalesPoint = {
  date: string;
  invoiceCount: number;
  totalAmount: number;
}

export type ExpenseCategoryPoint = {
  category: string;
  totalAmount: number;
}

export type InwardPoint = {
  date: string;
  truckCount: number;
  totalQtyBrass: number;
}

export type MaterialSalesPoint = {
  material: string;
  quantityBrass: number;
  totalRevenue: number;
}

export type DashboardChartsResponse = {
  salesByDate: SalesPoint[];
  expensesByCategory: ExpenseCategoryPoint[];
  truckInwardByDate: InwardPoint[];
  materialWiseSales: MaterialSalesPoint[];
}