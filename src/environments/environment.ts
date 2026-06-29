export const environment = {
  production: true,
  apiUrl: (typeof window !== 'undefined' && (window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')))
    ? 'http://localhost:8080'
    : 'https://trainshier-backend-9hbp.onrender.com'
};
