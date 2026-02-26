'use client';

import { AuthProvider } from '@/lib/auth';
import LoginModal from '@/components/LoginModal';

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            {children}
            <LoginModal />
        </AuthProvider>
    );
}
