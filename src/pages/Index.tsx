import { useState } from 'react';
import { useShows } from '@/context/ShowsContext';
import UpNextStrip from '@/components/UpNextStrip';
import CalendarView from '@/components/CalendarView';
import EmptyDashboard from '@/components/EmptyDashboard';
import OnboardingModal from '@/components/OnboardingModal';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';

const Dashboard = () => {
  const { shows } = useShows();
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('plotify-onboarding-done') && !localStorage.getItem('plotify-shows');
  });

  const dismissOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('plotify-onboarding-done', '1');
  };

  const isEmpty = shows.length === 0;

  return (
    <div className={`px-4 max-w-4xl mx-auto ${isEmpty ? 'min-h-[100vh] flex flex-col pb-20' : 'space-y-6 pb-20 pt-6'}`}>
      <AppHeader />
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
