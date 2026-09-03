// components/TopNav.jsx
'use client';

import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function TopNav() {
  const { profile } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-ink/10 bg-paper">
      <Link href="/dashboard" className="font-serif text-xl text-ink">
        Traject
      </Link>
      {profile && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink/70">
            {profile.full_name} <span className="text-ink/40">· {profile.role}</span>
          </span>
          <button onClick={handleLogout} className="btn-secondary text-sm">
            Log out
          </button>
        </div>
      )}
    </nav>
  );
}