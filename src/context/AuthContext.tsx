import React, { createContext, useState, useContext } from 'react';

interface AuthContextType {
  userToken: string | null;
  userRole: string | null;
  login: (token: string, role: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  userToken: null,
  userRole: null,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const login = (token: string, role: string) => {
    setUserToken(token);
    setUserRole(role);
  };

  const logout = () => {
    setUserToken(null);
    setUserRole(null);
  };

  return (
    
      {children}
    
  );
};

export const useAuth = () => useContext(AuthContext);