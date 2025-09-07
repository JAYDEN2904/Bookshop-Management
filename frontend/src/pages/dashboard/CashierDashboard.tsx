import React from 'react';
import { 
  AlertTriangle,
  ShoppingCart,
  Clock,
  TrendingUp,
  Users,
  BookOpen,
  CheckCircle,
  ArrowUpRight
} from 'lucide-react';
import Card from '../../components/ui/Card';
import { useInventory } from '../../contexts/InventoryContext';
import { Link } from 'react-router-dom';

const CashierDashboard: React.FC = () => {
  const { books } = useInventory();

  // Get low stock books
  const lowStockBooks = books.filter(book => book.stock <= book.minStock);

  // Mock today's sales data
  const todaySales = {
    total: 8450,
    transactions: 32,
    items: 127,
    growth: 8,
    averageTransaction: 264
  };

  // Mock recent transactions
  const recentTransactions = [
    { student: 'Rahul Kumar', class: 'Basic 9-A', amount: 850, time: '10:30 AM', items: 5 },
    { student: 'Priya Sharma', class: 'Basic 8-B', amount: 650, time: '10:15 AM', items: 4 },
    { student: 'Amit Singh', class: 'Basic 7-C', amount: 1200, time: '09:45 AM', items: 8 },
    { student: 'Sneha Patel', class: 'Basic 6-A', amount: 950, time: '09:30 AM', items: 6 },
    { student: 'Kavya Reddy', class: 'Basic 5-B', amount: 750, time: '09:20 AM', items: 3 }
  ];

  // Mock top selling items today
  const topSellingItems = [
    { title: 'Mathematics - Basic 9', sold: 12, revenue: 1800 },
    { title: 'English Grammar - Basic 8', sold: 8, revenue: 960 },
    { title: 'Science - Basic 7', sold: 6, revenue: 720 },
    { title: 'History - Basic 6', sold: 4, revenue: 480 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cashier Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your daily sales overview</p>
      </div>

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
            <p className="text-2xl font-bold text-green-600">₵{todaySales.total.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Total Sales</p>
            <div className="flex items-center justify-center mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-xs text-green-600">+{todaySales.growth}%</span>
            </div>
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
            <p className="text-2xl font-bold text-orange-600">₵{todaySales.averageTransaction}</p>
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
            {recentTransactions.map((transaction, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{transaction.student}</p>
                  <p className="text-sm text-gray-600">{transaction.class} • {transaction.items} items</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">₵{transaction.amount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{transaction.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Selling Items Today */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Selling Items Today</h3>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {topSellingItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-600">{item.sold} copies sold</p>
                </div>
                <p className="font-semibold text-green-600">₵{item.revenue.toLocaleString()}</p>
              </div>
            ))}
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
                    <p className="font-medium text-gray-900">{book.subject}</p>
                    <p className="text-sm text-red-600">Only {book.stock} left (Min: {book.minStock})</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-700">₵{book.sellingPrice}</p>
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