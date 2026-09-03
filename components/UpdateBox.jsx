// components/UpdateBox.jsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthProvider';

const PLACEHOLDERS = [
  'Fixed the sensor calibration bug from last week…',
  'Read 4 papers for the lit survey, notes are in the doc…',
  'Debugged the ESP32 connection issue…',
];

export default function UpdateBox({ groupId, onLogged }) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [recent, setRecent] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const placeholder = PLACEHOLDERS[new Date().getDate() % PLACEHOLDERS.length];

  useEffect(() => {
    loadRecent();
  }, [groupId, user]);

  async function loadRecent() {
    if (!user) return;
    const { data } = await supabase
      .from('activity_logs')
      .select('id, update_text, created_at')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3);
    setRecent(data || []);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;

    setSubmitting(true);
    const { error } = await supabase
      .from('activity_logs')
      .insert({ group_id: groupId, user_id: user.id, update_text: text.trim() });
    setSubmitting(false);

    if (!error) {
      setText('');
      loadRecent();
      onLogged?.();
    }
  }

  return (
    <div className="card">
      <label className="label">This week's update</label>
      <form onSubmit={handleSubmit}>
        <textarea
          className="input"
          rows={2}
          placeholder={placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex justify-end mt-2">
          <button disabled={submitting || !text.trim()} className="btn-primary">
            {submitting ? 'Logging…' : 'Log Update'}
          </button>
        </div>
      </form>

      {recent.length > 0 && (
        <div className="mt-4 pt-4 border-t border-ink/10 space-y-2">
          {recent.map((r) => (
            <div key={r.id} className="text-sm">
              <span className="mono-timestamp mr-2">
                {new Date(r.created_at).toLocaleDateString()}
              </span>
              {r.update_text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}