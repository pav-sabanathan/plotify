import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShows } from '@/context/ShowsContext';
import UpNextStrip from '@/components/UpNextStrip';
import CalendarView from '@/components/CalendarView';
import OnboardingModal from '@/components/OnboardingModal';
import FeedbackFooter from '@/components/FeedbackFooter';

const Dashboard = () => {
  const { shows } = useShows();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(() => shows.length === 0);

  const isEmpty = shows.length === 0;

  return (
    <div className="space-y-6 pb-20 px-4 pt-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Plotify</h1>
        <span className="text-xs text-muted-foreground bg-secondary rounded-full px-2 py-0.5">Beta</span>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-5">
          <div className="text-5xl">🎬</div>
          <h2 className="text-xl font-bold">Nothing on your radar yet</h2>
          <p className="text-sm text-muted-foreground max-w-xs">Add your first show to start tracking episode releases across all your platforms</p>
          <button
            onClick={() => navigate('/add')}
            className="rounded-xl bg-gradient-to-r from-[hsl(var(--prime))] to-[hsl(330,80%,55%)] text-white px-6 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Add Your First Show
          </button>
        </div>
      ) : (
        <>
          <UpNextStrip />
          <CalendarView />
        </>
      )}

      <FeedbackFooter />

      {showOnboarding && <OnboardingModal onDismiss={() => setShowOnboarding(false)} />}
    </div>
  );
};

export default Dashboard;
