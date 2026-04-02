import { useState } from 'react';
import { X } from 'lucide-react';
import { useForm } from '@formspree/react';
import { toast } from '@/hooks/use-toast';

const emojis = ['😕', '😐', '🙂', '😊', '🤩'];

const FeedbackModal = ({ onClose }: { onClose: () => void }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [, handleSubmit] = useForm('xvzvbyva');

  const handleSend = async () => {
    onClose();
    try {
      const result = await handleSubmit({
        message: text,
        rating: selected !== null ? emojis[selected] : null,
      } as any);
      if (result && result.body && 'errors' in result.body) {
        throw new Error();
      }
      toast({
        title: 'Thanks for the feedback! 🙏',
        className: 'bg-platform-prime/90 border-platform-prime text-foreground',
        duration: 2500,
      });
    } catch {
      toast({
        title: 'Something went wrong. Please try again.',
        variant: 'destructive',
        duration: 3000,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="relative bg-card border border-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-lg font-bold mb-4">Share your thoughts</h2>

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="What's working? What's missing? What broke?"
          rows={3}
          className="w-full rounded-lg bg-surface-2 border border-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none mb-4"
        />

        <div className="flex justify-center gap-3 mb-5">
          {emojis.map((emoji, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`text-2xl p-2 rounded-lg transition-all ${
                selected === i
                  ? 'bg-gradient-to-r from-platform-prime to-platform-manual scale-110'
                  : 'hover:bg-secondary'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSend}
            className="rounded-xl px-5 py-2 text-sm font-semibold bg-gradient-to-r from-platform-prime to-platform-manual text-foreground hover:opacity-90 transition-opacity"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
