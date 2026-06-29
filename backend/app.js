const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const authRoute = require("./routes/authRoute");
const adminRoute = require("./routes/adminRoute");
const uploadRoute = require("./routes/uploadRoute");

const app = express();

// Sécurité des headers HTTP avec Helmet
app.use(helmet());

// Rate Limiting pour éviter les attaques brute force
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite chaque IP à 100 requêtes par fenêtre
  message: {
    success: false,
    message: "Trop de requêtes depuis cette IP, veuillez réessayer plus tard.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Limite plus stricte pour les routes d'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Seulement 10 tentatives de login par IP
  message: {
    success: false,
    message: "Trop de tentatives de connexion, veuillez réessayer plus tard.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

// ─── Swagger UI ───────────────────────────────────────────────
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Maze NFC — API Docs",
    customCss: `
      .swagger-ui .topbar { background-color: #6A35FF; }
      .swagger-ui .topbar .download-url-wrapper { display: none; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
    },
  })
);

// Endpoint qui expose le JSON brut (utile pour Postman / Insomnia)
app.get("/api/docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// ─── Routes ───────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Maze NFC API",
    docs: "http://localhost:3000/api/docs",
  });
});

app.use("/api/auth", authLimiter, authRoute);
app.use("/api/admin", adminRoute);
app.use("/api/upload", uploadRoute);

// ─── Gestion globale des erreurs (ne pas exposer les détails sensibles) ──────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);

  const isDevelopment = process.env.NODE_ENV === "development";

  res.status(err.status || 500).json({
    success: false,
    message: isDevelopment ? err.message : "Erreur interne du serveur",
  });
});

module.exports = app;
