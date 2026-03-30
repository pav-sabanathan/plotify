import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import plotifyLogo from '@/assets/plotify-logo-full.png';

const AppHeader = () => {
  const navigate = useNavigate();

  return (
    <div className="relative flex justify-center items-center py-1.5 md:py-6">
      <img
        src={plotifyLogo}
        alt="Plotify"
        className="w-[120px] cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => navigate('/home')}
      />
      <button
        onClick={() => navigate('/settings')}
        className="absolute right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Settings"
      >
        <Settings className="h-5 w-5" />
      </button>
    </div>
  );
};

export default AppHeader;
