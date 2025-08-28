'use client';

import { useState } from 'react';
import Link from 'next/link';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebaseClient';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Success! Please check your email inbox for a password reset link.');
    } catch (e) {
      setError('Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4">
      <h1 className="text-3xl font-bold text-primary-text mb-6">Reset Your Password</h1>
      <p className="text-secondary-text mb-4">Enter your email address below, and we will send you a link to reset your password.</p>
      <form onSubmit={onSubmit} className="card p-6 space-y-4">
        <div>
          <label className="form-label">Email Address</label>
          <input className="form-input" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
        </div>
        {message && <div className="text-success">{message}</div>}
        {error && <div className="text-error">{error}</div>}
        <button type="submit" className={`btn btn-primary w-full ${loading? 'opacity-50 cursor-not-allowed':''}`}>{loading? 'Sending...':'Send Reset Link'}</button>
        <div className="text-center text-secondary-text">
          <Link href="/login" className="text-primary-accent">Back to Login</Link>
        </div>
      </form>
    </div>
  );
}


