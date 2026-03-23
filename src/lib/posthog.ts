import posthog from 'posthog-js';

const key = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
const host = import.meta.env.VITE_PUBLIC_POSTHOG_HOST;

export const initPostHog = () => {
  if (key && host) {
    posthog.init(key, {
      api_host: host,
      capture_pageview: true,
      capture_pageleave: true,
      respect_dnt: true,
      autocapture: true,
      capture_exceptions: true,
    });
  }
};

export const trackEvent = (event: string, properties?: Record<string, string | number | boolean>) => {
  if (key) {
    posthog.capture(event, properties);
  }
};

export default posthog;
