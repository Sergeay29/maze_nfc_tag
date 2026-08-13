const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const swaggerUi = require("swagger-ui-express");
const path = require("path");

const swaggerSpec = require("./config/swagger");

const authRoute = require("./routes/authRoute");
const adminRoute = require("./routes/adminRoute");
const uploadRoute = require("./routes/uploadRoute");
const enterpriseRoute = require("./routes/enterpriseRoute");
const scanRoute = require("./routes/scanRoute");
const clientAuthRoute = require("./routes/clientAuthRoute");

const app = express();

/*
 * L'application se trouve derrière un seul reverse proxy :
 *
 * Navigateur → Apache → Backend Express
 *
 * Cette configuration permet notamment :
 * - de récupérer correctement l'adresse IP du client ;
 * - d'interpréter X-Forwarded-For ;
 * - d'interpréter X-Forwarded-Proto ;
 * - de faire fonctionner correctement express-rate-limit.
 */
app.set("trust proxy", 1);

/*
 * Masque l'information indiquant que l'application utilise Express.
 */
app.disable("x-powered-by");

/*
 * Sécurisation des en-têtes HTTP.
 *
 * cross-origin est nécessaire si les images stockées dans /uploads
 * doivent être affichées dans le frontend.
 */
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

/*
 * Une ou plusieurs origines peuvent être renseignées,
 * séparées par une virgule :
 *
 * FRONTEND_URL=https://exemple.com,https://www.exemple.com
 */
const allowedOrigins = (
  process.env.FRONTEND_URL || "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      /*
       * Certaines requêtes serveur à serveur ou certains outils
       * comme curl et Postman n'envoient pas d'en-tête Origin.
       */
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      const error = new Error("Origine non autorisée par la politique CORS");
      error.status = 403;

      return callback(error);
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

/*
 * Limitation de la taille des requêtes JSON.
 *
 * Les fichiers sont reçus par Multer et ne passent pas par ce parseur.
 */
app.use(
  express.json({
    limit: "1mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  })
);

/*
 * Fichiers téléversés localement.
 *
 * Dans Docker, le dossier backend/uploads sera relié
 * à un volume persistant.
 */
const uploadsDirectory = path.join(__dirname, "uploads");

app.use(
  "/uploads",
  express.static(uploadsDirectory, {
    index: false,
    maxAge: process.env.NODE_ENV === "production" ? "7d" : 0,
  })
);

/*
 * Endpoint de santé utilisé par Docker.
 *
 * Il confirme que le processus Express fonctionne.
 * Il ne modifie aucune donnée.
 */
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    service: "maze-nfc-api",
    timestamp: new Date().toISOString(),
  });
});

/*
 * Documentation Swagger.
 */
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Maze NFC — API Docs",

    customCss: `
      .swagger-ui .topbar {
        background-color: #6A35FF;
      }

      .swagger-ui .topbar .download-url-wrapper {
        display: none;
      }
    `,

    swaggerOptions: {
      persistAuthorization: true,
    },
  })
);

/*
 * Spécification OpenAPI brute.
 */
app.get("/api/docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

/*
 * Route d'information de l'API.
 */
app.get("/", (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;

  res.json({
    success: true,
    message: "Maze NFC API",
    docs: `${baseUrl}/api/docs`,
    health: `${baseUrl}/api/health`,
  });
});

/*
 * Routes métier.
 */
app.use("/api/auth", authRoute);
app.use("/api/admin", adminRoute);
app.use("/api/enterprise", enterpriseRoute);
app.use("/api/upload", uploadRoute);
app.use("/api/scan", scanRoute);
app.use("/api/client/auth", clientAuthRoute);

/*
 * Réponse normalisée lorsqu'aucune route ne correspond.
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route introuvable",
    path: req.originalUrl,
  });
});

/*
 * Gestion globale des erreurs.
 *
 * Les détails techniques ne sont pas exposés en production.
 */
app.use((err, _req, res, _next) => {
  console.error(err.stack || err);

  const isDevelopment = process.env.NODE_ENV === "development";

  res.status(err.status || 500).json({
    success: false,
    message: isDevelopment
      ? err.message
      : "Erreur interne du serveur",
  });
});

module.exports = app;