import AddShowSearch from '@/components/AddShowSearch';
import AppFooter from '@/components/AppFooter';
import plotifyLogo from '@/assets/plotify-logo-full.png';

const AddShow = () => (
  <div className="space-y-6 pb-20 px-4 pt-6 max-w-lg mx-auto">
    <div className="flex justify-center">
      <img src={plotifyLogo} alt="Plotify" className="h-12" />
    </div>
    <AddShowSearch />
    <AppFooter />
  </div>
);

export default AddShow;
