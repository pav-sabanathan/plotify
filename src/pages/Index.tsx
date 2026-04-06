import { useState, useEffect } from 'react';
import { useShows } from '@/context/ShowsContext';
import { useAuth } from '@/context/AuthContext';
import UpNextStrip from '@/components/UpNextStrip';
import CalendarView from '@/components/CalendarView';
import EmptyDashboard from '@/components/EmptyDashboard';
import OnboardingModal from '@/components/OnboardingModal';
import AppFooter from '@/components/AppFooter';

import EmailVerificationBanner from '@/components/EmailVerificationBanner';
import { trackEvent } from '@/lib/posthog';

const Dashboard = () => {
  const { shows } = useShows();
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('plotify-onboarding-done') && !localStorage.getItem('plotify-shows');
  });

  const dismissOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('plotify-onboarding-done', '1');
  };

  useEffect(() => { trackEvent('app_opened'); }, []);

  const isEmpty = shows.length === 0;

  return (
    <div className={`px-4 max-w-4xl mx-auto ${isEmpty ? '' : 'space-y-6 pb-20'}`}>
      {user && <EmailVerificationBanner />}
      {isEmpty ? (
        <>
          <EmptyDashboard />
          <div className="hidden md:block">
            <AppFooter />
          </div>
        </>
      ) : (
        <>
          <UpNextStrip />
          <CalendarView />
          <AppFooter />
        </>
      )}
      {showOnboarding && <OnboardingModal onDismiss={dismissOnboarding} />}
    </div>
  );
};

export default Dashboard;
