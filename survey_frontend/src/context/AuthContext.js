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
    /**
     * Attempt password sign-in. After successful auth, ensure there is a corresponding
     * row in the public.users table whose id matches the Supabase Auth user id.
     * This aligns with the DB schema where surveys.created_by references users(id).
     * If this row is missing (e.g., user created outside this app), survey creation would fail.
     */
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    try {
      const authedUser = data?.user;
      if (authedUser?.id) {
        // Try to upsert a profile row. If RLS is enabled and prevents this, we log a warning.
        // We use onConflict on primary key id so repeated sign-ins won't error.
        const displayName =
          authedUser.user_metadata?.name ||
          authedUser.user_metadata?.full_name ||
          authedUser.email?.split('@')[0] ||
          'User';

        await supabase
          .from('users')
          .upsert(
            [{ id: authedUser.id, name: displayName, email: authedUser.email }],
            { onConflict: 'id', ignoreDuplicates: false }
          );
        // Ignore returned data/error here intentionally; diagnostics are provided on the Diagnostics page if needed.
      }
    } catch (profileError) {
      // eslint-disable-next-line no-console
      console.warn('Non-blocking profile upsert warning:', profileError?.message || profileError);
      // Do not block sign-in; survey creation page will surface clear errors if FK/RLS issues persist.
    }

    return data;
  }

  // PUBLIC_INTERFACE
  async function signUp({ email, password, name }) {
    /**
     * Create an auth user, then create a profile row in public.users using the same UUID.
     * This is necessary because surveys.created_by has a FK to users(id).
     * If RLS is enabled on users, ensure there is a policy allowing INSERT by authenticated users.
     */
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
