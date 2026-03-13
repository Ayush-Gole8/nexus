import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AuthUser } from '../api/auth';
import { getMe } from '../api/auth';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  isOfficial: boolean;
  isAdmin: boolean;
  isCitizen: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: () => {},
  logout: () => {},
  isOfficial: false,
  isAdmin: false,
  isCitizen: true,
});

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('nexus_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      getMe(token)
        .then((u) => {
          const payload = parseJwtPayload(token);
          const wardFromJwt = typeof payload?.wardId === 'string' ? payload.wardId : undefined;
          setUser({ ...u, wardId: u.wardId || wardFromJwt });
        })
        .catch(() => {
          localStorage.removeItem('nexus_token');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const loginFn = (newToken: string, newUser: AuthUser) => {
    const payload = parseJwtPayload(newToken);
    const wardFromJwt = typeof payload?.wardId === 'string' ? payload.wardId : undefined;
    localStorage.setItem('nexus_token', newToken);
    setToken(newToken);
    setUser({ ...newUser, wardId: newUser.wardId || wardFromJwt });
  };

  const logout = () => {
    localStorage.removeItem('nexus_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login: loginFn,
        logout,
        isOfficial: user?.role === 'official' || user?.role === 'admin',
        isAdmin: user?.role === 'admin',
        isCitizen: user?.role === 'citizen',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
