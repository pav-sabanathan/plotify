import AddShowSearch from '@/components/AddShowSearch';
import AppFooter from '@/components/AppFooter';
import AppHeader from '@/components/AppHeader';

const AddShow = () => (
  <div className="space-y-6 pb-20 px-4 pt-6 max-w-lg mx-auto">
    <AppHeader />
    <AddShowSearch />
    <AppFooter />
  </div>
);

export default AddShow;
