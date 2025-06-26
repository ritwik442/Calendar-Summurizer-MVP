export const API_BASE = (
  process.env.REACT_APP_API_URL || 'http://localhost:4000'
).replace(/\/+$/, '');    // ← strips every trailing slash
