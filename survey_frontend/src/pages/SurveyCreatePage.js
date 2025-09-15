import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const QUESTION_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'single_choice', label: 'Single Choice' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'rating', label: 'Rating (1-5)' },
];

// PUBLIC_INTERFACE
/**
 * SurveyCreatePage
 * Create survey with questions and options per schema.
 */
export default function SurveyCreatePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meta, setMeta] = useState({ title: '', description: '' });
  const [questions, setQuestions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  function addQuestion() {
    setQuestions(qs => qs.concat({
      id: crypto.randomUUID(),
      question_text: '',
      question_type: 'text',
      required: false,
      position: qs.length,
      options: [],
    }));
  }

  function updateQuestion(id, patch) {
    setQuestions(qs => qs.map(q => q.id === id ? { ...q, ...patch } : q));
  }

  function removeQuestion(id) {
    setQuestions(qs => qs.filter(q => q.id !== id));
  }

  function addOption(qid) {
    setQuestions(qs => qs.map(q => {
      if (q.id !== qid) return q;
      const next = q.options.concat({ id: crypto.randomUUID(), option_text: '', position: q.options.length });
      return { ...q, options: next };
    }));
  }

  function updateOption(qid, oid, patch) {
    setQuestions(qs => qs.map(q => {
      if (q.id !== qid) return q;
      return { ...q, options: q.options.map(o => o.id === oid ? { ...o, ...patch } : o) };
    }));
  }

  function removeOption(qid, oid) {
    setQuestions(qs => qs.map(q => {
      if (q.id !== qid) return q;
      return { ...q, options: q.options.filter(o => o.id !== oid) };
    }));
  }

  async function handleSave() {
    setErr('');
    if (!user) {
      setErr('You must be signed in to create surveys.');
      return;
    }
    if (!meta.title.trim()) {
      setErr('Please provide a survey title.');
      return;
    }
    setSaving(true);
    try {
      // 1) Insert survey
      const { data: survey, error: sErr } = await supabase
        .from('surveys')
        .insert([{ title: meta.title, description: meta.description, created_by: user.id, is_active: true }])
        .select('id')
        .single();
      if (sErr) throw sErr;

      // 2) Insert questions
      for (const [idx, q] of questions.entries()) {
        const { data: qRow, error: qErr } = await supabase
          .from('questions')
          .insert([{
            survey_id: survey.id,
            question_text: q.question_text,
            question_type: q.question_type,
            required: q.required,
            position: idx,
          }])
          .select('id')
          .single();
        if (qErr) throw qErr;

        // 3) If choice types, insert options
        if (q.question_type === 'single_choice' || q.question_type === 'multiple_choice') {
          for (const [oIdx, o] of q.options.entries()) {
            const { error: oErr } = await supabase
              .from('options')
              .insert([{ question_id: qRow.id, option_text: o.option_text, position: oIdx }]);
            if (oErr) throw oErr;
          }
        }
      }

      navigate(`/survey/${survey.id}`);
    } catch (e) {
      let message = e?.message || String(e);
      const lower = message.toLowerCase();
      // Helpful hints for common setup issues
      if (lower.includes('foreign key') && lower.includes('created_by')) {
        message += '\n\nHint: Your profile may be missing in the "users" table. Sign out and sign back in to let the app create/ensure a users row (or check RLS policies on public.users).';
      } else if (lower.includes('rls') || lower.includes('row level security') || lower.includes('permission')) {
        message += '\n\nHint: Check your Supabase RLS policies. Ensure authenticated users can INSERT into "surveys", "questions", and "options".';
      }
      setErr(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Create Survey</h1>
      {err ? <div className="mb-4 text-red-400 text-sm">{err}</div> : null}
      <div className="space-y-4">
        <div className="rounded border border-slate-800 bg-slate-900 p-4">
          <div className="grid gap-3">
            <div>
              <label className="block text-sm mb-1">Title</label>
              <input
                className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-2"
                value={meta.title}
                onChange={e => setMeta(m => ({ ...m, title: e.target.value }))}
                placeholder="Customer Satisfaction Survey"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Description</label>
              <textarea
                className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-2 min-h-[80px]"
                value={meta.description}
                onChange={e => setMeta(m => ({ ...m, description: e.target.value }))}
                placeholder="Help us improve by answering a few questions."
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium">Questions</h2>
          <button onClick={addQuestion} className="rounded bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-sm">
            + Add Question
          </button>
        </div>

        <div className="space-y-3">
          {questions.map((q, i) => (
            <div key={q.id} className="rounded border border-slate-800 bg-slate-900 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Question #{i + 1}</h3>
                <button onClick={() => removeQuestion(q.id)} className="text-sm text-red-400 hover:underline">
                  Remove
                </button>
              </div>
              <div className="mt-3 grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Text</label>
                  <input
                    className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-2"
                    value={q.question_text}
                    onChange={e => updateQuestion(q.id, { question_text: e.target.value })}
                    placeholder="How satisfied are you with our service?"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Type</label>
                  <select
                    className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-2"
                    value={q.question_type}
                    onChange={e => updateQuestion(q.id, { question_type: e.target.value })}
                  >
                    {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id={`req-${q.id}`}
                    type="checkbox"
                    className="h-4 w-4"
                    checked={q.required}
                    onChange={e => updateQuestion(q.id, { required: e.target.checked })}
                  />
                  <label htmlFor={`req-${q.id}`} className="text-sm">Required</label>
                </div>
              </div>

              {(q.question_type === 'single_choice' || q.question_type === 'multiple_choice') && (
                <div className="mt-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-slate-300">Options</h4>
                    <button onClick={() => addOption(q.id)} className="text-sm text-blue-400 hover:underline">+ Add Option</button>
                  </div>
                  <div className="mt-2 space-y-2">
                    {q.options.map((o, idx) => (
                      <div key={o.id} className="flex items-center gap-2">
                        <input
                          className="flex-1 rounded bg-slate-800 border border-slate-700 px-3 py-2"
                          value={o.option_text}
                          onChange={e => updateOption(q.id, o.id, { option_text: e.target.value })}
                          placeholder={`Option #${idx + 1}`}
                        />
                        <button
                          onClick={() => removeOption(q.id, o.id)}
                          className="text-xs text-red-400 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          {questions.length === 0 && (
            <p className="text-slate-400 text-sm">No questions added yet. Click "Add Question" to get started.</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            disabled={saving}
            onClick={handleSave}
            className="rounded bg-blue-600 hover:bg-blue-500 px-4 py-2 font-medium disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Survey'}
          </button>
        </div>
      </div>
    </div>
  );
}
