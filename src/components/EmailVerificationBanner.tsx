import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const EmailVerificationBanner = () => {
  const { user, resendVerification } = useAuth();
  const { toast } = useToast();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);

  // Only show if signed in and email not verified
  const isVerified = user?.email_confirmed_at || user?.confirmed_at;
  if (!user || isVerified || dismissed) return null;

  const handleResend = async () => {
    setSending(true);
    const result = await resendVerification();
    setSending(false);
    if (result.error) {
      toast({ title: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Verification email sent!' });
    }
  };

  return (
    <div className="flex items-center justify-between bg-surface-1 border border-border rounded-lg px-4 py-2.5 text-sm mb-4">
      <p className="text-muted-foreground">
        Please verify your email address to secure your account.
      </p>
      <div className="flex items-center gap-2 shrink-0 ml-2">
        <button onClick={handleResend} disabled={sending} className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 hover:underline font-medium">
          {sending ? 'Sending…' : 'Resend email'}
        </button>
        <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
