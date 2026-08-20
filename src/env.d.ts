declare global {
  interface Window {
    __ENV__?: {
      API_BASE_URL?: string;
    };
  }
}

export const ENV = {
  API_BASE_URL: window.__ENV__?.API_BASE_URL ?? import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4444/api',
};
