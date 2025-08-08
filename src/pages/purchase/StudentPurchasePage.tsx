import React, { useState, useRef } from 'react';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { User, Package, Trash2, Plus, ShoppingCart, Download, History } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useStudentContext } from '../../contexts/StudentContext';
import { useAuth } from '../../contexts/AuthContext';

// Mock data for classes
const classes = ['Basic 1', 'Basic 2', 'Basic 3', 'Basic 4', 'Basic 5', 'Basic 6', 'Basic 7', 'Basic 8', 'Basic 9'];

// Mock data for books (with stock and price)
const mockBooks = [
  // Basic 9 Books
  { id: 'b1', title: 'Mathematics', class: 'Basic 9', stock: 10, price: 50 },
  { id: 'b2', title: 'English Grammar', class: 'Basic 9', stock: 5, price: 40 },
  { id: 'b3', title: 'Science', class: 'Basic 9', stock: 0, price: 60 },
  { id: 'b4', title: 'Social Studies', class: 'Basic 9', stock: 8, price: 45 },
  { id: 'b5', title: 'French', class: 'Basic 9', stock: 12, price: 35 },
  { id: 'b6', title: 'ICT', class: 'Basic 9', stock: 15, price: 55 },
  
  // Basic 8 Books
  { id: 'b7', title: 'Mathematics', class: 'Basic 8', stock: 8, price: 45 },
  { id: 'b8', title: 'English Grammar', class: 'Basic 8', stock: 12, price: 38 },
  { id: 'b9', title: 'Science', class: 'Basic 8', stock: 3, price: 55 },
  { id: 'b10', title: 'Social Studies', class: 'Basic 8', stock: 10, price: 42 },
  { id: 'b11', title: 'French', class: 'Basic 8', stock: 7, price: 32 },
  { id: 'b12', title: 'ICT', class: 'Basic 8', stock: 13, price: 50 },
  
  // Basic 7 Books
  { id: 'b13', title: 'Mathematics', class: 'Basic 7', stock: 15, price: 42 },
  { id: 'b14', title: 'English Grammar', class: 'Basic 7', stock: 9, price: 35 },
  { id: 'b15', title: 'Science', class: 'Basic 7', stock: 11, price: 48 },
  { id: 'b16', title: 'Social Studies', class: 'Basic 7', stock: 6, price: 38 },
  { id: 'b17', title: 'French', class: 'Basic 7', stock: 14, price: 30 },
  { id: 'b18', title: 'ICT', class: 'Basic 7', stock: 8, price: 45 },
  
  // Basic 6 Books
  { id: 'b19', title: 'Mathematics', class: 'Basic 6', stock: 12, price: 40 },
  { id: 'b20', title: 'English Grammar', class: 'Basic 6', stock: 16, price: 32 },
  { id: 'b21', title: 'Science', class: 'Basic 6', stock: 7, price: 45 },
  { id: 'b22', title: 'Social Studies', class: 'Basic 6', stock: 9, price: 35 },
  { id: 'b23', title: 'French', class: 'Basic 6', stock: 11, price: 28 },
  { id: 'b24', title: 'ICT', class: 'Basic 6', stock: 10, price: 40 },
  
  // Basic 5 Books
  { id: 'b25', title: 'Mathematics', class: 'Basic 5', stock: 18, price: 38 },
  { id: 'b26', title: 'English Grammar', class: 'Basic 5', stock: 14, price: 30 },
  { id: 'b27', title: 'Science', class: 'Basic 5', stock: 13, price: 42 },
  { id: 'b28', title: 'Social Studies', class: 'Basic 5', stock: 8, price: 32 },
  { id: 'b29', title: 'French', class: 'Basic 5', stock: 12, price: 25 },
  { id: 'b30', title: 'ICT', class: 'Basic 5', stock: 9, price: 38 },
  
  // Basic 4 Books
  { id: 'b31', title: 'Mathematics', class: 'Basic 4', stock: 20, price: 35 },
  { id: 'b32', title: 'English Grammar', class: 'Basic 4', stock: 17, price: 28 },
  { id: 'b33', title: 'Science', class: 'Basic 4', stock: 15, price: 40 },
  { id: 'b34', title: 'Social Studies', class: 'Basic 4', stock: 11, price: 30 },
  { id: 'b35', title: 'French', class: 'Basic 4', stock: 13, price: 22 },
  { id: 'b36', title: 'ICT', class: 'Basic 4', stock: 12, price: 35 },
  
  // Basic 3 Books
  { id: 'b37', title: 'Mathematics', class: 'Basic 3', stock: 22, price: 32 },
  { id: 'b38', title: 'English Grammar', class: 'Basic 3', stock: 19, price: 25 },
  { id: 'b39', title: 'Science', class: 'Basic 3', stock: 16, price: 38 },
  { id: 'b40', title: 'Social Studies', class: 'Basic 3', stock: 14, price: 28 },
  { id: 'b41', title: 'French', class: 'Basic 3', stock: 15, price: 20 },
  { id: 'b42', title: 'ICT', class: 'Basic 3', stock: 13, price: 32 },
  
  // Basic 2 Books
  { id: 'b43', title: 'Mathematics', class: 'Basic 2', stock: 25, price: 30 },
  { id: 'b44', title: 'English Grammar', class: 'Basic 2', stock: 21, price: 22 },
  { id: 'b45', title: 'Science', class: 'Basic 2', stock: 18, price: 35 },
  { id: 'b46', title: 'Social Studies', class: 'Basic 2', stock: 16, price: 25 },
  { id: 'b47', title: 'French', class: 'Basic 2', stock: 17, price: 18 },
  { id: 'b48', title: 'ICT', class: 'Basic 2', stock: 14, price: 30 },
  
  // Basic 1 Books
  { id: 'b49', title: 'Mathematics', class: 'Basic 1', stock: 28, price: 28 },
  { id: 'b50', title: 'English Grammar', class: 'Basic 1', stock: 24, price: 20 },
  { id: 'b51', title: 'Science', class: 'Basic 1', stock: 20, price: 32 },
  { id: 'b52', title: 'Social Studies', class: 'Basic 1', stock: 18, price: 22 },
  { id: 'b53', title: 'French', class: 'Basic 1', stock: 19, price: 15 },
  { id: 'b54', title: 'ICT', class: 'Basic 1', stock: 16, price: 28 },
];

// Mock bundles (class -> array of {bookId, quantity})
const initialBundles = {
  'Basic 9': [
    { bookId: 'b1', quantity: 1 }, // Mathematics
    { bookId: 'b2', quantity: 1 }, // English Grammar
    { bookId: 'b3', quantity: 1 }, // Science
    { bookId: 'b4', quantity: 1 }, // Social Studies
    { bookId: 'b5', quantity: 1 }, // French
    { bookId: 'b6', quantity: 1 }, // ICT
  ],
  'Basic 8': [
    { bookId: 'b7', quantity: 1 }, // Mathematics
    { bookId: 'b8', quantity: 1 }, // English Grammar
    { bookId: 'b9', quantity: 1 }, // Science
    { bookId: 'b10', quantity: 1 }, // Social Studies
    { bookId: 'b11', quantity: 1 }, // French
    { bookId: 'b12', quantity: 1 }, // ICT
  ],
  'Basic 7': [
    { bookId: 'b13', quantity: 1 }, // Mathematics
    { bookId: 'b14', quantity: 1 }, // English Grammar
    { bookId: 'b15', quantity: 1 }, // Science
    { bookId: 'b16', quantity: 1 }, // Social Studies
    { bookId: 'b17', quantity: 1 }, // French
    { bookId: 'b18', quantity: 1 }, // ICT
  ],
  'Basic 6': [
    { bookId: 'b19', quantity: 1 }, // Mathematics
    { bookId: 'b20', quantity: 1 }, // English Grammar
    { bookId: 'b21', quantity: 1 }, // Science
    { bookId: 'b22', quantity: 1 }, // Social Studies
    { bookId: 'b23', quantity: 1 }, // French
    { bookId: 'b24', quantity: 1 }, // ICT
  ],
  'Basic 5': [
    { bookId: 'b25', quantity: 1 }, // Mathematics
    { bookId: 'b26', quantity: 1 }, // English Grammar
    { bookId: 'b27', quantity: 1 }, // Science
    { bookId: 'b28', quantity: 1 }, // Social Studies
    { bookId: 'b29', quantity: 1 }, // French
    { bookId: 'b30', quantity: 1 }, // ICT
  ],
  'Basic 4': [
    { bookId: 'b31', quantity: 1 }, // Mathematics
    { bookId: 'b32', quantity: 1 }, // English Grammar
    { bookId: 'b33', quantity: 1 }, // Science
    { bookId: 'b34', quantity: 1 }, // Social Studies
    { bookId: 'b35', quantity: 1 }, // French
    { bookId: 'b36', quantity: 1 }, // ICT
  ],
  'Basic 3': [
    { bookId: 'b37', quantity: 1 }, // Mathematics
    { bookId: 'b38', quantity: 1 }, // English Grammar
    { bookId: 'b39', quantity: 1 }, // Science
    { bookId: 'b40', quantity: 1 }, // Social Studies
    { bookId: 'b41', quantity: 1 }, // French
    { bookId: 'b42', quantity: 1 }, // ICT
  ],
  'Basic 2': [
    { bookId: 'b43', quantity: 1 }, // Mathematics
    { bookId: 'b44', quantity: 1 }, // English Grammar
    { bookId: 'b45', quantity: 1 }, // Science
    { bookId: 'b46', quantity: 1 }, // Social Studies
    { bookId: 'b47', quantity: 1 }, // French
    { bookId: 'b48', quantity: 1 }, // ICT
  ],
  'Basic 1': [
    { bookId: 'b49', quantity: 1 }, // Mathematics
    { bookId: 'b50', quantity: 1 }, // English Grammar
    { bookId: 'b51', quantity: 1 }, // Science
    { bookId: 'b52', quantity: 1 }, // Social Studies
    { bookId: 'b53', quantity: 1 }, // French
    { bookId: 'b54', quantity: 1 }, // ICT
  ],
};

const StudentPurchasePage: React.FC = () => {
  const { user } = useAuth();
  const { students } = useStudentContext();
  
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Bundle management state (admin only)
  const [showBundleModal, setShowBundleModal] = useState(false);
  const [bundleClass, setBundleClass] = useState('');
  const [bundles, setBundles] = useState<{ [key: string]: { bookId: string; quantity: number }[] }>(initialBundles);
  const [editingBundle, setEditingBundle] = useState<{ bookId: string; quantity: number }[]>([]);
  const [addBookId, setAddBookId] = useState('');
  const [addBookQty, setAddBookQty] = useState(1);

  // Get unique classes from actual students
  const availableClasses = Array.from(new Set(students.map(student => student.class))).sort();

  // Inventory/book selection modal
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookSearch, setBookSearch] = useState('');
  const [bookQty, setBookQty] = useState(1);

  // Cart state
  const [cart, setCart] = useState<{ bookId: string; title: string; price: number; quantity: number; stock: number }[]>([]);

  // Discount state
  const [discountType, setDiscountType] = useState<'percent' | 'flat'>('percent');
  const [discountValue, setDiscountValue] = useState(0);
  const [overrideCode, setOverrideCode] = useState('');
  const [overrideActive, setOverrideActive] = useState(false);
  const MAX_CASHIER_PERCENT = 10; // max percent discount for cashier
  const ADMIN_OVERRIDE_CODE = 'ADMIN123'; // mock admin code

  // Split payment state
  const paymentMethods = [
    { key: 'cash', label: 'Cash' },
    { key: 'momo', label: 'Mobile Money' },
    { key: 'bank', label: 'Bank Transfer' },
    { key: 'other', label: 'Other' },
  ];
  const [payments, setPayments] = useState([
    { method: 'cash', amount: 0, reference: '' },
  ]);
  const [paymentError, setPaymentError] = useState('');

  // Receipt preview state
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any>(null);
  const receiptIdRef = useRef(1000);

  // Purchase history state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyFilter, setHistoryFilter] = useState({ dateFrom: '', dateTo: '', term: '', payment: '' });

  // Mock purchase history data
  const mockHistory = [
    {
      id: 'RCPT1001',
      date: '2024-06-01',
      term: 'Term 3',
      payment: 'cash',
      total: 120,
      paid: 100,
      balance: 20,
      items: [
        { title: 'Mathematics', quantity: 1, price: 50 },
        { title: 'English Grammar', quantity: 1, price: 40 },
        { title: 'Science', quantity: 1, price: 30 },
      ],
    },
    {
      id: 'RCPT1002',
      date: '2024-05-15',
      term: 'Term 2',
      payment: 'momo',
      total: 90,
      paid: 90,
      balance: 0,
      items: [
        { title: 'Mathematics', quantity: 1, price: 45 },
        { title: 'English Grammar', quantity: 1, price: 45 },
      ],
    },
  ];

  // Filtered history
  const filteredHistory = mockHistory.filter(h => {
    if (historyFilter.dateFrom && h.date < historyFilter.dateFrom) return false;
    if (historyFilter.dateTo && h.date > historyFilter.dateTo) return false;
    if (historyFilter.term && h.term !== historyFilter.term) return false;
    if (historyFilter.payment && h.payment !== historyFilter.payment) return false;
    return true;
  });

  // Export CSV
  const handleExportCSV = () => {
    const rows = [
      ['Receipt ID', 'Date', 'Term', 'Payment', 'Total', 'Paid', 'Balance'],
      ...filteredHistory.map(h => [h.id, h.date, h.term, h.payment, h.total, h.paid, h.balance]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'purchase_history.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter students by selected class and search term
  const filteredStudents = students.filter(
    (student) =>
      (!selectedClass || student.class === selectedClass) &&
      (student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.studentId && student.studentId.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  // Filter books for inventory modal
  const filteredBooks = mockBooks.filter(
    (book) =>
      (!selectedStudent || book.class === selectedStudent.class) &&
      (book.title.toLowerCase().includes(bookSearch.toLowerCase()))
  );

  // Add book to cart
  const handleAddBookToCart = (book: typeof mockBooks[0], quantity: number) => {
    if (book.stock < quantity) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.bookId === book.id);
      if (existing) {
        return prev.map((item) =>
          item.bookId === book.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, book.stock) }
            : item
      );
    } else {
        return [
          ...prev,
          { bookId: book.id, title: book.title, price: book.price, quantity: Math.min(quantity, book.stock), stock: book.stock },
        ];
    }
    });
    setShowBookModal(false);
    setBookQty(1);
  };

  // Add bundle to cart
  const handleAddBundleToCart = () => {
    if (!selectedStudent) return;
    const bundle = bundles[selectedStudent.class] || [];
    setCart((prev) => {
      let updated = [...prev];
      bundle.forEach((b) => {
        const book = mockBooks.find((bk) => bk.id === b.bookId);
        if (!book) return;
        const existing = updated.find((item) => item.bookId === book.id);
        const addQty = Math.min(b.quantity, book.stock - (existing ? existing.quantity : 0));
        if (addQty > 0) {
          if (existing) {
            existing.quantity += addQty;
          } else {
            updated.push({ bookId: book.id, title: book.title, price: book.price, quantity: addQty, stock: book.stock });
          }
        }
      });
      return updated;
    });
  };

  // Remove item from cart
  const handleRemoveFromCart = (bookId: string) => {
    setCart((prev) => prev.filter((item) => item.bookId !== bookId));
  };

  // Bundle management handlers (same as before)
  const openBundleModal = (cls: string) => {
    setBundleClass(cls);
    setEditingBundle(bundles[cls] ? [...bundles[cls]] : []);
    setShowBundleModal(true);
    setAddBookId('');
    setAddBookQty(1);
  };
  const handleAddBookToBundle = () => {
    if (!addBookId || editingBundle.some(b => b.bookId === addBookId)) return;
    setEditingBundle([...editingBundle, { bookId: addBookId, quantity: addBookQty }]);
    setAddBookId('');
    setAddBookQty(1);
  };
  const handleRemoveBookFromBundle = (bookId: string) => {
    setEditingBundle(editingBundle.filter(b => b.bookId !== bookId));
  };
  const handleBundleQtyChange = (bookId: string, qty: number) => {
    setEditingBundle(editingBundle.map(b => b.bookId === bookId ? { ...b, quantity: qty } : b));
  };
  const handleSaveBundle = () => {
    setBundles({ ...bundles, [bundleClass]: editingBundle });
    setShowBundleModal(false);
  };

  // Discount calculation
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  let discountAmount = 0;
  if (discountType === 'percent') {
    discountAmount = subtotal * (discountValue / 100);
  } else {
    discountAmount = discountValue;
  }
  if (discountAmount > subtotal) discountAmount = subtotal;
  const total = subtotal - discountAmount;

  // Discount permission logic
  const isCashier = user?.role === 'cashier';
  const needsOverride = isCashier && discountType === 'percent' && discountValue > MAX_CASHIER_PERCENT && !overrideActive;
  const canApplyDiscount = !needsOverride;

  // Payment handlers
  const handlePaymentChange = (idx: number, field: 'method' | 'amount' | 'reference', value: any) => {
    setPayments((prev) =>
      prev.map((p, i) =>
        i === idx ? { ...p, [field]: field === 'amount' ? Number(value) : value } : p
      )
    );
  };
  const handleAddPayment = () => {
    setPayments((prev) => [...prev, { method: 'cash', amount: 0, reference: '' }]);
  };
  const handleRemovePayment = (idx: number) => {
    setPayments((prev) => prev.filter((_, i) => i !== idx));
  };
  const paymentSum = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const isPaymentValid = paymentSum === total && total > 0;

  // Handle override
  const handleOverride = () => {
    if (overrideCode === ADMIN_OVERRIDE_CODE) {
      setOverrideActive(true);
    } else {
      alert('Invalid override code.');
    }
  };

  // Cart total
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Handle complete purchase
  const handleCompletePurchase = () => {
    // Generate unique receipt ID
    const receiptId = `RCPT${receiptIdRef.current++}`;
    const receipt = {
      id: receiptId,
      date: new Date().toLocaleString(),
      student: selectedStudent,
      items: cart,
      subtotal,
      discountType,
      discountValue,
      discountAmount,
      total,
      payments,
    };
    setLastReceipt(receipt);
    setShowReceiptModal(true);
    // Optionally: clear cart/payments/discounts here
  };

  // WhatsApp message generator
  const getWhatsAppMessage = (receipt: any) => {
    let msg = `Bookshop Receipt\nReceipt ID: ${receipt.id}\nDate: ${receipt.date}\nStudent: ${receipt.student?.name} (${receipt.student?.class}, ${receipt.student?.studentId})\n\nItems:`;
    receipt.items.forEach((item: any) => {
      msg += `\n- ${item.title} x${item.quantity} (₵${item.price * item.quantity})`;
    });
    msg += `\nSubtotal: ₵${receipt.subtotal}`;
    if (receipt.discountAmount > 0) {
      msg += `\nDiscount: -₵${receipt.discountAmount}`;
    }
    msg += `\nTotal: ₵${receipt.total}`;
    msg += `\n\nPayments:`;
    receipt.payments.forEach((p: any) => {
      msg += `\n- ${p.method}: ₵${p.amount} (${p.reference})`;
    });
    return msg;
  };

  const handlePrintReceipt = () => {
    const printContents = document.querySelector('.print-receipt')?.innerHTML;
    if (!printContents) return;
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Receipt</title>
          <style>
            body { background: white; margin: 0; padding: 0; }
            .print-receipt { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          </style>
        </head>
        <body>
          <div class="print-receipt">${printContents}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  // Payment method icons (simple fallback)
  const paymentIcons: Record<string, JSX.Element> = {
    cash: <span className="inline-block w-5 h-5 bg-gray-200 rounded-full text-xs flex items-center justify-center">₵</span>,
    momo: <span className="inline-block w-5 h-5 bg-green-200 rounded-full text-xs flex items-center justify-center">MoMo</span>,
    bank: <span className="inline-block w-5 h-5 bg-blue-200 rounded-full text-xs flex items-center justify-center">🏦</span>,
    other: <span className="inline-block w-5 h-5 bg-gray-300 rounded-full text-xs flex items-center justify-center">?</span>,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Purchase</h1>
          <p className="text-gray-600">Process book purchases for students</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setShowStudentModal(true)}>
            <User className="h-4 w-4 mr-2" />
            {selectedStudent ? 'Change Student' : 'Select Student'}
          </Button>
          {selectedStudent && (
            <Button variant="outline" onClick={() => setShowHistoryModal(true)}>
              <History className="h-4 w-4 mr-2" />
              View History
            </Button>
          )}
        </div>
      </div>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Student Information</h3>
              <Button variant="outline" size="sm" onClick={() => setShowStudentModal(true)}>
            {selectedStudent ? 'Change Student' : 'Select Student'}
              </Button>
            </div>
            {selectedStudent ? (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedStudent.name}</p>
                    <p className="text-sm text-gray-600">{selectedStudent.class} - Student ID: {selectedStudent.studentId}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No student selected</p>
              </div>
            )}
          </Card>

      {/* Inventory & Cart Section */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Purchase Items</h3>
              <div className="flex space-x-2">
                  <Button
              size="sm"
                    variant="outline"
              onClick={handleAddBundleToCart}
              disabled={!selectedStudent}
                  >
                    <Package className="h-4 w-4 mr-2" />
              Add {selectedStudent ? selectedStudent.class : ''} Bundle
                  </Button>
            <Button size="sm" onClick={() => setShowBookModal(true)} disabled={!selectedStudent}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Book
                </Button>
              </div>
            </div>
        {/* Cart Items */}
        {cart.length > 0 ? (
              <div className="space-y-3">
            {cart.map((item) => (
                  <div key={item.bookId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-600">₵{item.price} × {item.quantity}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                  <p className="font-semibold text-gray-900">₵{item.price * item.quantity}</p>
                      <button
                    onClick={() => handleRemoveFromCart(item.bookId)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
            {/* Discount Section */}
            <div className="pt-4 space-y-2">
              <div className="flex items-center space-x-2">
                <label className="font-medium">Discount:</label>
                <select
                  className="px-2 py-1 border rounded"
                  value={discountType}
                  onChange={e => {
                    setDiscountType(e.target.value as 'percent' | 'flat');
                    setDiscountValue(0);
                  }}
                >
                  <option value="percent">Percent (%)</option>
                  <option value="flat">Flat (₵)</option>
                </select>
                <Input
                  type="number"
                  min={0}
                  max={discountType === 'percent' ? 100 : subtotal}
                  value={discountValue}
                  onChange={e => setDiscountValue(Number(e.target.value))}
                  className="w-24"
                  disabled={!canApplyDiscount}
                />
                {needsOverride && (
                  <>
                    <Input
                      type="text"
                      placeholder="Override code"
                      value={overrideCode}
                      onChange={e => setOverrideCode(e.target.value)}
                      className="w-32"
                    />
                    <Button size="sm" onClick={handleOverride}>Override</Button>
                  </>
                )}
              </div>
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>₵{subtotal}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600 text-sm">
                  <span>Discount:</span>
                  <span>-₵{discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span>₵{total}</span>
              </div>
            </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No items added</p>
              </div>
            )}
          </Card>

      {/* Split Payment Section */}
      {cart.length > 0 && (
        <Card>
          <div className="pt-6">
            <h4 className="font-semibold mb-2">Payment Breakdown</h4>
            <div className="space-y-2">
              {payments.map((p, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <select
                    className="px-2 py-1 border rounded"
                    value={p.method}
                    onChange={e => handlePaymentChange(idx, 'method', e.target.value)}
                  >
                    {paymentMethods.map((m) => (
                      <option key={m.key} value={m.key}>{m.label}</option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min={0}
                    value={p.amount}
                    onChange={e => handlePaymentChange(idx, 'amount', e.target.value)}
                    className="w-24"
                    placeholder="Amount"
                  />
                  <Input
                    type="text"
                    value={p.reference}
                    onChange={e => handlePaymentChange(idx, 'reference', e.target.value)}
                    className="w-32"
                    placeholder="Reference/Notes"
                  />
                  {payments.length > 1 && (
                    <Button size="sm" variant="danger" onClick={() => handleRemovePayment(idx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={handleAddPayment}>
                <Plus className="h-4 w-4 mr-1" /> Add Payment Method
              </Button>
              <div className="flex justify-between text-sm pt-2">
                <span>Total Entered:</span>
                <span>₵{paymentSum}</span>
              </div>
              {!isPaymentValid && (
                <div className="text-red-600 text-sm">Payment total must match ₵{total}.</div>
              )}
            </div>
          </div>
          {/* Complete Purchase Button */}
          <div className="pt-6 flex justify-end">
            <Button disabled={!isPaymentValid || cart.length === 0} onClick={handleCompletePurchase}>
              Complete Purchase
            </Button>
          </div>
        </Card>
      )}

      {/* Receipt Preview Modal */}
      <Modal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        title="Receipt Preview"
        size="md"
      >
        {lastReceipt && (
          <div className="print-receipt bg-white rounded-lg shadow p-0 max-w-lg mx-auto print:max-w-full print:shadow-none print:p-0 print:bg-white font-sans">
            {/* Header with logo and title */}
            <div className="bg-blue-50 border-b border-blue-200 px-8 pt-8 pb-4 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Stylized logo (SVG or initials) */}
                <div className="bg-blue-800 text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl font-bold shadow">
                  BS
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-blue-900 tracking-wide">BookShop</div>
                  <div className="text-xs text-blue-700 font-semibold uppercase tracking-wider">Official Receipt</div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-gray-400">Receipt No.</span>
                <span className="font-mono text-base">{lastReceipt.id}</span>
                <div className="mt-2"><QRCodeCanvas value={lastReceipt.id} size={40} /></div>
              </div>
            </div>
            {/* Two-column info */}
            <div className="px-8 pt-4 pb-2 grid grid-cols-2 gap-4 border-b border-gray-200">
              <div>
                <div className="text-xs text-gray-500 font-semibold mb-1">Billed To</div>
                <div className="font-semibold text-gray-900">{lastReceipt.student?.name}</div>
                <div className="text-xs text-gray-600">Class: {lastReceipt.student?.class}</div>
                <div className="text-xs text-gray-600">Student ID: {lastReceipt.student?.studentId}</div>
              </div>
              <div className="flex flex-col items-end justify-between">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="inline-block bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full text-xs">PAID</span>
                  <span className="text-xs text-gray-500">{lastReceipt.date}</span>
                </div>
                <div className="text-right text-xs text-gray-500">Payment Method(s):
                  <div className="flex space-x-2 mt-1 justify-end">
                    {lastReceipt.payments.map((p: any, idx: number) => (
                      <span key={idx} className="flex items-center space-x-1">
                        {paymentIcons[p.method] || paymentIcons.other}
                        <span className="text-xs text-gray-700">{paymentMethods.find(m => m.key === p.method)?.label || p.method}</span>
                        {p.reference && <span className="text-xs text-gray-400">({p.reference})</span>}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* Confirmation message */}
            <div className="px-8 py-2 text-center text-sm text-gray-700 border-b border-gray-200">Thank you, <span className="font-semibold">{lastReceipt.student?.name}</span>! You have successfully paid for your purchase.</div>
            {/* Items Table */}
            <div className="px-8 py-4">
              <div className="font-semibold mb-2 text-gray-800">Items</div>
              <table className="w-full text-sm border-t border-b border-gray-200">
                <thead>
                  <tr className="text-left text-gray-500 bg-gray-50">
                    <th className="py-2">Title</th>
                    <th className="py-2">Qty</th>
                    <th className="py-2 text-right">Price</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lastReceipt.items.map((item: any, idx: number) => (
                    <tr key={item.bookId} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="py-2">{item.title}</td>
                      <td className="py-2">{item.quantity}</td>
                      <td className="py-2 text-right">₵{item.price}</td>
                      <td className="py-2 text-right">₵{item.price * item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Summary Section */}
            <div className="px-8 pb-4">
              <div className="bg-gray-50 rounded-lg p-4 max-w-xs ml-auto">
                <div className="flex justify-between text-sm mb-1">
                  <span>Subtotal</span>
                  <span>₵{lastReceipt.subtotal}</span>
                </div>
                {lastReceipt.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 mb-1">
                    <span>Discount</span>
                    <span>-₵{lastReceipt.discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold border-t border-gray-200 pt-2 mt-2">
                  <span>Total Paid</span>
                  <span>₵{lastReceipt.total}</span>
                </div>
                {/* Outstanding balance if any */}
                {lastReceipt.payments && lastReceipt.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0) < lastReceipt.total && (
                  <div className="flex justify-between text-sm text-red-600 mt-1">
                    <span>Outstanding</span>
                    <span>₵{lastReceipt.total - lastReceipt.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0)}</span>
                  </div>
                )}
              </div>
            </div>
            {/* Footer */}
            <div className="px-8 pb-6">
              <div className="text-center text-xs text-gray-400 mb-4">Thank you for your business! | Contact: 0302-123-456 | bookshop@example.com</div>
              <div className="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0 justify-center print-hidden">
                <Button variant="outline" onClick={handlePrintReceipt}>Print</Button>
                <Button variant="outline" onClick={() => {navigator.clipboard.writeText(getWhatsAppMessage(lastReceipt)); alert('WhatsApp message copied!');}}>Copy WhatsApp Message</Button>
                <Button variant="outline" onClick={() => {alert('Email sent (simulated)!');}}>Send Email</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Admin-only: Bundle Management */}
      {user?.role === 'admin' && (
          <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Class Bundles</h3>
            <div className="flex space-x-2">
              {availableClasses.map((cls) => (
                <Button key={cls} size="sm" variant="outline" onClick={() => openBundleModal(cls)}>
                  <Package className="h-4 w-4 mr-1" /> Edit {cls} Bundle
                </Button>
              ))}
            </div>
              </div>
          <div className="text-sm text-gray-600">Edit the list of books and quantities for each class bundle.</div>
          </Card>
      )}

      {/* Student Selection Modal */}
      <Modal
        isOpen={showStudentModal}
        onClose={() => setShowStudentModal(false)}
        title="Select Student"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex space-x-2">
            <select
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">All Classes</option>
              {availableClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
              className="w-1/2"
          />
          </div>
          
          <div className="max-h-64 overflow-y-auto space-y-2">
            {filteredStudents.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                {students.length === 0 ? 'No students imported yet. Please import students first.' : 'No students found matching your search criteria.'}
              </div>
            )}
            {filteredStudents.map((student) => (
              <button
                key={student.id}
                onClick={() => {
                  setSelectedStudent(student);
                  setShowStudentModal(false);
                }}
                className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border border-gray-200"
              >
                <p className="font-medium text-gray-900">{student.name}</p>
                <p className="text-sm text-gray-600">{student.class} - Student ID: {student.studentId}</p>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Book Selection Modal */}
      <Modal
        isOpen={showBookModal}
        onClose={() => setShowBookModal(false)}
        title="Add Book"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            placeholder="Search books..."
            value={bookSearch}
            onChange={(e) => setBookSearch(e.target.value)}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBooks.length === 0 && <div className="text-gray-400 col-span-2">No books found.</div>}
            {filteredBooks.map((book) => (
              <div key={book.id} className="border border-gray-200 rounded-lg p-4 flex flex-col justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{book.title}</h4>
                  <p className="text-sm text-gray-600">{book.class}</p>
                    <p className="text-xs text-gray-500">Stock: {book.stock}</p>
                  <p className="text-xs text-gray-500">₵{book.price}</p>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <Input
                    type="number"
                    min={1}
                    max={book.stock}
                    value={bookQty}
                    onChange={(e) => setBookQty(Number(e.target.value))}
                    className="w-16"
                    disabled={book.stock === 0}
                  />
                <Button
                  size="sm"
                    onClick={() => handleAddBookToCart(book, bookQty)}
                  disabled={book.stock === 0}
                >
                    <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
                </div>
                {book.stock === 0 && <div className="text-xs text-red-500 mt-1">Out of stock</div>}
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Bundle Edit Modal (Admin Only) */}
      <Modal
        isOpen={showBundleModal}
        onClose={() => setShowBundleModal(false)}
        title={`Edit ${bundleClass} Bundle`}
        size="md"
      >
        <div className="space-y-4">
          <div className="flex space-x-2 items-end">
            <select
              className="w-2/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={addBookId}
              onChange={(e) => setAddBookId(e.target.value)}
            >
              <option value="">Select Book</option>
              {mockBooks
                .filter(
                  (b) =>
                    !editingBundle.some((eb) => eb.bookId === b.id) &&
                    (bundleClass === '' || b.class === bundleClass)
                )
                .map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.title}
                  </option>
                ))}
            </select>
            <Input
              type="number"
              min={1}
              value={addBookQty}
              onChange={(e) => setAddBookQty(Number(e.target.value))}
              className="w-1/4"
            />
            <Button size="sm" onClick={handleAddBookToBundle}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
          <div className="space-y-2">
            {editingBundle.length === 0 && <div className="text-gray-400">No books in bundle.</div>}
            {editingBundle.map((item) => {
              const book = mockBooks.find((b) => b.id === item.bookId);
              return (
                <div key={item.bookId} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium text-gray-900">{book?.title}</div>
              </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => handleBundleQtyChange(item.bookId, Number(e.target.value))}
                      className="w-16"
                    />
                    <Button size="sm" variant="danger" onClick={() => handleRemoveBookFromBundle(item.bookId)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
          </div>
            </div>
              );
            })}
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" onClick={() => setShowBundleModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBundle}>
              Save Bundle
            </Button>
          </div>
        </div>
      </Modal>

      {/* Purchase History Modal */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title="Purchase History"
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Input
              type="date"
              value={historyFilter.dateFrom}
              onChange={e => setHistoryFilter(f => ({ ...f, dateFrom: e.target.value }))}
              className="w-32"
              placeholder="From"
            />
            <Input
              type="date"
              value={historyFilter.dateTo}
              onChange={e => setHistoryFilter(f => ({ ...f, dateTo: e.target.value }))}
              className="w-32"
              placeholder="To"
            />
            <select
              className="px-2 py-1 border rounded"
              value={historyFilter.term}
              onChange={e => setHistoryFilter(f => ({ ...f, term: e.target.value }))}
            >
              <option value="">All Terms</option>
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </select>
            <select
              className="px-2 py-1 border rounded"
              value={historyFilter.payment}
              onChange={e => setHistoryFilter(f => ({ ...f, payment: e.target.value }))}
            >
              <option value="">All Payments</option>
              <option value="cash">Cash</option>
              <option value="momo">Mobile Money</option>
              <option value="bank">Bank Transfer</option>
              <option value="other">Other</option>
            </select>
            {user?.role === 'admin' && (
              <Button size="sm" variant="outline" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-1" /> Export CSV
              </Button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-2 py-1 border">Receipt ID</th>
                  <th className="px-2 py-1 border">Date</th>
                  <th className="px-2 py-1 border">Term</th>
                  <th className="px-2 py-1 border">Payment</th>
                  <th className="px-2 py-1 border">Total</th>
                  <th className="px-2 py-1 border">Paid</th>
                  <th className="px-2 py-1 border">Balance</th>
                  <th className="px-2 py-1 border">Items</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length === 0 && (
                  <tr><td colSpan={8} className="text-center text-gray-400 py-4">No purchases found.</td></tr>
                )}
                {filteredHistory.map(h => (
                  <tr key={h.id}>
                    <td className="px-2 py-1 border">{h.id}</td>
                    <td className="px-2 py-1 border">{h.date}</td>
                    <td className="px-2 py-1 border">{h.term}</td>
                    <td className="px-2 py-1 border">{h.payment}</td>
                    <td className="px-2 py-1 border">₵{h.total}</td>
                    <td className="px-2 py-1 border">₵{h.paid}</td>
                    <td className={"px-2 py-1 border " + (h.balance > 0 ? 'text-red-600 font-bold' : '')}>₵{h.balance}</td>
                    <td className="px-2 py-1 border">
                      <ul>
                        {h.items.map((item, idx) => (
                          <li key={idx}>{item.title} x{item.quantity}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StudentPurchasePage;