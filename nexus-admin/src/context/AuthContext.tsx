import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { isAxiosError } from 'axios';
import api from '../services/api';
import { User } from '../api/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(sessionStorage.getItem('nexus-token'));
  const [isLoading, setIsLoading] = useState(true);
  const isAdmin = user?.roleId === 1;

  const logError = (label: string, error: unknown) => {
    if (isAxiosError(error)) {
      console.warn(label, error.response?.status ?? 'unknown', error.message);
      return;
    }
    if (error instanceof Error) {
      console.warn(label, error.message);
      return;
    }
    console.warn(label);
  };

  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data } = await api.get<User>('/me');
        if (data.roleId !== 1) {
          await logout();
          return;
        }
        setUser(data);
      } catch (error) {
        logError("Failed to load user", error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // Faz login, salva o token e já carrega o perfil para evitar redirecionar de volta ao login.
  const login = async (newToken: string) => {
    setIsLoading(true);
    sessionStorage.setItem('nexus-token', newToken);
    setToken(newToken);
    try {
      const { data } = await api.get<User>('/me');
      if (data.roleId !== 1) {
        await logout();
        return;
      }
      setUser(data);
    } catch (error) {
      logError("Failed to load user after login", error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      logError("Failed to logout", error);
    }
    sessionStorage.removeItem('nexus-token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, isAdmin, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
