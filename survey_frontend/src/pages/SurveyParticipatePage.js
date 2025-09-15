import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

// PUBLIC_INTERFACE
/**
 * SurveyParticipatePage
 * Display survey questions and allows submission of a response saved into responses and answers tables.
 */
export default function SurveyParticipatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [survey, setSurvey] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [optionsByQ, setOptionsByQ] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      // survey
      const { data: s, error: sErr } = await supabase
        .from('surveys')
        .select('id,title,description,is_active')
        .eq('id', id)
        .single();
      if (sErr) {
        setErr(sErr.message);
        setLoading(false);
        return;
      }
      // questions ordered by position
      const { data: qs, error: qErr } = await supabase
        .from('questions')
        .select('id,question_text,question_type,required,position')
        .eq('survey_id', id)
        .order('position', { ascending: true });
      if (qErr) {
        setErr(qErr.message);
        setLoading(false);
        return;
      }
      // options for these questions
      const qIds = (qs || []).map(q => q.id);
      let optsByQid = {};
      if (qIds.length) {
        const { data: opts, error: oErr } = await supabase
          .from('options')
          .select('id,question_id,option_text,position')
          .in('question_id', qIds)
          .order('position', { ascending: true });
        if (oErr) {
          setErr(oErr.message);
          setLoading(false);
          return;
        }
        optsByQid = (opts || []).reduce((acc, o) => {
          acc[o.question_id] = acc[o.question_id] || [];
          acc[o.question_id].push(o);
          return acc;
        }, {});
      }
      if (isMounted) {
        setSurvey(s);
        setQuestions(qs || []);
        setOptionsByQ(optsByQid);
        setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [id]);

  const initialState = useMemo(() => {
    const state = {};
    for (const q of questions) {
      if (q.question_type === 'multiple_choice') state[q.id] = new Set();
      else state[q.id] = '';
    }
    return state;
  }, [questions]);

  const [answers, setAnswers] = useState({});
  useEffect(() => {
    setAnswers(initialState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions.length]);

  function updateAnswer(q, value) {
    setAnswers(prev => ({ ...prev, [q]: value }));
  }

  function toggleMulti(qid, optId) {
    setAnswers(prev => {
      const cur = prev[qid] instanceof Set ? new Set(prev[qid]) : new Set();
      if (cur.has(optId)) cur.delete(optId); else cur.add(optId);
      return { ...prev, [qid]: cur };
    });
  }

  async function submit() {
    setErr('');
    if (!survey?.is_active) {
      setErr('Survey is inactive.');
      return;
    }
    // Validate required
    for (const q of questions) {
      const val = answers[q.id];
      if (q.required) {
        if (q.question_type === 'multiple_choice') {
          if (!(val instanceof Set) || val.size === 0) {
            setErr('Please answer all required questions.');
            return;
          }
        } else if (!val) {
          setErr('Please answer all required questions.');
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      // create response
      const payload = { survey_id: survey.id };
      if (user) payload.user_id = user.id;
      const { data: resp, error: rErr } = await supabase
        .from('responses')
        .insert([payload])
        .select('id')
        .single();
      if (rErr) throw rErr;

      // create answers
      for (const q of questions) {
        const val = answers[q.id];
        if (q.question_type === 'text' || q.question_type === 'rating') {
          const textValue = String(val ?? '');
          if (textValue || q.required) {
            const { error: aErr } = await supabase
              .from('answers')
              .insert([{ response_id: resp.id, question_id: q.id, answer_text: textValue }]);
            if (aErr) throw aErr;
          }
        } else if (q.question_type === 'single_choice') {
          if (val) {
            const { error: aErr } = await supabase
              .from('answers')
              .insert([{ response_id: resp.id, question_id: q.id, option_id: val }]);
            if (aErr) throw aErr;
          }
        } else if (q.question_type === 'multiple_choice') {
          const setVal = val instanceof Set ? Array.from(val) : [];
          for (const optId of setVal) {
            const { error: aErr } = await supabase
              .from('answers')
              .insert([{ response_id: resp.id, question_id: q.id, option_id: optId }]);
            if (aErr) throw aErr;
          }
        }
      }

      navigate(`/results/${survey.id}`);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div>Loading...</div>;
  if (!survey) return <div className="text-red-400">Survey not found.</div>;

  return (
    <div>
      <h1 className="text-2xl font-semibold">{survey.title}</h1>
      <p className="text-slate-400 mb-4">{survey.description}</p>
      {err ? <div className="mb-3 text-red-400 text-sm">{err}</div> : null}
      <div className="space-y-4">
        {questions.map(q => (
          <div key={q.id} className="rounded border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium">
                {q.question_text}{' '}
                {q.required ? <span className="text-amber-400 text-xs align-top">required</span> : null}
              </h3>
              <span className="text-xs text-slate-400">{q.question_type}</span>
            </div>
            <div className="mt-3">
              {q.question_type === 'text' && (
                <textarea
                  className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-2 min-h-[80px]"
                  value={answers[q.id] ?? ''}
                  onChange={e => updateAnswer(q.id, e.target.value)}
                />
              )}
              {q.question_type === 'rating' && (
                <div className="flex items-center gap-2">
                  {[1,2,3,4,5].map(n => (
                    <button
                      type="button"
                      key={n}
                      onClick={() => updateAnswer(q.id, n)}
                      className={`h-9 w-9 rounded-full border ${answers[q.id] === n ? 'bg-yellow-500 border-yellow-400' : 'bg-slate-800 border-slate-700'} `}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              )}
              {q.question_type === 'single_choice' && (
                <div className="space-y-2">
                  {(optionsByQ[q.id] || []).map(o => (
                    <label key={o.id} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={q.id}
                        checked={answers[q.id] === o.id}
                        onChange={() => updateAnswer(q.id, o.id)}
                      />
                      <span>{o.option_text}</span>
                    </label>
                  ))}
                </div>
              )}
              {q.question_type === 'multiple_choice' && (
                <div className="space-y-2">
                  {(optionsByQ[q.id] || []).map(o => (
                    <label key={o.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={answers[q.id] instanceof Set ? answers[q.id].has(o.id) : false}
                        onChange={() => toggleMulti(q.id, o.id)}
                      />
                      <span>{o.option_text}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <button
          onClick={submit}
          disabled={submitting}
          className="rounded bg-emerald-600 hover:bg-emerald-500 px-4 py-2 font-medium disabled:opacity-60"
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </div>
  );
}
