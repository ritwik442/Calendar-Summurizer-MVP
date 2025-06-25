// src/hooks/useSession.js
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function useSession() {
  const [session, setSession] = useState(undefined); // undefined = loading

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data }) => setSession(data?.session ?? null));

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => setSession(newSession)
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  return session;
}
