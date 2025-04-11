// src/context/AuthContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    isLoggedIn: false,
    userData: null
  });

  // Check auth state on initial load
  useEffect(() => {
    const token = localStorage.getItem('accessToken') || Cookies.get('accessToken');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      setAuthState({
        isLoggedIn: true,
        userData: JSON.parse(user)
      });
    }
  }, []);

  const login = (token, user, rememberMe = false) => {
    if (rememberMe) {
      Cookies.set('accessToken', token, { expires: 7 });
    } else {
      localStorage.setItem('accessToken', token);
    }
    localStorage.setItem('user', JSON.stringify(user));
    
    setAuthState({
      isLoggedIn: true,
      userData: user
    });
  };

  const logout = () => {
    Cookies.remove('accessToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setAuthState({
      isLoggedIn: false,
      userData: null
    });
  };

  return (
    <AuthContext.Provider value={{
      isLoggedIn: authState.isLoggedIn,
      userData: authState.userData,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};