import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle,
  ShoppingCart,
  Clock,
  TrendingUp,
  Users,
  BookOpen,
  CheckCircle,
  ArrowUpRight,
  Loader2
} from 'lucide-react';
import Card from '../../components/ui/Card';
import { useInventory } from '../../contexts/InventoryContext';
import { Link } from 'react-router-dom';
import { api } from '../../config/api';
import toast from 'react-hot-toast';

interface TodaySales {
  total: number;
  transactions: number;
  items: number;
  growth: number;
  averageTransaction: number;
}

interface RecentTransaction {
  student: string;
  class: string;
  amount: number;
  time: string;
  items: number;
}

interface TopSellingItem {
  title: string;
  sold: number;
  revenue: number;
}

const CashierDashboard: React.FC = () => {
  const { getLowStockBooks } = useInventory();
  const [loading, setLoading] = useState(false);
  const [todaySales, setTodaySales] = useState<TodaySales>({
    total: 0,
    transactions: 0,
    items: 0,
    growth: 0,
    averageTransaction: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [topSellingItems, setTopSellingItems] = useState<TopSellingItem[]>([]);

  // Get low stock books
  const lowStockBooks = getLowStockBooks();

  // Get today's date range
  const getTodayRange = () => {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    return {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    };
  };

  // Get yesterday's date range for growth calculation
  const getYesterdayRange = () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 1);
    endDate.setHours(23, 59, 59, 999);
    return {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    };
  };

  // Fetch today's sales data
  const fetchTodaySales = async () => {
    try {
      const todayRange = getTodayRange();
      const params = new URLSearchParams({
        start_date: todayRange.start_date,
        end_date: todayRange.end_date
      });
      
      const response = await api.getSalesReport(params);
      if (response.success && response.data) {
        const summary = response.data.summary;
        const total = summary.totalSales || 0;
        const transactions = summary.totalPurchases || 0;
        const items = summary.totalQuantity || 0;
        const averageTransaction = transactions > 0 ? total / transactions : 0;
        
        // Calculate growth compared to yesterday
        let growth = 0;
        try {
          const yesterdayRange = getYesterdayRange();
          const yesterdayParams = new URLSearchParams({
            start_date: yesterdayRange.start_date,
            end_date: yesterdayRange.end_date
          });
          const yesterdayResponse = await api.getSalesReport(yesterdayParams);
          if (yesterdayResponse.success && yesterdayResponse.data) {
            const yesterdayTotal = yesterdayResponse.data.summary.totalSales || 0;
            if (yesterdayTotal > 0) {
              growth = ((total - yesterdayTotal) / yesterdayTotal) * 100;
            }
          }
        } catch (error) {
          // Ignore error for yesterday's data
        }
        
        setTodaySales({
          total,
          transactions,
          items,
          growth: Math.round(growth * 10) / 10,
          averageTransaction
        });
      }
    } catch (error: any) {
      console.error('Error fetching today sales:', error);
      toast.error('Failed to load today\'s sales data');
    }
  };

  // Fetch recent transactions
  const fetchRecentTransactions = async () => {
    try {
      const todayRange = getTodayRange();
      const params = new URLSearchParams({
        start_date: todayRange.start_date,
        end_date: todayRange.end_date,
        limit: '50',
        page: '1'
      });
      
      const response = await api.getPurchases(params);
      if (response.success && response.data) {
        // Group purchases by receipt_number
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
            const totalItems = purchases.reduce((sum, p) => sum + Number(p.quantity || 0), 0);
            const studentName = firstPurchase.students?.name || 'Unknown Student';
            const classLevel = firstPurchase.students?.class_level || 'Unknown';
            const createdAt = new Date(firstPurchase.created_at);
            const timeStr = createdAt.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            });
            
            return {
              student: studentName,
              class: classLevel,
              amount: totalAmount,
              time: timeStr,
              items: totalItems
            };
          });
        
        setRecentTransactions(transactions);
      }
    } catch (error: any) {
      console.error('Error fetching recent transactions:', error);
    }
  };

  // Fetch top selling items today
  const fetchTopSellingItems = async () => {
    try {
      const todayRange = getTodayRange();
      const params = new URLSearchParams({
        start_date: todayRange.start_date,
        end_date: todayRange.end_date
      });
      
      const response = await api.getSalesReport(params);
      if (response.success && response.data) {
        const bookSales = response.data.bookSales || [];
        
        // Sort by quantity and get top 4
        const topItems = bookSales
          .sort((a: any, b: any) => b.quantity - a.quantity)
          .slice(0, 4)
          .map((bs: any) => ({
            title: bs.book?.title || 'Unknown Book',
            sold: bs.quantity || 0,
            revenue: bs.revenue || 0
          }));
        
        setTopSellingItems(topItems);
      }
    } catch (error: any) {
      console.error('Error fetching top selling items:', error);
    }
  };

  // Fetch all data on mount
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchTodaySales(),
      fetchRecentTransactions(),
      fetchTopSellingItems()
    ]).finally(() => {
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cashier Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your daily sales overview</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading dashboard data...</span>
        </div>
      )}

      {/* Today's Sales Summary */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Today's Sales</h3>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">Live updates</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">₵{todaySales.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-sm text-gray-600">Total Sales</p>
            {todaySales.growth !== 0 && (
              <div className="flex items-center justify-center mt-1">
                {todaySales.growth >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                ) : (
                  <ArrowUpRight className="h-3 w-3 text-red-600 mr-1 rotate-180" />
                )}
                <span className={`text-xs ${todaySales.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(todaySales.growth).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{todaySales.transactions}</p>
            <p className="text-sm text-gray-600">Transactions</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{todaySales.items}</p>
            <p className="text-sm text-gray-600">Items Sold</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">₵{todaySales.averageTransaction.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-sm text-gray-600">Avg. Transaction</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            <Clock className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{transaction.student}</p>
                    <p className="text-sm text-gray-600">{transaction.class} • {transaction.items} items</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">₵{transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-xs text-gray-500">{transaction.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No transactions today</p>
            )}
          </div>
        </Card>

        {/* Top Selling Items Today */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Selling Items Today</h3>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {topSellingItems.length > 0 ? (
              topSellingItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-600">{item.sold} copies sold</p>
                  </div>
                  <p className="font-semibold text-green-600">₵{item.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No sales data available</p>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alert */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Low Stock Alert</h3>
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          </div>
          <div className="space-y-4">
            {lowStockBooks.length > 0 ? (
              lowStockBooks.slice(0, 5).map((book, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <p className="font-medium text-gray-900">{book.subject || 'Unknown'}</p>
                    <p className="text-sm text-red-600">Only {book.stock} left (Min: {book.minStock})</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-700">₵{book.sellingPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
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

        {/* Quick Access */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Access</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link 
              to="/purchase"
              className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-center group"
            >
              <ShoppingCart className="h-8 w-8 text-blue-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-medium text-gray-900">New Purchase</p>
              <p className="text-xs text-gray-600 mt-1">Process student purchase</p>
            </Link>
            <Link 
              to="/receipts"
              className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-center group"
            >
              <Clock className="h-8 w-8 text-green-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-medium text-gray-900">View Receipts</p>
              <p className="text-xs text-gray-600 mt-1">Today's transactions</p>
            </Link>
            <Link 
              to="/students"
              className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-center group"
            >
              <Users className="h-8 w-8 text-purple-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-medium text-gray-900">Students</p>
              <p className="text-xs text-gray-600 mt-1">Manage students</p>
            </Link>
            <Link 
              to="/inventory"
              className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-center group"
            >
              <BookOpen className="h-8 w-8 text-orange-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-medium text-gray-900">Inventory</p>
              <p className="text-xs text-gray-600 mt-1">Check stock levels</p>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CashierDashboard;
