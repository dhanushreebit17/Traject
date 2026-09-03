// app/groups/[groupId]/page.js
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthProvider';
import TopNav from '@/components/TopNav';
import TrajectoryLine from '@/components/TrajectoryLine';
import StatusBadge from '@/components/StatusBadge';
import UpdateBox from '@/components/UpdateBox';
import EmptyState from '@/components/EmptyState';

const TYPE_ICON = { lit_survey: '📄', code: '💻', dataset: '📊', report: '📄', other: '🔗' };

export default function GroupDetailPage() {
  const { groupId } = useParams();
  const { user } = useAuth();

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [updatedThisWeek, setUpdatedThisWeek] = useState(new Set());
  const [guideName, setGuideName] = useState(null);
  const [teammateEmail, setTeammateEmail] = useState('');
  const [addError, setAddError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);

    const { data: g } = await supabase.from('groups').select('*').eq('id', groupId).single();
    setGroup(g);

    if (g?.guide_id) {
      const { data: guide } = await supabase.from('profiles').select('full_name').eq('id', g.guide_id).single();
      setGuideName(guide?.full_name ?? null);
    }

    const { data: mem } = await supabase
      .from('group_members')
      .select('user_id, profiles(full_name)')
      .eq('group_id', groupId);
    setMembers(mem || []);

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentLogs } = await supabase
      .from('activity_logs')
      .select('user_id')
      .eq('group_id', groupId)
      .gte('created_at', weekAgo);
    setUpdatedThisWeek(new Set((recentLogs || []).map((l) => l.user_id)));

    const { data: art } = await supabase
      .from('artifacts')
      .select('*, profiles(full_name)')
      .eq('group_id', groupId)
      .order('uploaded_at', { ascending: false });
    setArtifacts(art || []);

    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleAddTeammate(e) {
    e.preventDefault();
    setAddError('');

    const { data: found } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('email', teammateEmail.trim().toLowerCase())
      .maybeSingle();

    if (!found) {
      setAddError("No account found for that email — they'll need to sign up first.");
      return;
    }
    if (found.role !== 'student') {
      setAddError('Only student accounts can be added as teammates.');
      return;
    }

    const { error } = await supabase.from('group_members').insert({ group_id: groupId, user_id: found.id });
    if (error) {
      setAddError(error.message.includes('duplicate') ? 'Already a member of this group.' : error.message);
      return;
    }

    setTeammateEmail('');
    loadAll();
  }

  if (loading || !group) return <p className="p-6 text-ink/50">Loading…</p>;

  return (
    <div>
      <TopNav />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/dashboard" className="text-sm text-ink/50">← Dashboard</Link>

        <div className="flex items-center justify-between mt-2 mb-4">
          <h1 className="font-serif text-2xl text-ink">{group.project_title}</h1>
          <StatusBadge status={group.status} />
        </div>

        <div className="flex items-center justify-between mb-6">
          <TrajectoryLine current={0} status={group.status} />
          {guideName && <span className="text-sm text-ink/50">guide: {guideName}</span>}
        </div>

        {group.status === 'revise' && (
          <div className="bg-rose/10 border border-rose/30 text-ink rounded-md px-4 py-3 mb-6 text-sm">
            This group has been marked for revision by the guide. Check the latest review comment
            on the review history for what to fix.
          </div>
        )}

        <UpdateBox groupId={groupId} onLogged={loadAll} />

        <section className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-lg text-ink">Members ({members.length})</h2>
          </div>
          <div className="card mb-3">
            {members.map((m) => (
              <div key={m.user_id} className="flex items-center justify-between py-1.5 text-sm">
                <span>
                  {m.profiles?.full_name} {m.user_id === user.id && <span className="text-ink/40">(you)</span>}
                </span>
                <span className={updatedThisWeek.has(m.user_id) ? 'text-sage' : 'text-ink/40'}>
                  {updatedThisWeek.has(m.user_id) ? '✓ updated this week' : '— no update yet'}
                </span>
              </div>
            ))}
          </div>
          <form onSubmit={handleAddTeammate} className="flex gap-2">
            <input
              type="email"
              className="input"
              placeholder="teammate@yourcollege.edu.in"
              value={teammateEmail}
              onChange={(e) => setTeammateEmail(e.target.value)}
              required
            />
            <button className="btn-secondary whitespace-nowrap">+ Add teammate</button>
          </form>
          {addError && <p className="text-sm text-rose mt-1">{addError}</p>}
        </section>

        <section className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-lg text-ink">Artifacts ({artifacts.length})</h2>
            <Link href={`/groups/${groupId}/artifact/new`} className="btn-secondary text-sm">
              + Add artifact
            </Link>
          </div>
          {artifacts.length === 0 ? (
            <EmptyState
              title="Nothing logged yet."
              body="Add your first artifact — even a rough draft counts."
            />
          ) : (
            <div className="card divide-y divide-ink/10">
              {artifacts.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    {TYPE_ICON[a.type]}{' '}
                    <a
                      href={a.file_url || a.link_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-ink hover:underline"
                    >
                      {a.title}
                    </a>{' '}
                    <span className="text-ink/40">{a.type}</span>
                  </span>
                  <span className="mono-timestamp">
                    {a.profiles?.full_name} · {new Date(a.uploaded_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}