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
  AlertCircle
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { Supplier } from '../../types';
import toast from 'react-hot-toast';

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

const SuppliersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'suppliers' | 'orders' | 'payments'>('suppliers');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    email: '',
    address: ''
  });

  const tabs = [
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
    { id: 'orders', label: 'Purchase Orders', icon: Package },
    { id: 'payments', label: 'Payments', icon: DollarSign }
  ];

  const filteredSuppliers = mockSuppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBalance = mockSuppliers.reduce((sum, supplier) => sum + supplier.balance, 0);
  const outstandingPayments = mockSuppliers.filter(s => s.balance < 0).reduce((sum, s) => sum + Math.abs(s.balance), 0);

  const handleAddSupplier = () => {
    if (!formData.name || !formData.contact || !formData.email) {
      toast.error('Please fill required fields');
      return;
    }
    
    toast.success('Supplier added successfully');
    setShowAddModal(false);
    setFormData({ name: '', contact: '', email: '', address: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supplier Management</h1>
          <p className="text-gray-600">Manage suppliers, orders, and payments</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Truck className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Suppliers</p>
              <p className="text-2xl font-bold text-gray-900">{mockSuppliers.length}</p>
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
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Orders</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
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
              </div>

              {/* Suppliers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSuppliers.map((supplier) => (
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
                          onClick={() => setSelectedSupplier(supplier)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
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

                    <div className="flex space-x-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSelectedSupplier(supplier);
                          setShowOrderModal(true);
                        }}
                      >
                        <Package className="h-4 w-4 mr-1" />
                        Order
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedSupplier(supplier);
                          setShowPaymentModal(true);
                        }}
                      >
                        <DollarSign className="h-4 w-4 mr-1" />
                        Pay
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Purchase Orders</h3>
                <Button onClick={() => setShowOrderModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Order
                </Button>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[
                      { id: 'PO001', supplier: 'NCERT Publications', items: 5, amount: 25000, status: 'Pending', date: '2024-01-15' },
                      { id: 'PO002', supplier: 'S Chand Publications', items: 3, amount: 18000, status: 'Delivered', date: '2024-01-12' },
                      { id: 'PO003', supplier: 'Oxford University Press', items: 8, amount: 32000, status: 'Shipped', date: '2024-01-10' },
                    ].map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.supplier}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.items} items
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₵{order.amount.toLocaleString('en-US')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(order.date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
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
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[
                      { id: 'PAY001', supplier: 'NCERT Publications', amount: 15000, method: 'Bank Transfer', date: '2024-01-14', ref: 'TXN123456' },
                      { id: 'PAY002', supplier: 'S Chand Publications', amount: 8000, method: 'Cheque', date: '2024-01-12', ref: 'CHQ789012' },
                      { id: 'PAY003', supplier: 'Oxford University Press', amount: 12000, method: 'UPI', date: '2024-01-10', ref: 'UPI345678' },
                    ].map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {payment.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.supplier}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₵{payment.amount.toLocaleString('en-US')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.method}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(payment.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.ref}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Add Supplier Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Supplier"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Supplier Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter supplier name"
            />
            <Input
              label="Contact Number *"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              placeholder="Enter contact number"
            />
          </div>
          
          <Input
            label="Email Address *"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Enter email address"
          />
          
          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Enter complete address"
          />

          <div className="flex justify-end space-x-4 pt-4">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSupplier}>Add Supplier</Button>
          </div>
        </div>
      </Modal>

      {/* Order Modal */}
      <Modal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        title="Create Purchase Order"
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              Create a new purchase order for books and supplies
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Supplier</option>
                {mockSuppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </div>
            <Input label="Expected Delivery" type="date" />
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Order Items</h4>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-700 mb-2">
                <span>Book</span>
                <span>Quantity</span>
                <span>Unit Price</span>
                <span>Total</span>
              </div>
              <div className="grid grid-cols-4 gap-4 items-center">
                <select className="px-2 py-1 border border-gray-300 rounded text-sm">
                  <option>Select Book</option>
                  <option>Mathematics Class 10</option>
                  <option>English Grammar</option>
                </select>
                <Input type="number" placeholder="Qty" />
                <Input type="number" placeholder="Price" />
                                        <span className="text-sm font-medium">₵0</span>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button variant="outline" onClick={() => setShowOrderModal(false)}>
              Cancel
            </Button>
            <Button>Create Order</Button>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select Supplier</option>
              {mockSuppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Amount" type="number" placeholder="Enter amount" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="upi">UPI</option>
              </select>
            </div>
          </div>

          <Input label="Reference Number" placeholder="Transaction/Cheque reference" />
          <Input label="Notes" placeholder="Additional notes (optional)" />

          <div className="flex justify-end space-x-4 pt-4">
            <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
              Cancel
            </Button>
            <Button>Record Payment</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SuppliersPage;