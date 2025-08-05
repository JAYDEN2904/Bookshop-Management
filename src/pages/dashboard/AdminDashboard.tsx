import React from 'react';
import { 
  DollarSign, 
  AlertTriangle, 
  CreditCard,
  TrendingUp,
  Package,
  Users,
  ShoppingCart,
  Activity
} from 'lucide-react';
import Card from '../../components/ui/Card';

const AdminDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Overview of your bookshop operations</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's Sales</p>
              <p className="text-2xl font-bold text-gray-900">₵12,450</p>
              <p className="text-xs text-green-600">+12% from yesterday</p>
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
              <p className="text-2xl font-bold text-gray-900">8</p>
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
              <p className="text-sm font-medium text-gray-600">Pending Payments</p>
              <p className="text-2xl font-bold text-gray-900">₵45,200</p>
              <p className="text-xs text-orange-600">3 suppliers</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₵285,600</p>
              <p className="text-xs text-blue-600">+18% growth</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Books */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Selling Books</h3>
            <Package className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {[
                      { title: 'Mathematics - Class 10', sales: 45, revenue: '₵6,750' },
        { title: 'English Grammar - Class 9', sales: 38, revenue: '₵4,560' },
        { title: 'Science - Class 8', sales: 32, revenue: '₵4,800' },
        { title: 'History - Class 7', sales: 28, revenue: '₵3,360' },
            ].map((book, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{book.title}</p>
                  <p className="text-sm text-gray-600">{book.sales} copies sold</p>
                </div>
                <p className="font-semibold text-green-600">{book.revenue}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {[
              { action: 'Stock added for Mathematics Class 10', user: 'Admin', time: '2 hours ago', icon: Package },
              { action: 'Purchase completed by Rahul Kumar', user: 'Sarah (Cashier)', time: '3 hours ago', icon: ShoppingCart },
              { action: 'New supplier added: Oxford Publications', user: 'Admin', time: '5 hours ago', icon: Users },
              { action: 'Low stock alert: English Grammar Class 9', user: 'System', time: '6 hours ago', icon: AlertTriangle },
            ].map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <activity.icon className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-600">by {activity.user} • {activity.time}</p>
                </div>
              </div>
            ))}
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