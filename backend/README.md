# Bookshop Management System - Backend

A robust Node.js/Express backend API for the Bookshop Management System with PostgreSQL database and Prisma ORM.

## 🚀 Tech Stack

- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens
- **Validation**: Joi
- **File Upload**: Multer
- **Security**: Helmet, CORS
- **Language**: TypeScript

## 📁 Project Structure

```
backend/
├── src/
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Data models (Prisma)
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   ├── config/          # Configuration files
│   └── server.ts        # Main server file
├── prisma/
│   └── schema.prisma    # Database schema
├── uploads/             # File uploads directory
├── package.json
├── tsconfig.json
└── README.md
```

## 🛠️ Setup Instructions

### Prerequisites

1. **Node.js** (v18 or higher)
2. **PostgreSQL** database
3. **npm** or **yarn**

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   DATABASE_URL="postgresql://username:password@localhost:5432/bookshop_db"
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d
   ```

3. **Set up the database:**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # Or run migrations
   npm run db:migrate
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Books (Inventory)
- `GET /api/books` - Get all books
- `GET /api/books/:id` - Get single book
- `POST /api/books` - Create book (Admin only)
- `PUT /api/books/:id` - Update book (Admin only)
- `DELETE /api/books/:id` - Delete book (Admin only)
- `GET /api/books/low-stock` - Get low stock books

### Students
- `GET /api/students` - Get all students
- `POST /api/students` - Create student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `POST /api/students/import` - Import students from Excel

### Suppliers (Admin only)
- `GET /api/suppliers` - Get all suppliers
- `POST /api/suppliers` - Create supplier
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

### Purchases
- `GET /api/purchases` - Get all purchases
- `POST /api/purchases` - Create purchase
- `GET /api/purchases/:id` - Get single purchase

### Reports (Admin only)
- `GET /api/reports/sales` - Sales reports
- `GET /api/reports/inventory` - Inventory reports
- `GET /api/reports/suppliers` - Supplier reports

## 🔐 Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 🗄️ Database Schema

The database includes the following main entities:

- **Users** - System users (Admin/Cashier)
- **Books** - Inventory items
- **Students** - Book purchasers
- **Suppliers** - Book suppliers
- **Purchases** - Sales transactions
- **StockHistory** - Inventory tracking
- **SupplyOrders** - Supplier orders
- **SupplierPayments** - Payment tracking

## 🚀 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with sample data

## 🔧 Development

### Adding New Routes

1. Create a new route file in `src/routes/`
2. Import and add to `src/server.ts`
3. Implement controllers in `src/controllers/`

### Database Changes

1. Update `prisma/schema.prisma`
2. Run `npm run db:generate`
3. Run `npm run db:push` or `npm run db:migrate`

### Environment Variables

Add new environment variables to:
- `env.example` (for documentation)
- `.env` (for local development)

## 🧪 Testing

To be implemented:
- Unit tests with Jest
- Integration tests
- API endpoint tests

## 📦 Production Deployment

1. Set `NODE_ENV=production`
2. Configure production database
3. Set secure JWT secret
4. Run `npm run build`
5. Start with `npm run start`

## 🤝 Contributing

1. Follow TypeScript best practices
2. Use proper error handling
3. Add input validation
4. Write meaningful commit messages
5. Test your changes

## 📄 License

This project is part of the Bookshop Management System.
