import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  loadShowsFromStorage,
  loadWatchedFromStorage,
  showToDbRow,
  watchedToDbRows,
  STORAGE_KEY,
  WATCHED_KEY,
} from '@/context/ShowsContext';
import { loadServicesFromStorage, STORAGE_KEY as SERVICES_KEY } from '@/context/CustomServicesContext';
import { Loader2 } from 'lucide-react';

const IMPORT_DONE_KEY = 'plotify-import-checked';

const ImportDataModal = ({ onDone }: { onDone: () => void }) => {
  const { user } = useAuth();
  const [importing, setImporting] = useState(false);

  if (!user) return null;

  // Check if there's localStorage data worth importing
  const localShows = loadShowsFromStorage();
  const localServices = loadServicesFromStorage();
  const hasLocalData = localShows.length > 0 || localServices.length > 0;

  // Already handled or no data
  if (!hasLocalData) {
    return null;
  }

  const handleImport = async () => {
    setImporting(true);
    try {
      // Import shows
      if (localShows.length > 0) {
        const showRows = localShows.map(s => showToDbRow(s, user.id));
        await supabase.from('shows').upsert(showRows as any, { onConflict: 'id' });
      }

      // Import watch progress
      const localWatched = loadWatchedFromStorage();
      const watchRows = watchedToDbRows(localWatched, user.id);
      if (watchRows.length > 0) {
        await supabase.from('watch_progress').upsert(watchRows as any, { onConflict: 'show_id,user_id,season,episode' });
      }

      // Import custom services
      if (localServices.length > 0) {
        const serviceRows = localServices.map(s => ({
          id: s.id,
          user_id: user.id,
          name: s.name,
          colour: s.color,
        }));
        await supabase.from('custom_services').upsert(serviceRows as any, { onConflict: 'id' });
      }

      // Clear localStorage
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(WATCHED_KEY);
      localStorage.removeItem(SERVICES_KEY);
    } catch (e) {
      console.error('Import failed:', e);
    } finally {
      localStorage.setItem(IMPORT_DONE_KEY, '1');
      setImporting(false);
      onDone();
    }
  };

  const handleStartFresh = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(WATCHED_KEY);
    localStorage.removeItem(SERVICES_KEY);
    localStorage.setItem(IMPORT_DONE_KEY, '1');
    onDone();
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-sm w-full p-6 space-y-4 animate-fade-in">
        <h2 className="text-lg font-bold text-foreground">We found shows on this device</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Would you like to import them to your account? This will sync {localShows.length} show{localShows.length !== 1 ? 's' : ''} and your watch progress across all your devices.
        </p>
        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={handleImport}
            disabled={importing}
            className="rounded-xl px-6 py-3 text-sm font-semibold bg-gradient-to-r from-platform-prime to-platform-manual text-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {importing && <Loader2 className="h-4 w-4 animate-spin" />}
            Import Shows
          </button>
          <button
            onClick={handleStartFresh}
            disabled={importing}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            Start Fresh
          </button>
        </div>
      </div>
    </div>
  );
};

export { IMPORT_DONE_KEY };
export default ImportDataModal;
