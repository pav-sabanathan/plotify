import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { PLATFORM_LABELS } from '@/types/show';
import FeedbackModal from '@/components/FeedbackModal';
import { toast } from '@/hooks/use-toast';

const BUILT_IN_SERVICES: { key: string; label: string; color: string }[] = [
  { key: 'netflix', label: 'Netflix', color: 'hsl(357, 91%, 47%)' },
  { key: 'disney', label: 'Disney+', color: 'hsl(225, 91%, 44%)' },
  { key: 'apple', label: 'Apple TV+', color: 'hsl(0, 0%, 63%)' },
  { key: 'prime', label: 'Prime Video', color: 'hsl(196, 100%, 44%)' },
  { key: 'bbc', label: 'BBC iPlayer', color: 'hsl(25, 100%, 50%)' },
];

const STORAGE_KEYS = {
  showPastEpisodes: 'plotify-show-past-episodes',
  spoilerFree: 'plotify-spoiler-free-export',
};

const Settings = () => {
  const navigate = useNavigate();
  const [showFeedback, setShowFeedback] = useState(false);

  const [showPastEpisodes, setShowPastEpisodes] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.showPastEpisodes) === 'true';
  });

  const [spoilerFree, setSpoilerFree] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.spoilerFree) === 'true';
  });

  const togglePastEpisodes = (checked: boolean) => {
    setShowPastEpisodes(checked);
    localStorage.setItem(STORAGE_KEYS.showPastEpisodes, String(checked));
  };

  const toggleSpoilerFree = (checked: boolean) => {
    setSpoilerFree(checked);
    localStorage.setItem(STORAGE_KEYS.spoilerFree, String(checked));
  };

  const handleAddService = () => {
    toast({
      title: 'Coming Soon 🚀',
      description: 'Custom streaming services will be available in the next update.',
      duration: 3000,
    });
  };

  return (
    <div className="px-4 max-w-lg mx-auto pb-24 space-y-6">
      {/* Back header */}
      <div className="flex items-center gap-3 -mx-1">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Go back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold">Settings</h1>
      </div>

      {/* SECTION 1 — Streaming Services */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
          Streaming Services
        </h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
          {BUILT_IN_SERVICES.map((service) => (
            <div
              key={service.key}
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: service.color }}
                />
                <span className="text-sm text-foreground">{service.label}</span>
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                Built-in
              </span>
            </div>
          ))}
        </div>

        {/* Custom Services placeholder */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground/60 px-1">Custom Services</h3>
          <div className="rounded-xl border border-border bg-card px-4 py-4 text-center space-y-3">
            <p className="text-sm text-muted-foreground">No custom services added yet</p>
            <button
              onClick={handleAddService}
              className="rounded-lg bg-secondary px-4 py-2 text-xs font-medium text-secondary-foreground hover:bg-accent transition-colors"
            >
              Add Streaming Service
            </button>
          </div>
        </div>
      </section>

      <Separator className="bg-border" />

      {/* SECTION 2 — Display Preferences */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
          Display Preferences
        </h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex-1 pr-4">
              <p className="text-sm text-foreground">Show past episodes on calendar</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Display episodes from the last 30 days in a muted style
              </p>
            </div>
            <Switch checked={showPastEpisodes} onCheckedChange={togglePastEpisodes} />
          </div>
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex-1 pr-4">
              <p className="text-sm text-foreground">Spoiler-free calendar export</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Exclude episode descriptions from ICS exports
              </p>
            </div>
            <Switch checked={spoilerFree} onCheckedChange={toggleSpoilerFree} />
          </div>
        </div>
      </section>

      <Separator className="bg-border" />

      {/* SECTION 3 — Feedback */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
          Feedback
        </h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <button
            onClick={() => setShowFeedback(true)}
            className="flex items-center justify-between w-full px-4 py-3.5 text-sm text-foreground hover:bg-secondary/50 transition-colors"
          >
            <span className="flex items-center gap-3">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              Send Feedback
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </section>

      <Separator className="bg-border" />

      {/* SECTION 4 — About */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
          About
        </h2>
        <div className="rounded-xl border border-border bg-card px-4 py-4 space-y-1.5">
          <p className="text-sm font-semibold text-foreground">Plotify</p>
          <p className="text-xs text-muted-foreground">Version 4.0 Beta</p>
          <p className="text-xs text-muted-foreground italic mt-2">
            "Built to solve a real problem."
          </p>
          <p className="text-[11px] text-muted-foreground/50">
            Made by a PM who missed too many episodes.
          </p>
        </div>
      </section>

      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
    </div>
  );
};

export default Settings;
