import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import { Toaster } from 'react-hot-toast';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
          >
            <Menu className="h-6 w-6" />
          </button>
        </header>

        {/* Main content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </div>
  );
};

export default Layout;