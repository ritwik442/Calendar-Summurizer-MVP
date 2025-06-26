export const API_BASE = (
  process.env.REACT_APP_API_URL
).replace(/\/+$/, '');    // ← strips every trailing slash
