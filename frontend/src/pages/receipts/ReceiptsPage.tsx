import React, { useState, useEffect, useCallback } from 'react';
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
  Globe,
  Loader
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { Purchase, PurchaseItem } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../config/api';
import toast from 'react-hot-toast';

// Helper function to group purchases by receipt number
const groupPurchasesByReceipt = (purchases: any[], currentUser: any): Purchase[] => {
  const receiptMap = new Map<string, any>();
  
  purchases.forEach((purchase) => {
    const receiptNumber = purchase.receipt_number || purchase.id;
    const student = purchase.students;
    const book = purchase.books;
    const cashier = purchase.cashier || currentUser; // Use cashier from purchase or fallback to current user
    
    if (!receiptMap.has(receiptNumber)) {
      receiptMap.set(receiptNumber, {
        id: receiptNumber,
        studentId: purchase.student_id,
        actualStudentId: student?.student_id || 'N/A', // Actual student ID (e.g., "ST001")
        studentName: student?.name || 'Unknown Student',
        items: [],
        total: 0,
        discount: 0, // Discount is not stored in purchases table
        paymentMode: 'cash' as const, // Default, as payment mode is not stored
        cashierId: cashier?.id || currentUser?.id || '',
        cashierName: cashier?.name || currentUser?.name || 'Unknown Cashier',
        createdAt: purchase.created_at,
      });
    }
    
    const receipt = receiptMap.get(receiptNumber);
    const item: PurchaseItem = {
      bookId: purchase.book_id,
      title: book?.title || book?.subject || 'Unknown Book',
      quantity: purchase.quantity,
      price: Number(purchase.unit_price),
      total: Number(purchase.total_amount),
    };
    
    receipt.items.push(item);
    receipt.total += item.total;
  });
  
  return Array.from(receiptMap.values());
};

const ReceiptsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  
  const [receipts, setReceipts] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [cashierFilter, setCashierFilter] = useState('all');
  const [selectedReceipt, setSelectedReceipt] = useState<Purchase | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showResendModal, setShowResendModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Fetch purchases from API
  const fetchReceipts = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('limit', '1000'); // Get a large number of purchases
      params.append('page', '1');
      
      // Apply date filter
      const now = new Date();
      if (dateFilter === 'today') {
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        params.append('start_date', today.toISOString());
      } else if (dateFilter === 'yesterday') {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        params.append('start_date', yesterday.toISOString());
        params.append('end_date', todayStart.toISOString());
      } else if (dateFilter === 'last_7_days') {
        const lastWeek = new Date(now);
        lastWeek.setDate(lastWeek.getDate() - 7);
        lastWeek.setHours(0, 0, 0, 0);
        params.append('start_date', lastWeek.toISOString());
      } else if (dateFilter === 'last_30_days') {
        const lastMonth = new Date(now);
        lastMonth.setDate(lastMonth.getDate() - 30);
        lastMonth.setHours(0, 0, 0, 0);
        params.append('start_date', lastMonth.toISOString());
      }
      // If dateFilter is 'all', don't add date filters (get all receipts)
      
      const response = await api.getPurchases(params);
      
      console.log('Receipts API response:', response);
      
      if (response && response.success && response.data) {
        console.log('Grouping purchases:', response.data.length, 'purchases');
        const groupedReceipts = groupPurchasesByReceipt(response.data, user);
        console.log('Grouped receipts:', groupedReceipts.length, 'receipts');
        setReceipts(groupedReceipts);
      } else {
        const errorMsg = response?.error || 'Failed to load receipts';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err: any) {
      console.error('Error fetching receipts:', err);
      const errorMsg = err.message || 'Failed to load receipts';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [user, dateFilter]);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  // Get unique cashiers for admin filtering
  const uniqueCashiers = Array.from(new Set(receipts.map(r => r.cashierName)));

  const filteredReceipts = receipts.filter(receipt => {
    const matchesSearch = receipt.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         receipt.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (isAdmin && receipt.cashierName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPayment = paymentFilter === 'all' || receipt.paymentMode === paymentFilter;
    const matchesCashier = cashierFilter === 'all' || receipt.cashierName === cashierFilter;
    
    return matchesSearch && matchesPayment && matchesCashier;
  });

  const totalAmount = filteredReceipts.reduce((sum, receipt) => sum + receipt.total, 0);
  const totalTransactions = filteredReceipts.length;

  const handlePrintReceipt = (receipt: Purchase & { actualStudentId?: string }) => {
    const { date, time } = formatDateTime(receipt.createdAt);
    const subtotal = receipt.items.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = receipt.discount > 0 
      ? Math.round((subtotal * receipt.discount) / 100) 
      : 0;
    const actualStudentId = (receipt as any).actualStudentId || 'N/A';

    // Create print window
    const printWindow = window.open('', '_blank', 'width=600,height=800');
    if (!printWindow) {
      toast.error('Please allow popups to print receipts');
      return;
    }

    // Generate HTML for compact A6 receipt (105mm × 148mm)
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Receipt ${receipt.id}</title>
          <style>
            @page {
              size: A6;
              margin: 5mm;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Arial', 'Helvetica', sans-serif;
              color: #000;
              background: #fff;
              line-height: 1.3;
              font-size: 8pt;
              width: 95mm;
              height: 138mm;
              overflow: hidden;
            }
            .receipt-container {
              width: 100%;
              padding: 3mm;
            }
            .header {
              border-bottom: 2px solid #000;
              padding-bottom: 3mm;
              margin-bottom: 3mm;
            }
            .header-top {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 2mm;
            }
            .school-info {
              flex: 1;
            }
            .school-name {
              font-size: 11pt;
              font-weight: bold;
              letter-spacing: 0.5px;
              margin-bottom: 1mm;
              text-transform: uppercase;
            }
            .school-tagline {
              font-size: 7pt;
              font-style: italic;
              color: #333;
            }
            .receipt-number {
              text-align: right;
              border: 1px solid #000;
              padding: 2mm 3mm;
            }
            .receipt-label {
              font-size: 6pt;
              font-weight: bold;
              text-transform: uppercase;
              margin-bottom: 1mm;
            }
            .receipt-id {
              font-size: 9pt;
              font-weight: bold;
              font-family: 'Courier New', monospace;
            }
            .info-section {
              display: flex;
              justify-content: space-between;
              margin-bottom: 3mm;
              padding: 2mm 0;
              border-top: 1px solid #000;
              border-bottom: 1px solid #000;
              font-size: 7pt;
            }
            .info-column {
              flex: 1;
              padding: 0 2mm;
            }
            .info-column:first-child {
              border-right: 1px solid #000;
              padding-left: 0;
            }
            .info-column:last-child {
              padding-right: 0;
            }
            .info-label {
              font-size: 6pt;
              font-weight: bold;
              text-transform: uppercase;
              margin-bottom: 1mm;
              color: #333;
            }
            .info-value {
              font-size: 7pt;
              margin-bottom: 2mm;
              line-height: 1.4;
            }
            .items-section {
              margin-bottom: 3mm;
            }
            .section-title {
              font-size: 7pt;
              font-weight: bold;
              text-transform: uppercase;
              margin-bottom: 2mm;
              border-bottom: 1px solid #000;
              padding-bottom: 1mm;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 2mm;
              font-size: 7pt;
            }
            .items-table thead {
              background-color: #f5f5f5;
            }
            .items-table th {
              padding: 1.5mm 1mm;
              text-align: left;
              font-weight: bold;
              font-size: 6pt;
              text-transform: uppercase;
              border-bottom: 1px solid #000;
              border-top: 1px solid #000;
            }
            .items-table th:last-child,
            .items-table td:last-child {
              text-align: right;
            }
            .items-table th:nth-child(2),
            .items-table td:nth-child(2),
            .items-table th:nth-child(3),
            .items-table td:nth-child(3),
            .items-table th:nth-child(4),
            .items-table td:nth-child(4) {
              text-align: right;
            }
            .items-table td {
              padding: 1.5mm 1mm;
              border-bottom: 0.5px solid #ddd;
              font-size: 7pt;
              word-wrap: break-word;
            }
            .items-table td:first-child {
              max-width: 40mm;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .items-table tbody tr:last-child td {
              border-bottom: 1px solid #000;
            }
            .totals-section {
              margin-top: 2mm;
              margin-bottom: 2mm;
            }
            .totals-table {
              width: 100%;
              max-width: 50mm;
              margin-left: auto;
              border-collapse: collapse;
              font-size: 7pt;
            }
            .totals-table td {
              padding: 1mm 2mm;
            }
            .totals-table td:first-child {
              text-align: right;
              font-weight: normal;
              border-right: 0.5px solid #ddd;
            }
            .totals-table td:last-child {
              text-align: right;
              font-weight: bold;
            }
            .totals-table .subtotal-row td {
              border-top: 0.5px solid #ddd;
            }
            .totals-table .discount-row td {
              color: #333;
            }
            .totals-table .total-row {
              border-top: 1.5px solid #000;
              border-bottom: 1.5px solid #000;
            }
            .totals-table .total-row td {
              font-size: 9pt;
              font-weight: bold;
              padding: 2mm;
            }
            .payment-section {
              margin-top: 2mm;
              padding: 2mm;
              border: 1.5px solid #000;
              background-color: #f9f9f9;
            }
            .payment-label {
              font-size: 6pt;
              font-weight: bold;
              text-transform: uppercase;
              margin-bottom: 1mm;
            }
            .payment-value {
              font-size: 8pt;
              font-weight: bold;
              text-transform: uppercase;
            }
            .footer {
              margin-top: 3mm;
              padding-top: 2mm;
              border-top: 1px solid #000;
              text-align: center;
              font-size: 6pt;
              color: #333;
            }
            .footer-line {
              margin: 1mm 0;
            }
            .thank-you {
              margin-top: 2mm;
              text-align: center;
              font-size: 7pt;
              font-style: italic;
              font-weight: bold;
            }
            @media print {
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
                width: 95mm;
                height: 138mm;
              }
              .receipt-container {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <!-- Header -->
            <div class="header">
              <div class="header-top">
                <div class="school-info">
                  <div class="school-name">School Bookshop</div>
                  <div class="school-tagline">Official Receipt</div>
                </div>
                <div class="receipt-number">
                  <div class="receipt-label">Receipt #</div>
                  <div class="receipt-id">${receipt.id}</div>
                </div>
              </div>
            </div>

            <!-- Information Section -->
            <div class="info-section">
              <div class="info-column">
                <div class="info-label">Billed To</div>
                <div class="info-value">
                  <strong>${receipt.studentName}</strong><br>
                  ID: ${actualStudentId}
                </div>
                <div class="info-label">Date & Time</div>
                <div class="info-value">${date}<br>${time}</div>
              </div>
              <div class="info-column">
                <div class="info-label">Cashier</div>
                <div class="info-value">
                  <strong>${receipt.cashierName}</strong>
                </div>
                <div class="info-label">Payment</div>
                <div class="info-value">${receipt.paymentMode.toUpperCase()}</div>
              </div>
            </div>

            <!-- Items Section -->
            <div class="items-section">
              <div class="section-title">Items</div>
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${receipt.items.map((item: PurchaseItem) => `
                    <tr>
                      <td>${item.title}</td>
                      <td>${item.quantity}</td>
                      <td>₵${item.price.toFixed(2)}</td>
                      <td>₵${item.total.toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <!-- Totals Section -->
            <div class="totals-section">
              <table class="totals-table">
                <tr class="subtotal-row">
                  <td>Subtotal:</td>
                  <td>₵${subtotal.toFixed(2)}</td>
                </tr>
                ${receipt.discount > 0 ? `
                <tr class="discount-row">
                  <td>Discount (${receipt.discount}%):</td>
                  <td>-₵${discountAmount.toFixed(2)}</td>
                </tr>
                ` : ''}
                <tr class="total-row">
                  <td>TOTAL:</td>
                  <td>₵${receipt.total.toFixed(2)}</td>
                </tr>
              </table>
            </div>

            <!-- Payment Section -->
            <div class="payment-section">
              <div class="payment-label">Payment Method</div>
              <div class="payment-value">${receipt.paymentMode.toUpperCase()}</div>
            </div>

            <!-- Thank You Message -->
            <div class="thank-you">
              Thank you for your purchase!
            </div>

            <!-- Footer -->
            <div class="footer">
              <div class="footer-line">Official Receipt - Keep for your records</div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);

    toast.success('Opening print preview...');
  };

  const handleResendReceipt = () => {
    if (!selectedReceipt) return;
    toast.success(`Receipt ${selectedReceipt.id} sent successfully`);
    setShowResendModal(false);
    setSelectedReceipt(null);
  };

  const handleExportAll = async () => {
    try {
      // Export receipts as CSV
      const headers = ['Receipt ID', 'Date', 'Student', 'Items', 'Total', 'Payment Method', 'Cashier'];
      const rows = filteredReceipts.map(receipt => [
        receipt.id,
        new Date(receipt.createdAt).toLocaleString(),
        receipt.studentName,
        receipt.items.map(i => `${i.title} x${i.quantity}`).join('; '),
        receipt.total.toFixed(2),
        receipt.paymentMode,
        receipt.cashierName
      ]);
      
      const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipts_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('Receipts exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export receipts');
    }
  };

  const handleRefresh = async () => {
    await fetchReceipts();
    toast.success('Receipts refreshed');
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading receipts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

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
          <Button variant="outline" onClick={handleRefresh}>
            <Calendar className="h-4 w-4 mr-2" />
            Refresh
          </Button>
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
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-6 py-8 text-center text-gray-500">
                    No receipts found
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((receipt) => {
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
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{receipt.items.length} items</div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {receipt.items.slice(0, 2).map(item => item.title).join(', ')}
                          {receipt.items.length > 2 && '...'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">₵{receipt.total.toFixed(2)}</div>
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
                })
              )}
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