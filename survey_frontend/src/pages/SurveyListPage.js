import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

// PUBLIC_INTERFACE
/**
 * SurveyListPage
 * Shows active surveys with quick actions to participate or view results.
 */
export default function SurveyListPage() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('surveys')
      .select('id,title,description,is_active,created_at')
      .order('created_at', { ascending: false });
    if (!error) setSurveys(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Surveys</h1>
        <Link to="/create" className="rounded bg-blue-600 hover:bg-blue-500 px-3 py-2 text-sm">New Survey</Link>
      </div>
      {loading ? <div>Loading...</div> : null}
      <div className="grid md:grid-cols-2 gap-4">
        {surveys.map(s => (
          <div key={s.id} className="rounded border border-slate-800 bg-slate-900 p-4">
            <h2 className="text-lg font-medium">{s.title}</h2>
            <p className="text-sm text-slate-400 mb-3">{s.description}</p>
            <div className="flex items-center gap-3 text-sm">
              <Link to={`/survey/${s.id}`} className="rounded bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5">Participate</Link>
              <Link to={`/results/${s.id}`} className="rounded bg-slate-800 hover:bg-slate-700 px-3 py-1.5">Results</Link>
              {!s.is_active ? <span className="text-amber-400">Inactive</span> : null}
            </div>
          </div>
        ))}
      </div>
      {!loading && surveys.length === 0 ? (
        <p className="text-slate-400">No surveys yet. Create the first one.</p>
      ) : null}
    </div>
  );
}
