// components/StudentDashboard.jsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthProvider';
import Card from '@/components/Card';
import StatusBadge from '@/components/StatusBadge';
import TrajectoryLine from '@/components/TrajectoryLine';
import EmptyState from '@/components/EmptyState';

// Maps a group's status + whether it has any reviews yet into a
// rough 0-3 "current milestone" index for the trajectory line.
// v1 keeps this simple: pending/no reviews = 0 (Idea), and each
// review row logged bumps the milestone forward by its checkpoint.
const CHECKPOINT_INDEX = { idea: 0, review_1: 1, review_2: 2, final: 3 };

export default function StudentDashboard() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadGroups();
  }, [user]);

  async function loadGroups() {
    setLoading(true);

    // 1. Which groups am I in?
    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id);

    const groupIds = (memberships || []).map((m) => m.group_id);
    if (groupIds.length === 0) {
      setGroups([]);
      setLoading(false);
      return;
    }

    // 2. Pull those groups, their member counts, latest activity, and
    //    latest review checkpoint, all in a couple of round trips.
    const { data: groupRows } = await supabase
      .from('groups')
      .select('*, group_members(count)')
      .in('id', groupIds);

    const enriched = await Promise.all(
      (groupRows || []).map(async (g) => {
        const { data: lastLog } = await supabase
          .from('activity_logs')
          .select('created_at')
          .eq('group_id', g.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const { data: lastReview } = await supabase
          .from('reviews')
          .select('checkpoint')
          .eq('group_id', g.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        return {
          ...g,
          memberCount: g.group_members?.[0]?.count ?? 1,
          lastUpdateAt: lastLog?.created_at ?? null,
          currentMilestone: CHECKPOINT_INDEX[lastReview?.checkpoint] ?? 0,
        };
      })
    );

    // Neediest-first: no update in 7+ days floats up.
    enriched.sort((a, b) => daysSince(a.lastUpdateAt) - daysSince(b.lastUpdateAt));
    setGroups(enriched);
    setLoading(false);
  }

  function daysSince(dateStr) {
    if (!dateStr) return Infinity;
    return (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
  }

  if (loading) return <p className="text-ink/50 p-6">Loading your groups…</p>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-ink">My Groups</h1>
        <Link href="/groups/new" className="btn-primary">
          + New Group
        </Link>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          title="You're not in a group yet."
          body="Create one, or ask a teammate to add you by email."
          cta={
            <Link href="/groups/new" className="btn-primary">
              Create a group
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {groups.map((g) => {
            const stale = daysSince(g.lastUpdateAt) > 7;
            return (
              <Link key={g.id} href={`/groups/${g.id}`}>
                <Card className="hover:shadow-md transition cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-serif text-lg text-ink">{g.project_title}</h2>
                    <StatusBadge status={g.status} />
                  </div>
                  <TrajectoryLine current={g.currentMilestone} status={g.status} size="sm" />
                  <p className="text-sm text-ink/60 mt-3">
                    {g.memberCount} members ·{' '}
                    {g.lastUpdateAt
                      ? `last update ${Math.floor(daysSince(g.lastUpdateAt))}d ago`
                      : 'no update logged yet'}
                    {stale && <span className="text-rose ml-2">● hasn't been updated in a while</span>}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}