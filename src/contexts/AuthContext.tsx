import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type User = Record<string, any>;

type AuthContextType = {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  updateUser: (updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) setUser(JSON.parse(userStr));
      } catch {} finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates } as User;
      AsyncStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const refreshUser = useCallback(async () => {
    const userStr = await AsyncStorage.getItem('user');
    if (userStr) setUser(JSON.parse(userStr));
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin: user?.role === 'admin',
        isLoading,
        updateUser,
        refreshUser,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
