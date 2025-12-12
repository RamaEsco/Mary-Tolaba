import { createClient } from '@supabase/supabase-js';
import { supabaseConfig, allowedOrigins, AUTH_TOKEN_EXPIRY, ALLOWED_ROLES } from './config.js';

// Inicializar cliente de Supabase
const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false
  }
});

// Middleware para verificar el token JWT
const verifyToken = async (req) => {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return { user: null, error: 'No token provided' };

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { user: null, error: error?.message || 'Invalid token' };
    }

    // Verificar si el usuario tiene un rol permitido
    const { data: userData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || !userData || !ALLOWED_ROLES.includes(userData.role)) {
      return { user: null, error: 'Unauthorized' };
    }

    return { user, error: null };
  } catch (error) {
    console.error('Error verifying token:', error);
    return { user: null, error: 'Error verifying token' };
  }
};

// Middleware para manejar CORS
const handleCors = (response) => {
  response.headers.set('Access-Control-Allow-Origin', allowedOrigins.join(','));
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
};

// Manejador de errores
const handleError = (error, message = 'An error occurred') => {
  console.error(`${message}:`, error);
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message 
    }), 
    { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    }
  );
};

// API: Obtener productos
async function getProducts() {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return handleError(error, 'Error fetching products');
  }
}

// API: Agregar producto (protegido)
async function addProduct(req) {
  try {
    // Verificar autenticación
    const { user, error: authError } = await verifyToken(req);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar datos de entrada
    const { categoria, nombre, precio, imagen } = await req.json();
    if (!categoria || !nombre || !precio || !imagen) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Insertar en la base de datos
    const { data, error } = await supabase
      .from('productos')
      .insert([{ 
        categoria, 
        nombre, 
        precio: parseFloat(precio), 
        imagen,
        creado_por: user.id
      }])
      .select();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, data: data[0] }), 
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleError(error, 'Error adding product');
  }
}

// Manejador principal de la API
export async function handleRequest(req) {
  const { pathname } = new URL(req.url);
  let response;

  try {
    // Manejar CORS para solicitudes OPTIONS
    if (req.method === 'OPTIONS') {
      return handleCors(new Response(null, { status: 204 }));
    }

    // Enrutamiento de la API
    switch (pathname) {
      case '/api/products':
        if (req.method === 'GET') {
          response = await getProducts();
        } else if (req.method === 'POST') {
          response = await addProduct(req);
        } else {
          response = new Response(
            JSON.stringify({ success: false, error: 'Method not allowed' }), 
            { status: 405, headers: { 'Content-Type': 'application/json' } }
          );
        }
        break;
      
      default:
        response = new Response(
          JSON.stringify({ success: false, error: 'Not found' }), 
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
    }

    return handleCors(response);
  } catch (error) {
    return handleError(error);
  }
}

// Para usar en entornos serverless
export default {
  async fetch(request) {
    return handleRequest(request);
  }
};
