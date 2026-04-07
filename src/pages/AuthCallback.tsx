import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');

      if (code) {
        // PKCE flow: exchange the code for a session
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('Auth callback error:', error);
        }
      } else {
        // Implicit/magic-link flow: tokens are in the URL hash, picked up automatically
        const { error } = (await supabase.auth.getSession()).error ? { error: (await supabase.auth.getSession()).error } : { error: null };
        if (error) {
          console.error('Auth callback error:', error);
        }
      }

      navigate('/home', { replace: true });
    };

    handleCallback();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Verifying your account…</p>
    </div>
  );
};

export default AuthCallback;
