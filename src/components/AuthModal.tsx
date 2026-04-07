import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

const AuthModal = () => {
  const { showAuthModal, setShowAuthModal, authModalView, setAuthModalView, signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setError(null);
    setShowPassword(false);
    setForgotMode(false);
    setResetSent(false);
  };

  const handleClose = () => {
    setShowAuthModal(false);
    resetForm();
  };

  const switchView = (view: 'sign-in' | 'sign-up') => {
    setAuthModalView(view);
    setError(null);
    setPassword('');
    setForgotMode(false);
    setResetSent(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (forgotMode) {
      const result = await resetPassword(email);
      setSubmitting(false);
      if (result.error) {
        setError(result.error);
      } else {
        setResetSent(true);
      }
      return;
    }

    const result = authModalView === 'sign-in'
      ? await signIn(email, password)
      : await signUp(email, password);
    
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
    } else {
      handleClose();
      // If signed in from landing page, go to home
      if (location.pathname === '/') {
        navigate('/home', { replace: true });
      }
    }
  };

  const handleGoogle = async () => {
    setError(null);
    const result = await signInWithGoogle();
    if (result.error) setError(result.error);
  };

  const isSignIn = authModalView === 'sign-in';

  return (
    <Dialog open={showAuthModal} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-[400px] bg-card border-border p-0 max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain">
        <div className="p-6">
        {forgotMode ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Reset password</h2>
            {resetSent ? (
              <p className="text-sm text-muted-foreground">Check your email for a password reset link.</p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">Enter your email to receive a reset link.</p>
                <div>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="bg-background border-border"
                  />
                  {error && <p className="text-sm text-destructive mt-1">{error}</p>}
                </div>
                <Button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                  {submitting ? 'Sending…' : 'Send reset link'}
                </Button>
              </>
            )}
            <p className="text-sm text-center text-muted-foreground">
              <button type="button" onClick={() => setForgotMode(false)} className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 hover:underline">
                Back to sign in
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              {isSignIn ? 'Welcome back' : 'Create your account'}
            </h2>

            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="bg-background border-border"
              />
            </div>

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-background border-border pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
              {submitting ? 'Loading…' : isSignIn ? 'Sign In' : 'Create Account'}
            </Button>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isSignIn ? (
                <p className="w-full text-center">
                  Don't have an account?{' '}
                  <button type="button" onClick={() => switchView('sign-up')} className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 hover:underline">
                    Sign up
                  </button>
                </p>
              ) : (
                <p className="w-full text-center">
                  Already have an account?{' '}
                  <button type="button" onClick={() => switchView('sign-in')} className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 hover:underline">
                    Sign in
                  </button>
                </p>
              )}
            </div>

            {isSignIn && (
              <p className="text-sm text-center">
                <button type="button" onClick={() => setForgotMode(true)} className="text-muted-foreground hover:text-foreground">
                  Forgot password?
                </button>
              </p>
            )}

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">or</span></div>
            </div>

            <Button type="button" variant="outline" className="w-full border-border" onClick={handleGoogle}>
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>
          </form>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
