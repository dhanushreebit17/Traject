// components/GuideDashboard.jsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthProvider';
import Card from '@/components/Card';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';

export default function GuideDashboard() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadGroups();
  }, [user]);

  async function loadGroups() {
    setLoading(true);

    const { data: groupRows } = await supabase
      .from('groups')
      .select('*, group_members(user_id)')
      .eq('guide_id', user.id);

    const enriched = await Promise.all(
      (groupRows || []).map(async (g) => {
        const memberIds = (g.group_members || []).map((m) => m.user_id);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const { data: logs } = await supabase
          .from('activity_logs')
          .select('user_id, created_at')
          .eq('group_id', g.id)
          .gte('created_at', weekAgo);

        const updatedCount = new Set((logs || []).map((l) => l.user_id)).size;

        const { data: lastLog } = await supabase
          .from('activity_logs')
          .select('created_at')
          .eq('group_id', g.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        return {
          ...g,
          memberCount: memberIds.length,
          updatedCount,
          lastUpdateAt: lastLog?.created_at ?? null,
        };
      })
    );

    // "Needs attention" score: fewer updates this week + longer since
    // last activity sorts first. Pending-approval groups always float
    // to the top regardless, handled in the sort comparator below.
    enriched.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (b.status === 'pending' && a.status !== 'pending') return 1;
      const scoreA = a.updatedCount / Math.max(a.memberCount, 1) - daysSince(a.lastUpdateAt) * 0.01;
      const scoreB = b.updatedCount / Math.max(b.memberCount, 1) - daysSince(b.lastUpdateAt) * 0.01;
      return scoreA - scoreB;
    });

    setGroups(enriched);
    setLoading(false);
  }

  function daysSince(dateStr) {
    if (!dateStr) return 999;
    return (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
  }

  const filtered = groups.filter((g) => {
    if (filter === 'pending') return g.status === 'pending';
    if (filter === 'attention') return g.updatedCount < g.memberCount || daysSince(g.lastUpdateAt) > 7;
    if (filter === 'on-track') return g.status === 'approved' && g.updatedCount >= g.memberCount;
    return true;
  });

  if (loading) return <p className="text-ink/50 p-6">Loading your groups…</p>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-serif text-2xl text-ink">Your Groups ({groups.length})</h1>
      </div>

      <div className="flex gap-2 mb-6">
        {[
          { key: 'all', label: 'All' },
          { key: 'attention', label: 'Needs attention' },
          { key: 'pending', label: 'Pending approval' },
          { key: 'on-track', label: 'On track' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`pill ${filter === f.key ? 'pill-active' : ''}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No groups assigned to you yet" body="Check with your department coordinator." />
      ) : (
        <div className="space-y-4">
          {filtered.map((g) => {
            const needsAttention = g.updatedCount < g.memberCount || daysSince(g.lastUpdateAt) > 7;
            return (
              <Link key={g.id} href={`/guide/groups/${g.id}/review`}>
                <Card className="hover:shadow-md transition cursor-pointer">
                  <div className="flex items-center justify-between">
                    <h2 className="font-serif text-lg text-ink">
                      {needsAttention && <span className="text-rose mr-1">⚠</span>}
                      {g.project_title}
                    </h2>
                    <StatusBadge status={g.status} />
                  </div>
                  <p className="text-sm text-ink/60 mt-2 font-mono">
                    {g.updatedCount}/{g.memberCount} updated this week
                    {daysSince(g.lastUpdateAt) > 7 && (
                      <span className="text-rose ml-2 font-sans">
                        · no update in {Math.floor(daysSince(g.lastUpdateAt))} days
                      </span>
                    )}
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