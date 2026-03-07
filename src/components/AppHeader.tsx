import { useNavigate } from 'react-router-dom';
import plotifyLogo from '@/assets/plotify-logo-full.png';

const AppHeader = () => {
  const navigate = useNavigate();

  return (
    <div className="flex justify-center py-4 -mx-4 -mt-6 mb-2 bg-[#111111] border-b border-[#1f1f1f]">
      <img
        src={plotifyLogo}
        alt="Plotify"
        className="h-16 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => navigate('/')}
      />
    </div>
  );
};

export default AppHeader;
