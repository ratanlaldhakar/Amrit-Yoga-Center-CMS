import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AdminLayout } from './components/layout/AdminLayout';

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AdminLayout />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
