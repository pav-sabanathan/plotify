import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  resendVerification: () => Promise<{ error: string | null }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: string | null }>;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  authModalView: 'sign-in' | 'sign-up';
  setAuthModalView: (view: 'sign-in' | 'sign-up') => void;
  needsProfileSetup: boolean;
  setNeedsProfileSetup: (v: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalView, setAuthModalView] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      // Use maybeSingle() to avoid PGRST116 error when no row exists
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('fetchProfile query error:', error);
        setProfile({ display_name: null, avatar_url: null });
        setNeedsProfileSetup(true);
        return;
      }

      if (data) {
        setProfile({ display_name: data.display_name ?? null, avatar_url: data.avatar_url ?? null });
        if (!data.display_name) {
          setNeedsProfileSetup(true);
        }
      } else {
        // No profile row exists — create one for this user
        setProfile({ display_name: null, avatar_url: null });
        setNeedsProfileSetup(true);
        try {
          await supabase.from('profiles').insert({ user_id: userId });
        } catch (insertErr) {
          console.error('Failed to create profile row:', insertErr);
        }
      }
    } catch (e) {
      console.error('Failed to fetch profile:', e);
      setProfile({ display_name: null, avatar_url: null });
      setNeedsProfileSetup(true);
    }
  }, []);

  const ensureWebcalToken = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('webcal_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (error) {
        // Silently skip foreign key constraint errors (user row not yet committed)
        if ((error as any).code === '23503') return;
        console.error('ensureWebcalToken select error:', error);
        return;
      }

      if (!data || data.length === 0) {
        const token = crypto.randomUUID();
        const { error: insertError } = await supabase.from('webcal_subscriptions').insert({
          user_id: userId,
          token,
        });
        if (insertError) {
          // Silently skip foreign key constraint errors
          if ((insertError as any).code === '23503') return;
          console.error('ensureWebcalToken insert error:', insertError);
        }
      }
    } catch (e) {
      console.error('Failed to ensure webcal token:', e);
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener BEFORE getting session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (currentSession?.user) {
          const userId = currentSession.user.id;
          // Use setTimeout to avoid Supabase client deadlock
          setTimeout(() => {
            fetchProfile(userId).catch((e) => console.error('fetchProfile unhandled:', e));
          }, 0);
          // For new sign-ups, delay webcal token creation to let the DB trigger commit the user row.
          // Skip entirely during INITIAL_SESSION to avoid running during auth callback flow.
          if (_event !== 'INITIAL_SESSION') {
            const delay = _event === 'SIGNED_IN' ? 2000 : 0;
            setTimeout(() => {
              ensureWebcalToken(userId).catch((e) => console.error('ensureWebcalToken unhandled:', e));
            }, delay);
          }
        } else {
          setProfile(null);
        }
        if (_event === 'SIGNED_OUT') {
          setProfile(null);
          setNeedsProfileSetup(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id).catch((e) => console.error('fetchProfile unhandled:', e));
        // Delay webcal token creation to let DB trigger commit
        setTimeout(() => {
          ensureWebcalToken(s.user.id).catch((e) => console.error('ensureWebcalToken unhandled:', e));
        }, 2000);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, ensureWebcalToken]);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      if (error.message.includes('already registered')) {
        return { error: 'An account with this email already exists.' };
      }
      return { error: error.message };
    }
    return { error: null };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return { error: 'No account found, or incorrect password. Please check your details or sign up.' };
      }
      if (error.message.includes('Email not confirmed')) {
        return { error: 'Please verify your email address before signing in.' };
      }
      return { error: 'Something went wrong. Please try again.' };
    }
    return { error: null };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const currentPath = window.location.pathname;
    const redirectTo = currentPath === '/'
      ? `${window.location.origin}/home`
      : window.location.href;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) return { error: 'Something went wrong. Please try again.' };
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { error: 'Something went wrong. Please try again.' };
    return { error: null };
  }, []);

  const resendVerification = useCallback(async () => {
    if (!user?.email) return { error: 'No email found.' };
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
    });
    if (error) return { error: 'Something went wrong. Please try again.' };
    return { error: null };
  }, [user]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) return { error: 'Not signed in.' };
    // Use upsert to handle case where profile row doesn't exist yet
    const { error } = await supabase
      .from('profiles')
      .upsert({ user_id: user.id, ...updates }, { onConflict: 'user_id' });
    if (error) return { error: error.message };
    setProfile(prev => {
      const base = prev ?? { display_name: null, avatar_url: null };
      return { ...base, ...updates };
    });
    setNeedsProfileSetup(false);
    return { error: null };
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user, session, profile, loading,
      signUp, signIn, signInWithGoogle, signOut, resetPassword, resendVerification, updateProfile,
      showAuthModal, setShowAuthModal, authModalView, setAuthModalView,
      needsProfileSetup, setNeedsProfileSetup,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
