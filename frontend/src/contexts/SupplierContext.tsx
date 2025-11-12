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
      { bookId: '1', bookTitle: 'Mathematics Basic 9', quantity: 50, costPrice: 200, total: 10000 },
      { bookId: '2', bookTitle: 'Science Basic 9', quantity: 50, costPrice: 180, total: 9000 }
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

<<<<<<< Updated upstream
  // Supplier CRUD operations
  const addSupplier = async (supplier: Omit<Supplier, 'id' | 'createdAt'>) => {
    try {
      setIsLoading(true);
      const newSupplier: Supplier = {
        ...supplier,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
=======
  // Load suppliers from Supabase
  const loadSuppliers = async (): Promise<Supplier[]> => {
    try {
      setError(null);
      const { data: suppliersData, error: fetchError } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching suppliers:', fetchError);
        setError('Failed to load suppliers');
        return [];
      }

      // Map Supabase field names to Supplier interface
      // Database uses 'phone' but frontend uses 'contact'
      // Database doesn't have 'balance' column, so default to 0
      const mappedSuppliers: Supplier[] = (suppliersData || []).map(supplier => ({
        id: supplier.id,
        name: supplier.name,
        contact: supplier.phone || supplier.contact || '', // Map phone to contact
        email: supplier.email || '',
        address: supplier.address || '',
        balance: supplier.balance || 0, // Default to 0 if balance doesn't exist
        createdAt: supplier.created_at
      }));

      setSuppliers(mappedSuppliers);
      return mappedSuppliers;
    } catch (error: any) {
      console.error('Failed to load suppliers:', error);
      setError(error.message || 'Failed to load suppliers');
      return [];
    }
  };

  // Load supply orders from Supabase
  const loadSupplyOrders = async (suppliersList?: Supplier[]) => {
    try {
      const { data: ordersData, error: fetchError } = await supabase
        .from('supply_orders')
        .select(`
          *,
          supply_order_items (
            id,
            book_id,
            quantity,
            cost_price,
            total,
            books (
              id,
              subject,
              title
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching supply orders:', fetchError);
        // Don't throw error if table doesn't exist yet (first time setup)
        if (fetchError.message?.includes('does not exist')) {
          return;
        }
        return;
      }

      // Use provided suppliers list or current suppliers state
      const suppliersToUse = suppliersList || suppliers;

      // Map Supabase data to SupplyOrder interface
      const mappedOrders: SupplyOrder[] = (ordersData || []).map(order => {
        const items: SupplyItem[] = (order.supply_order_items || []).map((item: any) => ({
          bookId: item.book_id,
          bookTitle: item.books?.subject || item.books?.title || 'Unknown Book',
          quantity: item.quantity,
          costPrice: Number(item.cost_price),
          total: Number(item.total)
        }));

        const supplier = suppliersToUse.find(s => s.id === order.supplier_id);

        return {
          id: order.id,
          supplierId: order.supplier_id,
          supplierName: supplier?.name || 'Unknown Supplier',
          items,
          totalAmount: Number(order.total_amount),
          invoiceNumber: order.invoice_number,
          supplyDate: order.supply_date,
          expectedPaymentDate: order.expected_payment_date,
          status: order.status as 'pending' | 'received' | 'cancelled',
          notes: order.notes,
          createdAt: order.created_at
        };
      });

      setSupplyOrders(mappedOrders);
    } catch (error: any) {
      console.error('Failed to load supply orders:', error);
      // Silently fail if tables don't exist yet
    }
  };

  // Load supplier payments from Supabase
  const loadSupplierPayments = async (suppliersList?: Supplier[]) => {
    try {
      const { data: paymentsData, error: fetchError } = await supabase
        .from('supplier_payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching supplier payments:', fetchError);
        // Don't throw error if table doesn't exist yet (first time setup)
        if (fetchError.message?.includes('does not exist')) {
          return;
        }
        return;
      }

      // Use provided suppliers list or current suppliers state
      const suppliersToUse = suppliersList || suppliers;

      // Map Supabase data to SupplierPayment interface
      const mappedPayments: SupplierPayment[] = (paymentsData || []).map(payment => {
        const supplier = suppliersToUse.find(s => s.id === payment.supplier_id);
        return {
          id: payment.id,
          supplierId: payment.supplier_id,
          supplierName: supplier?.name || 'Unknown Supplier',
          amount: Number(payment.amount),
          paymentMethod: payment.payment_method as 'cash' | 'bank_transfer' | 'cheque' | 'upi',
          reference: payment.reference || '',
          paymentDate: payment.payment_date,
          notes: payment.notes,
          createdAt: payment.created_at
        };
      });

      setSupplierPayments(mappedPayments);
    } catch (error: any) {
      console.error('Failed to load supplier payments:', error);
      // Silently fail if tables don't exist yet
    }
  };

  useEffect(() => {
    if (user) {
      const loadAll = async () => {
        setIsLoading(true);
        const loadedSuppliers = await loadSuppliers();
        // Load supply orders and payments after suppliers are loaded
        // Pass suppliers list to ensure supplier names are populated correctly
        await loadSupplyOrders(loadedSuppliers);
        await loadSupplierPayments(loadedSuppliers);
        setIsLoading(false);
      };
      loadAll();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const refreshSuppliers = async () => {
    setIsLoading(true);
    await loadSuppliers();
    setIsLoading(false);
  };

  const addSupplier = async (supplier: Omit<Supplier, 'id' | 'createdAt'>) => {
    try {
      setError(null);
      // Map frontend 'contact' to database 'phone'
      // Don't include 'balance' as it doesn't exist in the database schema
      const { data: newSupplier, error: createError } = await supabase
        .from('suppliers')
        .insert([{
          name: supplier.name,
          phone: supplier.contact, // Map contact to phone
          email: supplier.email || null,
          address: supplier.address || null
        }])
        .select()
        .single();

      if (createError) {
        console.error('Error creating supplier:', createError);
        const errorMessage = createError.message || 'Failed to add supplier';
        setError(errorMessage);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      // Map the new supplier to the interface
      // Map database 'phone' back to frontend 'contact'
      const mappedSupplier: Supplier = {
        id: newSupplier.id,
        name: newSupplier.name,
        contact: newSupplier.phone || newSupplier.contact || '', // Map phone to contact
        email: newSupplier.email || '',
        address: newSupplier.address || '',
        balance: newSupplier.balance || 0, // Default to 0 if balance doesn't exist
        createdAt: newSupplier.created_at
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
      setIsLoading(true);
      setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
=======
      setError(null);
      const normalizedUpdates: any = {};
      
      // Map frontend fields to database fields
      if (updates.name) normalizedUpdates.name = updates.name;
      if (updates.contact !== undefined) normalizedUpdates.phone = updates.contact; // Map contact to phone
      if (updates.email !== undefined) normalizedUpdates.email = updates.email;
      if (updates.address !== undefined) normalizedUpdates.address = updates.address;
      // Don't include balance as it doesn't exist in the database schema

      const { data: updatedSupplier, error: updateError } = await supabase
        .from('suppliers')
        .update(normalizedUpdates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating supplier:', updateError);
        const errorMessage = updateError.message || 'Failed to update supplier';
        setError(errorMessage);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      // Map the updated supplier to the interface
      // Map database 'phone' back to frontend 'contact'
      const mappedSupplier: Supplier = {
        id: updatedSupplier.id,
        name: updatedSupplier.name,
        contact: updatedSupplier.phone || updatedSupplier.contact || '', // Map phone to contact
        email: updatedSupplier.email || '',
        address: updatedSupplier.address || '',
        balance: updatedSupplier.balance || 0, // Default to 0 if balance doesn't exist
        createdAt: updatedSupplier.created_at
      };

      setSuppliers(prev => prev.map(s => 
        s.id === id ? mappedSupplier : s
      ));
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
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
=======
      setError(null);
      
      // Check if required fields are present
      if (!order.supplierId || !order.supplyDate) {
        throw new Error('Supplier and supply date are required');
      }

      // Validate items
      if (!order.items || order.items.length === 0) {
        throw new Error('At least one item is required');
      }

      // Filter out items with missing book IDs
      const validItems = order.items.filter(item => item.bookId && item.quantity > 0);
      if (validItems.length === 0) {
        throw new Error('Please add at least one valid item with a book selected');
      }

      // Insert supply order into database
      const { data: newOrder, error: orderError } = await supabase
        .from('supply_orders')
        .insert([{
          supplier_id: order.supplierId,
          invoice_number: order.invoiceNumber || null,
          supply_date: order.supplyDate,
          expected_payment_date: order.expectedPaymentDate || null,
          status: order.status,
          total_amount: order.totalAmount || 0,
          notes: order.notes || null
        }])
        .select()
        .single();

      if (orderError) {
        console.error('Error creating supply order:', orderError);
        
        // Check if table doesn't exist
        if (orderError.message?.includes('does not exist') || orderError.message?.includes('relation') || orderError.code === '42P01') {
          throw new Error('Database tables not found. Please run the migration script: backend/scripts/add-supplier-tables.sql in your Supabase SQL Editor.');
        }
        
        throw new Error(orderError.message || 'Failed to create supply order');
      }

      // Insert supply order items
      if (validItems.length > 0) {
        const itemsToInsert = validItems.map(item => ({
          supply_order_id: newOrder.id,
          book_id: item.bookId,
          quantity: item.quantity || 0,
          cost_price: item.costPrice || 0,
          total: (item.quantity || 0) * (item.costPrice || 0)
        }));

        const { error: itemsError } = await supabase
          .from('supply_order_items')
          .insert(itemsToInsert);

        if (itemsError) {
          console.error('Error creating supply order items:', itemsError);
          // Try to delete the order if items insertion fails
          await supabase.from('supply_orders').delete().eq('id', newOrder.id);
          throw new Error(itemsError.message || 'Failed to create supply order items');
        }
      }

      // Reload supply orders to get the complete data
      await loadSupplyOrders();
      toast.success('Supply order added successfully');
    } catch (error: any) {
      console.error('Failed to add supply order:', error);
      const errorMessage = error.message || 'Failed to add supply order';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
>>>>>>> Stashed changes
    }
  };

  const updateSupplyOrderStatus = async (id: string, status: SupplyOrder['status']) => {
    try {
<<<<<<< Updated upstream
      setIsLoading(true);
      setSupplyOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      toast.success('Order status updated successfully');
    } catch (err) {
      setError('Failed to update order status');
      toast.error('Failed to update order status');
    } finally {
      setIsLoading(false);
=======
      setError(null);
      
      const { error: updateError } = await supabase
        .from('supply_orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (updateError) {
        console.error('Error updating supply order status:', updateError);
        throw new Error(updateError.message || 'Failed to update supply order status');
      }

      // Reload supply orders
      await loadSupplyOrders();
      toast.success('Supply order status updated');
    } catch (error: any) {
      console.error('Failed to update supply order status:', error);
      setError(error.message || 'Failed to update supply order status');
      toast.error(error.message || 'Failed to update supply order status');
      throw error;
>>>>>>> Stashed changes
    }
  };

  const getSupplyOrdersBySupplier = (supplierId: string) => {
    return supplyOrders.filter(o => o.supplierId === supplierId);
  };

  // Payment operations
  const addSupplierPayment = async (payment: Omit<SupplierPayment, 'id' | 'createdAt'>) => {
    try {
<<<<<<< Updated upstream
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
=======
      setError(null);
      
      // Validate required fields
      if (!payment.supplierId || !payment.paymentDate) {
        throw new Error('Supplier and payment date are required');
      }

      if (!payment.amount || payment.amount <= 0) {
        throw new Error('Payment amount must be greater than 0');
      }

      const { data: newPayment, error: paymentError } = await supabase
        .from('supplier_payments')
        .insert([{
          supplier_id: payment.supplierId,
          amount: payment.amount,
          payment_method: payment.paymentMethod,
          reference: payment.reference || null,
          payment_date: payment.paymentDate,
          notes: payment.notes || null
        }])
        .select()
        .single();

      if (paymentError) {
        console.error('Error creating supplier payment:', paymentError);
        
        // Check if table doesn't exist
        if (paymentError.message?.includes('does not exist') || paymentError.message?.includes('relation') || paymentError.code === '42P01') {
          throw new Error('Database tables not found. Please run the migration script: backend/scripts/add-supplier-tables.sql in your Supabase SQL Editor.');
        }
        
        throw new Error(paymentError.message || 'Failed to create supplier payment');
      }

      // Reload supplier payments
      await loadSupplierPayments();
      toast.success('Payment added successfully');
    } catch (error: any) {
      console.error('Failed to add payment:', error);
      const errorMessage = error.message || 'Failed to add payment';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
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
=======
    // Get supplier's orders and payments
    const supplierOrders = supplyOrders.filter(order => order.supplierId === supplierId);
    const supplierPaymentsList = supplierPayments.filter(payment => payment.supplierId === supplierId);
    const supplier = getSupplierById(supplierId);

    // Calculate total supplies (sum of all received orders)
    const receivedOrders = supplierOrders.filter(order => order.status === 'received');
    const totalSupplies = receivedOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    // Calculate total payments
    const totalPayments = supplierPaymentsList.reduce((sum, payment) => sum + payment.amount, 0);

    // Outstanding balance (supplier balance, or calculated as supplies - payments)
    const outstandingBalance = supplier?.balance ?? (totalSupplies - totalPayments);

    // Calculate average order value
    const averageOrderValue = receivedOrders.length > 0 
      ? totalSupplies / receivedOrders.length 
      : 0;

    // Calculate on-time delivery rate
    // Since we don't have an expected delivery date, we'll base it on:
    // 1. Orders that are received (not pending/cancelled) = delivered
    // 2. For orders with expected payment dates, we can infer delivery was on time if supply date is reasonable
    // For now, we'll use a simplified metric: percentage of orders that are received
    // A more accurate calculation would require an "expectedDeliveryDate" field
    const totalOrders = supplierOrders.filter(order => order.status !== 'cancelled').length;
    const onTimeDeliveryRate = totalOrders > 0
      ? (receivedOrders.length / totalOrders) * 100
      : 0;

    // Calculate payment history (on-time, late, overdue)
    // This tracks payment timeliness based on expected payment dates
    const paymentHistory = {
      onTime: 0,
      late: 0,
      overdue: 0
    };

    const today = new Date();
    const ordersWithPaymentDate = receivedOrders.filter(order => order.expectedPaymentDate);
    
    // Track which payments have been "used" to avoid double counting
    const usedPayments = new Set<string>();
    
    // For each order with an expected payment date, check if payment was made on time
    ordersWithPaymentDate.forEach(order => {
      if (order.expectedPaymentDate) {
        const expectedDate = new Date(order.expectedPaymentDate);
        
        // Find the closest payment to this order's expected payment date that hasn't been used
        let bestPayment: typeof supplierPaymentsList[0] | null = null;
        let bestDaysDiff = Infinity;
        
        supplierPaymentsList.forEach(payment => {
          if (!usedPayments.has(payment.id)) {
            const paymentDate = new Date(payment.paymentDate);
            const daysDiff = Math.abs((paymentDate.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24));
            
            // Consider payments within 60 days of expected date
            if (daysDiff <= 60 && daysDiff < bestDaysDiff) {
              bestPayment = payment;
              bestDaysDiff = daysDiff;
            }
          }
        });

        if (bestPayment) {
          // Payment was made
          usedPayments.add(bestPayment.id);
          const paymentDate = new Date(bestPayment.paymentDate);
          
          if (paymentDate <= expectedDate) {
            paymentHistory.onTime++;
          } else {
            paymentHistory.late++;
          }
        } else if (today > expectedDate) {
          // No payment found and past due date
          paymentHistory.overdue++;
        }
>>>>>>> Stashed changes
      }
    });

    // Calculate reliability score (combination of on-time delivery and payment history)
    // Weight: 60% on-time delivery, 40% payment history
    const totalPaymentEvents = paymentHistory.onTime + paymentHistory.late + paymentHistory.overdue;
    const paymentScore = totalPaymentEvents > 0
      ? (paymentHistory.onTime / totalPaymentEvents) * 100
      : 100; // Default to 100 if no payment history
    
    const reliabilityScore = Math.round(
      (onTimeDeliveryRate * 0.6) + (paymentScore * 0.4)
    );

    // Get last order date
    const lastOrder = supplierOrders
      .sort((a, b) => new Date(b.supplyDate).getTime() - new Date(a.supplyDate).getTime())[0];
    const lastOrderDate = lastOrder?.supplyDate || new Date().toISOString();

    return {
      totalSupplies,
      totalPayments,
      outstandingBalance,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100, // Round to 2 decimal places
      onTimeDeliveryRate: Math.round(onTimeDeliveryRate * 100) / 100, // Round to 2 decimal places
      reliabilityScore,
      lastOrderDate,
      paymentHistory
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
<<<<<<< Updated upstream
    return supplyOrders.filter(order => {
      if (!order.expectedPaymentDate || order.status !== 'received') return false;
      const dueDate = new Date(order.expectedPaymentDate);
      return dueDate < today;
=======
    today.setHours(0, 0, 0, 0); // Reset to start of day for comparison
    
    return supplyOrders.filter(order => {
      // An order is overdue if:
      // 1. It has an expected payment date
      // 2. The expected payment date has passed
      // 3. It's been received (status === 'received') - meaning we need to pay for it
      // 4. There's still outstanding balance (not fully paid)
      if (!order.expectedPaymentDate || order.status !== 'received') {
        return false;
      }
      
      const expectedDate = new Date(order.expectedPaymentDate);
      expectedDate.setHours(0, 0, 0, 0);
      
      return expectedDate < today;
>>>>>>> Stashed changes
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