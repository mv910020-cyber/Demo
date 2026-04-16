'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import { api, authStorage, ApiError } from '../../lib/api';
import { useToast } from '../../lib/toast-context';
import ErrorBanner from '../../components/ui/ErrorBanner';

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const result = await api.login(email, password);
      authStorage.setToken(result.access_token);
      showToast('Signed in successfully', 'success');
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'Invalid email or password. Please try again.');
      } else {
        setError('Unable to sign in right now. Please try again.');
      }
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#fdfdfc] p-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl p-10">
        
        <div className="mb-8 text-center flex flex-col items-center overflow-hidden">
          <div className="p-3 bg-cyan-100 rounded-2xl mb-4">
            <Zap className="text-cyan-600" size={32} />
          </div>
          <p className="text-xs font-bold text-cyan-500 tracking-[0.35em] uppercase animate-in slide-in-from-right-[80px] fade-in duration-1000 ease-out">
            Demo Booking
          </p>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">Welcome back</h1>
          <p className="mt-2 text-slate-500 text-sm px-4">Sign in to access your dashboard and schedule demos.</p>
        </div>

        <ErrorBanner message={error} />

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
            <input 
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@gmail.com" 
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all" 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
            <input 
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password" 
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all" 
            />
          </div>
          
          <button 
            type="submit" disabled={isSubmitting}
            className="w-full bg-cyan-500 text-white font-bold text-lg p-3.5 rounded-xl shadow-md shadow-cyan-200 hover:bg-cyan-600 transition-all hover:-translate-y-0.5 active:scale-[0.98] mt-4 disabled:opacity-70 disabled:cursor-wait"
          >
            {isSubmitting ? 'Signing In...' : 'SIGN IN'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-cyan-600 font-bold hover:underline">
            Sign up here
          </Link>
        </div>
      </div>
    </main>
  );
}