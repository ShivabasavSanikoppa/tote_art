// Central API base URL
// In development, Vite proxy handles /api → localhost:5001
// In production (static hosting), calls go directly to the Render backend
const API_BASE = import.meta.env.VITE_API_URL || 'https://tote-art-backend.onrender.com';

export default API_BASE;
