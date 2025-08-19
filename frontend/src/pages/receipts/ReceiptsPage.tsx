import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Receipt, 
  Download, 
  Eye, 
  Mail,
  Calendar,
  DollarSign,
  User,
  Printer,
  Users,
  Globe
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { Purchase } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const mockReceipts: Purchase[] = [
  {
    id: 'RCP001',
    studentId: '1',
    studentName: 'Rahul Kumar',
    items: [
      { bookId: '1', title: 'Mathematics Basic 9', quantity: 1, price: 150, total: 150 },
      { bookId: '2', title: 'Science Basic 9', quantity: 1, price: 140, total: 140 }
    ],
    total: 290,
    discount: 0,
    paymentMode: 'cash',
    cashierId: '2',
    cashierName: 'Sarah Cashier',
    createdAt: '2024-01-15T10:30:00'
  },
  {
    id: 'RCP002',
    studentId: '2',
    studentName: 'Priya Sharma',
    items: [
      { bookId: '3', title: 'English Grammar', quantity: 1, price: 120, total: 120 },
      { bookId: '4', title: 'History Basic 8', quantity: 1, price: 110, total: 110 }
    ],
    total: 230,
    discount: 10,
    paymentMode: 'upi',
    cashierId: '2',
    cashierName: 'Sarah Cashier',
    createdAt: '2024-01-15T09:15:00'
  },
  {
    id: 'RCP003',
    studentId: '3',
    studentName: 'Amit Singh',
    items: [
      { bookId: '5', title: 'Geography Basic 7', quantity: 2, price: 95, total: 190 }
    ],
    total: 190,
    discount: 5,
    paymentMode: 'card',
    cashierId: '3',
    cashierName: 'Mike Johnson',
    createdAt: '2024-01-14T16:45:00'
  },
  {
    id: 'RCP004',
    studentId: '4',
    studentName: 'Sneha Patel',
    items: [
      { bookId: '1', title: 'Mathematics Basic 9', quantity: 1, price: 150, total: 150 },
      { bookId: '6', title: 'Physics Basic 6', quantity: 1, price: 180, total: 180 }
    ],
    total: 330,
    discount: 0,
    paymentMode: 'cash',
    cashierId: '4',
    cashierName: 'John Smith',
    createdAt: '2024-01-14T14:20:00'
  },
  {
    id: 'RCP005',
    studentId: '5',
    studentName: 'Kavya Reddy',
    items: [
      { bookId: '7', title: 'Chemistry Basic 5', quantity: 1, price: 200, total: 200 }
    ],
    total: 200,
    discount: 15,
    paymentMode: 'upi',
    cashierId: '2',
    cashierName: 'Sarah Cashier',
    createdAt: '2024-01-13T11:30:00'
  }
];

const ReceiptsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [cashierFilter, setCashierFilter] = useState('all');
  const [selectedReceipt, setSelectedReceipt] = useState<Purchase | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showResendModal, setShowResendModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Get unique cashiers for admin filtering
  const uniqueCashiers = Array.from(new Set(mockReceipts.map(r => r.cashierName)));

  const filteredReceipts = mockReceipts.filter(receipt => {
    const matchesSearch = receipt.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         receipt.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (isAdmin && receipt.cashierName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPayment = paymentFilter === 'all' || receipt.paymentMode === paymentFilter;
    const matchesCashier = cashierFilter === 'all' || receipt.cashierName === cashierFilter;
    
    // Date filtering logic would go here
    return matchesSearch && matchesPayment && matchesCashier;
  });

  const totalAmount = filteredReceipts.reduce((sum, receipt) => sum + receipt.total, 0);
  const totalTransactions = filteredReceipts.length;

  const handlePrintReceipt = (receipt: Purchase) => {
    toast.success(`Printing receipt ${receipt.id}`);
  };

  const handleResendReceipt = () => {
    if (!selectedReceipt) return;
    toast.success(`Receipt ${selectedReceipt.id} sent successfully`);
    setShowResendModal(false);
    setSelectedReceipt(null);
  };

  const handleExportAll = () => {
    toast.success('Exporting all receipts...');
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Receipts</h1>
          <p className="text-gray-600">
            {isAdmin ? 'Global receipt management across all users' : 'View and manage transaction receipts'}
          </p>
        </div>
        <div className="flex space-x-2">
          {isAdmin && (
            <Button variant="outline">
              <Globe className="h-4 w-4 mr-2" />
              Global Search
            </Button>
          )}
          <Button variant="outline" onClick={handleExportAll}>
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Receipt className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Receipts</p>
              <p className="text-2xl font-bold text-gray-900">{totalTransactions}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">₵{totalAmount.toLocaleString('en-US')}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <User className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unique Students</p>
              <p className="text-2xl font-bold text-gray-900">{new Set(filteredReceipts.map(r => r.studentId)).size}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's Receipts</p>
              <p className="text-2xl font-bold text-gray-900">{filteredReceipts.filter(r => new Date(r.createdAt).toDateString() === new Date().toDateString()).length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder={isAdmin ? "Search by receipt ID, student name, or cashier..." : "Search by receipt ID or student name..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="h-4 w-4 text-gray-400" />}
            />
          </div>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Payments</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="upi">UPI</option>
          </select>
          {isAdmin && (
            <select
              value={cashierFilter}
              onChange={(e) => setCashierFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Cashiers</option>
              {uniqueCashiers.map(cashier => (
                <option key={cashier} value={cashier}>{cashier}</option>
              ))}
            </select>
          )}
          <Button 
            variant="outline" 
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {showAdvancedFilters ? 'Hide' : 'More'} Filters
          </Button>
        </div>

        {/* Advanced Filters (Admin Only) */}
        {isAdmin && showAdvancedFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Range</label>
                <div className="flex space-x-2">
                  <Input placeholder="Min" type="number" />
                  <Input placeholder="Max" type="number" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Applied</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="all">All</option>
                  <option value="with_discount">With Discount</option>
                  <option value="without_discount">Without Discount</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Items Count</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="all">All</option>
                  <option value="single_item">Single Item</option>
                  <option value="multiple_items">Multiple Items</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Receipts Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Receipt Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                {isAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cashier
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReceipts.map((receipt) => {
                const { date, time } = formatDateTime(receipt.createdAt);
                return (
                  <tr key={receipt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{receipt.id}</div>
                        <div className="text-sm text-gray-500">{date} at {time}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{receipt.studentName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{receipt.items.length} items</div>
                      <div className="text-sm text-gray-500">
                        {receipt.items.slice(0, 2).map(item => item.title).join(', ')}
                        {receipt.items.length > 2 && '...'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">₵{receipt.total}</div>
                      {receipt.discount > 0 && (
                        <div className="text-sm text-green-600">-{receipt.discount}% discount</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                        receipt.paymentMode === 'cash' ? 'bg-green-100 text-green-800' :
                        receipt.paymentMode === 'card' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {receipt.paymentMode}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {receipt.cashierName}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setSelectedReceipt(receipt);
                          setShowReceiptModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Receipt"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handlePrintReceipt(receipt)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Print Receipt"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedReceipt(receipt);
                          setShowResendModal(true);
                        }}
                        className="text-green-600 hover:text-green-900"
                        title="Resend Receipt"
                      >
                        <Mail className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Receipt View Modal */}
      <Modal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        title="Receipt Details"
        size="md"
      >
        {selectedReceipt && (
          <div className="space-y-4">
            {/* Receipt Header */}
            <div className="text-center border-b pb-4">
              <div className="flex items-center justify-center mb-2">
                <Receipt className="h-8 w-8 text-blue-600 mr-2" />
                <h3 className="text-xl font-bold">School Bookshop</h3>
              </div>
              <p className="text-sm text-gray-600">Receipt #{selectedReceipt.id}</p>
              <p className="text-sm text-gray-600">{formatDateTime(selectedReceipt.createdAt).date} at {formatDateTime(selectedReceipt.createdAt).time}</p>
            </div>

            {/* Student & Cashier Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Student:</p>
                <p className="text-sm text-gray-900">{selectedReceipt.studentName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Cashier:</p>
                <p className="text-sm text-gray-900">{selectedReceipt.cashierName}</p>
              </div>
            </div>

            {/* Items */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Items:</p>
              <div className="space-y-2">
                {selectedReceipt.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.title} × {item.quantity}</span>
                    <span>₵{item.total}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t pt-2 space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₵{selectedReceipt.items.reduce((sum, item) => sum + item.total, 0)}</span>
              </div>
              {selectedReceipt.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({selectedReceipt.discount}%):</span>
                  <span>-₵{Math.round((selectedReceipt.items.reduce((sum, item) => sum + item.total, 0) * selectedReceipt.discount) / 100)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span>₵{selectedReceipt.total}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Payment:</span>
                <span className="capitalize">{selectedReceipt.paymentMode}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => handlePrintReceipt(selectedReceipt)}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => {
                setShowReceiptModal(false);
                setShowResendModal(true);
              }}>
                <Mail className="h-4 w-4 mr-2" />
                Resend
              </Button>
              <Button className="flex-1" onClick={() => setShowReceiptModal(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Resend Receipt Modal */}
      <Modal
        isOpen={showResendModal}
        onClose={() => setShowResendModal(false)}
        title="Resend Receipt"
        size="sm"
      >
        {selectedReceipt && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                Resend receipt <strong>{selectedReceipt.id}</strong> for {selectedReceipt.studentName}
              </p>
            </div>

            <Input
              label="Email Address"
              type="email"
              placeholder="Enter email address"
              defaultValue="student@example.com"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Send Method</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button variant="outline" onClick={() => setShowResendModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleResendReceipt}>
                <Mail className="h-4 w-4 mr-2" />
                Send Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReceiptsPage;