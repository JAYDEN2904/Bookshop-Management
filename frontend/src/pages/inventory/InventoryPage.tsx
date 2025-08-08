import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Package, 
  AlertTriangle, 
  History,
  Edit,
  RefreshCw,
  Eye,
  AlertCircle
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { Book } from '../../types';
import { useInventory } from '../../contexts/InventoryContext';
import { useAuth } from '../../contexts/AuthContext';

const InventoryPage: React.FC = () => {
  const { user } = useAuth();
  const { 
    books, 
    isLoading, 
    error,
    addBook,
    updateBook,
    addStock,
    markWastage,
    getStockHistory,
    getLowStockBooks
  } = useInventory();

  const isAdmin = user?.role === 'admin';
  // const isCashier = user?.role === 'cashier';

  const [activeTab, setActiveTab] = useState<'current' | 'alerts' | 'history'>('current');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showWastageModal, setShowWastageModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedHistoryBook, setSelectedHistoryBook] = useState<Book | null>(null);

  // Form states
  const [bookForm, setBookForm] = useState({
    author: '',
    class: '',
    subject: '',
    type: 'textbook' as 'textbook' | 'workbook' | 'reference' | 'other',
    sellingPrice: '',
    costPrice: '',
    stock: '',
    minStock: '',
    supplier: '',
    description: ''
  });

  const [stockForm, setStockForm] = useState({
    quantity: '',
    reference: '',
    note: ''
  });

  const [wastageForm, setWastageForm] = useState({
    quantity: '',
    note: ''
  });

  const tabs = [
    { id: 'current', label: 'Current Stock', icon: Package },
    { id: 'alerts', label: 'Low Stock Alerts', icon: AlertTriangle },
    { id: 'history', label: 'Stock History', icon: History }
  ];

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = !selectedClass || book.class === selectedClass;
    return matchesSearch && matchesClass;
  });

  const lowStockBooks = getLowStockBooks();

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addBook({
        author: bookForm.author,
        class: bookForm.class,
        subject: bookForm.subject,
        type: bookForm.type,
        sellingPrice: parseFloat(bookForm.sellingPrice),
        costPrice: parseFloat(bookForm.costPrice),
        stock: parseInt(bookForm.stock),
        minStock: parseInt(bookForm.minStock),
        supplier: bookForm.supplier,
        description: bookForm.description
      });
      setShowAddModal(false);
      resetBookForm();
    } catch (error) {
      console.error('Failed to add book:', error);
    }
  };

  const handleUpdateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;
    
    try {
      await updateBook(selectedBook.id, {
        author: bookForm.author,
        class: bookForm.class,
        subject: bookForm.subject,
        type: bookForm.type,
        sellingPrice: parseFloat(bookForm.sellingPrice),
        costPrice: parseFloat(bookForm.costPrice),
        minStock: parseInt(bookForm.minStock),
        supplier: bookForm.supplier,
        description: bookForm.description
      });
      setShowEditModal(false);
      resetBookForm();
    } catch (error) {
      console.error('Failed to update book:', error);
    }
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;
    
    try {
      await addStock(
        selectedBook.id,
        parseInt(stockForm.quantity),
        stockForm.reference,
        stockForm.note
      );
      setShowStockModal(false);
      resetStockForm();
    } catch (error) {
      console.error('Failed to add stock:', error);
    }
  };

  const handleMarkWastage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;
    
    try {
      await markWastage(
        selectedBook.id,
        parseInt(wastageForm.quantity),
        wastageForm.note
      );
      setShowWastageModal(false);
      resetWastageForm();
    } catch (error) {
      console.error('Failed to mark wastage:', error);
    }
  };

  const resetBookForm = () => {
    setBookForm({
      author: '',
      class: '',
      subject: '',
      type: 'textbook',
      sellingPrice: '',
      costPrice: '',
      stock: '',
      minStock: '',
      supplier: '',
      description: ''
    });
  };

  const resetStockForm = () => {
    setStockForm({
      quantity: '',
      reference: '',
      note: ''
    });
  };

  const resetWastageForm = () => {
    setWastageForm({
      quantity: '',
      note: ''
    });
  };

  const openEditModal = (book: Book) => {
    setSelectedBook(book);
    setBookForm({
      author: book.author,
      class: book.class,
      subject: book.subject,
      type: book.type,
      sellingPrice: book.sellingPrice.toString(),
      costPrice: book.costPrice.toString(),
      stock: book.stock.toString(),
      minStock: book.minStock.toString(),
      supplier: book.supplier,
      description: book.description || ''
    });
    setShowEditModal(true);
  };

  const openHistoryModal = (book: Book) => {
    setSelectedHistoryBook(book);
    setShowHistoryModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">
            {isAdmin ? 'Manage your book inventory and stock levels' : 'View book inventory and stock levels'}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Book
          </Button>
        )}
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
                {tab.id === 'alerts' && lowStockBooks.length > 0 && (
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                    {lowStockBooks.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'current' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search books..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    icon={<Search className="h-4 w-4 text-gray-400" />}
                  />
                </div>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Classes</option>
                  <option value="Basic 1">Basic 1</option>
                  <option value="Basic 2">Basic 2</option>
                  <option value="Basic 3">Basic 3</option>
                  <option value="Basic 4">Basic 4</option>
                  <option value="Basic 5">Basic 5</option>
                  <option value="Basic 6">Basic 6</option>
                  <option value="Basic 7">Basic 7</option>
                  <option value="Basic 8">Basic 8</option>
                  <option value="Basic 9">Basic 9</option>
                </select>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>

              {/* Books Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         Book Details
                       </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Class/Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pricing
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBooks.map((book) => (
                      <tr key={book.id} className={`hover:bg-gray-50 ${book.stock <= book.minStock ? 'bg-red-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{book.subject}</div>
                            <div className="text-sm text-gray-500">by {book.author}</div>
                            <div className="text-xs text-gray-400 capitalize">{book.type}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{book.class}</div>
                          <div className="text-sm text-gray-500">{book.subject}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">₵{book.sellingPrice}</div>
                          <div className="text-sm text-gray-500">Cost: ₵{book.costPrice}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`text-sm font-medium ${book.stock <= book.minStock ? 'text-red-600' : 'text-gray-900'}`}>
                              {book.stock} units
                            </div>
                            {book.stock <= book.minStock && (
                              <AlertTriangle className="h-4 w-4 text-red-500 ml-2" />
                            )}
                          </div>
                          <div className="text-xs text-gray-500">Min: {book.minStock}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          {isAdmin ? (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedBook(book);
                                  setShowStockModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                                title="Add Stock"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => openEditModal(book)}
                                className="text-gray-600 hover:text-gray-900"
                                title="Edit Book"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedBook(book);
                                  setShowWastageModal(true);
                                }}
                                className="text-orange-600 hover:text-orange-900"
                                title="Mark Wastage/Return"
                              >
                                <AlertCircle className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => openHistoryModal(book)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Stock History"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => openHistoryModal(book)}
                            className="text-gray-600 hover:text-gray-900"
                            title="View Stock History"
                          >
                            <History className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-4">
              {lowStockBooks.length > 0 ? (
                <>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                      <h3 className="text-lg font-medium text-red-800">
                        {lowStockBooks.length} items need restocking
                      </h3>
                    </div>
                    <p className="text-red-700 mt-1">
                      These books have fallen below their minimum stock levels.
                    </p>
                  </div>

                  {lowStockBooks.map((book) => (
                    <Card key={book.id}>
                      <div className="flex items-center justify-between">
                        <div>
                           <h4 className="font-medium text-gray-900">{book.subject}</h4>
                          <p className="text-gray-600">{book.class} - {book.subject}</p>
                          <p className="text-sm text-red-600">
                            Current: {book.stock} | Minimum: {book.minStock}
                          </p>
                        </div>
                        {isAdmin && (
                          <Button
                            onClick={() => {
                              setSelectedBook(book);
                              setShowStockModal(true);
                            }}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Restock
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </>
              ) : (
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">All Stock Levels Good</h3>
                  <p className="text-gray-600">No books are currently below their minimum stock levels.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="text-center py-12">
                <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Stock History</h3>
                <p className="text-gray-600">Track all inventory changes and stock movements</p>
                <p className="text-sm text-gray-500 mt-2">Click on the history icon next to any book to view its detailed stock history.</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Add Book Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetBookForm();
        }}
        title="Add New Book"
        size="lg"
      >
        <form onSubmit={handleAddBook} className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Author" 
              placeholder="Enter author name"
              value={bookForm.author}
              onChange={(e) => setBookForm({...bookForm, author: e.target.value})}
              required
            />
            <select 
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={bookForm.class}
              onChange={(e) => setBookForm({...bookForm, class: e.target.value})}
              required
            >
              <option value="">Select Class</option>
              <option value="Basic 1">Basic 1</option>
              <option value="Basic 2">Basic 2</option>
              <option value="Basic 3">Basic 3</option>
              <option value="Basic 4">Basic 4</option>
              <option value="Basic 5">Basic 5</option>
              <option value="Basic 6">Basic 6</option>
              <option value="Basic 7">Basic 7</option>
              <option value="Basic 8">Basic 8</option>
              <option value="Basic 9">Basic 9</option>
            </select>
            <Input 
              label="Subject" 
              placeholder="Enter subject"
              value={bookForm.subject}
              onChange={(e) => setBookForm({...bookForm, subject: e.target.value})}
              required
            />
            <select 
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={bookForm.type}
              onChange={(e) => setBookForm({...bookForm, type: e.target.value as any})}
              required
            >
              <option value="textbook">Textbook</option>
              <option value="workbook">Workbook</option>
              <option value="reference">Reference</option>
              <option value="other">Other</option>
            </select>
            <Input 
              label="Selling Price" 
              type="number" 
              placeholder="Enter selling price"
              value={bookForm.sellingPrice}
              onChange={(e) => setBookForm({...bookForm, sellingPrice: e.target.value})}
              required
            />
            <Input 
              label="Cost Price" 
              type="number" 
              placeholder="Enter cost price"
              value={bookForm.costPrice}
              onChange={(e) => setBookForm({...bookForm, costPrice: e.target.value})}
              required
            />
            <Input 
              label="Initial Stock" 
              type="number" 
              placeholder="Enter initial stock"
              value={bookForm.stock}
              onChange={(e) => setBookForm({...bookForm, stock: e.target.value})}
              required
            />
            <Input 
              label="Minimum Stock" 
              type="number" 
              placeholder="Enter minimum stock level"
              value={bookForm.minStock}
              onChange={(e) => setBookForm({...bookForm, minStock: e.target.value})}
              required
            />
            <Input 
              label="Supplier" 
              placeholder="Enter supplier name"
              value={bookForm.supplier}
              onChange={(e) => setBookForm({...bookForm, supplier: e.target.value})}
              required
            />
          </div>
          <Input 
            label="Description" 
            placeholder="Enter book description (optional)"
            value={bookForm.description}
            onChange={(e) => setBookForm({...bookForm, description: e.target.value})}
          />
          <div className="flex justify-end space-x-4 pt-4">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => {
                setShowAddModal(false);
                resetBookForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit">Add Book</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Book Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetBookForm();
        }}
        title="Edit Book"
        size="lg"
      >
        <form onSubmit={handleUpdateBook} className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Author" 
              placeholder="Enter author name"
              value={bookForm.author}
              onChange={(e) => setBookForm({...bookForm, author: e.target.value})}
              required
            />
            <select 
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={bookForm.class}
              onChange={(e) => setBookForm({...bookForm, class: e.target.value})}
              required
            >
              <option value="">Select Class</option>
              <option value="Basic 1">Basic 1</option>
              <option value="Basic 2">Basic 2</option>
              <option value="Basic 3">Basic 3</option>
              <option value="Basic 4">Basic 4</option>
              <option value="Basic 5">Basic 5</option>
              <option value="Basic 6">Basic 6</option>
              <option value="Basic 7">Basic 7</option>
              <option value="Basic 8">Basic 8</option>
              <option value="Basic 9">Basic 9</option>
            </select>
            <Input 
              label="Subject" 
              placeholder="Enter subject"
              value={bookForm.subject}
              onChange={(e) => setBookForm({...bookForm, subject: e.target.value})}
              required
            />
            <select 
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={bookForm.type}
              onChange={(e) => setBookForm({...bookForm, type: e.target.value as any})}
              required
            >
              <option value="textbook">Textbook</option>
              <option value="workbook">Workbook</option>
              <option value="reference">Reference</option>
              <option value="other">Other</option>
            </select>
            <Input 
              label="Selling Price" 
              type="number" 
              placeholder="Enter selling price"
              value={bookForm.sellingPrice}
              onChange={(e) => setBookForm({...bookForm, sellingPrice: e.target.value})}
              required
            />
            <Input 
              label="Cost Price" 
              type="number" 
              placeholder="Enter cost price"
              value={bookForm.costPrice}
              onChange={(e) => setBookForm({...bookForm, costPrice: e.target.value})}
              required
            />
            <Input 
              label="Minimum Stock" 
              type="number" 
              placeholder="Enter minimum stock level"
              value={bookForm.minStock}
              onChange={(e) => setBookForm({...bookForm, minStock: e.target.value})}
              required
            />
            <Input 
              label="Supplier" 
              placeholder="Enter supplier name"
              value={bookForm.supplier}
              onChange={(e) => setBookForm({...bookForm, supplier: e.target.value})}
              required
            />
          </div>
          <Input 
            label="Description" 
            placeholder="Enter book description (optional)"
            value={bookForm.description}
            onChange={(e) => setBookForm({...bookForm, description: e.target.value})}
          />
          <div className="flex justify-end space-x-4 pt-4">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => {
                setShowEditModal(false);
                resetBookForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit">Update Book</Button>
          </div>
        </form>
      </Modal>

      {/* Add Stock Modal */}
      <Modal
        isOpen={showStockModal}
        onClose={() => {
          setShowStockModal(false);
          setSelectedBook(null);
          resetStockForm();
        }}
        title="Add Stock"
        size="md"
      >
        {selectedBook && (
          <form onSubmit={handleAddStock} className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900">{selectedBook.subject}</h4>
              <p className="text-gray-600">Current Stock: {selectedBook.stock} units</p>
            </div>
            <Input 
              label="Quantity to Add" 
              type="number" 
              placeholder="Enter quantity"
              value={stockForm.quantity}
              onChange={(e) => setStockForm({...stockForm, quantity: e.target.value})}
              required
            />
            <Input 
              label="Reference (Optional)" 
              placeholder="Enter batch details, supplier info, etc."
              value={stockForm.reference}
              onChange={(e) => setStockForm({...stockForm, reference: e.target.value})}
            />
            <Input 
              label="Note (Optional)" 
              placeholder="Enter additional notes"
              value={stockForm.note}
              onChange={(e) => setStockForm({...stockForm, note: e.target.value})}
            />
            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowStockModal(false);
                  setSelectedBook(null);
                  resetStockForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Add Stock</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Mark Wastage/Return Modal */}
      <Modal
        isOpen={showWastageModal}
        onClose={() => {
          setShowWastageModal(false);
          setSelectedBook(null);
          resetWastageForm();
        }}
        title="Mark Wastage/Return"
        size="md"
      >
        {selectedBook && (
          <form onSubmit={handleMarkWastage} className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900">{selectedBook.subject}</h4>
              <p className="text-gray-600">Current Stock: {selectedBook.stock} units</p>
            </div>
            <Input 
              label="Quantity" 
              type="number" 
              placeholder="Enter quantity"
              value={wastageForm.quantity}
              onChange={(e) => setWastageForm({...wastageForm, quantity: e.target.value})}
              required
            />
            <Input 
              label="Note (Optional)" 
              placeholder="Enter reason for wastage/return"
              value={wastageForm.note}
              onChange={(e) => setWastageForm({...wastageForm, note: e.target.value})}
            />
            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowWastageModal(false);
                  setSelectedBook(null);
                  resetWastageForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Mark Wastage</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Stock History Modal */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false);
          setSelectedHistoryBook(null);
        }}
        title={`Stock History - ${selectedHistoryBook?.subject || ''}`}
        size="lg"
      >
        {selectedHistoryBook && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900">{selectedHistoryBook.subject}</h4>
              <p className="text-gray-600">Current Stock: {selectedHistoryBook.stock} units</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Previous Stock
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      New Stock
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Note
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getStockHistory(selectedHistoryBook.id).map((history) => (
                    <tr key={history.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(history.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          history.type === 'addition' ? 'bg-green-100 text-green-800' :
                          history.type === 'reduction' ? 'bg-red-100 text-red-800' :
                          history.type === 'wastage' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {history.type}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {history.quantity}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {history.previousStock}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {history.newStock}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {history.reference || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {history.note || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {history.userName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedHistoryBook(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InventoryPage;