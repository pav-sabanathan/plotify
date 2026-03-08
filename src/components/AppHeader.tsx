import { useNavigate } from 'react-router-dom';
import plotifyLogo from '@/assets/plotify-logo-full.png';

const AppHeader = () => {
  const navigate = useNavigate();

  return (
    <div className="flex justify-center items-center py-2 md:py-6">
      <img
        src={plotifyLogo}
        alt="Plotify"
        className="w-[120px] cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => navigate('/')}
      />
    </div>
  );
};

export default AppHeader;
