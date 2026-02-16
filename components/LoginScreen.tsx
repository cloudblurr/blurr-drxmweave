"use client";

import React, { useState } from 'react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../services/authService';
import { Mail, Lock, User, LogIn } from 'lucide-react';
import logoUrl from '../muselogo.jpg';

interface LoginScreenProps {
  onSuccess?: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const logoSrc: string = ((logoUrl as unknown as { src?: string })?.src ?? (logoUrl as unknown as string)) || '';

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password, displayName || undefined);
      } else {
        await signInWithEmail(email, password);
      }
      onSuccess?.();
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else if (code === 'auth/weak-password') {
        setError('Password must be at least 6 characters.');
      } else {
        setError(err?.message || 'Authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      onSuccess?.();
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setError(err?.message || 'Google sign-in failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 relative"
      style={{ background: '#020810' }}>
      {/* Grid background */}
      <div className="absolute inset-0 opacity-8"
        style={{
          backgroundImage: `linear-gradient(rgba(0,229,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.08) 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }}
      />
      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8 animate-fadeInUp">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <img src={logoSrc} alt="Ooda Muse Engine logo" className="w-18 h-18 rounded-2xl shadow-glow" />
              <div className="absolute inset-0 rounded-2xl animate-holo-pulse" style={{ boxShadow: '0 0 30px rgba(0,229,255,0.25)' }} />
            </div>
          </div>
          <h1 className="text-4xl font-bold holo-text tracking-wide mb-2">Ooda Muse Engine</h1>
          <p className="holo-label">Authenticate to access ship systems</p>
        </div>

        {/* Card */}
        <div className="holo-modal p-6 animate-fadeInUp delay-100">

          {/* Google button */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full holo-btn holo-btn-primary flex items-center justify-center gap-3 px-5 py-3 rounded-xl mb-6 text-sm font-semibold disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-holo-cyan/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 holo-label" style={{ background: 'rgba(4, 12, 24, 0.95)' }}>
                or continue with email
              </span>
            </div>
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-holo-cyan/40" />
                <input
                  type="text"
                  placeholder="Display name"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 holo-input text-sm"
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-holo-cyan/40" />
              <input
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 holo-input text-sm"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-holo-cyan/40" />
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                minLength={6}
                className="w-full pl-11 pr-4 py-3 holo-input text-sm"
              />
            </div>

            {error && (
              <p className="text-sm px-1" style={{ color: '#ff4081' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full holo-btn holo-btn-primary flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
            >
              <LogIn className="w-5 h-5" />
              {mode === 'signup' ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          {/* Toggle mode */}
          <p className="text-center text-slate-500 text-sm mt-5">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
              className="text-holo-cyan hover:text-white font-semibold transition-colors">
              {mode === 'signin' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
