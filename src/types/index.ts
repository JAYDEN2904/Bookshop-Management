export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'cashier';
  createdAt: string;
  lastActive?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  class: string;
  subject: string;
  type: 'textbook' | 'workbook' | 'reference' | 'other';
  sellingPrice: number;
  costPrice: number;
  stock: number;
  minStock: number;
  supplier: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockHistory {
  id: string;
  bookId: string;
  type: 'addition' | 'reduction' | 'wastage' | 'return';
  quantity: number;
  previousStock: number;
  newStock: number;
  reference?: string;
  note?: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface Student {
  id: string;
  name: string;
  class: string;
  studentId: string; // Add this field to store the actual student ID from Excel
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  address: string;
  balance: number;
  createdAt: string;
}

export interface Purchase {
  id: string;
  studentId: string;
  studentName: string;
  items: PurchaseItem[];
  total: number;
  discount: number;
  paymentMode: 'cash' | 'card' | 'upi';
  cashierId: string;
  cashierName: string;
  createdAt: string;
}

export interface PurchaseItem {
  bookId: string;
  title: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Bundle {
  id: string;
  class: string;
  books: BundleItem[];
  totalPrice: number;
}

export interface BundleItem {
  bookId: string;
  title: string;
  quantity: number;
  price: number;
}

export interface SupplyOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  items: SupplyItem[];
  totalAmount: number;
  invoiceNumber?: string;
  supplyDate: string;
  expectedPaymentDate?: string;
  status: 'pending' | 'received' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export interface SupplyItem {
  bookId: string;
  bookTitle: string;
  quantity: number;
  costPrice: number;
  total: number;
}

export interface SupplierPayment {
  id: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'cheque' | 'upi';
  reference: string;
  paymentDate: string;
  notes?: string;
  createdAt: string;
}

export interface SupplierLedgerEntry {
  id: string;
  supplierId: string;
  type: 'supply' | 'payment';
  reference: string;
  description: string;
  amount: number;
  balance: number;
  date: string;
}

export interface SupplierAnalytics {
  totalSupplies: number;
  totalPayments: number;
  outstandingBalance: number;
  averageOrderValue: number;
  onTimeDeliveryRate: number;
  reliabilityScore: number;
  lastOrderDate: string;
  paymentHistory: {
    onTime: number;
    late: number;
    overdue: number;
  };
}