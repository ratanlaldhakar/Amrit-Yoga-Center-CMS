import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { storageService } from '../services/storageService';

const ACTIVE_USER_STORAGE_KEY = 'ayc_active_user_id';

interface AuthContextType {
  currentUser: User;
  setUser: (user: User) => void;
  availableUsers: User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => storageService.getUsers());
  const [activeUserId, setActiveUserId] = useState<string>(() => {
    try {
      return localStorage.getItem(ACTIVE_USER_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  // Keep users in sync with storage updates (e.g. user added/edited/deleted)
  useEffect(() => {
    const handleUpdate = () => {
      setUsers(storageService.getUsers());
    };
    window.addEventListener('amrit_data_updated', handleUpdate);
    return () => window.removeEventListener('amrit_data_updated', handleUpdate);
  }, []);

  // Determine current active user
  const currentUser: User =
    users.find(u => u.id === activeUserId) ||
    users[0] || {
      id: 'u-1',
      fullName: 'Suresh Kumar',
      email: 'contact@amrityogacenter.in',
      phone: '+91 7737773384',
      designation: 'Center Director & Founder',
      active: true,
      createdAt: '2024-01-01',
    };

  const setUser = (user: User) => {
    setActiveUserId(user.id);
    try {
      localStorage.setItem(ACTIVE_USER_STORAGE_KEY, user.id);
    } catch (e) {
      console.warn('Could not persist active user to localStorage', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setUser,
        availableUsers: users,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

