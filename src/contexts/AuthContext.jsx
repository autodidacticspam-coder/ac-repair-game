import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const USERNAME_KEY = 'ac-repair-game-username';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load username from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(USERNAME_KEY);
    if (saved) {
      setUsername(saved);
    }
    setLoading(false);
  }, []);

  const signIn = (name) => {
    const trimmed = name.trim().toLowerCase();
    if (trimmed) {
      localStorage.setItem(USERNAME_KEY, trimmed);
      setUsername(trimmed);
      return { success: true };
    }
    return { success: false, error: 'Please enter a username' };
  };

  const signOut = () => {
    localStorage.removeItem(USERNAME_KEY);
    setUsername(null);
  };

  const value = {
    user: username ? { username } : null,
    loading,
    signIn,
    signOut,
    isConfigured: true,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
