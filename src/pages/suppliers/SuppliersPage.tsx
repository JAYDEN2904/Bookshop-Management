import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Truck, 
  DollarSign, 
  Package, 
  Edit, 
  Trash2,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  AlertCircle,
  Calendar,
  FileText,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { useSupplier } from '../../contexts/SupplierContext';
import { useInventory } from '../../contexts/InventoryContext';
import { Supplier, SupplyOrder, SupplyItem, SupplierPayment } from '../../types';
import toast from 'react-hot-toast';

const SuppliersPage: React.FC = () => {
  const {
    suppliers,
    supplyOrders,
    supplierPayments,
    addSupplier,
    editSupplier,
    deleteSupplier,
    addSupplyOrder,
    addSupplierPayment,
    getSupplierLedger,
    getSupplierAnalytics,
    getOverduePayments,
    getUpcomingPayments,
    updateSupplyOrderStatus
  } = useSupplier();
  
  const { books } = useInventory();
  
  const [activeTab, setActiveTab] = useState<'suppliers' | 'supplies' | 'payments' | 'ledger' | 'analytics'>('suppliers');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showEditSupplierModal, setShowEditSupplierModal] = useState(false);
  const [showSupplyModal, setShowSupplyModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Form states
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contact: '',
    email: '',
    address: ''
  });
  
  const [supplyForm, setSupplyForm] = useState({
    supplierId: '',
    invoiceNumber: '',
    supplyDate: '',
    expectedPaymentDate: '',
    notes: '',
    items: [{ bookId: '', bookTitle: '', quantity: 1, costPrice: 0, total: 0 }] as SupplyItem[]
  });
  
  const [paymentForm, setPaymentForm] = useState({
    supplierId: '',
    amount: 0,
    paymentMethod: 'bank_transfer' as const,
    reference: '',
    paymentDate: '',
    notes: ''
  });

  const tabs = [
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
    { id: 'supplies', label: 'Supply Orders', icon: Package },
    { id: 'payments', label: 'Payments', icon: DollarSign },
    { id: 'ledger', label: 'Ledger', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBalance = suppliers.reduce((sum, supplier) => sum + supplier.balance, 0);
  const outstandingPayments = suppliers.filter(s => s.balance < 0).reduce((sum, s) => sum + Math.abs(s.balance), 0);
  const overduePayments = getOverduePayments();
  const upcomingPayments = getUpcomingPayments();

  const handleAddSupplier = () => {
    if (!supplierForm.name || !supplierForm.contact || !supplierForm.email) {
      toast.error('Please fill required fields');
      return;
    }
    
    addSupplier({
      ...supplierForm,
      balance: 0
    });
    setShowAddSupplierModal(false);
    setSupplierForm({ name: '', contact: '', email: '', address: '' });
  };

  const handleEditSupplier = () => {
    if (!selectedSupplier) return;
    
    editSupplier(selectedSupplier.id, supplierForm);
    setShowEditSupplierModal(false);
    setSelectedSupplier(null);
    setSupplierForm({ name: '', contact: '', email: '', address: '' });
  };

  const handleDeleteSupplier = (supplierId: string) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      deleteSupplier(supplierId);
    }
  };

  const handleAddSupply = () => {
    if (!supplyForm.supplierId || supplyForm.items.length === 0) {
      toast.error('Please select supplier and add items');
      return;
    }
    
    const supplier = suppliers.find(s => s.id === supplyForm.supplierId);
    if (!supplier) return;
    
    const totalAmount = supplyForm.items.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0);
    
    addSupplyOrder({
      supplierId: supplyForm.supplierId,
      supplierName: supplier.name,
      items: supplyForm.items,
      totalAmount,
      invoiceNumber: supplyForm.invoiceNumber,
      supplyDate: supplyForm.supplyDate,
      expectedPaymentDate: supplyForm.expectedPaymentDate,
      status: 'pending',
      notes: supplyForm.notes
    });
    
    setShowSupplyModal(false);
    setSupplyForm({
      supplierId: '',
      invoiceNumber: '',
      supplyDate: '',
      expectedPaymentDate: '',
      notes: '',
      items: [{ bookId: '', bookTitle: '', quantity: 1, costPrice: 0, total: 0 }]
    });
  };

  const handleAddPayment = () => {
    if (!paymentForm.supplierId || paymentForm.amount <= 0) {
      toast.error('Please select supplier and enter amount');
      return;
    }
    
    const supplier = suppliers.find(s => s.id === paymentForm.supplierId);
    if (!supplier) return;
    
    addSupplierPayment({
      supplierId: paymentForm.supplierId,
      supplierName: supplier.name,
      amount: paymentForm.amount,
      paymentMethod: paymentForm.paymentMethod,
      reference: paymentForm.reference,
      paymentDate: paymentForm.paymentDate,
      notes: paymentForm.notes
    });
    
    setShowPaymentModal(false);
    setPaymentForm({
      supplierId: '',
      amount: 0,
      paymentMethod: 'bank_transfer',
      reference: '',
      paymentDate: '',
      notes: ''
    });
  };

  const addSupplyItem = () => {
    setSupplyForm(prev => ({
      ...prev,
      items: [...prev.items, { bookId: '', bookTitle: '', quantity: 1, costPrice: 0, total: 0 }]
    }));
  };

  const removeSupplyItem = (index: number) => {
    setSupplyForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateSupplyItem = (index: number, field: keyof SupplyItem, value: any) => {
    setSupplyForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i !== index) return item;
        
        const updatedItem = { ...item, [field]: value };
        
        // Update bookTitle when bookId changes
        if (field === 'bookId') {
          const selectedBook = books.find(book => book.id === value);
          updatedItem.bookTitle = selectedBook?.title || '';
        }
        
        // Update total when quantity or costPrice changes
        if (field === 'quantity' || field === 'costPrice') {
          updatedItem.total = updatedItem.quantity * updatedItem.costPrice;
        }
        
        return updatedItem;
      })
    }));
  };

  const openEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setSupplierForm({
      name: supplier.name,
      contact: supplier.contact,
      email: supplier.email,
      address: supplier.address
    });
    setShowEditSupplierModal(true);
  };

  const openLedger = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowLedgerModal(true);
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods = {
      cash: 'Cash',
      bank_transfer: 'Bank Transfer',
      cheque: 'Cheque',
      upi: 'UPI'
    };
    return methods[method as keyof typeof methods] || method;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      received: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supplier Management</h1>
          <p className="text-gray-600">Manage suppliers, supplies, payments, and analytics</p>
        </div>
        <Button onClick={() => setShowAddSupplierModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Truck className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Suppliers</p>
              <p className="text-2xl font-bold text-gray-900">{suppliers.length}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Balance</p>
              <p className="text-2xl font-bold text-gray-900">₵{totalBalance.toLocaleString('en-US')}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Outstanding</p>
              <p className="text-2xl font-bold text-gray-900">₵{outstandingPayments.toLocaleString('en-US')}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">{overduePayments.length}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Orders</p>
              <p className="text-2xl font-bold text-gray-900">{supplyOrders.filter(o => o.status === 'pending').length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Card padding={false}>
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'suppliers' && (
            <div className="space-y-6">
              {/* Search */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search suppliers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    icon={<Search className="h-4 w-4 text-gray-400" />}
                  />
                </div>
                <Button onClick={() => setShowSupplyModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Record Supply
                </Button>
              </div>

              {/* Suppliers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSuppliers.map((supplier) => {
                  const analytics = getSupplierAnalytics(supplier.id);
                  return (
                  <Card key={supplier.id}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Truck className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                          <p className={`text-sm font-medium ${
                            supplier.balance >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            Balance: ₵{supplier.balance.toLocaleString('en-US')}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button
                            onClick={() => openEditSupplier(supplier)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                          <button 
                            onClick={() => handleDeleteSupplier(supplier.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4" />
                        <span>{supplier.contact}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4" />
                        <span>{supplier.email}</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 mt-0.5" />
                        <span className="line-clamp-2">{supplier.address}</span>
                      </div>
                    </div>

                      {/* Analytics Summary */}
                      <div className="bg-gray-50 p-3 rounded-lg mb-4">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Reliability:</span>
                            <div className="flex items-center space-x-1">
                              <div className="flex-1 bg-gray-200 rounded-full h-1">
                                <div 
                                  className="bg-blue-600 h-1 rounded-full" 
                                  style={{ width: `${analytics.reliabilityScore}%` }}
                                ></div>
                              </div>
                              <span className="font-medium">{analytics.reliabilityScore}%</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Avg Order:</span>
                            <span className="font-medium">₵{analytics.averageOrderValue.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                            setSupplyForm(prev => ({ ...prev, supplierId: supplier.id }));
                            setShowSupplyModal(true);
                        }}
                      >
                        <Package className="h-4 w-4 mr-1" />
                          Supply
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                            setPaymentForm(prev => ({ ...prev, supplierId: supplier.id }));
                          setShowPaymentModal(true);
                        }}
                      >
                        <DollarSign className="h-4 w-4 mr-1" />
                        Pay
                      </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openLedger(supplier)}
                        >
                          <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'supplies' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Supply Orders</h3>
                <div className="flex space-x-2">
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="received">Received</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <Button onClick={() => setShowSupplyModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                    New Supply
                </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supply Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {supplyOrders
                      .filter(order => filterStatus === 'all' || order.status === filterStatus)
                      .map((order) => {
                        const isOverdue = order.expectedPaymentDate && 
                          new Date(order.expectedPaymentDate) < new Date() && 
                          order.status === 'received';
                        
                        return (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {order.supplierName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {order.items.length} items
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ₵{order.totalAmount.toLocaleString('en-US')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(order.supplyDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {order.expectedPaymentDate ? (
                                <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}>
                                  {new Date(order.expectedPaymentDate).toLocaleDateString()}
                                  {isOverdue && <AlertCircle className="h-4 w-4 inline ml-1" />}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <select 
                                value={order.status}
                                onChange={(e) => updateSupplyOrderStatus(order.id, e.target.value as any)}
                                className="px-2 py-1 border border-gray-300 rounded text-xs"
                              >
                                <option value="pending">Pending</option>
                                <option value="received">Received</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                        </td>
                      </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
                <Button onClick={() => setShowPaymentModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {supplierPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {payment.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.supplierName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₵{payment.amount.toLocaleString('en-US')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getPaymentMethodLabel(payment.paymentMethod)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(payment.paymentDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.reference}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'ledger' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Supplier Ledger</h3>
                <div className="flex space-x-2">
                  <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                    <option value="">Select Supplier</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                    ))}
                  </select>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  Select a supplier to view their complete transaction ledger including supplies and payments.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {suppliers.map(supplier => {
                  const analytics = getSupplierAnalytics(supplier.id);
                  return (
                    <Card key={supplier.id}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          analytics.reliabilityScore >= 80 ? 'bg-green-100 text-green-800' :
                          analytics.reliabilityScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {analytics.reliabilityScore}% Reliable
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Supplies:</span>
                          <span className="font-medium">₵{analytics.totalSupplies.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Payments:</span>
                          <span className="font-medium">₵{analytics.totalPayments.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Outstanding:</span>
                          <span className={`font-medium ${analytics.outstandingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₵{analytics.outstandingBalance.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Avg Order Value:</span>
                          <span className="font-medium">₵{analytics.averageOrderValue.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">On-time Delivery:</span>
                          <span className="font-medium">{analytics.onTimeDeliveryRate}%</span>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Add Supplier Modal */}
      <Modal
        isOpen={showAddSupplierModal}
        onClose={() => setShowAddSupplierModal(false)}
        title="Add New Supplier"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Supplier Name *"
              value={supplierForm.name}
              onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
              placeholder="Enter supplier name"
            />
            <Input
              label="Contact Number *"
              value={supplierForm.contact}
              onChange={(e) => setSupplierForm({ ...supplierForm, contact: e.target.value })}
              placeholder="Enter contact number"
            />
          </div>
          
          <Input
            label="Email Address *"
            type="email"
            value={supplierForm.email}
            onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
            placeholder="Enter email address"
          />
          
          <Input
            label="Address"
            value={supplierForm.address}
            onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
            placeholder="Enter complete address"
          />

          <div className="flex justify-end space-x-4 pt-4">
            <Button variant="outline" onClick={() => setShowAddSupplierModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSupplier}>Add Supplier</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Supplier Modal */}
      <Modal
        isOpen={showEditSupplierModal}
        onClose={() => setShowEditSupplierModal(false)}
        title="Edit Supplier"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Supplier Name *"
              value={supplierForm.name}
              onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
              placeholder="Enter supplier name"
            />
            <Input
              label="Contact Number *"
              value={supplierForm.contact}
              onChange={(e) => setSupplierForm({ ...supplierForm, contact: e.target.value })}
              placeholder="Enter contact number"
            />
          </div>
          
          <Input
            label="Email Address *"
            type="email"
            value={supplierForm.email}
            onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
            placeholder="Enter email address"
          />
          
          <Input
            label="Address"
            value={supplierForm.address}
            onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
            placeholder="Enter complete address"
          />

          <div className="flex justify-end space-x-4 pt-4">
            <Button variant="outline" onClick={() => setShowEditSupplierModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSupplier}>Update Supplier</Button>
          </div>
        </div>
      </Modal>

      {/* Supply Order Modal */}
      <Modal
        isOpen={showSupplyModal}
        onClose={() => setShowSupplyModal(false)}
        title="Record Supply Order"
        size="xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={supplyForm.supplierId}
                onChange={(e) => setSupplyForm({ ...supplyForm, supplierId: e.target.value })}
              >
                <option value="">Select Supplier</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </div>
            <Input 
              label="Invoice Number" 
              value={supplyForm.invoiceNumber}
              onChange={(e) => setSupplyForm({ ...supplyForm, invoiceNumber: e.target.value })}
              placeholder="Enter invoice number"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Supply Date *" 
              type="date"
              value={supplyForm.supplyDate}
              onChange={(e) => setSupplyForm({ ...supplyForm, supplyDate: e.target.value })}
            />
            <Input 
              label="Expected Payment Date" 
              type="date"
              value={supplyForm.expectedPaymentDate}
              onChange={(e) => setSupplyForm({ ...supplyForm, expectedPaymentDate: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Supply Items</h4>
              <Button size="sm" variant="outline" onClick={addSupplyItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
              </div>
            
            <div className="space-y-3">
              {supplyForm.items.map((item, index) => (
                <div key={index} className="grid grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Book</label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      value={item.bookId}
                      onChange={(e) => updateSupplyItem(index, 'bookId', e.target.value)}
                    >
                      <option value="">Select Book</option>
                      {books.map(book => (
                        <option key={book.id} value={book.id}>{book.title}</option>
                      ))}
                </select>
                  </div>
                  <Input 
                    label="Quantity"
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateSupplyItem(index, 'quantity', parseInt(e.target.value))}
                    placeholder="Qty"
                  />
                  <Input 
                    label="Cost Price"
                    type="number"
                    value={item.costPrice}
                    onChange={(e) => updateSupplyItem(index, 'costPrice', parseFloat(e.target.value))}
                    placeholder="Price"
                  />
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">
                      ₵{(item.quantity * item.costPrice).toLocaleString()}
                    </span>
                    {supplyForm.items.length > 1 && (
                      <button
                        onClick={() => removeSupplyItem(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                  </div>
              </div>
              ))}
            </div>
          </div>

          <Input 
            label="Notes" 
            value={supplyForm.notes}
            onChange={(e) => setSupplyForm({ ...supplyForm, notes: e.target.value })}
            placeholder="Additional notes (optional)"
          />

          <div className="flex justify-end space-x-4 pt-4">
            <Button variant="outline" onClick={() => setShowSupplyModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSupply}>Record Supply</Button>
          </div>
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Record Payment"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={paymentForm.supplierId}
              onChange={(e) => setPaymentForm({ ...paymentForm, supplierId: e.target.value })}
            >
              <option value="">Select Supplier</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Amount *" 
              type="number"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) })}
              placeholder="Enter amount"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={paymentForm.paymentMethod}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as any })}
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="upi">UPI</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Reference Number" 
              value={paymentForm.reference}
              onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
              placeholder="Transaction/Cheque reference"
            />
            <Input 
              label="Payment Date *" 
              type="date"
              value={paymentForm.paymentDate}
              onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
            />
          </div>

          <Input 
            label="Notes" 
            value={paymentForm.notes}
            onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
            placeholder="Additional notes (optional)"
          />

          <div className="flex justify-end space-x-4 pt-4">
            <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPayment}>Record Payment</Button>
          </div>
        </div>
      </Modal>

      {/* Ledger Modal */}
      <Modal
        isOpen={showLedgerModal}
        onClose={() => setShowLedgerModal(false)}
        title={`Ledger - ${selectedSupplier?.name}`}
        size="xl"
      >
        {selectedSupplier && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Current Balance:</span>
                  <p className={`font-semibold ${selectedSupplier.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₵{selectedSupplier.balance.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Total Supplies:</span>
                  <p className="font-semibold">₵{getSupplierAnalytics(selectedSupplier.id).totalSupplies.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Total Payments:</span>
                  <p className="font-semibold">₵{getSupplierAnalytics(selectedSupplier.id).totalPayments.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getSupplierLedger(selectedSupplier.id).map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          entry.type === 'supply' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {entry.type === 'supply' ? 'Supply' : 'Payment'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.reference}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.description}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        entry.amount >= 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {entry.amount >= 0 ? '+' : ''}₵{entry.amount.toLocaleString()}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        entry.balance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ₵{entry.balance.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SuppliersPage;