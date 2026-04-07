import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Copy, Check, RefreshCw, ExternalLink, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const WEBCAL_HOST = 'getplotify.vercel.app';

const CalendarFeedSection = () => {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const fetchToken = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('webcal_subscriptions')
      .select('token')
      .eq('user_id', user.id)
      .limit(1)
      .single();
    if (data) setToken(data.token);
  }, [user]);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  if (!user || !token) return null;

  const webcalUrl = `webcal://${WEBCAL_HOST}/api/calendar/${token}.ics`;
  const httpsUrl = `https://${WEBCAL_HOST}/api/calendar/${token}.ics`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(webcalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Feed URL copied', duration: 2000 });
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    const newToken = crypto.randomUUID();
    if (newToken.length < 32) throw new Error('Generated token is too short');
    await supabase
      .from('webcal_subscriptions')
      .update({ token: newToken })
      .eq('user_id', user.id);
    setToken(newToken);
    setRegenerating(false);
    toast({ title: 'Feed URL regenerated', duration: 2000 });
  };

  const googleCalUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl)}`;

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
        Calendar Feed
      </h2>
      <div className="rounded-xl border border-border bg-card px-4 py-4 space-y-3">
        <p className="text-sm font-medium text-foreground">Your calendar feed</p>

        {/* URL display */}
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0 rounded-lg bg-secondary px-3 py-2">
            <p className="text-xs font-mono text-muted-foreground truncate">
              {webcalUrl}
            </p>
          </div>
          <button
            onClick={handleCopy}
            className="shrink-0 rounded-lg bg-secondary p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Copy feed URL"
          >
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <a
            href={googleCalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-secondary px-3 py-2.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Add to Google Calendar
          </a>
          <a
            href={httpsUrl}
            download
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-secondary px-3 py-2.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Download iCal File
          </a>
        </div>

        {/* Instructions */}
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          This link updates automatically when you add or remove shows. Don't share it — use Regenerate if it's been leaked.
        </p>

        {/* Regenerate */}
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${regenerating ? 'animate-spin' : ''}`} />
          Regenerate
        </button>
      </div>
    </section>
  );
};

export default CalendarFeedSection;
