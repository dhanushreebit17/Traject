// app/groups/[groupId]/artifact/new/page.js
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthProvider';
import TopNav from '@/components/TopNav';

const TYPES = [
  { value: 'lit_survey', label: 'Lit Survey' },
  { value: 'code', label: 'Code' },
  { value: 'dataset', label: 'Dataset' },
  { value: 'report', label: 'Report' },
  { value: 'other', label: 'Other' },
];

export default function AddArtifactPage() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const router = useRouter();

  const [type, setType] = useState('lit_survey');
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState('file'); // 'file' | 'link'
  const [file, setFile] = useState(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleFileChange(e) {
    const f = e.target.files[0];
    setFile(f);
    if (f && !title) {
      // Auto-suggest a title from the filename, still fully editable.
      const base = f.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(base.charAt(0).toUpperCase() + base.slice(1));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (mode === 'file' && !file) {
      setError('Choose a file to upload, or switch to "Link instead."');
      return;
    }
    if (mode === 'link' && !linkUrl.trim()) {
      setError('Paste a link, or switch to file upload.');
      return;
    }

    setSubmitting(true);
    let fileUrl = null;

    if (mode === 'file') {
      // Namespaced as `<group_id>/<timestamp>-<filename>` — the
      // storage RLS policies in schema.sql check this exact path
      // prefix to decide who can read/write it.
      const path = `${groupId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('artifacts').upload(path, file);
      if (uploadError) {
        setError(uploadError.message);
        setSubmitting(false);
        return;
      }
      const { data: signedUrlData } = await supabase.storage
        .from('artifacts')
        .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year signed URL
      fileUrl = signedUrlData?.signedUrl ?? null;
    }

    const { error: insertError } = await supabase.from('artifacts').insert({
      group_id: groupId,
      type,
      title,
      file_url: fileUrl,
      link_url: mode === 'link' ? linkUrl.trim() : null,
      uploaded_by: user.id,
    });

    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.push(`/groups/${groupId}`);
  }

  return (
    <div>
      <TopNav />
      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="card">
          <h1 className="font-serif text-2xl text-ink mb-6">Add Artifact</h1>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Type</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {TYPES.map((t) => (
                  <button
                    type="button"
                    key={t.value}
                    onClick={() => setType(t.value)}
                    className={`pill ${type === t.value ? 'pill-active' : ''}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Title</label>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div>
              <label className="label">Source</label>
              <div className="flex gap-4 text-sm mb-2">
                <label className="flex items-center gap-1">
                  <input type="radio" checked={mode === 'file'} onChange={() => setMode('file')} /> Upload a file
                </label>
                <label className="flex items-center gap-1">
                  <input type="radio" checked={mode === 'link'} onChange={() => setMode('link')} /> Link instead
                </label>
              </div>

              {mode === 'file' ? (
                <div className="border border-dashed border-ink/30 rounded-md p-4 text-center">
                  <input type="file" onChange={handleFileChange} />
                  {file && <p className="text-sm text-ink/60 mt-2">{file.name}</p>}
                </div>
              ) : (
                <input
                  type="url"
                  className="input"
                  placeholder="https://..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
              )}
            </div>

            {error && <p className="text-sm text-rose">{error}</p>}

            <button disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Adding…' : 'Add Artifact'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}