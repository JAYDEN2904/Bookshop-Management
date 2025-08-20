# Bookshop Management System

A comprehensive bookshop management system with separate frontend and backend components.

## Project Structure

```
Bookshop Management System 2/
├── frontend/          # React + TypeScript + Vite frontend application
│   ├── src/           # Source code
│   ├── dist/          # Build output
│   ├── node_modules/  # Frontend dependencies
│   └── ...            # Frontend configuration files
├── backend/           # Backend API (to be implemented)
└── README.md          # This file
```

## Frontend

The frontend is a React application built with:
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Context API** for state management

### Features
- User authentication (Login/Signup)
- Role-based dashboards (Admin/Cashier)
- Inventory management
- Student management
- Supplier management
- Purchase management
- Receipts and reporting
- User management

### Getting Started

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and visit `http://localhost:5173`

## Backend

The backend is a Node.js/Express API built with:
- **Node.js** with Express.js
- **PostgreSQL** database with Prisma ORM
- **JWT** authentication
- **TypeScript** for type safety
- **File upload** support for Excel imports

### Getting Started

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp env.example .env
   ```

4. Set up the database:
   ```bash
   npm run db:generate
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. The API will be available at `http://localhost:5000`

### API Documentation

See the [backend README](./backend/README.md) for detailed API documentation and setup instructions.

## Development

This project uses a monorepo structure with separate frontend and backend directories for better organization and maintainability.
