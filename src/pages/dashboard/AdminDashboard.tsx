import React, { useState } from 'react';
import { 
  DollarSign, 
  AlertTriangle, 
  CreditCard,
  TrendingUp,
  Package,
  Users,
  ShoppingCart,
  Activity,
  Calendar,
  Clock,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle
} from 'lucide-react';
import Card from '../../components/ui/Card';
import { useSupplier } from '../../contexts/SupplierContext';
import { useInventory } from '../../contexts/InventoryContext';

const AdminDashboard: React.FC = () => {
  const { getOverduePayments, getUpcomingPayments } = useSupplier();
  const { books } = useInventory();
  const [salesPeriod, setSalesPeriod] = useState<'today' | 'week' | 'month'>('today');

  // Mock data for sales summary
  const salesData = {
    today: { amount: 12450, transactions: 45, growth: 12 },
    week: { amount: 85600, transactions: 312, growth: 8 },
    month: { amount: 285600, transactions: 1245, growth: 18 }
  };

  // Get low stock books
  const lowStockBooks = books.filter(book => book.stock <= book.minStock);

  // Get overdue and upcoming payments
  const overduePayments = getOverduePayments();
  const upcomingPayments = getUpcomingPayments();

  // Mock top-selling books data
  const topSellingBooks = [
    { title: 'Mathematics - Class 10', sales: 45, revenue: 6750, growth: 15 },
    { title: 'English Grammar - Class 9', sales: 38, revenue: 4560, growth: 8 },
    { title: 'Science - Class 8', sales: 32, revenue: 4800, growth: 12 },
    { title: 'History - Class 7', sales: 28, revenue: 3360, growth: -3 },
    { title: 'Geography - Class 6', sales: 25, revenue: 3000, growth: 5 }
  ];

  // Mock cashier activity logs
  const cashierActivityLogs = [
    { cashier: 'Sarah Johnson', action: 'Completed purchase for Rahul Kumar', amount: '₵850', time: '2 hours ago', status: 'completed' },
    { cashier: 'Mike Chen', action: 'Processed refund for Priya Sharma', amount: '-₵200', time: '3 hours ago', status: 'refund' },
    { cashier: 'Sarah Johnson', action: 'New student registration', amount: '₵1,200', time: '4 hours ago', status: 'completed' },
    { cashier: 'Mike Chen', action: 'Bulk purchase for Class 10-A', amount: '₵2,450', time: '5 hours ago', status: 'completed' },
    { cashier: 'Sarah Johnson', action: 'Partial payment received', amount: '₵500', time: '6 hours ago', status: 'partial' }
  ];

  const currentSales = salesData[salesPeriod];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Overview of your bookshop operations</p>
      </div>

      {/* Sales Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {salesPeriod === 'today' ? "Today's Sales" : 
                 salesPeriod === 'week' ? "This Week's Sales" : "This Month's Sales"}
              </p>
              <p className="text-2xl font-bold text-gray-900">₵{currentSales.amount.toLocaleString()}</p>
              <div className="flex items-center text-xs">
                {currentSales.growth >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-600 mr-1" />
                )}
                <span className={currentSales.growth >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {Math.abs(currentSales.growth)}% from previous period
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Stock Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{lowStockBooks.length}</p>
              <p className="text-xs text-red-600">Immediate attention needed</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Supplier Payments Due</p>
              <p className="text-2xl font-bold text-gray-900">{overduePayments.length}</p>
              <p className="text-xs text-orange-600">Overdue payments</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{currentSales.transactions}</p>
              <p className="text-xs text-blue-600">This {salesPeriod}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Sales Period Selector */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Sales Summary</h3>
          <div className="flex space-x-2">
            {(['today', 'week', 'month'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSalesPeriod(period)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  salesPeriod === period
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">₵{currentSales.amount.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Total Revenue</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{currentSales.transactions}</p>
            <p className="text-sm text-gray-600">Transactions</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">₵{(currentSales.amount / currentSales.transactions).toFixed(0)}</p>
            <p className="text-sm text-gray-600">Avg. Transaction</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Books */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Selling Books</h3>
            <Package className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {topSellingBooks.map((book, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{book.title}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>{book.sales} copies sold</span>
                    <div className="flex items-center">
                      {book.growth >= 0 ? (
                        <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-red-600 mr-1" />
                      )}
                      <span className={book.growth >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {Math.abs(book.growth)}%
                      </span>
                    </div>
                  </div>
                </div>
                <p className="font-semibold text-green-600">{book.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Cashier Activity Logs */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Cashier Activity Logs</h3>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {cashierActivityLogs.map((log, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${
                  log.status === 'completed' ? 'bg-green-100' :
                  log.status === 'refund' ? 'bg-red-100' :
                  'bg-yellow-100'
                }`}>
                  <ShoppingCart className={`h-4 w-4 ${
                    log.status === 'completed' ? 'text-green-600' :
                    log.status === 'refund' ? 'text-red-600' :
                    'text-yellow-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{log.action}</p>
                  <p className="text-xs text-gray-600">by {log.cashier} • {log.time}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    log.status === 'refund' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {log.amount}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    log.status === 'completed' ? 'bg-green-100 text-green-800' :
                    log.status === 'refund' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {log.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supplier Payments Due */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Supplier Payments Due</h3>
            <CreditCard className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {overduePayments.length > 0 ? (
              overduePayments.map((payment, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <p className="font-medium text-gray-900">{payment.supplierName}</p>
                    <p className="text-sm text-red-600">
                      Due: {new Date(payment.expectedPaymentDate || '').toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">₵{payment.totalAmount.toLocaleString()}</p>
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                      Overdue
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-gray-600">No overdue payments</p>
              </div>
            )}
            
            {upcomingPayments.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Upcoming Payments</h4>
                {upcomingPayments.slice(0, 3).map((payment, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{payment.supplierName}</p>
                      <p className="text-xs text-yellow-600">
                        Due: {new Date(payment.expectedPaymentDate || '').toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-yellow-700">₵{payment.totalAmount.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h3>
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          </div>
          <div className="space-y-4">
            {lowStockBooks.length > 0 ? (
              lowStockBooks.slice(0, 5).map((book, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div>
                    <p className="font-medium text-gray-900">{book.title}</p>
                    <p className="text-sm text-orange-600">
                      Only {book.stock} left (Min: {book.minStock})
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-orange-700">₵{book.sellingPrice}</p>
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                      Low Stock
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-gray-600">All stock levels are good</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Stock Overview Chart Placeholder */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Stock Inflow vs Outflow</h3>
          <select className="text-sm border border-gray-300 rounded-md px-3 py-1">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 3 months</option>
          </select>
        </div>
        <div className="h-64 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Chart visualization would go here</p>
            <p className="text-sm text-gray-500">Stock trends and analytics</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;