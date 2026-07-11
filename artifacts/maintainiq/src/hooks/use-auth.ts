import { create } from 'zustand';
import { User, AuthSession } from '@workspace/api-client-react';

interface AuthState {
  user: User | null;
  token: string | null;
  setSession: (session: AuthSession | null) => void;
  updateUser: (user: User) => void;
  logout: () => void;
}

const getStoredToken = () => {
  try {
    return localStorage.getItem('maintainiq_token');
  } catch (e) {
    return null;
  }
};

const getStoredUser = () => {
  try {
    const userStr = localStorage.getItem('maintainiq_user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    return null;
  }
};

export const useAuth = create<AuthState>()((set) => ({
  user: getStoredUser(),
  token: getStoredToken(),
  setSession: (session) => {
    if (session) {
      localStorage.setItem('maintainiq_token', session.token);
      localStorage.setItem('maintainiq_user', JSON.stringify(session.user));
      set({ user: session.user, token: session.token });
    } else {
      localStorage.removeItem('maintainiq_token');
      localStorage.removeItem('maintainiq_user');
      set({ user: null, token: null });
    }
  },
  updateUser: (user) => {
    localStorage.setItem('maintainiq_user', JSON.stringify(user));
    set({ user });
  },
  logout: () => {
    localStorage.removeItem('maintainiq_token');
    localStorage.removeItem('maintainiq_user');
    set({ user: null, token: null });
  }
}));
