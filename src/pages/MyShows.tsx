import { useNewSeasonCheck } from '@/hooks/useNewSeasonCheck';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import ShowGrid from '@/components/ShowGrid';

const MyShows = () => {
  const { alerts, handleUpdate, handleDismiss } = useNewSeasonCheck();

  return (
    <div className="space-y-6 pb-20 px-4 max-w-4xl mx-auto">
      {alerts.map(alert => (
        <div
          key={alert.showId}
          className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 animate-fade-in"
        >
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            <p className="text-sm text-foreground truncate">
              A new season of <span className="font-semibold">{alert.showName}</span> is available. Update your tracker?
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleUpdate(alert)}
              className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="h-3 w-3" />
              Update
            </button>
            <button
              onClick={() => handleDismiss(alert.showId)}
              className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
      <ShowGrid />
    </div>
  );
};

export default MyShows;
