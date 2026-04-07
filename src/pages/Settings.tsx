import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight, MessageSquare, Plus, Check, Trash2, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useCustomServices, CustomService } from '@/context/CustomServicesContext';
import FeedbackModal from '@/components/FeedbackModal';
import ColorWheelModal from '@/components/ColorWheelModal';
import { toast } from '@/hooks/use-toast';
import CalendarFeedSection from '@/components/CalendarFeedSection';
import ProfileSection from '@/components/ProfileSection';
import { getPlatformLogo } from '@/lib/platformLogos';

const BUILT_IN_SERVICES = [
  { key: 'netflix', label: 'Netflix', color: '#E50914' },
  { key: 'disney', label: 'Disney+', color: '#113CCF' },
  { key: 'apple', label: 'Apple TV+', color: '#A0A0A0' },
  { key: 'prime', label: 'Prime Video', color: '#00A8E1' },
  { key: 'bbc', label: 'BBC iPlayer', color: '#FF6B00' },
];

const SUGGESTED_SERVICES: { id: string; name: string; color: string }[] = [
  { id: 'suggested-crave', name: 'Crave', color: '#0057FF' },
  { id: 'suggested-paramount', name: 'Paramount+', color: '#0064FF' },
  { id: 'suggested-max', name: 'Max / HBO Max', color: '#5822B4' },
  { id: 'suggested-crunchyroll', name: 'Crunchyroll', color: '#F47521' },
  { id: 'suggested-sky', name: 'Sky', color: '#CC0000' },
  { id: 'suggested-nowtv', name: 'NOW TV', color: '#1B6B6B' },
  { id: 'suggested-channel4', name: 'Channel 4', color: '#7B00FF' },
  { id: 'suggested-itvx', name: 'ITVX', color: '#C8E63C' },
  { id: 'suggested-peacock', name: 'Peacock', color: '#F5C400' },
  { id: 'suggested-britbox', name: 'BritBox', color: '#00A8A8' },
];

const TOOLTIP_KEY = 'plotify_services_tooltip_dismissed';

const STORAGE_KEYS = {
  showPastEpisodes: 'plotify-show-past-episodes',
  spoilerFree: 'plotify-spoiler-free-export',
};

const Settings = () => {
  const navigate = useNavigate();
  const { services, addService, removeService, hasService } = useCustomServices();
  const [showFeedback, setShowFeedback] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customColor, setCustomColor] = useState('#8B5CF6');
  const [customColorInput, setCustomColorInput] = useState('#8B5CF6');
  const [customError, setCustomError] = useState('');
  const [colorError, setColorError] = useState('');
  const [showColorWheel, setShowColorWheel] = useState(false);
  const [tooltipDismissed, setTooltipDismissed] = useState(() => localStorage.getItem(TOOLTIP_KEY) === 'true');

  const { user } = useAuth();

  const [showPastEpisodes, setShowPastEpisodes] = useState(() =>
    localStorage.getItem(STORAGE_KEYS.showPastEpisodes) === 'true'
  );
  const [spoilerFree, setSpoilerFree] = useState(() =>
    localStorage.getItem(STORAGE_KEYS.spoilerFree) === 'true'
  );

  // Load preferences from Supabase for authenticated users
  useEffect(() => {
    if (!user) return;
    supabase.from('user_preferences').select('*').eq('user_id', user.id).single().then(({ data }) => {
      if (data) {
        setShowPastEpisodes(data.show_past_episodes);
        setSpoilerFree(data.spoiler_free_calendar);
      }
    });
  }, [user]);

  const savePreference = useCallback(async (field: string, value: boolean) => {
    if (!user) return;
    await supabase.from('user_preferences').upsert({
      user_id: user.id,
      [field]: value,
    }, { onConflict: 'user_id' });
  }, [user]);

  const togglePastEpisodes = (checked: boolean) => {
    setShowPastEpisodes(checked);
    localStorage.setItem(STORAGE_KEYS.showPastEpisodes, String(checked));
    savePreference('show_past_episodes', checked);
  };

  const toggleSpoilerFree = (checked: boolean) => {
    setSpoilerFree(checked);
    localStorage.setItem(STORAGE_KEYS.spoilerFree, String(checked));
    savePreference('spoiler_free_calendar', checked);
  };

  const dismissTooltip = () => {
    setTooltipDismissed(true);
    localStorage.setItem(TOOLTIP_KEY, 'true');
  };

  const handleAddSuggested = (s: typeof SUGGESTED_SERVICES[0]) => {
    if (hasService(s.id)) return;
    addService({ id: s.id, name: s.name, color: s.color, suggested: true });
    toast({
      title: `✓ ${s.name} added to your platforms`,
      className: 'bg-platform-prime/90 border-platform-prime text-foreground',
      duration: 2000,
    });
  };

  const handleSaveCustom = () => {
    const trimmed = customName.trim();
    if (!trimmed) {
      setCustomError('Please enter a service name');
      return;
    }
    // Check duplicates among built-in, suggested, and existing custom
    const allNames = [
      ...BUILT_IN_SERVICES.map(s => s.label.toLowerCase()),
      ...SUGGESTED_SERVICES.map(s => s.name.toLowerCase()),
      ...services.map(s => s.name.toLowerCase()),
    ];
    if (allNames.includes(trimmed.toLowerCase())) {
      toast({
        title: 'A service with this name already exists',
        variant: 'destructive',
        className: 'bg-amber-600/90 border-amber-500 text-foreground',
        duration: 3000,
      });
      return;
    }
    const id = 'custom-' + trimmed.toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + Date.now();
    addService({ id, name: trimmed, color: customColor, suggested: false });
    toast({
      title: `✓ ${trimmed} added to your platforms`,
      className: 'bg-platform-prime/90 border-platform-prime text-foreground',
      duration: 2000,
    });
    setCustomName('');
    setCustomColor('#8B5CF6');
    setCustomColorInput('#8B5CF6');
    setCustomError('');
    setColorError('');
    setShowCustomForm(false);
  };

  const handleDeleteService = (service: CustomService) => {
    const { dismiss } = toast({
      title: `Are you sure? This will remove ${service.name} from your Add Show options`,
      duration: 8000,
      action: (
        <div className="flex gap-2 mt-1">
          <button
            onClick={() => {
              removeService(service.id);
              dismiss();
            }}
            className="rounded-md bg-destructive px-3 py-1 text-xs font-medium text-destructive-foreground hover:bg-destructive/90"
          >
            Confirm
          </button>
        </div>
      ),
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

      {/* SECTION 0 — Profile (signed-in only) */}
      {user && (
        <>
          <ProfileSection />
          <Separator className="bg-border" />
        </>
      )}

      {/* SECTION 1 — Streaming Services */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
          Streaming Services
        </h2>

        {/* Built-in services */}
        <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
          {BUILT_IN_SERVICES.map((service) => {
              const logo = getPlatformLogo(service.key);
              return (
            <div key={service.key} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                {logo ? (
                  <img
                    src={logo.src}
                    alt={service.label}
                    className="h-4 w-auto max-w-[64px]"
                    style={logo.needsInvert ? { filter: 'brightness(0) invert(1)' } : undefined}
                  />
                ) : (
                  <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: service.color }} />
                )}
                <span className="text-sm text-foreground">{service.label}</span>
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                Built-in
              </span>
            </div>
              );
          })}
        </div>

        {/* First-time tooltip */}
        {!tooltipDismissed && (
          <div className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2.5 animate-fade-in">
            <p className="text-xs text-muted-foreground">
              Don't see your platform? Add it from the suggestions above or create your own.
            </p>
            <button onClick={dismissTooltip} className="ml-2 shrink-0 text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Suggested services */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground px-1">Add a Platform</h3>
          <div className="grid grid-cols-2 gap-2">
            {SUGGESTED_SERVICES.map((s) => {
              const added = hasService(s.id);
              const logo = getPlatformLogo(s.name);
              return (
                <button
                  key={s.id}
                  onClick={() => !added && handleAddSuggested(s)}
                  disabled={added}
                  className={`flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-colors ${
                    added ? 'opacity-60 cursor-default' : 'hover:bg-secondary/50 cursor-pointer'
                  }`}
                >
                  {logo ? (
                    <img
                      src={logo.src}
                      alt={s.name}
                      className="h-4 w-auto max-w-[64px] shrink-0"
                      style={logo.needsInvert ? { filter: 'brightness(0) invert(1)' } : undefined}
                    />
                  ) : (
                    <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  )}
                  <span className="text-sm text-foreground flex-1 truncate">{s.name}</span>
                  {added ? (
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom service form */}
        {showCustomForm ? (
          <div className="rounded-xl border border-border bg-card p-4 space-y-3 animate-fade-in">
            <div>
              <input
                type="text"
                value={customName}
                onChange={e => { setCustomName(e.target.value); setCustomError(''); }}
                placeholder="Service name"
                className={`w-full rounded-lg bg-surface-2 border px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                  customError ? 'border-destructive' : 'border-transparent'
                }`}
              />
              {customError && <p className="text-xs text-destructive mt-1">{customError}</p>}
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Accent Colour</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowColorWheel(true)}
                  className="h-9 w-9 rounded-md shrink-0 border border-border cursor-pointer hover:ring-2 hover:ring-ring transition-all"
                  style={{ backgroundColor: customColor }}
                  aria-label="Open colour picker"
                />
                <input
                  type="text"
                  value={customColorInput}
                  onChange={e => {
                    const val = e.target.value;
                    setCustomColorInput(val);
                    setColorError('');
                    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                      setCustomColor(val);
                    }
                  }}
                  onBlur={() => {
                    if (!/^#[0-9A-Fa-f]{6}$/.test(customColorInput)) {
                      setCustomColor('#8B5CF6');
                      setCustomColorInput('#8B5CF6');
                      setColorError('Please enter a valid hex colour');
                    }
                  }}
                  placeholder="#8B5CF6"
                  className="w-28 rounded-lg bg-secondary border border-border px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              {colorError && <p className="text-xs text-destructive mt-1">{colorError}</p>}
            </div>
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => { setShowCustomForm(false); setCustomName(''); setCustomError(''); setCustomColor('#8B5CF6'); setCustomColorInput('#8B5CF6'); setColorError(''); }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustom}
                className="rounded-lg px-5 py-2 text-sm font-semibold text-foreground hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#8B5CF6' }}
              >
                Save Service
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCustomForm(true)}
            className="w-full rounded-lg bg-secondary px-4 py-2.5 text-xs font-medium text-secondary-foreground hover:bg-accent transition-colors"
          >
            Add Streaming Service
          </button>
        )}

        {/* My Platforms list */}
        {services.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground px-1">My Platforms</h3>
            <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
              {services.map((service) => (
                <div key={service.id} className="flex items-center justify-between px-4 py-3">
                  {(() => {
                    const sLogo = getPlatformLogo(service.name);
                    return (
                  <div className="flex items-center gap-3">
                    {sLogo ? (
                      <img
                        src={sLogo.src}
                        alt={service.name}
                        className="h-4 w-auto max-w-[64px] shrink-0"
                        style={sLogo.needsInvert ? { filter: 'brightness(0) invert(1)' } : undefined}
                      />
                    ) : (
                      <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: service.color }} />
                    )}
                    <span className="text-sm text-foreground">{service.name}</span>
                  </div>
                    );
                  })()}
                  <button
                    onClick={() => handleDeleteService(service)}
                    className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
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

      {/* SECTION — Calendar Feed (signed-in only) */}
      <CalendarFeedSection />

      <Separator className="bg-border" />
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
      {showColorWheel && (
        <ColorWheelModal
          initialColor={customColor}
          onConfirm={(color) => {
            setCustomColor(color);
            setCustomColorInput(color);
            setColorError('');
            setShowColorWheel(false);
          }}
          onCancel={() => setShowColorWheel(false)}
        />
      )}
    </div>
  );
};

export default Settings;
