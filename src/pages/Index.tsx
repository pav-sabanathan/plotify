import { useState } from 'react';
import { useShows } from '@/context/ShowsContext';
import UpNextStrip from '@/components/UpNextStrip';
import CalendarView from '@/components/CalendarView';
import EmptyDashboard from '@/components/EmptyDashboard';
import OnboardingModal from '@/components/OnboardingModal';
import AppFooter from '@/components/AppFooter';

const Dashboard = () => {
  const { shows } = useShows();
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('plotify-onboarding-done') && shows.length === 0;
  });

  const dismissOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('plotify-onboarding-done', '1');
  };

  const isEmpty = shows.length === 0;

  return (
    <div className="space-y-6 pb-20 px-4 pt-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Plotify</h1>
        <span className="text-xs text-muted-foreground bg-secondary rounded-full px-2 py-0.5">Beta</span>
      </div>
      {isEmpty ? (
        <EmptyDashboard />
      ) : (
        <>
          <UpNextStrip />
          <CalendarView />
        </>
      )}
      <AppFooter />
      {showOnboarding && <OnboardingModal onDismiss={dismissOnboarding} />}
    </div>
  );
};

export default Dashboard;
