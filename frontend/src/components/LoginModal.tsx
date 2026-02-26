'use client';

import { useState } from 'react';
import { useAuth, User } from '@/lib/auth';

type AuthMethod = 'social' | 'email' | 'phone' | 'alias';

const METHODS: { id: AuthMethod; label: string; icon: string }[] = [
    { id: 'social', label: 'Red Social', icon: '🌐' },
    { id: 'email', label: 'Correo', icon: '📧' },
    { id: 'phone', label: 'Teléfono', icon: '📱' },
    { id: 'alias', label: 'Alias', icon: '👤' },
];

export default function LoginModal() {
    const { showLogin, setShowLogin, login } = useAuth();
    const [method, setMethod] = useState<AuthMethod>('social');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'form' | 'verify'>('form');

    // Form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [alias, setAlias] = useState('');
    const [verifyCode, setVerifyCode] = useState('');
    const [error, setError] = useState('');

    if (!showLogin) return null;

    const resetForm = () => {
        setName('');
        setEmail('');
        setPhone('');
        setAlias('');
        setVerifyCode('');
        setError('');
        setStep('form');
        setLoading(false);
    };

    const handleClose = () => {
        setShowLogin(false);
        resetForm();
    };

    const handleSocialLogin = (provider: 'google' | 'facebook') => {
        setLoading(true);
        // Simulate OAuth redirect delay
        setTimeout(() => {
            const user: User = {
                id: `${provider}_${Date.now()}`,
                name: provider === 'google' ? 'Usuario Google' : 'Usuario Facebook',
                alias: provider === 'google' ? '@google_user' : '@fb_user',
                email: `usuario@${provider}.com`,
                provider,
                avatar: undefined,
                verified: true,
                created_at: new Date().toISOString(),
            };
            login(user);
            resetForm();
        }, 1200);
    };

    const handleEmailSubmit = () => {
        if (!email || !name) {
            setError('Ingresa tu nombre y correo electrónico');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Correo electrónico inválido');
            return;
        }
        setError('');
        setStep('verify');
    };

    const handlePhoneSubmit = () => {
        if (!phone || !name) {
            setError('Ingresa tu nombre y número de teléfono');
            return;
        }
        if (!/^\+?[\d\s-]{7,15}$/.test(phone)) {
            setError('Número de teléfono inválido');
            return;
        }
        setError('');
        setStep('verify');
    };

    const handleVerifyCode = () => {
        if (verifyCode.length < 4) {
            setError('Ingresa el código de 6 dígitos');
            return;
        }
        setLoading(true);
        // Simulate verification
        setTimeout(() => {
            const user: User = {
                id: `${method}_${Date.now()}`,
                name,
                alias: alias || `@${name.split(' ')[0].toLowerCase()}`,
                email: method === 'email' ? email : undefined,
                phone: method === 'phone' ? phone : undefined,
                provider: method as 'email' | 'phone',
                verified: true,
                created_at: new Date().toISOString(),
            };
            login(user);
            resetForm();
        }, 1000);
    };

    const handleAliasLogin = () => {
        if (!alias || !name) {
            setError('Ingresa tu nombre y un alias');
            return;
        }
        setLoading(true);
        setTimeout(() => {
            const user: User = {
                id: `alias_${Date.now()}`,
                name,
                alias: alias.startsWith('@') ? alias : `@${alias}`,
                provider: 'alias',
                verified: false,
                created_at: new Date().toISOString(),
            };
            login(user);
            resetForm();
        }, 800);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
            <div className="w-full max-w-md rounded-2xl overflow-hidden animate-fade-in"
                style={{ background: 'var(--vp-surface)', border: '1px solid var(--vp-border)', boxShadow: '0 0 60px rgba(255,23,68,0.15)' }}>

                {/* Header */}
                <div className="p-6 pb-4 text-center relative" style={{ borderBottom: '1px solid var(--vp-border)' }}>
                    <button onClick={handleClose} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-lg transition-colors hover:bg-white/10" style={{ color: 'var(--vp-text-dim)' }}>
                        ✕
                    </button>
                    <img src="/logo.svg" alt="VOTA.PE" width={50} height={50} className="mx-auto mb-3 rounded-full" style={{ boxShadow: '0 0 20px var(--vp-red-glow)' }} />
                    <h2 className="text-lg font-black tracking-wider uppercase">
                        <span style={{ color: 'var(--vp-text)' }}>Ingresar a </span>
                        <span style={{ color: 'var(--vp-red)' }}>VOTA.PE</span>
                    </h2>
                    <p className="text-xs mt-1" style={{ color: 'var(--vp-text-dim)' }}>
                        Elige cómo quieres identificarte
                    </p>
                </div>

                {/* Method Tabs */}
                <div className="flex p-2 gap-1" style={{ background: 'rgba(0,0,0,0.2)' }}>
                    {METHODS.map(m => (
                        <button
                            key={m.id}
                            onClick={() => { setMethod(m.id); resetForm(); }}
                            className="flex-1 text-center py-2 rounded-lg text-[10px] font-bold tracking-wider transition-all"
                            style={{
                                background: method === m.id ? 'var(--vp-red)' : 'transparent',
                                color: method === m.id ? '#fff' : 'var(--vp-text-dim)',
                            }}
                        >
                            <div className="text-sm mb-0.5">{m.icon}</div>
                            {m.label}
                        </button>
                    ))}
                </div>

                {/* Form Content */}
                <div className="p-6">
                    {/* Social Login */}
                    {method === 'social' && (
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => handleSocialLogin('google')}
                                disabled={loading}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
                                style={{ background: 'rgba(66,133,244,0.12)', border: '1px solid rgba(66,133,244,0.3)', color: '#fff' }}
                            >
                                <span className="text-xl">🔵</span>
                                <span className="flex-1 text-left">Continuar con Google</span>
                                {loading && <Spinner />}
                            </button>
                            <button
                                onClick={() => handleSocialLogin('facebook')}
                                disabled={loading}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
                                style={{ background: 'rgba(24,119,242,0.12)', border: '1px solid rgba(24,119,242,0.3)', color: '#fff' }}
                            >
                                <span className="text-xl">🔷</span>
                                <span className="flex-1 text-left">Continuar con Facebook</span>
                                {loading && <Spinner />}
                            </button>
                            <p className="text-[10px] text-center mt-2" style={{ color: 'var(--vp-text-dim)' }}>
                                Al continuar aceptas los términos de uso de VOTA.PE
                            </p>
                        </div>
                    )}

                    {/* Email Login */}
                    {method === 'email' && step === 'form' && (
                        <div className="flex flex-col gap-3">
                            <InputField label="Nombre completo" value={name} onChange={setName} placeholder="Juan Pérez" icon="👤" />
                            <InputField label="Correo electrónico" value={email} onChange={setEmail} placeholder="tu@email.com" type="email" icon="📧" />
                            {error && <ErrorMsg text={error} />}
                            <button onClick={handleEmailSubmit} className="login-submit-btn">
                                Enviar código de verificación
                            </button>
                        </div>
                    )}

                    {/* Phone Login */}
                    {method === 'phone' && step === 'form' && (
                        <div className="flex flex-col gap-3">
                            <InputField label="Nombre completo" value={name} onChange={setName} placeholder="Juan Pérez" icon="👤" />
                            <InputField label="Número de teléfono" value={phone} onChange={setPhone} placeholder="+51 999 999 999" type="tel" icon="📱" />
                            {error && <ErrorMsg text={error} />}
                            <button onClick={handlePhoneSubmit} className="login-submit-btn">
                                Enviar código SMS
                            </button>
                        </div>
                    )}

                    {/* Verification Code Step (for email & phone) */}
                    {(method === 'email' || method === 'phone') && step === 'verify' && (
                        <div className="flex flex-col gap-3">
                            <div className="text-center mb-2">
                                <div className="text-3xl mb-2">{method === 'email' ? '📧' : '📱'}</div>
                                <p className="text-sm font-semibold" style={{ color: 'var(--vp-text)' }}>Código enviado</p>
                                <p className="text-xs" style={{ color: 'var(--vp-text-dim)' }}>
                                    Ingresa el código enviado a {method === 'email' ? email : phone}
                                </p>
                            </div>
                            <InputField label="Código de verificación" value={verifyCode} onChange={setVerifyCode} placeholder="123456" icon="🔐" />
                            {error && <ErrorMsg text={error} />}
                            <button onClick={handleVerifyCode} disabled={loading} className="login-submit-btn">
                                {loading ? <Spinner /> : 'Verificar y entrar'}
                            </button>
                            <button onClick={() => setStep('form')} className="text-xs text-center" style={{ color: 'var(--vp-text-dim)' }}>
                                ← Volver
                            </button>
                        </div>
                    )}

                    {/* Alias Login (simplest) */}
                    {method === 'alias' && (
                        <div className="flex flex-col gap-3">
                            <InputField label="Nombre completo" value={name} onChange={setName} placeholder="Juan Pérez" icon="👤" />
                            <InputField label="Alias / Nombre de usuario" value={alias} onChange={setAlias} placeholder="@juanpe" icon="🏷️" />
                            {error && <ErrorMsg text={error} />}
                            <button onClick={handleAliasLogin} disabled={loading} className="login-submit-btn">
                                {loading ? <Spinner /> : 'Entrar como invitado'}
                            </button>
                            <p className="text-[10px] text-center" style={{ color: 'var(--vp-text-dim)' }}>
                                ⚠️ Cuenta no verificada — funcionalidad limitada
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Helper components
function InputField({ label, value, onChange, placeholder, type = 'text', icon }: {
    label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string; icon: string;
}) {
    return (
        <div>
            <label className="text-[10px] font-bold tracking-wider uppercase mb-1 block" style={{ color: 'var(--vp-text-dim)' }}>
                {icon} {label}
            </label>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 py-2.5 rounded-lg text-sm"
                style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--vp-border)',
                    color: 'var(--vp-text)',
                    outline: 'none',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--vp-red)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--vp-border)'; }}
            />
        </div>
    );
}

function ErrorMsg({ text }: { text: string }) {
    return <div className="text-xs text-red-400 px-2">⚠️ {text}</div>;
}

function Spinner() {
    return <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#fff', borderTopColor: 'transparent' }} />;
}
