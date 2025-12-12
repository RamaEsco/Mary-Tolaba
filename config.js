// Configuración de Supabase
export const supabaseConfig = {
  url: 'https://vxxjedxgodklduvypwsc.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4eGplZHhnb2RrbGR1dnlwd3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NDU1MTUsImV4cCI6MjA4MTAyMTUxNX0.kr_VCVlRRd_kVaUZyPr5Ar6S9y0_BVxU_fanb7k1DSo'
};

// Lista blanca de orígenes permitidos (CORS)
export const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'null',  // For file:// URLs
  'https://tudominio.com'
];

// Tiempo de expiración del token de autenticación (en segundos)
export const AUTH_TOKEN_EXPIRY = 3600; // 1 hora

// Roles permitidos para el panel de administración
export const ALLOWED_ROLES = ['admin', 'editor'];
