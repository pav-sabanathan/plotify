import ShowGrid from '@/components/ShowGrid';
import AppFooter from '@/components/AppFooter';
import plotifyLogo from '@/assets/plotify-logo-full.png';

const MyShows = () => (
  <div className="space-y-6 pb-20 px-4 pt-6 max-w-4xl mx-auto">
    <div className="flex justify-center">
      <img src={plotifyLogo} alt="Plotify" className="h-12" />
    </div>
    <ShowGrid />
    <AppFooter />
  </div>
);

export default MyShows;
