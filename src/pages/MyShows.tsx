import { useNavigate } from 'react-router-dom';
import { useShows } from '@/context/ShowsContext';
import { Tv } from 'lucide-react';
import ShowGrid from '@/components/ShowGrid';
import FeedbackFooter from '@/components/FeedbackFooter';

const MyShows = () => {
  const { shows } = useShows();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 pb-20 px-4 pt-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight">My Shows</h1>

      {shows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          <Tv className="h-12 w-12 text-muted-foreground/40" />
          <h2 className="text-lg font-bold">No shows added yet</h2>
          <p className="text-sm text-muted-foreground">Your tracked shows will appear here</p>
          <button
            onClick={() => navigate('/add')}
            className="rounded-xl bg-platform-manual text-white px-6 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Add a Show
          </button>
        </div>
      ) : (
        <ShowGrid />
      )}

      <FeedbackFooter />
    </div>
  );
};

export default MyShows;
