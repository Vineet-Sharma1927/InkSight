'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('/patients');
    } catch (e) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4">
      <h1 className="text-3xl font-bold text-primary-text mb-6">Welcome Back to InkSight</h1>
      <form onSubmit={onSubmit} className="card p-6 space-y-4" autoComplete="off">
        <div>
          <label className="form-label">Email Address</label>
          <input
            className="form-input"
            type="email"
            name="login-email"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="form-label">Password</label>
          <div className="flex gap-2 items-center">
            <input
              className="form-input flex-1"
              type={showPw? 'text':'password'}
              name="login-password"
              autoComplete="new-password"
              autoCapitalize="none"
              autoCorrect="off"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              required
            />
            <button type="button" className="btn btn-outline" onClick={()=>setShowPw(v=>!v)}>{showPw? 'Hide':'Show'}</button>
            <div className="ml-auto text-sm"><Link href="/forgot-password" className="text-primary-accent">Forgot Password?</Link></div>
          </div>
        </div>
        {error && <div className="text-error">{error}</div>}
        <button type="submit" className={`btn btn-primary w-full ${loading? 'opacity-50 cursor-not-allowed':''}`}>{loading? 'Logging In...':'Log In'}</button>
        <div className="text-center text-secondary-text">
          Don't have an account? <Link href="/signup" className="text-primary-accent">Sign Up</Link>
        </div>
      </form>
    </div>
  );
}


