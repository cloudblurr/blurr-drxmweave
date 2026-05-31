"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../services/authService';
import { Mail, Lock, User, LogIn } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import logoUrl from '../assets/blurrdrxmweave.png';

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
    <div className="neuro-app flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="tech-grid absolute inset-0 opacity-40" />
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.42, ease: 'easeOut' }}
        className="relative z-10 grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]"
      >
        <section className="hidden min-h-[620px] flex-col justify-between rounded-[10px] border border-slate-800/80 bg-slate-950/45 p-8 shadow-2xl shadow-black/40 lg:flex">
          <div>
            <img src={logoSrc} alt="Blurr Drxmweave logo" className="h-16 w-16 rounded-[10px] object-cover ring-1 ring-cyan-200/20" />
            <h1 className="mt-8 max-w-lg text-5xl font-semibold tracking-tight text-slate-50">Blurr Drxmweave</h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-slate-400">
              A focused dark workspace for characters, lore, media generation, and contextual roleplay engines.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            {['Roleplay', 'Lorebooks', 'Grok Imagine'].map((label) => (
              <div key={label} className="command-surface rounded-[10px] px-3 py-3 text-slate-300">
                {label}
              </div>
            ))}
          </div>
        </section>

        <div className="w-full max-w-md justify-self-center lg:self-center">
          <div className="mb-6 text-center lg:hidden">
            <img src={logoSrc} alt="Blurr Drxmweave logo" className="mx-auto h-20 w-20 rounded-[10px] object-cover ring-1 ring-cyan-200/20" />
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-50">Blurr Drxmweave</h1>
            <p className="mt-1 text-sm text-slate-500">Engine access</p>
          </div>

          <Card className="p-6">
            <div className="mb-6">
              <p className="holo-label">Secure workspace</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">
                {mode === 'signup' ? 'Create your account' : 'Welcome back'}
              </h2>
            </div>

          <Button
            onClick={handleGoogle}
            disabled={loading}
            className="mb-6 w-full justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-[#10151e] px-3 text-xs text-slate-500">
                or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <Input
                  type="text"
                  placeholder="Display name"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="pl-11"
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <Input
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="pl-11"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <Input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                minLength={6}
                className="pl-11"
              />
            </div>

            {error && (
              <p className="rounded-[10px] border border-red-400/25 bg-red-950/20 px-3 py-2 text-sm text-red-200">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading}
              variant="secondary"
              className="w-full justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              {mode === 'signup' ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
              className="font-semibold text-cyan-200 transition-colors hover:text-white">
              {mode === 'signin' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginScreen;
