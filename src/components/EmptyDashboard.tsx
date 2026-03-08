import { useNavigate } from 'react-router-dom';
import { Tv } from 'lucide-react';

const EmptyDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center px-6 py-4 md:py-24 gap-3 md:gap-4">
      <Tv size={48} className="text-muted-foreground md:!w-16 md:!h-16" />
      <h2 className="text-xl font-bold">Nothing on your radar yet</h2>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
        Add your first show to start tracking episode releases across all your platforms
      </p>
      <button
        onClick={() => navigate('/add')}
        className="rounded-xl px-6 py-3 text-sm font-semibold bg-gradient-to-r from-platform-prime to-platform-manual text-foreground hover:opacity-90 transition-opacity mt-2"
      >
        Add Your First Show
      </button>
    </div>
  );
};

export default EmptyDashboard;
