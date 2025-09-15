import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

// PUBLIC_INTERFACE
/**
 * useAuth
 * Provides authenticated user session and helper methods for login, signup, and logout.
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session and listen to changes
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (isMounted) {
        setSession(currentSession);
        setLoading(false);
      }
    })();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // PUBLIC_INTERFACE
  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  // PUBLIC_INTERFACE
  async function signUp({ email, password, name }) {
    // Create auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Note: set SITE URL in Supabase to handle email confirmation if enabled.
        data: { name },
      },
    });
    if (error) throw error;

    // Create profile row in users table to align with app schema
    // We need the user id from the session if available; on some configs, session may be null until confirmation.
    const userId = data?.user?.id;
    if (userId) {
      // insert into users table with same id so FKs work
      const { error: profileErr } = await supabase
        .from('users')
        .insert([{ id: userId, name, email }]);
      if (profileErr && profileErr.code !== '23505') {
        // Ignore duplicate if already created
        // eslint-disable-next-line no-console
        console.warn('Profile creation warning:', profileErr.message);
      }
    }
    return data;
  }

  // PUBLIC_INTERFACE
  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
