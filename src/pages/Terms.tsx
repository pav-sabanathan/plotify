import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import plotifyLogo from '@/assets/plotify-logo.png';

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-20 space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <img src={plotifyLogo} alt="Plotify" className="w-10 h-10 rounded-lg object-contain" />
      <h1 className="text-xl font-bold">Terms of Service</h1>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Plotify is provided free of charge as a personal project with no guarantees of accuracy or availability. Episode release data is for informational purposes only. Use of this service is at your own discretion. For any questions contact: hello@plotify.app
      </p>
    </div>
  );
};

export default Terms;
