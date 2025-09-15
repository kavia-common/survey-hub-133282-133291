import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

// PUBLIC_INTERFACE
/**
 * DiagnosticsPage
 * Shows Supabase env var presence and basic connectivity:
 * - Verify env variables exist
 * - Try to select 1 row from 'surveys' to validate table presence and cache
 * - Display any error messages to guide setup
 */
export default function DiagnosticsPage() {
  const [envInfo, setEnvInfo] = useState({ urlSet: false, keySet: false });
  const [dbCheck, setDbCheck] = useState({ ok: false, error: '' });
  const [auth, setAuth] = useState({ userId: null });

  useEffect(() => {
    setEnvInfo({
      urlSet: !!process.env.REACT_APP_SUPABASE_URL,
      keySet: !!process.env.REACT_APP_SUPABASE_KEY,
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (mounted) {
        setAuth({ userId: sessionData?.session?.user?.id ?? null });
      }
      try {
        // Try a very small query to verify table is visible in schema
        const { error } = await supabase.from('surveys').select('id').limit(1);
        if (mounted) {
          if (error) {
            setDbCheck({ ok: false, error: error.message });
          } else {
            setDbCheck({ ok: true, error: '' });
          }
        }
      } catch (e) {
        if (mounted) {
          setDbCheck({ ok: false, error: e.message || String(e) });
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Diagnostics</h1>

      <div className="rounded border border-slate-800 bg-slate-900 p-4">
        <h2 className="text-lg font-medium mb-2">Environment</h2>
        <div className="text-sm">
          <div>REACT_APP_SUPABASE_URL: {envInfo.urlSet ? <span className="text-emerald-400">set</span> : <span className="text-red-400">missing</span>}</div>
          <div>REACT_APP_SUPABASE_KEY: {envInfo.keySet ? <span className="text-emerald-400">set</span> : <span className="text-red-400">missing</span>}</div>
        </div>
        {!envInfo.urlSet || !envInfo.keySet ? (
          <p className="text-amber-400 text-sm mt-2">
            Add values to survey_frontend/.env (see .env.example) and restart the dev server.
          </p>
        ) : null}
      </div>

      <div className="rounded border border-slate-800 bg-slate-900 p-4">
        <h2 className="text-lg font-medium mb-2">Supabase Database Check</h2>
        {dbCheck.ok ? (
          <div className="text-emerald-400 text-sm">Success: 'public.surveys' is accessible.</div>
        ) : (
          <>
            <div className="text-red-400 text-sm">Table check failed.</div>
            {dbCheck.error ? <pre className="text-xs mt-2 whitespace-pre-wrap">{dbCheck.error}</pre> : null}
            <div className="text-slate-400 text-xs mt-2">
              If the error says "Could not find the table 'public.surveys' in the schema cache":
              <ol className="list mt-2">
                <li>Apply database/schema.sql in Supabase (SQL Editor).</li>
                <li>Trigger a schema cache refresh by visiting the Table Editor or running a benign DDL.</li>
                <li>Reload this page.</li>
              </ol>
            </div>
          </>
        )}
      </div>

      <div className="rounded border border-slate-800 bg-slate-900 p-4">
        <h2 className="text-lg font-medium mb-2">Auth</h2>
        <div className="text-sm">User: {auth.userId ? <span className="text-emerald-400">{auth.userId}</span> : <span className="text-slate-400">not signed in</span>}</div>
      </div>
    </div>
  );
}
