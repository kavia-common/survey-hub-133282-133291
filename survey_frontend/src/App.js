import React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useParams } from 'react-router-dom';
import './App.css';
import Layout from './components/Layout';
import SchemaPreview from './components/SchemaPreview';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import SurveyCreatePage from './pages/SurveyCreatePage';
import SurveyListPage from './pages/SurveyListPage';
import SurveyParticipatePage from './pages/SurveyParticipatePage';
import SurveyResultsPage from './pages/SurveyResultsPage';
import DiagnosticsPage from './pages/DiagnosticsPage';

// PUBLIC_INTERFACE
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Home() {
  return (
    <div className="space-y-4">
      <div className="rounded border border-slate-800 bg-slate-900 p-4">
        <h1 className="text-2xl font-semibold">Welcome to Survey Hub</h1>
        <p className="text-slate-400">Create, participate, and analyze surveys powered by Supabase.</p>
        <div className="mt-3 flex items-center gap-3">
          <Link to="/surveys" className="rounded bg-blue-600 hover:bg-blue-500 px-3 py-2 text-sm">Browse Surveys</Link>
          <Link to="/create" className="rounded bg-slate-800 hover:bg-slate-700 px-3 py-2 text-sm">Create Survey</Link>
        </div>
      </div>
      <div className="rounded border border-slate-800 bg-slate-900 p-4">
        <h2 className="text-lg font-medium mb-2">Schema Reference</h2>
        <SchemaPreview />
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/surveys" element={<SurveyListPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/create" element={<RequireAuth><SurveyCreatePage /></RequireAuth>} />
            <Route path="/survey/:id" element={<SurveyParticipatePage />} />
            <Route path="/results" element={<RequireAuth><div>Select a survey from Browse to view results.</div></RequireAuth>} />
            <Route path="/results/:id" element={<RequireAuth><SurveyResultsPage /></RequireAuth>} />
            <Route path="/diagnostics" element={<DiagnosticsPage />} />
            <Route path="*" element={<div>Not found</div>} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
