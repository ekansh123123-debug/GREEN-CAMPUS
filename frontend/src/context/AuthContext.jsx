import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEMO_USERS } from '../data/mockData';
import { getStoredUser, setStoredUser, setStoredToken } from '../lib/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser() || DEMO_USERS.student);

  useEffect(() => {
    setStoredUser(user);
  }, [user]);

  const login = (userData, authToken = 'demo-token') => {
    setUser(userData);
    setStoredToken(authToken);
    setStoredUser(userData);
  };

  const logout = () => {
    setUser(null);
    setStoredToken(null);
    setStoredUser(null);
  };

  // Quick role switcher for testing and demonstration
  const switchDemoRole = (roleKey) => {
    const targetUser = DEMO_USERS[roleKey] || DEMO_USERS.student;
    login(targetUser, `demo-${roleKey}-token`);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'student',
        isAuthenticated: !!user,
        login,
        logout,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// oxlint-disable-next-line react/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
