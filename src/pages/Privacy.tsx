import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import plotifyLogo from '@/assets/plotify-logo.png';

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-20 space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <img src={plotifyLogo} alt="Plotify" className="w-10 h-10 rounded-lg object-contain" />
      <h1 className="text-xl font-bold">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Plotify is a personal project and does not currently collect, store, or share any personal data. This policy will be updated when user accounts and data storage are introduced in a future version. For any questions contact: hello@plotify.app
      </p>
    </div>
  );
};

export default Privacy;
