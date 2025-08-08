import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Download,
  Filter,
  PieChart,
  FileText,
  Calculator
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sales' | 'inventory' | 'suppliers' | 'finance'>('sales');
  const [dateRange, setDateRange] = useState('last_30_days');

  const tabs = [
    { id: 'sales', label: 'Sales Reports', icon: BarChart3 },
    { id: 'inventory', label: 'Inventory Reports', icon: Package },
    { id: 'suppliers', label: 'Supplier Reports', icon: TrendingUp },
    { id: 'finance', label: 'Financial Reports', icon: DollarSign }
  ];

  const salesData = [
    { period: 'Jan 2024', sales: 125000, transactions: 450, profit: 25000 },
    { period: 'Feb 2024', sales: 138000, transactions: 520, profit: 28000 },
    { period: 'Mar 2024', sales: 142000, transactions: 580, profit: 32000 },
    { period: 'Apr 2024', sales: 156000, transactions: 620, profit: 35000 },
  ];

  const topBooks = [
    { title: 'Mathematics Basic 9', sales: 245, revenue: 36750 },
    { title: 'English Grammar Basic 8', sales: 189, revenue: 22680 },
    { title: 'Science Basic 8', sales: 167, revenue: 21710 },
    { title: 'History Basic 7', sales: 134, revenue: 16080 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive business insights and financial reports</p>
        </div>
        <div className="flex space-x-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days</option>
            <option value="last_3_months">Last 3 Months</option>
            <option value="last_year">Last Year</option>
            <option value="custom">Custom Range</option>
          </select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₵561,000</p>
              <p className="text-xs text-green-600">+12% from last month</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Profit</p>
              <p className="text-2xl font-bold text-gray-900">₵120,000</p>
              <p className="text-xs text-blue-600">+18% from last month</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Items Sold</p>
              <p className="text-2xl font-bold text-gray-900">2,170</p>
              <p className="text-xs text-purple-600">+8% from last month</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Order Value</p>
              <p className="text-2xl font-bold text-gray-900">₵258</p>
              <p className="text-xs text-orange-600">+5% from last month</p>
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
          {activeTab === 'sales' && (
            <div className="space-y-6">
              {/* Sales Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Sales Trend</h3>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                  <div className="h-64 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Sales trend chart</p>
                      <p className="text-sm text-gray-500">Monthly sales visualization</p>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Top Selling Books</h3>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {topBooks.map((book, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                  <p className="font-medium text-gray-900">{book.title}</p>
                          <p className="text-sm text-gray-600">{book.sales} copies sold</p>
                        </div>
                        <p className="font-semibold text-green-600">₵{book.revenue.toLocaleString('en-US')}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Sales Table */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Monthly Sales Summary</h3>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Detailed Report
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Sales</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transactions</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profit</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Growth</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {salesData.map((data, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {data.period}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₵{data.sales.toLocaleString('en-US')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {data.transactions}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                            ₵{data.profit.toLocaleString('en-US')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                            +{Math.floor(Math.random() * 15 + 5)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Levels</h3>
                  <div className="h-64 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Stock level chart</p>
                      <p className="text-sm text-gray-500">Current vs minimum stock</p>
                    </div>
                  </div>
                </Card>

                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Turnover</h3>
                  <div className="space-y-4">
                    {[
                      { category: 'Basic 9 Books', turnover: '8.5x', status: 'High' },
                      { category: 'Basic 8 Books', turnover: '6.2x', status: 'Medium' },
                      { category: 'Basic 7 Books', turnover: '4.8x', status: 'Medium' },
                      { category: 'Stationery', turnover: '12.3x', status: 'High' },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{item.category}</p>
                          <p className="text-sm text-gray-600">Turnover: {item.turnover}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          item.status === 'High' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Movement Analysis</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Book</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Opening Stock</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchased</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sold</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {[
                        { book: 'Mathematics Basic 9', opening: 50, purchased: 100, sold: 125, current: 25, value: 3750 },
                        { book: 'English Grammar Basic 8', opening: 40, purchased: 60, sold: 78, current: 22, value: 2860 },
                        { book: 'Science Basic 8', opening: 35, purchased: 50, sold: 65, current: 20, value: 2600 },
                      ].map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.book}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.opening}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">+{item.purchased}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">-{item.sold}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.current}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₵{item.value.toLocaleString('en-US')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'suppliers' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Supplier Performance</h3>
                  <div className="space-y-4">
                    {[
                      { name: 'NCERT Publications', orders: 12, onTime: 95, rating: 4.8 },
                      { name: 'S Chand Publications', orders: 8, onTime: 88, rating: 4.5 },
                      { name: 'Oxford University Press', orders: 6, onTime: 92, rating: 4.7 },
                    ].map((supplier, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{supplier.name}</h4>
                          <span className="text-sm text-yellow-600">★ {supplier.rating}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Orders: {supplier.orders}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">On-time: {supplier.onTime}%</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status</h3>
                  <div className="h-64 bg-gradient-to-r from-red-50 to-green-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Payment status chart</p>
                      <p className="text-sm text-gray-500">Outstanding vs paid amounts</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit & Loss Statement</h3>
                  <div className="space-y-3">
                    {[
                      { item: 'Total Revenue', amount: 561000, type: 'positive' },
                      { item: 'Cost of Goods Sold', amount: -340000, type: 'negative' },
                      { item: 'Gross Profit', amount: 221000, type: 'positive' },
                      { item: 'Operating Expenses', amount: -85000, type: 'negative' },
                      { item: 'Net Profit', amount: 136000, type: 'positive' },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                        <span className="text-gray-900">{item.item}</span>
                        <span className={`font-medium ${
                          item.type === 'positive' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          ₵{Math.abs(item.amount).toLocaleString('en-US')}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
                  <div className="space-y-4">
                    {[
                      { category: 'Inventory Purchase', amount: 340000, percentage: 65 },
                      { category: 'Staff Salaries', amount: 45000, percentage: 8.5 },
                      { category: 'Rent & Utilities', amount: 25000, percentage: 4.8 },
                      { category: 'Other Expenses', amount: 15000, percentage: 2.9 },
                    ].map((expense, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">{expense.category}</span>
                          <span className="text-sm text-gray-600">₵{expense.amount.toLocaleString('en-US')}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${expense.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Add General Expense</h3>
                  <Button>
                    <Calculator className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Input placeholder="Expense description" />
                  <Input type="number" placeholder="Amount" />
                  <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Select Category</option>
                    <option>Utilities</option>
                    <option>Maintenance</option>
                    <option>Marketing</option>
                    <option>Other</option>
                  </select>
                  <Input type="date" />
                </div>
              </Card>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ReportsPage;