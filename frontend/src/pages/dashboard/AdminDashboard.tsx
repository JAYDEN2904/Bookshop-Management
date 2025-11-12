import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  AlertTriangle, 
  CreditCard,
  TrendingUp,
  Package,
  ShoppingCart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  Loader2
} from 'lucide-react';
import Card from '../../components/ui/Card';
import { useSupplier } from '../../contexts/SupplierContext';
import { useInventory } from '../../contexts/InventoryContext';
import { api } from '../../config/api';
import toast from 'react-hot-toast';

interface SalesData {
  amount: number;
  transactions: number;
  growth: number;
}

interface TopSellingBook {
  title: string;
  sales: number;
  revenue: number;
  growth: number;
}

interface RecentTransaction {
  cashier: string;
  action: string;
  amount: string;
  time: string;
  status: string;
}

const AdminDashboard: React.FC = () => {
  const { getOverduePayments, getUpcomingPayments } = useSupplier();
  const { getLowStockBooks } = useInventory();
  const [salesPeriod, setSalesPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [loading, setLoading] = useState(false);
  
  const [salesData, setSalesData] = useState<{
    today: SalesData;
    week: SalesData;
    month: SalesData;
  }>({
    today: { amount: 0, transactions: 0, growth: 0 },
    week: { amount: 0, transactions: 0, growth: 0 },
    month: { amount: 0, transactions: 0, growth: 0 }
  });
  
  const [topSellingBooks, setTopSellingBooks] = useState<TopSellingBook[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);

  // Get low stock books
  const lowStockBooks = getLowStockBooks();

  // Get overdue and upcoming payments
  const overduePayments = getOverduePayments();
  const upcomingPayments = getUpcomingPayments();

  // Calculate date ranges
  const getDateRange = (period: 'today' | 'week' | 'month') => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
    }
    
    return {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    };
  };

  // Fetch sales data for a period
  const fetchSalesData = async (period: 'today' | 'week' | 'month') => {
    try {
      const dateRange = getDateRange(period);
      const params = new URLSearchParams({
        start_date: dateRange.start_date,
        end_date: dateRange.end_date
      });
      
      const response = await api.getSalesReport(params);
      if (response.success && response.data) {
        const summary = response.data.summary;
        const amount = summary.totalSales || 0;
        const transactions = summary.totalPurchases || 0;
        
        // Calculate growth (compare with previous period)
        let growth = 0;
        if (period === 'today') {
          // Compare with yesterday
          const yesterdayRange = getDateRange('today');
          const yesterday = new Date(yesterdayRange.start_date);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayEnd = new Date(yesterday);
          yesterdayEnd.setHours(23, 59, 59, 999);
          
          try {
            const prevParams = new URLSearchParams({
              start_date: yesterday.toISOString(),
              end_date: yesterdayEnd.toISOString()
            });
            const prevResponse = await api.getSalesReport(prevParams);
            if (prevResponse.success && prevResponse.data) {
              const prevAmount = prevResponse.data.summary.totalSales || 0;
              if (prevAmount > 0) {
                growth = ((amount - prevAmount) / prevAmount) * 100;
              }
            }
          } catch (error) {
            // Ignore error for previous period
          }
        } else if (period === 'week') {
          // Compare with previous week
          const prevWeekStart = new Date(dateRange.start_date);
          prevWeekStart.setDate(prevWeekStart.getDate() - 7);
          const prevWeekEnd = new Date(dateRange.start_date);
          
          try {
            const prevParams = new URLSearchParams({
              start_date: prevWeekStart.toISOString(),
              end_date: prevWeekEnd.toISOString()
            });
            const prevResponse = await api.getSalesReport(prevParams);
            if (prevResponse.success && prevResponse.data) {
              const prevAmount = prevResponse.data.summary.totalSales || 0;
              if (prevAmount > 0) {
                growth = ((amount - prevAmount) / prevAmount) * 100;
              }
            }
          } catch (error) {
            // Ignore error for previous period
          }
        } else if (period === 'month') {
          // Compare with previous month
          const prevMonthStart = new Date(dateRange.start_date);
          prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
          const prevMonthEnd = new Date(dateRange.start_date);
          
          try {
            const prevParams = new URLSearchParams({
              start_date: prevMonthStart.toISOString(),
              end_date: prevMonthEnd.toISOString()
            });
            const prevResponse = await api.getSalesReport(prevParams);
            if (prevResponse.success && prevResponse.data) {
              const prevAmount = prevResponse.data.summary.totalSales || 0;
              if (prevAmount > 0) {
                growth = ((amount - prevAmount) / prevAmount) * 100;
              }
            }
          } catch (error) {
            // Ignore error for previous period
          }
        }
        
        setSalesData(prev => ({
          ...prev,
          [period]: { amount, transactions, growth: Math.round(growth * 10) / 10 }
        }));
      }
    } catch (error: any) {
      console.error(`Error fetching ${period} sales data:`, error);
      // Don't show toast for background fetches
    }
  };

  // Fetch top selling books
  const fetchTopSellingBooks = async () => {
    try {
      const dateRange = getDateRange('month');
      const params = new URLSearchParams({
        start_date: dateRange.start_date,
        end_date: dateRange.end_date
      });
      
      const response = await api.getSalesReport(params);
      if (response.success && response.data) {
        const bookSales = response.data.bookSales || [];
        
        // Sort by quantity and get top 5
        const topBooks = bookSales
          .sort((a: any, b: any) => b.quantity - a.quantity)
          .slice(0, 5)
          .map((bs: any) => ({
            title: bs.book?.title || 'Unknown Book',
            sales: bs.quantity || 0,
            revenue: bs.revenue || 0,
            growth: 0 // Growth calculation would need previous period data
          }));
        
        setTopSellingBooks(topBooks);
      }
    } catch (error: any) {
      console.error('Error fetching top selling books:', error);
    }
  };

  // Fetch recent transactions
  const fetchRecentTransactions = async () => {
    try {
      const params = new URLSearchParams({
        limit: '10',
        page: '1'
      });
      
      const response = await api.getPurchases(params);
      if (response.success && response.data) {
        // Group purchases by receipt_number to get transactions
        const receiptMap = new Map<string, any[]>();
        
        (response.data || []).forEach((purchase: any) => {
          const receiptNum = purchase.receipt_number || purchase.id;
          if (!receiptMap.has(receiptNum)) {
            receiptMap.set(receiptNum, []);
          }
          receiptMap.get(receiptNum)!.push(purchase);
        });
        
        // Convert to transaction format
        const transactions: RecentTransaction[] = Array.from(receiptMap.values())
          .slice(0, 5)
          .map((purchases: any[]) => {
            const firstPurchase = purchases[0];
            const totalAmount = purchases.reduce((sum, p) => sum + Number(p.total_amount || 0), 0);
            const studentName = firstPurchase.students?.name || 'Unknown Student';
            const bookTitles = purchases.map((p: any) => p.books?.title || 'Book').join(', ');
            const createdAt = new Date(firstPurchase.created_at);
            const timeAgo = getTimeAgo(createdAt);
            
            return {
              cashier: 'Cashier', // Would need to fetch cashier name from user table
              action: `Completed purchase for ${studentName}`,
              amount: `₵${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              time: timeAgo,
              status: 'completed'
            };
          });
        
        setRecentTransactions(transactions);
      }
    } catch (error: any) {
      console.error('Error fetching recent transactions:', error);
    }
  };

  // Helper to calculate time ago
  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    }
  };

  // Fetch all data on mount and when period changes
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchSalesData('today'),
      fetchSalesData('week'),
      fetchSalesData('month'),
      fetchTopSellingBooks(),
      fetchRecentTransactions()
    ]).finally(() => {
      setLoading(false);
    });
  }, []);

  // Refetch current period data when period changes
  useEffect(() => {
    fetchSalesData(salesPeriod);
  }, [salesPeriod]);

  const currentSales = salesData[salesPeriod];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's an overview of your bookshop operations</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading dashboard data...</span>
        </div>
      )}

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
              <p className="text-2xl font-bold text-gray-900">₵{currentSales.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <div className="flex items-center text-xs">
                {currentSales.growth >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-600 mr-1" />
                )}
                <span className={currentSales.growth >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {Math.abs(currentSales.growth).toFixed(1)}% from previous period
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
            <p className="text-2xl font-bold text-gray-900">₵{currentSales.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-sm text-gray-600">Total Revenue</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{currentSales.transactions}</p>
            <p className="text-sm text-gray-600">Transactions</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              ₵{currentSales.transactions > 0 ? (currentSales.amount / currentSales.transactions).toFixed(2) : '0.00'}
            </p>
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
            {topSellingBooks.length > 0 ? (
              topSellingBooks.map((book, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{book.title}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{book.sales} copies sold</span>
                      {book.growth !== 0 && (
                        <div className="flex items-center">
                          {book.growth >= 0 ? (
                            <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 text-red-600 mr-1" />
                          )}
                          <span className={book.growth >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {Math.abs(book.growth).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="font-semibold text-green-600">₵{book.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No sales data available</p>
            )}
          </div>
        </Card>

        {/* Cashier Activity Logs */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((log, index) => (
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
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent transactions</p>
            )}
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
                    <p className="font-semibold text-red-600">₵{payment.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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
                    <p className="text-sm font-medium text-yellow-700">₵{payment.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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
                    <p className="font-medium text-gray-900">{book.subject || 'Unknown'}</p>
                    <p className="text-sm text-orange-600">
                      Only {book.stock} left (Min: {book.minStock})
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-orange-700">₵{book.sellingPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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
