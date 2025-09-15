import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

// PUBLIC_INTERFACE
/**
 * SurveyResultsPage
 * Displays analytics for a survey: total responses and per-question breakdowns.
 */
export default function SurveyResultsPage() {
  const { id } = useParams();
  const [survey, setSurvey] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [optionsByQ, setOptionsByQ] = useState({});
  const [answers, setAnswers] = useState([]);
  const [responsesCount, setResponsesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data: s } = await supabase
        .from('surveys')
        .select('id,title,description')
        .eq('id', id)
        .single();

      const { data: qs } = await supabase
        .from('questions')
        .select('id,question_text,question_type,required,position')
        .eq('survey_id', id)
        .order('position', { ascending: true });

      let optsByQid = {};
      if (qs && qs.length) {
        const { data: opts } = await supabase
          .from('options')
          .select('id,question_id,option_text,position')
          .in('question_id', qs.map(q => q.id))
          .order('position', { ascending: true });

        optsByQid = (opts || []).reduce((acc, o) => {
          acc[o.question_id] = acc[o.question_id] || [];
          acc[o.question_id].push(o);
          return acc;
        }, {});
      }

      const { data: respAgg } = await supabase
        .from('responses')
        .select('id', { count: 'exact', head: true })
        .eq('survey_id', id);

      const { data: ans } = await supabase
        .from('answers')
        .select('id,response_id,question_id,option_id,answer_text');

      if (mounted) {
        setSurvey(s);
        setQuestions(qs || []);
        setOptionsByQ(optsByQid);
        setResponsesCount(respAgg?.length ?? respAgg?.count ?? 0); // head:true usually does not return data rows
        setAnswers(ans || []);
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  function renderStats(q) {
    const qAnswers = answers.filter(a => a.question_id === q.id);
    if (q.question_type === 'single_choice' || q.question_type === 'multiple_choice') {
      const counts = {};
      for (const o of (optionsByQ[q.id] || [])) counts[o.id] = 0;
      for (const a of qAnswers) {
        if (a.option_id) counts[a.option_id] = (counts[a.option_id] || 0) + 1;
      }
      return (
        <div className="space-y-2">
          {(optionsByQ[q.id] || []).map(o => {
            const c = counts[o.id] || 0;
            return (
              <div key={o.id} className="flex items-center gap-2">
                <div className="w-48 text-sm">{o.option_text}</div>
                <div className="flex-1 h-3 bg-slate-800 rounded overflow-hidden">
                  <div className="h-3 bg-blue-600" style={{ width: `${responsesCount ? (c / responsesCount) * 100 : 0}%` }} />
                </div>
                <div className="w-12 text-right text-sm">{c}</div>
              </div>
            );
          })}
        </div>
      );
    }
    if (q.question_type === 'rating') {
      const nums = qAnswers.map(a => Number(a.answer_text)).filter(n => !Number.isNaN(n));
      const avg = nums.length ? (nums.reduce((s, n) => s + n, 0) / nums.length).toFixed(2) : 'N/A';
      return <div className="text-sm">Average rating: <span className="font-medium">{avg}</span></div>;
    }
    // text
    return (
      <div className="space-y-2">
        {qAnswers.slice(0, 5).map(a => (
          <div key={a.id} className="rounded bg-slate-800 border border-slate-700 p-2 text-sm">
            {a.answer_text || <span className="text-slate-500 italic">No answer</span>}
          </div>
        ))}
        {qAnswers.length > 5 ? (
          <div className="text-xs text-slate-400">Showing 5 of {qAnswers.length} answers</div>
        ) : null}
      </div>
    );
  }

  if (loading) return <div>Loading...</div>;
  if (!survey) return <div className="text-red-400">Survey not found.</div>;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">{survey.title}</h1>
      <p className="text-slate-400 mb-4">{survey.description}</p>
      <div className="mb-6 text-sm text-slate-300">Responses: <span className="font-medium">{responsesCount}</span></div>
      <div className="space-y-4">
        {questions.map(q => (
          <div key={q.id} className="rounded border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-start justify-between">
              <h3 className="font-medium">{q.question_text}</h3>
              <span className="text-xs text-slate-400">{q.question_type}</span>
            </div>
            <div className="mt-3">
              {renderStats(q)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
