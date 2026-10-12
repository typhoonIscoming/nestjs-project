'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
	token: string | null;
	user: User | null;
	hydrated: boolean;
	setAuth: (token: string, user: User) => void;
	setUser: (user: User) => void;
	logout: () => void;
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set) => ({
			token: null,
			user: null,
			hydrated: false,
			setAuth: (token, user) => set({ token, user }),
			setUser: (user) => set({ user }),
			logout: () => set({ token: null, user: null }),
		}),
		{
			name: 'web3-career-auth',
			partialize: (state) => ({ token: state.token, user: state.user }),
			skipHydration: true,
		}
	)
);
