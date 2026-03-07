import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
}

const emojis = ['😕', '😐', '🙂', '😊', '🤩'];

const FeedbackModal = ({ open, onClose }: FeedbackModalProps) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  if (!open) return null;

  const handleSend = () => {
    onClose();
    setSelected(null);
    setMessage('');
    toast.success('Thanks for the feedback! 🙏', { duration: 2500 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-6">
      <div className="relative w-full max-w-sm rounded-2xl bg-card border border-border p-6 space-y-5">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-lg font-bold">Share your thoughts</h2>

        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="What's working? What's missing? What broke?"
          rows={3}
          className="w-full rounded-lg bg-secondary border-none px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />

        <div className="flex justify-center gap-3">
          {emojis.map((emoji, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`text-2xl p-2 rounded-lg transition-all ${
                selected === i
                  ? 'bg-gradient-to-r from-[hsl(var(--prime))] to-[hsl(330,80%,55%)] scale-110'
                  : 'hover:bg-secondary'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleSend} className="flex-1 rounded-lg bg-foreground text-background py-2 text-sm font-semibold hover:opacity-90 transition-opacity">
            Send
          </button>
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
