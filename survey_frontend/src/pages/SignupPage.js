import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// PUBLIC_INTERFACE
/**
 * SignupPage
 * Allows creating an account and a profile row in "users" table.
 */
export default function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await signUp(form);
      navigate('/');
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Create account</h1>
      {err ? <div className="mb-3 text-red-400 text-sm">{err}</div> : null}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input
            type="text"
            className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-2"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            type="email"
            className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-2"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input
            type="password"
            className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-2"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full rounded bg-blue-600 hover:bg-blue-500 px-3 py-2 font-medium"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Sign up'}
        </button>
      </form>
      <p className="text-sm text-slate-400 mt-3">
        Already have an account? <Link to="/login" className="text-blue-400 hover:underline">Login</Link>
      </p>
    </div>
  );
}
