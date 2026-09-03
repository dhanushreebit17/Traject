// app/signup/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { isCollegeEmail, collegeEmailErrorMessage } from '@/lib/validateCollegeEmail';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // 1. Instant client-side college-email check (server double-checks
    //    this too — see the Postgres trigger in supabase/schema.sql).
    if (!isCollegeEmail(email)) {
      setError(collegeEmailErrorMessage());
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // This metadata is what the `handle_new_user` trigger reads
        // to create your profiles row automatically.
        data: { full_name: fullName, role },
      },
    });
    setSubmitting(false);

    if (signupError) {
      // The Postgres trigger raises a domain error too — surface it
      // in plain language either way.
      setError(signupError.message || 'Something went wrong. Please try again.');
      return;
    }

    router.push('/dashboard');
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="card w-full max-w-md">
        <h1 className="font-serif text-2xl text-ink mb-1">Create your account</h1>
        <p className="text-sm text-ink/60 mb-6">
          Sign-up is restricted to college email addresses.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">College email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yourcollege.edu.in"
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
              minLength={8}
              required
            />
          </div>

          <div>
            <label className="label">I am a</label>
            <div className="flex gap-2 mt-1">
              {['student', 'guide'].map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRole(r)}
                  className={`pill ${role === r ? 'pill-active' : ''}`}
                >
                  {r === 'student' ? 'Student' : 'Guide'}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-rose bg-rose/10 border border-rose/30 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Creating account…' : 'Sign up'}
          </button>
        </form>

        <p className="text-sm text-ink/60 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-terracotta font-medium">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}