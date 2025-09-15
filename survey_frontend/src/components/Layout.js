import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-bold text-lg text-white">Survey Hub</Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link to="/surveys" className="text-slate-300 hover:text-white">Browse</Link>
            {user ? (
              <>
                <Link to="/create" className="text-slate-300 hover:text-white">Create</Link>
                <Link to="/results" className="text-slate-300 hover:text-white">Results</Link>
                <button
                  onClick={signOut}
                  className="ml-2 rounded bg-slate-800 hover:bg-slate-700 px-3 py-1.5"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-slate-300 hover:text-white">Login</Link>
                <Link to="/signup" className="text-slate-300 hover:text-white">Sign up</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
