import React from 'react';
import { 
  DollarSign, 
  AlertTriangle,
  ShoppingCart,
  Clock,
  TrendingUp
} from 'lucide-react';
import Card from '../../components/ui/Card';

const CashierDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cashier Dashboard</h1>
        <p className="text-gray-600">Your daily sales overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's Sales</p>
              <p className="text-2xl font-bold text-gray-900">₵8,450</p>
              <p className="text-xs text-green-600">32 transactions</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Items Sold</p>
              <p className="text-2xl font-bold text-gray-900">127</p>
              <p className="text-xs text-blue-600">Books & supplies</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-gray-900">5</p>
              <p className="text-xs text-orange-600">Check inventory</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            <Clock className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {[
                      { student: 'Rahul Kumar', class: 'Class 10-A', amount: '₵850', time: '10:30 AM' },
        { student: 'Priya Sharma', class: 'Class 9-B', amount: '₵650', time: '10:15 AM' },
        { student: 'Amit Singh', class: 'Class 8-C', amount: '₵1,200', time: '09:45 AM' },
        { student: 'Sneha Patel', class: 'Class 11-A', amount: '₵950', time: '09:30 AM' },
            ].map((transaction, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{transaction.student}</p>
                  <p className="text-sm text-gray-600">{transaction.class}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">{transaction.amount}</p>
                  <p className="text-xs text-gray-500">{transaction.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Low Stock Alert</h3>
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          </div>
          <div className="space-y-4">
            {[
              { title: 'Mathematics - Class 10', stock: 3, minStock: 10 },
              { title: 'Science - Class 9', stock: 5, minStock: 15 },
              { title: 'English - Class 8', stock: 2, minStock: 12 },
              { title: 'History - Class 7', stock: 1, minStock: 8 },
              { title: 'Geography - Class 6', stock: 4, minStock: 10 },
            ].map((book, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div>
                  <p className="font-medium text-gray-900">{book.title}</p>
                  <p className="text-sm text-red-600">Only {book.stock} left (Min: {book.minStock})</p>
                </div>
                <div className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                  Low Stock
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-center">
            <ShoppingCart className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">New Purchase</p>
          </button>
          <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-center">
            <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">View Receipts</p>
          </button>
          <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-center">
            <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Sales Report</p>
          </button>
          <button className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-center">
            <AlertTriangle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Stock Alerts</p>
          </button>
        </div>
      </Card>
    </div>
  );
};

export default CashierDashboard;