// API Configuration - Updated Nov 29, 2025
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://kayak-vending-machine-production.up.railway.app'
  : 'http://localhost:5000';

export default API_BASE_URL;
