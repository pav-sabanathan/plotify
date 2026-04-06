import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { X } from 'lucide-react';

const GuestBanner = () => {
  const { user, setShowAuthModal, setAuthModalView } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (user || dismissed) return null;

  const handleSignIn = () => {
    setAuthModalView('sign-in');
    setShowAuthModal(true);
  };

  return (
    <div className="flex items-center justify-between bg-surface-1 border border-border rounded-lg px-4 py-2.5 text-sm">
      <p className="text-muted-foreground">
        Sign in to save your shows across devices{' '}
        <button onClick={handleSignIn} className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 hover:underline font-medium">
          Sign In
        </button>
      </p>
      <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground ml-2 shrink-0">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default GuestBanner;
