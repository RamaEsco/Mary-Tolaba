import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'http';
import { handleRequest } from './api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(express.json());

// Servir archivos estáticos desde la carpeta actual
app.use(express.static(__dirname));

// Ruta principal - Redirige a la tienda
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'tienda.html'));
});

// Ruta para el panel de administración
app.get('/admin', (req, res) => {
  res.sendFile(join(__dirname, 'admin.html'));
});

// API routes - Usamos el manejador de api.js
app.all('/api/*', async (req, res) => {
  try {
    const response = await handleRequest({
      method: req.method,
      url: req.url,
      headers: req.headers,
      json: () => Promise.resolve(req.body),
      text: () => Promise.resolve(JSON.stringify(req.body))
    });

    // Enviar la respuesta al cliente
    res.status(response.status || 200);
    
    // Copiar las cabeceras de la respuesta
    for (const [key, value] of response.headers.entries()) {
      res.setHeader(key, value);
    }
    
    // Enviar el cuerpo de la respuesta
    const responseBody = await response.text();
    res.send(responseBody);
  } catch (error) {
    console.error('Error handling API request:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Iniciar el servidor
const server = createServer(app);

server.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`Tienda: http://localhost:${PORT}`);
  console.log(`Admin: http://localhost:${PORT}/admin`);
});

export { app };
