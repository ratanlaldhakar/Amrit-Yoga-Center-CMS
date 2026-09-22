import React, { useEffect, useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AdminLayout } from './components/layout/AdminLayout';
import { SplashScreen } from './components/common/SplashScreen';
import { initializeMobileApp } from './services/mobileAppService';

export function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    initializeMobileApp();
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
        <AdminLayout />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;

