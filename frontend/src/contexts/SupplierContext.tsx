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
import { supabase } from '../config/supabase';
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
  refreshSuppliers: () => Promise<void>;
  
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

export const SupplierProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplyOrders, setSupplyOrders] = useState<SupplyOrder[]>([]);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Load suppliers from Supabase
  const loadSuppliers = async () => {
    try {
      setError(null);
      const { data: suppliersData, error: fetchError } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching suppliers:', fetchError);
        setError('Failed to load suppliers');
        return;
      }

      // Map Supabase field names to Supplier interface
      const mappedSuppliers: Supplier[] = (suppliersData || []).map(supplier => ({
        id: supplier.id,
        name: supplier.name,
        contact: supplier.contact,
        email: supplier.email,
        address: supplier.address,
        balance: supplier.balance,
        createdAt: supplier.created_at
      }));

      setSuppliers(mappedSuppliers);
    } catch (error: any) {
      console.error('Failed to load suppliers:', error);
      setError(error.message || 'Failed to load suppliers');
    }
  };

  useEffect(() => {
    if (user) {
      loadSuppliers();
    }
    setIsLoading(false);
  }, [user]);

  const refreshSuppliers = async () => {
    setIsLoading(true);
    await loadSuppliers();
    setIsLoading(false);
  };

  const addSupplier = async (supplier: Omit<Supplier, 'id' | 'createdAt'>) => {
    try {
      setError(null);
      const { data: newSupplier, error: createError } = await supabase
        .from('suppliers')
        .insert([{
          name: supplier.name,
          contact: supplier.contact,
          email: supplier.email,
          address: supplier.address,
          balance: supplier.balance
        }])
        .select()
        .single();

      if (createError) {
        console.error('Error creating supplier:', createError);
        setError('Failed to add supplier');
        toast.error('Failed to add supplier');
        throw new Error('Failed to add supplier');
      }

      // Map the new supplier to the interface
      const mappedSupplier: Supplier = {
        id: newSupplier.id,
        name: newSupplier.name,
        contact: newSupplier.contact,
        email: newSupplier.email,
        address: newSupplier.address,
        balance: newSupplier.balance,
        createdAt: newSupplier.created_at
      };

      setSuppliers(prev => [...prev, mappedSupplier]);
      toast.success('Supplier added successfully');
    } catch (error: any) {
      console.error('Failed to add supplier:', error);
      setError(error.message || 'Failed to add supplier');
      toast.error(error.message || 'Failed to add supplier');
      throw error;
    }
  };

  const editSupplier = async (id: string, updates: Partial<Supplier>) => {
    try {
      setError(null);
      const normalizedUpdates: any = {};
      
      if (updates.name) normalizedUpdates.name = updates.name;
      if (updates.contact) normalizedUpdates.contact = updates.contact;
      if (updates.email) normalizedUpdates.email = updates.email;
      if (updates.address) normalizedUpdates.address = updates.address;
      if (updates.balance !== undefined) normalizedUpdates.balance = updates.balance;

      const { data: updatedSupplier, error: updateError } = await supabase
        .from('suppliers')
        .update(normalizedUpdates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating supplier:', updateError);
        setError('Failed to update supplier');
        toast.error('Failed to update supplier');
        throw new Error('Failed to update supplier');
      }

      // Map the updated supplier to the interface
      const mappedSupplier: Supplier = {
        id: updatedSupplier.id,
        name: updatedSupplier.name,
        contact: updatedSupplier.contact,
        email: updatedSupplier.email,
        address: updatedSupplier.address,
        balance: updatedSupplier.balance,
        createdAt: updatedSupplier.created_at
      };

      setSuppliers(prev => prev.map(s => 
        s.id === id ? mappedSupplier : s
      ));
      toast.success('Supplier updated successfully');
    } catch (error: any) {
      console.error('Failed to update supplier:', error);
      setError(error.message || 'Failed to update supplier');
      toast.error(error.message || 'Failed to update supplier');
      throw error;
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error deleting supplier:', deleteError);
        setError('Failed to delete supplier');
        toast.error('Failed to delete supplier');
        throw new Error('Failed to delete supplier');
      }

      setSuppliers(prev => prev.filter(s => s.id !== id));
      toast.success('Supplier deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete supplier:', error);
      setError(error.message || 'Failed to delete supplier');
      toast.error(error.message || 'Failed to delete supplier');
      throw error;
    }
  };

  const getSupplierById = (id: string) => {
    return suppliers.find(s => s.id === id);
  };

  const addSupplyOrder = async (order: Omit<SupplyOrder, 'id' | 'createdAt'>) => {
    try {
      setError(null);
      // This would need to be implemented with a real Supabase call
      const newOrder: SupplyOrder = {
        ...order,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      setSupplyOrders(prev => [...prev, newOrder]);
      toast.success('Supply order added successfully');
    } catch (error: any) {
      console.error('Failed to add supply order:', error);
      setError(error.message || 'Failed to add supply order');
      toast.error(error.message || 'Failed to add supply order');
      throw error;
    }
  };

  const updateSupplyOrderStatus = async (id: string, status: SupplyOrder['status']) => {
    try {
      setError(null);
      setSupplyOrders(prev => prev.map(order => 
        order.id === id ? { ...order, status } : order
      ));
      toast.success('Supply order status updated');
    } catch (error: any) {
      console.error('Failed to update supply order status:', error);
      setError(error.message || 'Failed to update supply order status');
      toast.error(error.message || 'Failed to update supply order status');
      throw error;
    }
  };

  const getSupplyOrdersBySupplier = (supplierId: string) => {
    return supplyOrders.filter(order => order.supplierId === supplierId);
  };

  const addSupplierPayment = async (payment: Omit<SupplierPayment, 'id' | 'createdAt'>) => {
    try {
      setError(null);
      const newPayment: SupplierPayment = {
        ...payment,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      setSupplierPayments(prev => [...prev, newPayment]);
      toast.success('Payment added successfully');
    } catch (error: any) {
      console.error('Failed to add payment:', error);
      setError(error.message || 'Failed to add payment');
      toast.error(error.message || 'Failed to add payment');
      throw error;
    }
  };

  const getPaymentsBySupplier = (supplierId: string) => {
    return supplierPayments.filter(payment => payment.supplierId === supplierId);
  };

  const getSupplierLedger = (supplierId: string): SupplierLedgerEntry[] => {
    // This would need to be implemented with a real Supabase call
    return [];
  };

  const getSupplierAnalytics = (supplierId: string): SupplierAnalytics => {
    // This would need to be implemented with a real Supabase call
    return {
      totalSupplies: 0,
      totalPayments: 0,
      outstandingBalance: 0,
      averageOrderValue: 0,
      onTimeDeliveryRate: 0,
      reliabilityScore: 0,
      lastOrderDate: new Date().toISOString(),
      paymentHistory: {
        onTime: 0,
        late: 0,
        overdue: 0
      }
    };
  };

  const getAllSuppliersAnalytics = (): SupplierAnalytics[] => {
    // This would need to be implemented with a real Supabase call
    return [];
  };

  const calculateSupplierBalance = (supplierId: string): number => {
    const supplier = getSupplierById(supplierId);
    return supplier?.balance || 0;
  };

  const getOverduePayments = (): SupplyOrder[] => {
    const today = new Date();
    return supplyOrders.filter(order => 
      new Date(order.supplyDate) < today && order.status === 'pending'
    );
  };

  const getUpcomingPayments = (): SupplyOrder[] => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return supplyOrders.filter(order => {
      const orderDate = new Date(order.supplyDate);
      return orderDate >= today && orderDate <= nextWeek && order.status === 'pending';
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
      refreshSuppliers,
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