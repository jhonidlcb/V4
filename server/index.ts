import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { loadMercadoPagoConfig } from "./mercadopago"; // Import the new function
import { db, users } from "./db"; // Import database connection and users model
import path from 'path';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Verificar configuración de la base de datos al inicio
  console.log('🚀 Iniciando servidor...');
  console.log('🔗 Verificando conexión a PostgreSQL...');

  try {
    // Test database connection
    const testQuery = await db.select().from(users).limit(1);
    console.log('✅ Conexión a PostgreSQL exitosa');
    console.log('👥 Usuarios en la base de datos:', testQuery.length > 0 ? 'SÍ' : 'Base de datos vacía');
  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL:', error);
    throw new Error('No se pudo conectar a la base de datos');
  }

  // Load MercadoPago configuration on startup (non-blocking)
  loadMercadoPagoConfig()
    .then(() => log("✅ MercadoPago configuration loaded from database"))
    .catch((error) => log("⚠️ Error loading MercadoPago config:", String(error)));

  const server = await registerRoutes(app);

  // Servir archivos estáticos desde client/public
  app.use('/public', express.static(path.join(import.meta.dirname, '../client/public')));
  app.use(express.static(path.join(import.meta.dirname, '../client/public')));

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();