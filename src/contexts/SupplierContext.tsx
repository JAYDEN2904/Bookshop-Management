import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Supplier, 
  SupplyOrder, 
  SupplyItem, 
  SupplierPayment, 
  SupplierLedgerEntry, 
  SupplierAnalytics,
  Book 
} from '../types';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface SupplierContextType {
  // Suppliers
  suppliers: Supplier[];
  isLoading: boolean;
  error: string | null;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => Promise<void>;
  editSupplier: (id: string, updates: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  getSupplierById: (id: string) => Supplier | undefined;
  
  // Supply Orders
  supplyOrders: SupplyOrder[];
  addSupplyOrder: (order: Omit<SupplyOrder, 'id' | 'createdAt'>) => Promise<void>;
  updateSupplyOrderStatus: (id: string, status: SupplyOrder['status']) => Promise<void>;
  getSupplyOrdersBySupplier: (supplierId: string) => SupplyOrder[];
  
  // Payments
  supplierPayments: SupplierPayment[];
  addSupplierPayment: (payment: Omit<SupplierPayment, 'id' | 'createdAt'>) => Promise<void>;
  getPaymentsBySupplier: (supplierId: string) => SupplierPayment[];
  
  // Ledger
  getSupplierLedger: (supplierId: string) => SupplierLedgerEntry[];
  
  // Analytics
  getSupplierAnalytics: (supplierId: string) => SupplierAnalytics;
  getAllSuppliersAnalytics: () => SupplierAnalytics[];
  
  // Utility
  calculateSupplierBalance: (supplierId: string) => number;
  getOverduePayments: () => SupplyOrder[];
  getUpcomingPayments: () => SupplyOrder[];
}

const SupplierContext = createContext<SupplierContextType | undefined>(undefined);

export const useSupplier = () => {
  const context = useContext(SupplierContext);
  if (!context) {
    throw new Error('useSupplier must be used within a SupplierProvider');
  }
  return context;
};

// Mock data for demonstration
const mockSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'NCERT Publications',
    contact: '+91 98765 43210',
    email: 'orders@ncert.gov.in',
    address: 'Sri Aurobindo Marg, New Delhi - 110016',
    balance: 25000,
    createdAt: '2024-01-01'
  },
  {
    id: '2',
    name: 'S Chand Publications',
    contact: '+91 87654 32109',
    email: 'sales@schand.com',
    address: 'Ramnagar, New Delhi - 110055',
    balance: -15000,
    createdAt: '2024-01-05'
  },
  {
    id: '3',
    name: 'Oxford University Press',
    contact: '+91 76543 21098',
    email: 'india@oup.com',
    address: 'YMCA Library Building, Jai Singh Road, New Delhi - 110001',
    balance: 8500,
    createdAt: '2024-01-10'
  }
];

const mockSupplyOrders: SupplyOrder[] = [
  {
    id: 'SO001',
    supplierId: '1',
    supplierName: 'NCERT Publications',
    items: [
      { bookId: '1', bookTitle: 'Mathematics Class 10', quantity: 50, costPrice: 200, total: 10000 },
      { bookId: '2', bookTitle: 'Science Class 10', quantity: 50, costPrice: 180, total: 9000 }
    ],
    totalAmount: 19000,
    invoiceNumber: 'INV-2024-001',
    supplyDate: '2024-01-15',
    expectedPaymentDate: '2024-02-15',
    status: 'received',
    notes: 'First quarter supplies',
    createdAt: '2024-01-15'
  },
  {
    id: 'SO002',
    supplierId: '2',
    supplierName: 'S Chand Publications',
    items: [
      { bookId: '3', bookTitle: 'English Grammar', quantity: 30, costPrice: 150, total: 4500 }
    ],
    totalAmount: 4500,
    invoiceNumber: 'INV-2024-002',
    supplyDate: '2024-01-20',
    expectedPaymentDate: '2024-02-20',
    status: 'pending',
    notes: 'Grammar books for English department',
    createdAt: '2024-01-20'
  }
];

const mockSupplierPayments: SupplierPayment[] = [
  {
    id: 'PAY001',
    supplierId: '1',
    supplierName: 'NCERT Publications',
    amount: 10000,
    paymentMethod: 'bank_transfer',
    reference: 'TXN123456',
    paymentDate: '2024-01-25',
    notes: 'Partial payment for January supplies',
    createdAt: '2024-01-25'
  },
  {
    id: 'PAY002',
    supplierId: '2',
    supplierName: 'S Chand Publications',
    amount: 8000,
    paymentMethod: 'cheque',
    reference: 'CHQ789012',
    paymentDate: '2024-01-22',
    notes: 'Payment for December supplies',
    createdAt: '2024-01-22'
  }
];

export const SupplierProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [supplyOrders, setSupplyOrders] = useState<SupplyOrder[]>(mockSupplyOrders);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>(mockSupplierPayments);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Supplier CRUD operations
  const addSupplier = async (supplier: Omit<Supplier, 'id' | 'createdAt'>) => {
    try {
      setIsLoading(true);
      const newSupplier: Supplier = {
        ...supplier,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      setSuppliers(prev => [...prev, newSupplier]);
      toast.success('Supplier added successfully');
    } catch (err) {
      setError('Failed to add supplier');
      toast.error('Failed to add supplier');
    } finally {
      setIsLoading(false);
    }
  };

  const editSupplier = async (id: string, updates: Partial<Supplier>) => {
    try {
      setIsLoading(true);
      setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
      toast.success('Supplier updated successfully');
    } catch (err) {
      setError('Failed to update supplier');
      toast.error('Failed to update supplier');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      setIsLoading(true);
      setSuppliers(prev => prev.filter(s => s.id !== id));
      toast.success('Supplier deleted successfully');
    } catch (err) {
      setError('Failed to delete supplier');
      toast.error('Failed to delete supplier');
    } finally {
      setIsLoading(false);
    }
  };

  const getSupplierById = (id: string) => {
    return suppliers.find(s => s.id === id);
  };

  // Supply Order operations
  const addSupplyOrder = async (order: Omit<SupplyOrder, 'id' | 'createdAt'>) => {
    try {
      setIsLoading(true);
      const newOrder: SupplyOrder = {
        ...order,
        id: `SO${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      setSupplyOrders(prev => [...prev, newOrder]);
      
      // Update supplier balance
      const supplier = getSupplierById(order.supplierId);
      if (supplier) {
        const newBalance = supplier.balance + order.totalAmount;
        editSupplier(order.supplierId, { balance: newBalance });
      }
      
      toast.success('Supply order created successfully');
    } catch (err) {
      setError('Failed to create supply order');
      toast.error('Failed to create supply order');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSupplyOrderStatus = async (id: string, status: SupplyOrder['status']) => {
    try {
      setIsLoading(true);
      setSupplyOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      toast.success('Order status updated successfully');
    } catch (err) {
      setError('Failed to update order status');
      toast.error('Failed to update order status');
    } finally {
      setIsLoading(false);
    }
  };

  const getSupplyOrdersBySupplier = (supplierId: string) => {
    return supplyOrders.filter(o => o.supplierId === supplierId);
  };

  // Payment operations
  const addSupplierPayment = async (payment: Omit<SupplierPayment, 'id' | 'createdAt'>) => {
    try {
      setIsLoading(true);
      const newPayment: SupplierPayment = {
        ...payment,
        id: `PAY${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      setSupplierPayments(prev => [...prev, newPayment]);
      
      // Update supplier balance
      const supplier = getSupplierById(payment.supplierId);
      if (supplier) {
        const newBalance = supplier.balance - payment.amount;
        editSupplier(payment.supplierId, { balance: newBalance });
      }
      
      toast.success('Payment recorded successfully');
    } catch (err) {
      setError('Failed to record payment');
      toast.error('Failed to record payment');
    } finally {
      setIsLoading(false);
    }
  };

  const getPaymentsBySupplier = (supplierId: string) => {
    return supplierPayments.filter(p => p.supplierId === supplierId);
  };

  // Ledger operations
  const getSupplierLedger = (supplierId: string): SupplierLedgerEntry[] => {
    const orders = getSupplyOrdersBySupplier(supplierId);
    const payments = getPaymentsBySupplier(supplierId);
    
    const ledger: SupplierLedgerEntry[] = [];
    let runningBalance = 0;

    // Add supply orders
    orders.forEach(order => {
      runningBalance += order.totalAmount;
      ledger.push({
        id: order.id,
        supplierId: order.supplierId,
        type: 'supply',
        reference: order.invoiceNumber || order.id,
        description: `Supply Order - ${order.items.length} items`,
        amount: order.totalAmount,
        balance: runningBalance,
        date: order.supplyDate
      });
    });

    // Add payments
    payments.forEach(payment => {
      runningBalance -= payment.amount;
      ledger.push({
        id: payment.id,
        supplierId: payment.supplierId,
        type: 'payment',
        reference: payment.reference,
        description: `Payment - ${payment.paymentMethod}`,
        amount: -payment.amount,
        balance: runningBalance,
        date: payment.paymentDate
      });
    });

    // Sort by date
    return ledger.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Analytics operations
  const getSupplierAnalytics = (supplierId: string): SupplierAnalytics => {
    const orders = getSupplyOrdersBySupplier(supplierId);
    const payments = getPaymentsBySupplier(supplierId);
    const supplier = getSupplierById(supplierId);
    
    const totalSupplies = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
    const outstandingBalance = supplier?.balance || 0;
    const averageOrderValue = orders.length > 0 ? totalSupplies / orders.length : 0;
    
    // Calculate on-time delivery rate (mock data)
    const onTimeDeliveryRate = orders.length > 0 ? 85 : 0;
    
    // Calculate reliability score based on various factors
    const reliabilityScore = Math.min(100, Math.max(0, 
      (onTimeDeliveryRate * 0.4) + 
      (orders.length > 0 ? 20 : 0) + 
      (outstandingBalance < 0 ? 40 : 0)
    ));

    const lastOrderDate = orders.length > 0 
      ? orders.sort((a, b) => new Date(b.supplyDate).getTime() - new Date(a.supplyDate).getTime())[0].supplyDate
      : '';

    return {
      totalSupplies,
      totalPayments,
      outstandingBalance,
      averageOrderValue,
      onTimeDeliveryRate,
      reliabilityScore,
      lastOrderDate,
      paymentHistory: {
        onTime: Math.floor(payments.length * 0.7),
        late: Math.floor(payments.length * 0.2),
        overdue: Math.floor(payments.length * 0.1)
      }
    };
  };

  const getAllSuppliersAnalytics = (): SupplierAnalytics[] => {
    return suppliers.map(supplier => getSupplierAnalytics(supplier.id));
  };

  // Utility functions
  const calculateSupplierBalance = (supplierId: string): number => {
    const supplier = getSupplierById(supplierId);
    return supplier?.balance || 0;
  };

  const getOverduePayments = (): SupplyOrder[] => {
    const today = new Date();
    return supplyOrders.filter(order => {
      if (!order.expectedPaymentDate || order.status !== 'received') return false;
      const dueDate = new Date(order.expectedPaymentDate);
      return dueDate < today;
    });
  };

  const getUpcomingPayments = (): SupplyOrder[] => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return supplyOrders.filter(order => {
      if (!order.expectedPaymentDate || order.status !== 'received') return false;
      const dueDate = new Date(order.expectedPaymentDate);
      return dueDate >= today && dueDate <= nextWeek;
    });
  };

  return (
    <SupplierContext.Provider value={{
      suppliers,
      isLoading,
      error,
      addSupplier,
      editSupplier,
      deleteSupplier,
      getSupplierById,
      supplyOrders,
      addSupplyOrder,
      updateSupplyOrderStatus,
      getSupplyOrdersBySupplier,
      supplierPayments,
      addSupplierPayment,
      getPaymentsBySupplier,
      getSupplierLedger,
      getSupplierAnalytics,
      getAllSuppliersAnalytics,
      calculateSupplierBalance,
      getOverduePayments,
      getUpcomingPayments
    }}>
      {children}
    </SupplierContext.Provider>
  );
}; 