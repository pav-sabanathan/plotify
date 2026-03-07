import plotifyLogo from '@/assets/plotify-logo-full.png';

const AppHeader = () => (
  <div className="flex justify-center py-4 -mx-4 -mt-6 mb-2 bg-[#111111] border-b border-[#1f1f1f]">
    <img src={plotifyLogo} alt="Plotify" className="h-16" />
  </div>
);

export default AppHeader;
