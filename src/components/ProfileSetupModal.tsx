import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const ProfileSetupModal = () => {
  const { needsProfileSetup, setNeedsProfileSetup, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setSubmitting(true);
    await updateProfile({ display_name: displayName.trim() });
    setSubmitting(false);
  };

  const handleSkip = () => {
    setNeedsProfileSetup(false);
  };

  return (
    <Dialog open={needsProfileSetup} onOpenChange={(open) => { if (!open) handleSkip(); }}>
      <DialogContent className="sm:max-w-[400px] bg-card border-border p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Set up your profile</h2>
          <div>
            <Input
              type="text"
              placeholder="Display name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              required
              className="bg-background border-border"
              autoFocus
            />
          </div>
          <Button type="submit" disabled={submitting || !displayName.trim()} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
            {submitting ? 'Saving…' : 'Continue'}
          </Button>
          <p className="text-sm text-center">
            <button type="button" onClick={handleSkip} className="text-muted-foreground hover:text-foreground">
              Skip for now
            </button>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileSetupModal;
