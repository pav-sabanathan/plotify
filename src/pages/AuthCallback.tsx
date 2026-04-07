import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) console.error('Auth callback error:', error);
        } else {
          const { error } = await supabase.auth.getSession();
          if (error) console.error('Auth callback error:', error);
        }
      } catch (e) {
        console.error('Auth callback exception:', e);
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
