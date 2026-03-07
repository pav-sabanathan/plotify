import { useState } from 'react';
import FeedbackModal from './FeedbackModal';

const FeedbackFooter = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex justify-center pb-24 pt-8">
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          Send feedback
        </button>
      </div>
      <FeedbackModal open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default FeedbackFooter;
