'use client';

import { AuthProvider } from '@/lib/auth';
import { SelectionProvider } from '@/lib/selection';
import LoginModal from '@/components/LoginModal';
import SelectionCart from '@/components/SelectionCart';

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <SelectionProvider>
                {children}
                <SelectionCart />
                <LoginModal />
            </SelectionProvider>
        </AuthProvider>
    );
}
