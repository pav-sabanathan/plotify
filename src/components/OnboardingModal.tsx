import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Tv, CalendarDays, CheckCircle } from 'lucide-react';
import plotifyLogo from '@/assets/plotify-logo.png';

interface OnboardingModalProps {
  onDismiss: () => void;
}

const steps = [
  {
    id: 1,
    heading: 'Welcome to Plotify',
    body: 'Never miss an episode again. Track all your shows across every streaming platform in one place.',
  },
  {
    id: 2,
    heading: 'How It Works',
    items: [
      { icon: Tv, text: 'Add the shows you\'re watching' },
      { icon: CalendarDays, text: 'See every release date on your calendar' },
      { icon: CheckCircle, text: 'Track which episodes you\'ve watched' },
    ],
  },
  {
    id: 3,
    heading: 'Ready to build your watchlist?',
    body: 'Start by adding a show you\'re currently watching.',
  },
];

const OnboardingModal = ({ onDismiss }: OnboardingModalProps) => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const handleAddShow = () => {
    onDismiss();
    navigate('/add');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative bg-card border border-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl animate-fade-in">
        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center space-y-5 py-4">
          {/* Step 1 */}
          {step === 0 && (
            <>
              <img src={plotifyLogo} alt="Plotify" className="w-16 h-16 rounded-xl object-contain" />
              <div className="space-y-2">
                <h2 className="text-xl font-bold">{steps[0].heading}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{steps[0].body}</p>
              </div>
              <button
                onClick={() => setStep(1)}
                className="w-full rounded-xl py-3 text-sm font-semibold bg-gradient-to-r from-platform-prime to-platform-manual text-foreground hover:opacity-90 transition-opacity"
              >
                Next
              </button>
            </>
          )}

          {/* Step 2 */}
          {step === 1 && (
            <>
              <div className="space-y-2 w-full">
                <h2 className="text-xl font-bold">{steps[1].heading}</h2>
              </div>
              <div className="space-y-4 w-full text-left">
                {steps[1].items!.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 px-2">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                      <item.icon className="h-5 w-5 text-foreground" />
                    </div>
                    <p className="text-sm text-foreground/90">{item.text}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full rounded-xl py-3 text-sm font-semibold bg-gradient-to-r from-platform-prime to-platform-manual text-foreground hover:opacity-90 transition-opacity"
              >
                Next
              </button>
              <button onClick={() => setStep(0)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Back
              </button>
            </>
          )}

          {/* Step 3 */}
          {step === 2 && (
            <>
              <div className="space-y-2">
                <h2 className="text-xl font-bold">{steps[2].heading}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{steps[2].body}</p>
              </div>
              <button
                onClick={handleAddShow}
                className="w-full rounded-xl py-3 text-sm font-semibold bg-gradient-to-r from-platform-prime to-platform-manual text-foreground hover:opacity-90 transition-opacity"
              >
                Add Your First Show
              </button>
              <button onClick={onDismiss} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Explore the app first
              </button>
            </>
          )}
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-2 mt-2">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-foreground' : 'bg-muted-foreground/30'}`}
            />
          ))}
        </div>

        {/* Skip */}
        {step < 2 && (
          <div className="text-center mt-3">
            <button onClick={onDismiss} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Skip
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingModal;
