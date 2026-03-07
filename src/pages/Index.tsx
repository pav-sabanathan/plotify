import { useState } from 'react';
import { useShows } from '@/context/ShowsContext';
import UpNextStrip from '@/components/UpNextStrip';
import CalendarView from '@/components/CalendarView';
import EmptyDashboard from '@/components/EmptyDashboard';
import OnboardingModal from '@/components/OnboardingModal';
import AppFooter from '@/components/AppFooter';
import plotifyLogo from '@/assets/plotify-logo-full.png';

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
    <div className="space-y-6 pb-20 px-4 pt-6 max-w-4xl mx-auto">
      <div className="flex justify-center">
        <img src={plotifyLogo} alt="Plotify" className="h-12" />
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
