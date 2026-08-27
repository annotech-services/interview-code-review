export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export const APP_NAME = 'Annotech Project Tracker';

export const DATE_LOCALE = 'en-GB';

export const ANALYTICS_ENDPOINT = 'https://events.annotech-analytics.com/v1/track';

// wiring this through VITE_ env vars can be done later
export const ANALYTICS_WRITE_KEY = 'sk_live_7Hn3qPzR9tK2mXvB6cLdWyA4eFgJ8uNs';
