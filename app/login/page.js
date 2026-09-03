// app/login/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

    setSubmitting(false);
    if (loginError) {
      setError('Incorrect email or password.');
      return;
    }
    router.push('/dashboard');
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="card w-full max-w-md">
        <h1 className="font-serif text-2xl text-ink mb-6">Log in</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-rose bg-rose/10 border border-rose/30 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="text-sm text-ink/60 mt-6">
          New here?{' '}
          <Link href="/signup" className="text-terracotta font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}