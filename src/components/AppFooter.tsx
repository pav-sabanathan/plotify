import { useState } from 'react';
import { Link } from 'react-router-dom';
import FeedbackModal from './FeedbackModal';

const AppFooter = () => {
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <>
      <footer className="flex flex-col items-center gap-2 py-3 md:py-4 text-[11px] text-muted-foreground/50">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowFeedback(true)} className="hover:text-muted-foreground transition-colors">
            Send feedback
          </button>
          <span>·</span>
          <Link to="/privacy" className="hover:text-muted-foreground transition-colors">Privacy Policy</Link>
          <span>·</span>
          <Link to="/terms" className="hover:text-muted-foreground transition-colors">Terms of Service</Link>
        </div>
      </footer>
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
    </>
  );
};

export default AppFooter;
