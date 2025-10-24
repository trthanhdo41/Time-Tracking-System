import { create } from 'zustand';
import { Session, UserStatus } from '@/types';

interface SessionState {
  currentSession: Session | null;
  status: UserStatus;
  setSession: (session: Session | null) => void;
  setStatus: (status: UserStatus) => void;
  updateSession: (updates: Partial<Session>) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  currentSession: null,
  status: 'offline',
  setSession: (session) => set({ 
    currentSession: session,
    status: session?.status || 'offline'
  }),
  setStatus: (status) => set({ status }),
  updateSession: (updates) => set((state) => ({
    currentSession: state.currentSession 
      ? { ...state.currentSession, ...updates }
      : null
  })),
}));

