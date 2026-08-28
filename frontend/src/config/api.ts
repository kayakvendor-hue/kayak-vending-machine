// API Configuration - Updated Nov 29, 2025

// For development: automatically use current host instead of localhost
// This allows the app to work on both desktop (localhost:3000) and phone (192.168.x.x:3000)
const getDevBackendUrl = () => {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isLocalhost) {
    // If accessing via localhost, use localhost backend
    return 'http://localhost:5000';
  } else {
    // If accessing via IP (e.g., 192.168.x.x from phone), use same IP for backend
    return `http://${window.location.hostname}:5000`;
  }
};

const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://web-production-ca964.up.railway.app'
    : getDevBackendUrl());

console.log('🔗 API Base URL:', API_BASE_URL);
console.log('📱 Frontend Hostname:', window.location.hostname);
console.log('🌍 Full URL:', window.location.href);

export default API_BASE_URL;
