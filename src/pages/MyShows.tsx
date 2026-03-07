import ShowGrid from '@/components/ShowGrid';
import AppFooter from '@/components/AppFooter';

const MyShows = () => (
  <div className="space-y-6 pb-20 px-4 pt-6 max-w-4xl mx-auto">
    <h1 className="text-2xl font-bold tracking-tight">My Shows</h1>
    <ShowGrid />
    <AppFooter />
  </div>
);

export default MyShows;
