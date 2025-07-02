import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (!token || token == 'undefined') return;
    const { exp } = jwtDecode(token);
    const timeout = exp * 1000 - Date.now();
    const id = setTimeout(logout, timeout);
    return () => clearTimeout(id);
  }, [token]);

  function login(newToken) {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  }
  function logout() {
    localStorage.removeItem('token');
    setToken(null);
  }
  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}