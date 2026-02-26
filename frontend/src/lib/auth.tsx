'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
    id: string;
    name: string;
    alias: string;
    email?: string;
    phone?: string;
    provider: 'google' | 'facebook' | 'email' | 'phone' | 'alias';
    avatar?: string;
    verified: boolean;
    created_at: string;
}

interface AuthContextType {
    user: User | null;
    isLoggedIn: boolean;
    showLogin: boolean;
    setShowLogin: (show: boolean) => void;
    login: (user: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoggedIn: false,
    showLogin: false,
    setShowLogin: () => { },
    login: () => { },
    logout: () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [showLogin, setShowLogin] = useState(false);

    // Load user from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('vp_user');
            if (stored) {
                try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
            }
        }
    }, []);

    const login = (userData: User) => {
        setUser(userData);
        localStorage.setItem('vp_user', JSON.stringify(userData));
        setShowLogin(false);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('vp_user');
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoggedIn: !!user,
            showLogin,
            setShowLogin,
            login,
            logout,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
