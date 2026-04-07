import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tv, CalendarDays, CheckCircle } from 'lucide-react';
import { trackEvent } from '@/lib/posthog';
import { getPlatformLogo } from '@/lib/platformLogos';
import plotifyWordmark from '@/assets/plotify-wordmark.png';
import plotifyIcon from '@/assets/plotify-logo.png';

const PLATFORMS = [
  { key: 'netflix', label: 'Netflix' },
  { key: 'disney', label: 'Disney+' },
  { key: 'apple', label: 'Apple TV+' },
  { key: 'prime', label: 'Prime Video' },
  { key: 'bbc', label: 'BBC iPlayer' },
];

const HOW_IT_WORKS = [
  { icon: Tv, heading: 'Add Your Shows', body: 'Search for any show and add it to your watchlist in seconds.' },
  { icon: CalendarDays, heading: "See What's Dropping", body: 'Every upcoming episode appears on your personal release calendar, colour-coded by platform.' },
  { icon: CheckCircle, heading: 'Track Your Progress', body: 'Mark episodes as watched and never lose your place again.' },
];

const HERO_SHOW_NAMES = [
  'Stranger Things', 'The Bear', 'House of the Dragon', 'The Last of Us',
  'Severance', 'Shogun', 'Fallout', 'Slow Horses', 'The Penguin',
  'Arcane', 'Wednesday', 'Andor', 'Squid Game', 'Reacher',
];

const TMDB_IMG = 'https://image.tmdb.org/t/p/w300';
const TMDB_TOKEN = import.meta.env.VITE_PUBLIC_TMDB_TOKEN;

const LandingPage = () => {
  const navigate = useNavigate();
  const howRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const trackedHow = useRef(false);
  const trackedFeatures = useRef(false);
  const [posters, setPosters] = useState<{ title: string; url: string }[]>([]);

  useEffect(() => {
    trackEvent('landing_page_viewed');
  }, []);

  useEffect(() => {
    if (!TMDB_TOKEN) return;
    const fetchPosters = async () => {
      const results = await Promise.all(
        HERO_SHOW_NAMES.map(async (name) => {
          try {
            const res = await fetch(
              `https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(name)}&page=1`,
              { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } }
            );
            if (!res.ok) return null;
            const data = await res.json();
            const poster_path = data.results?.[0]?.poster_path;
            if (!poster_path) return null;
            return { title: name, url: `${TMDB_IMG}${poster_path}` };
          } catch {
            return null;
          }
        })
      );
      setPosters(results.filter((r): r is { title: string; url: string } => r !== null));
    };
    fetchPosters();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target === howRef.current && !trackedHow.current) {
              trackedHow.current = true;
              trackEvent('how_it_works_viewed');
            }
            if (entry.target === featuresRef.current && !trackedFeatures.current) {
              trackedFeatures.current = true;
              trackEvent('features_viewed');
            }
          }
        });
      },
      { threshold: 0.3 }
    );
    if (howRef.current) observer.observe(howRef.current);
    if (featuresRef.current) observer.observe(featuresRef.current);
    return () => observer.disconnect();
  }, []);

  const handleCTA = (location: string) => {
    trackEvent('cta_clicked', { button_location: location });
    navigate('/home');
  };

  const scrollToHow = () => {
    howRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* Poster grid background */}
        {posters.length > 0 && (
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-7 gap-2 md:gap-3 opacity-40 sm:rotate-[-4deg] sm:scale-110 pointer-events-none select-none w-full px-4 sm:px-0 sm:w-auto">
                {posters.slice(0, 14).map((show, i) => (
                  <img
                    key={`${show.title}-${i}`}
                    src={show.url}
                    alt=""
                    loading={i < 7 ? 'eager' : 'lazy'}
                    className="w-full sm:w-20 md:w-28 rounded-lg object-cover aspect-[2/3]"
                  />
                ))}
              </div>
            </div>
            {/* Gradient overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/50 to-background" />
          </div>
        )}

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 pt-16 pb-20 max-w-3xl mx-auto">
          <img src={plotifyWordmark} alt="Plotify" className="w-48 md:w-64 mb-10" />
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
            Every episode. Every platform. One calendar.
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-xl mb-8 leading-relaxed">
            Plotify tracks your favourite shows across Netflix, Disney+, Apple TV+, Prime Video, and BBC iPlayer — so you never miss a drop.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <button
              onClick={() => handleCTA('hero')}
              className="rounded-xl px-8 py-3.5 text-sm font-semibold bg-gradient-to-r from-platform-prime to-platform-manual text-foreground hover:opacity-90 transition-opacity"
            >
              Try Plotify Free
            </button>
            <button
              onClick={scrollToHow}
              className="rounded-xl px-8 py-3.5 text-sm font-semibold border border-border text-foreground hover:bg-accent transition-colors"
            >
              See How It Works
            </button>
          </div>
          <a
            href="https://www.themoviedb.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            Poster data powered by TMDB
          </a>
        </div>
      </section>

      {/* PLATFORM BAR */}
      <section className="border-y border-border py-5 bg-surface-0">
        <div className="flex items-center justify-center flex-wrap gap-6 px-4">
          {PLATFORMS.map((p) => {
            const logo = getPlatformLogo(p.key);
            return logo ? (
              <img
                key={p.key}
                src={logo.src}
                alt={p.label}
                className="h-7 w-auto max-w-[100px] opacity-70 hover:opacity-100 transition-opacity duration-200"
                style={logo.needsInvert ? { filter: 'brightness(0) invert(1)' } : undefined}
              />
            ) : (
              <span key={p.key} className="text-sm font-semibold text-muted-foreground">{p.label}</span>
            );
          })}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section ref={howRef} id="how-it-works" className="py-20 px-6 max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {HOW_IT_WORKS.map((item) => (
            <div key={item.heading} className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl bg-card border border-border">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-platform-prime to-platform-manual flex items-center justify-center">
                <item.icon className="h-7 w-7 text-foreground" />
              </div>
              <h3 className="text-lg font-semibold">{item.heading}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section ref={featuresRef} className="py-20 px-6 max-w-5xl mx-auto space-y-16">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 rounded-2xl bg-card border border-border p-8 flex items-center justify-center min-h-[200px]">
            <div className="text-center space-y-2">
              <CalendarDays className="h-16 w-16 text-platform-prime mx-auto" />
              <p className="text-xs text-muted-foreground">Calendar View</p>
            </div>
          </div>
          <div className="flex-1 space-y-3">
            <h3 className="text-xl md:text-2xl font-bold">Your release schedule at a glance</h3>
            <p className="text-muted-foreground leading-relaxed">
              Week and month views show every upcoming episode across all your platforms in one place, colour-coded so you always know what's on where.
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row-reverse items-center gap-8">
          <div className="flex-1 rounded-2xl bg-card border border-border p-8 flex items-center justify-center min-h-[200px]">
            <div className="text-center space-y-2">
              <Tv className="h-16 w-16 text-platform-disney mx-auto" />
              <p className="text-xs text-muted-foreground">My Shows</p>
            </div>
          </div>
          <div className="flex-1 space-y-3">
            <h3 className="text-xl md:text-2xl font-bold">Everything you're watching, organised</h3>
            <p className="text-muted-foreground leading-relaxed">
              Your personal watchlist with watch progress, platform tags, and the ability to pause shows you've temporarily stepped away from.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-surface-0 border-y border-border">
        <div className="max-w-2xl mx-auto text-center space-y-5">
          <h2 className="text-2xl md:text-3xl font-bold">Stop missing episodes.</h2>
          <p className="text-muted-foreground">Free to use. No account needed. Just add your shows and go.</p>
          <button
            onClick={() => handleCTA('bottom')}
            className="rounded-xl px-8 py-3.5 text-sm font-semibold bg-gradient-to-r from-platform-prime to-platform-manual text-foreground hover:opacity-90 transition-opacity"
          >
            Try Plotify Free
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 px-6 text-center space-y-3">
        <img src={plotifyIcon} alt="Plotify" className="w-10 h-10 mx-auto rounded-lg" />
        <p className="text-xs text-muted-foreground">© 2026 Plotify</p>
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
          <span>·</span>
          <a href="/terms" className="hover:text-foreground transition-colors">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
