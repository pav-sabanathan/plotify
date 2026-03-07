import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

interface OnboardingModalProps {
  onDismiss: () => void;
}

const OnboardingModal = ({ onDismiss }: OnboardingModalProps) => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const handleAddShow = () => {
    onDismiss();
    navigate('/add');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-6">
      <div className="relative w-full max-w-sm rounded-2xl bg-card border border-border p-6 space-y-6">
        <button onClick={onDismiss} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-5 w-5" />
        </button>

        {step === 0 && (
          <div className="text-center space-y-4 pt-4">
            <div className="text-4xl">🎬</div>
            <h2 className="text-xl font-bold">Welcome to Plotify</h2>
            <p className="text-sm text-muted-foreground">Never miss an episode again. Track all your shows across every streaming platform in one place.</p>
            <button onClick={() => setStep(1)} className="w-full rounded-lg bg-gradient-to-r from-[hsl(var(--prime))] to-[hsl(330,80%,55%)] text-white py-2.5 text-sm font-semibold">
              Next
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5 pt-4">
            <h2 className="text-lg font-bold text-center">How It Works</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-xl">📺</span>
                <p className="text-sm text-muted-foreground">Add the shows you're watching</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">📅</span>
                <p className="text-sm text-muted-foreground">See every release date on your calendar</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">✅</span>
                <p className="text-sm text-muted-foreground">Track which episodes you've watched</p>
              </div>
            </div>
            <button onClick={() => setStep(2)} className="w-full rounded-lg bg-gradient-to-r from-[hsl(var(--prime))] to-[hsl(330,80%,55%)] text-white py-2.5 text-sm font-semibold">
              Next
            </button>
            <button onClick={() => setStep(0)} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">Back</button>
          </div>
        )}

        {step === 2 && (
          <div className="text-center space-y-4 pt-4">
            <h2 className="text-xl font-bold">Ready to build your watchlist?</h2>
            <p className="text-sm text-muted-foreground">Start by adding a show you're currently watching.</p>
            <button onClick={handleAddShow} className="w-full rounded-lg bg-gradient-to-r from-[hsl(var(--prime))] to-[hsl(330,80%,55%)] text-white py-2.5 text-sm font-semibold">
              Add Your First Show
            </button>
            <button onClick={onDismiss} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">Explore the app first</button>
          </div>
        )}

        {/* Step dots */}
        <div className="flex justify-center gap-2 pt-1">
          {[0, 1, 2].map(i => (
            <div key={i} className={`h-1.5 w-1.5 rounded-full transition-colors ${i === step ? 'bg-foreground' : 'bg-muted-foreground/30'}`} />
          ))}
        </div>

        <button onClick={onDismiss} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors">Skip</button>
      </div>
    </div>
  );
};

export default OnboardingModal;
