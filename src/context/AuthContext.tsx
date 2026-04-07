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
      const { data } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', userId)
        .single();
      if (data) {
        setProfile(data);
        if (!data.display_name) {
          setNeedsProfileSetup(true);
        }
      } else {
        // New user with no profile row yet
        setNeedsProfileSetup(true);
      }
    } catch (e) {
      console.error('Failed to fetch profile:', e);
      setNeedsProfileSetup(true);
    }
  }, []);

  const ensureWebcalToken = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from('webcal_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .limit(1);
      if (!data || data.length === 0) {
        const token = crypto.randomUUID();
        await supabase.from('webcal_subscriptions').insert({
          user_id: userId,
          token,
        });
      }
    } catch (e) {
      console.error('Failed to ensure webcal token:', e);
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener BEFORE getting session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (currentSession?.user) {
          // Use setTimeout to avoid Supabase client deadlock
          setTimeout(() => {
            fetchProfile(currentSession.user.id);
            ensureWebcalToken(currentSession.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        if (event === 'SIGNED_OUT') {
          setProfile(null);
          setNeedsProfileSetup(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

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
    // After OAuth, return to current page — unless on landing page, then go to /home
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
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id);
    if (error) return { error: error.message };
    setProfile(prev => prev ? { ...prev, ...updates } : updates as Profile);
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
