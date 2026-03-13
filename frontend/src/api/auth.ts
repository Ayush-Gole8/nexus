import axios from 'axios';

const api = axios.create({ baseURL: '/api/auth' });

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'citizen' | 'official' | 'responder' | 'admin';
  zone?: string;
  wardId?: string;
  badgeNumber?: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export async function login(
  email: string,
  password: string,
  role?: string,
  wardId?: string,
): Promise<AuthResponse> {
  const { data } = await api.post('/login', { email, password, role, wardId });
  return data;
}

export async function register(
  name: string,
  email: string,
  password: string,
  role: string,
  zone?: string,
  phone?: string
): Promise<AuthResponse> {
  const { data } = await api.post('/register', { name, email, password, role, zone, phone });
  return data;
}

export async function getMe(token: string): Promise<AuthUser> {
  const { data } = await api.get('/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}
