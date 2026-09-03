// app/guide/groups/[groupId]/review/page.js
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthProvider';
import TopNav from '@/components/TopNav';
import ContributionBar from '@/components/ContributionBar';

const CHECKPOINTS = [
  { value: 'idea', label: 'Idea' },
  { value: 'review_1', label: 'Review 1' },
  { value: 'review_2', label: 'Review 2' },
  { value: 'final', label: 'Final' },
];
const ARTIFACT_TYPES = ['lit_survey', 'code', 'dataset', 'report'];

export default function GuideReviewPage() {
  const { groupId } = useParams();
  const { user } = useAuth();

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [logsByUser, setLogsByUser] = useState({});
  const [presentTypes, setPresentTypes] = useState(new Set());
  const [expandedUser, setExpandedUser] = useState(null);
  const [checkpoint, setCheckpoint] = useState('review_1');
  const [comment, setComment] = useState('');
  const [statusChoice, setStatusChoice] = useState('approved');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAll();
  }, [groupId]);

  async function loadAll() {
    const { data: g } = await supabase.from('groups').select('*').eq('id', groupId).single();
    setGroup(g);

    const { data: mem } = await supabase
      .from('group_members')
      .select('user_id, profiles(full_name)')
      .eq('group_id', groupId);
    setMembers(mem || []);

    const { data: logs } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    const grouped = {};
    (logs || []).forEach((l) => {
      grouped[l.user_id] = grouped[l.user_id] || [];
      grouped[l.user_id].push(l);
    });
    setLogsByUser(grouped);

    const { data: artifacts } = await supabase.from('artifacts').select('type').eq('group_id', groupId);
    setPresentTypes(new Set((artifacts || []).map((a) => a.type)));
  }

  async function handleSave(newStatus) {
    setError('');
    if (!comment.trim()) {
      setError('Add a comment before saving a review.');
      return;
    }

    const { error: reviewError } = await supabase.from('reviews').insert({
      group_id: groupId,
      guide_id: user.id,
      checkpoint,
      comment: comment.trim(),
      status_set: newStatus,
    });
    if (reviewError) {
      setError(reviewError.message);
      return;
    }

    const { error: groupError } = await supabase.from('groups').update({ status: newStatus }).eq('id', groupId);
    if (groupError) {
      setError(groupError.message);
      return;
    }

    setSaved(true);
    setComment('');
    loadAll();
    setTimeout(() => setSaved(false), 2500);
  }

  if (!group) return <p className="p-6 text-ink/50">Loading…</p>;

  const totalUpdates = members.reduce((sum, m) => sum + (logsByUser[m.user_id]?.length || 0), 0);
  const average = members.length > 0 ? totalUpdates / members.length : 0;

  return (
    <div>
      <TopNav />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/dashboard" className="text-sm text-ink/50">← Dashboard</Link>
        <h1 className="font-serif text-2xl text-ink mt-2 mb-6">{group.project_title}</h1>

        <section className="card mb-6">
          <h2 className="font-serif text-lg text-ink mb-1">Contribution this period</h2>
          <p className="text-xs text-ink/50 mb-4">Based on logged updates, not hours or task complexity.</p>
          {members.map((m) => (
            <ContributionBar
              key={m.user_id}
              name={m.profiles?.full_name}
              count={logsByUser[m.user_id]?.length || 0}
              average={average}
              expanded={expandedUser === m.user_id}
              onExpand={() => setExpandedUser(expandedUser === m.user_id ? null : m.user_id)}
              logs={logsByUser[m.user_id] || []}
            />
          ))}
        </section>

        <section className="card mb-6">
          <h2 className="font-serif text-lg text-ink mb-3">Artifact checklist</h2>
          <div className="flex flex-wrap gap-3 text-sm">
            {ARTIFACT_TYPES.map((t) => (
              <label key={t} className="flex items-center gap-1.5">
                <input type="checkbox" checked={presentTypes.has(t)} readOnly />
                {t.replace('_', ' ')}
              </label>
            ))}
          </div>
        </section>

        <section className="card">
          <h2 className="font-serif text-lg text-ink mb-3">Review</h2>
          <label className="label">Checkpoint</label>
          <div className="flex gap-2 mb-4">
            {CHECKPOINTS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCheckpoint(c.value)}
                className={`pill ${checkpoint === c.value ? 'pill-active' : ''}`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <label className="label">Comment</label>
          <textarea
            className="input"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          {error && <p className="text-sm text-rose mt-2">{error}</p>}
          {saved && <p className="text-sm text-sage mt-2">Review saved.</p>}
          <div className="flex gap-2 mt-4">
            <button onClick={() => handleSave('approved')} className="btn-primary">
              Save Review
            </button>
            <button onClick={() => handleSave('revise')} className="btn-secondary">
              Mark: Revise
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}