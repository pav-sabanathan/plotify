import { useNavigate } from 'react-router-dom';
import { Tv } from 'lucide-react';

const EmptyDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-6">
      <Tv size={64} className="text-[#4B5563] mb-6" />
      <h2 className="text-xl font-bold mb-2">Nothing on your radar yet</h2>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-8">
        Add your first show to start tracking episode releases across all your platforms
      </p>
      <button
        onClick={() => navigate('/add')}
        className="rounded-xl px-6 py-3 text-sm font-semibold bg-gradient-to-r from-platform-prime to-platform-manual text-foreground hover:opacity-90 transition-opacity"
      >
        Add Your First Show
      </button>
    </div>
  );
};

export default EmptyDashboard;
