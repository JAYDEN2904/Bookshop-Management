import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Download,
  Filter,
  PieChart,
  FileText,
  Calculator,
  Loader2
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { api } from '../../config/api';
import toast from 'react-hot-toast';

interface SalesReportData {
  summary: {
    totalSales: number;
    totalQuantity: number;
    totalPurchases: number;
    totalProfit: number;
    averageOrderValue: number;
  };
  bookSales: Array<{
    book: any;
    quantity: number;
    revenue: number;
    profit: number;
    purchases: number;
  }>;
  monthlySales: Array<{
    period: string;
    sales: number;
    transactions: number;
    profit: number;
  }>;
}

interface InventoryReportData {
  summary: {
    totalBooks: number;
    totalStock: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  classLevelSummary: Array<{
    class_level: string;
    books: number;
    stock: number;
    value: number;
  }>;
  allBooks: Array<any>;
}

interface SupplierReportData {
  summary: {
    totalSuppliers: number;
    totalOrders: number;
    totalOrderValue: number;
    totalPaid: number;
    totalOutstanding: number;
  };
  supplierPerformance: Array<{
    supplier: any;
    orders: number;
    totalOrderValue: number;
    totalPaid: number;
    outstanding: number;
    onTimeRate: number;
    rating: number;
  }>;
  paymentStatus: {
    paid: number;
    outstanding: number;
    total: number;
  };
}

interface FinanceReportData {
  profitAndLoss: {
    totalRevenue: number;
    costOfGoodsSold: number;
    grossProfit: number;
    operatingExpenses: number;
    netProfit: number;
  };
  expenseBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
  };
}

const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sales' | 'inventory' | 'suppliers' | 'finance'>('sales');
  const [dateRange, setDateRange] = useState('last_30_days');
  const [loading, setLoading] = useState(false);
  
  // Sales data
  const [salesData, setSalesData] = useState<SalesReportData | null>(null);
  
  // Inventory data
  const [inventoryData, setInventoryData] = useState<InventoryReportData | null>(null);
  
  // Supplier data
  const [supplierData, setSupplierData] = useState<SupplierReportData | null>(null);
  
  // Finance data
  const [financeData, setFinanceData] = useState<FinanceReportData | null>(null);

  const tabs = [
    { id: 'sales', label: 'Sales Reports', icon: BarChart3 },
    { id: 'inventory', label: 'Inventory Reports', icon: Package },
    { id: 'suppliers', label: 'Supplier Reports', icon: TrendingUp },
    { id: 'finance', label: 'Financial Reports', icon: DollarSign }
  ];

  // Calculate date range
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (dateRange) {
      case 'last_7_days':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'last_30_days':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case 'last_3_months':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'last_year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }
    
    return {
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0]
    };
  };

  // Fetch sales report
  const fetchSalesReport = async () => {
    setLoading(true);
    try {
      const dateParams = getDateRange();
      const params = new URLSearchParams({
        start_date: dateParams.start_date,
        end_date: dateParams.end_date
      });
      
      const response = await api.getSalesReport(params);
      if (response.success) {
        setSalesData(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching sales report:', error);
      toast.error(error.message || 'Failed to fetch sales report');
    } finally {
      setLoading(false);
    }
  };

  // Fetch inventory report
  const fetchInventoryReport = async () => {
    setLoading(true);
    try {
      const response = await api.getInventoryReport();
      if (response.success) {
        setInventoryData(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching inventory report:', error);
      toast.error(error.message || 'Failed to fetch inventory report');
    } finally {
      setLoading(false);
    }
  };

  // Fetch supplier report
  const fetchSupplierReport = async () => {
    setLoading(true);
    try {
      const dateParams = getDateRange();
      const params = new URLSearchParams({
        start_date: dateParams.start_date,
        end_date: dateParams.end_date
      });
      
      const response = await api.getSupplierReport(params);
      if (response.success) {
        setSupplierData(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching supplier report:', error);
      toast.error(error.message || 'Failed to fetch supplier report');
    } finally {
      setLoading(false);
    }
  };

  // Fetch finance report
  const fetchFinanceReport = async () => {
    setLoading(true);
    try {
      const dateParams = getDateRange();
      const params = new URLSearchParams({
        start_date: dateParams.start_date,
        end_date: dateParams.end_date
      });
      
      const response = await api.getFinanceReport(params);
      if (response.success) {
        setFinanceData(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching finance report:', error);
      toast.error(error.message || 'Failed to fetch finance report');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when tab or date range changes
  useEffect(() => {
    switch (activeTab) {
      case 'sales':
        fetchSalesReport();
        break;
      case 'inventory':
        fetchInventoryReport();
        break;
      case 'suppliers':
        fetchSupplierReport();
        break;
      case 'finance':
        fetchFinanceReport();
        break;
    }
  }, [activeTab, dateRange]);

  // Calculate summary metrics for header cards
  const summaryMetrics = {
    totalRevenue: salesData?.summary.totalSales || financeData?.summary.totalRevenue || 0,
    totalProfit: salesData?.summary.totalProfit || financeData?.summary.netProfit || 0,
    itemsSold: salesData?.summary.totalQuantity || 0,
    avgOrderValue: salesData?.summary.averageOrderValue || 0
  };

  // Calculate growth (placeholder - would need previous period data)
  const calculateGrowth = (current: number) => {
    // This would compare with previous period in a real implementation
    return '+0%';
  };

  // Get top selling books
  const topBooks = salesData?.bookSales
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 4)
    .map(bs => ({
      title: bs.book?.title || 'Unknown Book',
      sales: bs.quantity,
      revenue: bs.revenue
    })) || [];

  // Calculate inventory turnover (simplified)
  const calculateTurnover = (classLevel: string) => {
    // This would need historical sales data for accurate calculation
    // For now, return a placeholder
    return 'N/A';
  };

  // Get stock movement data (simplified - would need stock_history)
  const getStockMovement = () => {
    // This would require stock_history data
    // For now, return current stock data
    return inventoryData?.allBooks.slice(0, 10).map(book => ({
      book: book.title,
      current: book.stock_quantity,
      value: book.stock_quantity * book.price
    })) || [];
  };

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
              <p className="text-2xl font-bold text-gray-900">
                ₵{summaryMetrics.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-green-600">{calculateGrowth(summaryMetrics.totalRevenue)} from last period</p>
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
              <p className="text-2xl font-bold text-gray-900">
                ₵{summaryMetrics.totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-blue-600">{calculateGrowth(summaryMetrics.totalProfit)} from last period</p>
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
              <p className="text-2xl font-bold text-gray-900">{summaryMetrics.itemsSold.toLocaleString('en-US')}</p>
              <p className="text-xs text-purple-600">{calculateGrowth(summaryMetrics.itemsSold)} from last period</p>
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
              <p className="text-2xl font-bold text-gray-900">
                ₵{summaryMetrics.avgOrderValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-orange-600">{calculateGrowth(summaryMetrics.avgOrderValue)} from last period</p>
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
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading report data...</span>
            </div>
          )}

          {!loading && activeTab === 'sales' && (
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
                      {salesData?.monthlySales && salesData.monthlySales.length > 0 && (
                        <p className="text-xs text-gray-400 mt-2">
                          {salesData.monthlySales.length} months of data available
                        </p>
                      )}
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
                    {topBooks.length > 0 ? (
                      topBooks.map((book, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{book.title}</p>
                            <p className="text-sm text-gray-600">{book.sales} copies sold</p>
                          </div>
                          <p className="font-semibold text-green-600">₵{book.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No sales data available</p>
                    )}
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
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {salesData?.monthlySales && salesData.monthlySales.length > 0 ? (
                        salesData.monthlySales.map((data, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {data.period}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ₵{data.sales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {data.transactions}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                              ₵{data.profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                            No sales data available for the selected period
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {!loading && activeTab === 'inventory' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Levels</h3>
                  <div className="h-64 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Stock level chart</p>
                      <p className="text-sm text-gray-500">Current vs minimum stock</p>
                      {inventoryData && (
                        <p className="text-xs text-gray-400 mt-2">
                          {inventoryData.summary.lowStockCount} low stock items
                        </p>
                      )}
                    </div>
                  </div>
                </Card>

                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Summary</h3>
                  <div className="space-y-4">
                    {inventoryData?.classLevelSummary && inventoryData.classLevelSummary.length > 0 ? (
                      inventoryData.classLevelSummary.slice(0, 4).map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{item.class_level}</p>
                            <p className="text-sm text-gray-600">{item.books} books, {item.stock} units</p>
                          </div>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            ₵{item.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No inventory data available</p>
                    )}
                  </div>
                </Card>
              </div>

              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Overview</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Book</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Stock</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {inventoryData?.allBooks && inventoryData.allBooks.length > 0 ? (
                        inventoryData.allBooks.slice(0, 10).map((book, index) => {
                          const isLowStock = book.stock_quantity <= book.min_stock;
                          const isOutOfStock = book.stock_quantity === 0;
                          return (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {book.title}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{book.stock_quantity}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{book.min_stock}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {isOutOfStock ? (
                                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Out of Stock</span>
                                ) : isLowStock ? (
                                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Low Stock</span>
                                ) : (
                                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">In Stock</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                ₵{(book.stock_quantity * book.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                            No inventory data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {!loading && activeTab === 'suppliers' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Supplier Performance</h3>
                  <div className="space-y-4">
                    {supplierData?.supplierPerformance && supplierData.supplierPerformance.length > 0 ? (
                      supplierData.supplierPerformance.map((supplier, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{supplier.supplier.name}</h4>
                            <span className="text-sm text-yellow-600">★ {supplier.rating.toFixed(1)}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Orders: {supplier.orders}</p>
                              <p className="text-gray-600">Total: ₵{supplier.totalOrderValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">On-time: {supplier.onTimeRate}%</p>
                              <p className="text-gray-600">Outstanding: ₵{supplier.outstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No supplier data available</p>
                    )}
                  </div>
                </Card>

                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status</h3>
                  <div className="space-y-4">
                    {supplierData?.paymentStatus && (
                      <>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <p className="text-sm text-gray-600">Total Paid</p>
                          <p className="text-2xl font-bold text-green-600">
                            ₵{supplierData.paymentStatus.paid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="p-4 bg-red-50 rounded-lg">
                          <p className="text-sm text-gray-600">Outstanding</p>
                          <p className="text-2xl font-bold text-red-600">
                            ₵{supplierData.paymentStatus.outstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm text-gray-600">Total Orders</p>
                          <p className="text-2xl font-bold text-blue-600">
                            ₵{supplierData.paymentStatus.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {!loading && activeTab === 'finance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit & Loss Statement</h3>
                  <div className="space-y-3">
                    {financeData?.profitAndLoss ? (
                      <>
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-900">Total Revenue</span>
                          <span className="font-medium text-green-600">
                            ₵{financeData.profitAndLoss.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-900">Cost of Goods Sold</span>
                          <span className="font-medium text-red-600">
                            -₵{financeData.profitAndLoss.costOfGoodsSold.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-900">Gross Profit</span>
                          <span className="font-medium text-green-600">
                            ₵{financeData.profitAndLoss.grossProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-900">Operating Expenses</span>
                          <span className="font-medium text-red-600">
                            -₵{financeData.profitAndLoss.operatingExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-2 font-bold">
                          <span className="text-gray-900">Net Profit</span>
                          <span className={`font-medium ${financeData.profitAndLoss.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₵{financeData.profitAndLoss.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No financial data available</p>
                    )}
                  </div>
                </Card>

                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
                  <div className="space-y-4">
                    {financeData?.expenseBreakdown && financeData.expenseBreakdown.length > 0 ? (
                      financeData.expenseBreakdown.map((expense, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">{expense.category}</span>
                            <span className="text-sm text-gray-600">
                              ₵{expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${Math.min(expense.percentage, 100)}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500">{expense.percentage.toFixed(1)}% of revenue</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No expense data available</p>
                    )}
                  </div>
                </Card>
              </div>

              {financeData?.summary && (
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Financial Summary</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Profit Margin</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {financeData.summary.profitMargin.toFixed(2)}%
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-green-600">
                        ₵{financeData.summary.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total Expenses</p>
                      <p className="text-2xl font-bold text-red-600">
                        ₵{financeData.summary.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ReportsPage;
