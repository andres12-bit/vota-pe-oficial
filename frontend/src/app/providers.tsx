'use client';

import { AuthProvider } from '@/lib/auth';
import { SelectionProvider } from '@/lib/selection';
import LoginModal from '@/components/LoginModal';

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <SelectionProvider>
                {children}
                <LoginModal />
            </SelectionProvider>
        </AuthProvider>
    );
}
