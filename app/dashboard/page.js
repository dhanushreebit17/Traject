// app/dashboard/page.js
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import TopNav from '@/components/TopNav';
import StudentDashboard from '@/components/StudentDashboard';
import GuideDashboard from '@/components/GuideDashboard';

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // v1 route protection: a client-side redirect if there's no
    // session. For production, move this to Next.js middleware
    // (using @supabase/ssr) so unauthenticated users never even
    // receive the page's JS bundle — flagged here as a known v1
    // simplification, not an oversight.
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  if (loading || !profile) return <p className="p-6 text-ink/50">Loading…</p>;

  return (
    <div>
      <TopNav />
      {profile.role === 'guide' ? <GuideDashboard /> : <StudentDashboard />}
    </div>
  );
}