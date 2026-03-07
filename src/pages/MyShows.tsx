import ShowGrid from '@/components/ShowGrid';
import AppFooter from '@/components/AppFooter';
import AppHeader from '@/components/AppHeader';

const MyShows = () => (
  <div className="space-y-6 pb-20 px-4 pt-6 max-w-4xl mx-auto">
    <AppHeader />
    <ShowGrid />
    <AppFooter />
  </div>
);

export default MyShows;
