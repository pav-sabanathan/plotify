import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, MessageSquare, Shield, FileText } from 'lucide-react';
import FeedbackModal from '@/components/FeedbackModal';

const Settings = () => {
  const navigate = useNavigate();
  const [showFeedback, setShowFeedback] = useState(false);

  const aboutItems = [
    { label: 'Privacy Policy', icon: Shield, action: () => navigate('/privacy') },
    { label: 'Terms of Service', icon: FileText, action: () => navigate('/terms') },
    { label: 'Send Feedback', icon: MessageSquare, action: () => setShowFeedback(true) },
  ];

  return (
    <div className="px-4 max-w-4xl mx-auto pb-20 space-y-6">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">About</h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
          {aboutItems.map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className="flex items-center justify-between w-full px-4 py-3.5 text-sm text-foreground hover:bg-secondary/50 transition-colors"
            >
              <span className="flex items-center gap-3">
                <item.icon className="h-4 w-4 text-muted-foreground" />
                {item.label}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
    </div>
  );
};

export default Settings;
