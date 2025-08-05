import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { InventoryProvider } from './contexts/InventoryContext';
import { StudentProvider } from './contexts/StudentContext';
import { SupplierProvider } from './contexts/SupplierContext';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import CashierDashboard from './pages/dashboard/CashierDashboard';
import InventoryPage from './pages/inventory/InventoryPage';
import StudentPurchasePage from './pages/purchase/StudentPurchasePage';
import StudentsPage from './pages/students/StudentsPage';
import SuppliersPage from './pages/suppliers/SuppliersPage';
import ReportsPage from './pages/reports/ReportsPage';
import UserManagementPage from './pages/users/UserManagementPage';
import ReceiptsPage from './pages/receipts/ReceiptsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ 
  children, 
  adminOnly = false 
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  return user?.role === 'admin' ? <AdminDashboard /> : <CashierDashboard />;
};

function App() {
  return (
    <AuthProvider>
      <InventoryProvider>
        <StudentProvider>
          <SupplierProvider>
            <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                
                <Route element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/inventory" element={<InventoryPage />} />
                  <Route path="/purchase" element={<StudentPurchasePage />} />
                  <Route path="/students" element={<StudentsPage />} />
                  <Route path="/suppliers" element={
                    <ProtectedRoute adminOnly>
                      <SuppliersPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/reports" element={
                    <ProtectedRoute adminOnly>
                      <ReportsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/users" element={
                    <ProtectedRoute adminOnly>
                      <UserManagementPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/receipts" element={<ReceiptsPage />} />
                </Route>
              </Routes>
            </Router>
          </SupplierProvider>
        </StudentProvider>
      </InventoryProvider>
    </AuthProvider>
  );
}

export default App;