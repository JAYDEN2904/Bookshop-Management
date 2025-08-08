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

The backend API will be implemented here to support the frontend functionality.

## Development

This project uses a monorepo structure with separate frontend and backend directories for better organization and maintainability.
