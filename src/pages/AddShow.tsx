import AddShowSearch from '@/components/AddShowSearch';
import AppFooter from '@/components/AppFooter';

const AddShow = () => (
  <div className="space-y-6 pb-20 px-4 pt-6 max-w-lg mx-auto">
    <h1 className="text-2xl font-bold tracking-tight">Add Show</h1>
    <AddShowSearch />
    <AppFooter />
  </div>
);

export default AddShow;
