'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../lib/firebaseClient';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (fullName.trim()) {
        await updateProfile(cred.user, { displayName: fullName.trim() });
      }
      router.replace('/patients');
    } catch (e) {
      if (e?.code === 'auth/email-already-in-use') setError('Email address is already in use');
      else setError('Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4">
      <h1 className="text-3xl font-bold text-primary-text mb-6">Create Your InkSight Account</h1>
      <form onSubmit={onSubmit} className="card p-6 space-y-4" autoComplete="off">
        <div>
          <label className="form-label">Full Name</label>
          <input
            className="form-input"
            type="text"
            name="signup-fullname"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            value={fullName}
            onChange={(e)=>setFullName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="form-label">Email Address</label>
          <input
            className="form-input"
            type="email"
            name="signup-email"
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
          <div className="flex gap-2">
            <input
              className="form-input flex-1"
              type={showPw? 'text':'password'}
              name="signup-password"
              autoComplete="new-password"
              autoCapitalize="none"
              autoCorrect="off"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              required
            />
            <button type="button" className="btn btn-outline" onClick={()=>setShowPw(v=>!v)}>{showPw? 'Hide':'Show'}</button>
          </div>
        </div>
        <div>
          <label className="form-label">Confirm Password</label>
          <div className="flex gap-2">
            <input
              className="form-input flex-1"
              type={showPw2? 'text':'password'}
              name="signup-password-confirm"
              autoComplete="new-password"
              autoCapitalize="none"
              autoCorrect="off"
              value={confirmPassword}
              onChange={(e)=>setConfirmPassword(e.target.value)}
              required
            />
            <button type="button" className="btn btn-outline" onClick={()=>setShowPw2(v=>!v)}>{showPw2? 'Hide':'Show'}</button>
          </div>
        </div>
        {error && <div className="text-error">{error}</div>}
        <button type="submit" className={`btn btn-primary w-full ${loading? 'opacity-50 cursor-not-allowed':''}`}>{loading? 'Signing Up...':'Sign Up'}</button>
        <div className="text-center text-secondary-text">
          Already have an account? <Link href="/login" className="text-primary-accent">Log In</Link>
        </div>
      </form>
    </div>
  );
}


