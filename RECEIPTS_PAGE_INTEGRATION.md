# Receipts Page Integration with Purchases

## Overview
The Receipts page is now integrated with the Student Purchase system. All purchases made through the purchase page will automatically appear on the Receipts page, grouped by receipt number.

## How It Works

### Purchase Creation Flow
1. When a student makes a purchase with multiple books:
   - First purchase gets a receipt number from the database
   - Subsequent purchases in the same transaction reuse that receipt number
   - All purchases are linked by the same receipt number

2. Backend stores:
   - Each purchase as a separate record
   - All purchases in the same transaction share the same `receipt_number`
   - Cashier ID (if column exists - see migration script)

### Receipts Page Flow
1. Fetches all purchases from the API
2. Groups purchases by `receipt_number`
3. Creates receipt objects with:
   - Receipt ID (receipt_number)
   - Student information
   - List of all items (books) in that receipt
   - Total amount
   - Cashier information (if available)
   - Date and time

## Database Schema

### Current Purchases Table
```sql
CREATE TABLE purchases (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES students(id),
  book_id UUID REFERENCES books(id),
  quantity INTEGER,
  unit_price DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  receipt_number VARCHAR(50) UNIQUE,
  created_at TIMESTAMP
);
```

### Optional: Add Cashier Tracking
To track which cashier processed each purchase, run:
```sql
-- Run: backend/scripts/add-cashier-to-purchases.sql
ALTER TABLE purchases
  ADD COLUMN cashier_id UUID REFERENCES users(id);
```

## Features

### Receipts Page Features
- ✅ View all receipts from purchases
- ✅ Filter by date (today, yesterday, last 7 days, last 30 days)
- ✅ Filter by payment method
- ✅ Filter by cashier (if cashier_id column exists)
- ✅ Search by receipt ID, student name, or cashier
- ✅ View receipt details in modal
- ✅ Print receipts
- ✅ Export receipts (CSV)
- ✅ Statistics (total receipts, total amount, unique students, today's receipts)

### Receipt Grouping
- Purchases with the same `receipt_number` are grouped into one receipt
- Each receipt shows all items purchased in that transaction
- Total amount is calculated from all items in the receipt

## API Endpoints Used

### GET /api/purchases
- Fetches all purchases
- Supports filtering by:
  - `start_date` - Filter purchases from this date
  - `end_date` - Filter purchases until this date
  - `student_id` - Filter by student
  - `book_id` - Filter by book
  - `search` - Search by student name or book title
  - `page` - Pagination page number
  - `limit` - Items per page

### Response Format
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "student_id": "uuid",
      "book_id": "uuid",
      "quantity": 1,
      "unit_price": 50.00,
      "total_amount": 50.00,
      "receipt_number": "RCP20240001",
      "created_at": "2024-01-15T10:30:00Z",
      "students": {
        "id": "uuid",
        "name": "John Doe",
        "student_id": "ST001",
        "class_level": "Basic 9"
      },
      "books": {
        "id": "uuid",
        "title": "Mathematics (Basic 9)",
        "class_level": "Basic 9",
        "subject": "Mathematics"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 1000,
    "total": 150,
    "pages": 1
  }
}
```

## Receipt Data Structure

### Receipt Object
```typescript
{
  id: string;              // receipt_number
  studentId: string;       // student UUID
  studentName: string;     // student name
  items: PurchaseItem[];   // array of books purchased
  total: number;           // total amount
  discount: number;        // discount (currently 0, not stored)
  paymentMode: 'cash' | 'card' | 'upi'; // payment method
  cashierId: string;       // cashier UUID (if available)
  cashierName: string;     // cashier name (if available)
  createdAt: string;       // purchase date/time
}
```

### PurchaseItem Object
```typescript
{
  bookId: string;          // book UUID
  title: string;           // book title/subject
  quantity: number;        // quantity purchased
  price: number;           // unit price
  total: number;           // total for this item
}
```

## Migration Steps

### Step 1: Add Cashier Tracking (Optional)
1. Open Supabase Dashboard → SQL Editor
2. Run: `backend/scripts/add-cashier-to-purchases.sql`
3. This adds `cashier_id` column to track which user processed each purchase

### Step 2: Verify Receipts Are Displayed
1. Make a purchase through the Student Purchase page
2. Go to Receipts page
3. Verify the receipt appears in the list
4. Click on the receipt to view details

## Troubleshooting

### No Receipts Showing
1. **Check if purchases exist:**
   - Go to backend logs
   - Check if purchases are being created
   - Verify receipt_number is being generated

2. **Check API response:**
   - Open browser console
   - Check Network tab for `/api/purchases` request
   - Verify response has `success: true` and `data` array

3. **Check date filter:**
   - Receipts are filtered by date
   - Try changing the date filter to "Last 30 Days"
   - Check if receipts appear

### Receipts Not Grouped Correctly
1. **Check receipt_number:**
   - All purchases in the same transaction should have the same receipt_number
   - Verify in database that receipt_number is consistent

2. **Check grouping logic:**
   - Receipts are grouped by `receipt_number`
   - If receipt_number is missing, purchases won't group correctly

### Cashier Name Shows "Unknown Cashier"
1. **Run migration:**
   - Run `backend/scripts/add-cashier-to-purchases.sql`
   - This adds cashier_id column to purchases table

2. **New purchases will include cashier:**
   - Only new purchases after migration will have cashier_id
   - Old purchases will show "Unknown Cashier"

## Future Enhancements

1. **Store Payment Method:**
   - Add payment_method column to purchases table
   - Store payment method when creating purchase
   - Display in receipts

2. **Store Discount:**
   - Add discount column to purchases table
   - Store discount amount when creating purchase
   - Display in receipts

3. **Store Payment Details:**
   - Add payment_details JSONB column
   - Store split payment information
   - Display in receipts

4. **Receipt Numbering:**
   - Use transaction-based receipt numbers
   - Generate one receipt number per transaction
   - Link all purchases in transaction to same receipt

5. **Receipt Export:**
   - Export receipts as PDF
   - Export receipts as CSV
   - Email receipts to students

## Files Modified

- `frontend/src/pages/receipts/ReceiptsPage.tsx` - Updated to fetch and display real purchases
- `frontend/src/pages/purchase/StudentPurchasePage.tsx` - Updated to reuse receipt numbers
- `backend/src/routes/purchases-supabase.ts` - Updated to support receipt_number parameter
- `backend/scripts/add-cashier-to-purchases.sql` - Migration script for cashier tracking

## Testing

### Test Purchase Creation
1. Create a student
2. Create books with stock
3. Go to Purchase page
4. Select student
5. Add multiple books to cart
6. Complete purchase
7. Verify receipt number is generated

### Test Receipts Display
1. Go to Receipts page
2. Verify receipt appears in list
3. Check receipt details:
   - Receipt ID matches
   - Student name is correct
   - All items are listed
   - Total amount is correct
   - Date/time is correct

### Test Receipt Filtering
1. Filter by date (today, yesterday, etc.)
2. Filter by payment method
3. Search by receipt ID
4. Search by student name
5. Verify filters work correctly

## Notes

- Receipts are grouped by `receipt_number`
- Each purchase record represents one book purchase
- Multiple purchases with the same receipt_number form one receipt
- Cashier information is optional (requires migration)
- Payment method and discount are not stored (defaults used)
- Date filtering works based on `created_at` timestamp








