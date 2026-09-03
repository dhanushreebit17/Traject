// app/groups/new/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthProvider';
import TopNav from '@/components/TopNav';

export default function NewGroupPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [guideEmail, setGuideEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    // Look up the guide by email (must already have a guide account).
    let guideId = null;
    if (guideEmail.trim()) {
      const { data: guideProfile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('email', guideEmail.trim().toLowerCase())
        .maybeSingle();

      if (!guideProfile || guideProfile.role !== 'guide') {
        setError('No guide account found for that email.');
        setSubmitting(false);
        return;
      }
      guideId = guideProfile.id;
    }

    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({
        name,
        project_title: projectTitle,
        abstract,
        guide_id: guideId,
        created_by: user.id,
      })
      .select()
      .single();

    if (groupError) {
      setError(groupError.message);
      setSubmitting(false);
      return;
    }

    // The creator must be added as the first group_member — RLS
    // allows this because the inserted row's user_id equals auth.uid().
    await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id });

    router.push(`/groups/${group.id}`);
  }

  return (
    <div>
      <TopNav />
      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="card">
          <h1 className="font-serif text-2xl text-ink mb-6">Start a new group</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Group name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="label">Project title</label>
              <input
                className="input"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Abstract (optional)</label>
              <textarea
                className="input"
                rows={3}
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Guide's email (optional — can add later)</label>
              <input
                type="email"
                className="input"
                value={guideEmail}
                onChange={(e) => setGuideEmail(e.target.value)}
                placeholder="guide@yourcollege.edu.in"
              />
            </div>
            {error && <p className="text-sm text-rose">{error}</p>}
            <button disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Creating…' : 'Create group'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}