const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Maze NFC API",
      version: "1.0.0",
      description:
        "Documentation de l'API Maze NFC — plateforme de gestion de cartes NFC pour entreprises.",
      contact: {
        name: "Maze NFC",
        email: "support@mazenfc.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Serveur de développement",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Token JWT obtenu via POST /api/auth/login",
        },
      },
      schemas: {
        // ─── Auth ───────────────────────────────────────────────
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "admin@maze-nfc.local" },
            password: { type: "string", example: "admin123456" },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                token: { type: "string" },
                user: { $ref: "#/components/schemas/User" },
              },
            },
          },
        },

        // ─── User ───────────────────────────────────────────────
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            firstName: { type: "string", example: "Super" },
            lastName: { type: "string", example: "Admin" },
            email: { type: "string", format: "email" },
            isActive: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            Role: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                name: { type: "string", example: "SUPER_ADMIN" },
              },
            },
          },
        },

        // ─── Enterprise ─────────────────────────────────────────
        Enterprise: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string", example: "Conciergerie Premium" },
            email: { type: "string", format: "email" },
            phone: { type: "string", example: "+33 1 23 45 67 89" },
            location: { type: "string", example: "Paris, France" },
            logo: { type: "string", format: "uri" },
            adminFirstName: { type: "string" },
            adminLastName: { type: "string" },
            subscription: { type: "string", enum: ["Starter", "Pro", "Enterprise"] },
            status: { type: "string", enum: ["active", "suspended", "inactive"] },
            cardsCount: { type: "integer" },
            modules: { type: "array", items: { type: "string" } },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        CreateEnterpriseRequest: {
          type: "object",
          required: ["name", "email"],
          properties: {
            name: { type: "string", example: "Ma Boutique" },
            email: { type: "string", format: "email", example: "contact@boutique.fr" },
            phone: { type: "string", example: "+33 6 00 00 00 00" },
            location: { type: "string", example: "Lyon, France" },
            adminFirstName: { type: "string", example: "Jean" },
            adminLastName: { type: "string", example: "Dupont" },
            subscription: { type: "string", enum: ["Starter", "Pro", "Enterprise"], default: "Starter" },
          },
        },
        UpdateEnterpriseRequest: {
          type: "object",
          properties: {
            name: { type: "string" },
            email: { type: "string", format: "email" },
            phone: { type: "string" },
            location: { type: "string" },
            status: { type: "string", enum: ["active", "suspended"] },
            subscription: { type: "string", enum: ["Starter", "Pro", "Enterprise"] },
          },
        },

        // ─── NFCCard ────────────────────────────────────────────
        NFCCard: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            cardNumber: { type: "string", example: "NFC-CONC-0001" },
            type: { type: "string", enum: ["Loyalty", "VIP", "Business", "Client"] },
            status: { type: "string", enum: ["active", "inactive", "unassigned"] },
            enterpriseId: { type: "string", format: "uuid" },
            enterpriseName: { type: "string" },
            assignedTo: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        GenerateCardsRequest: {
          type: "object",
          required: ["enterpriseId", "type", "prefix", "quantity"],
          properties: {
            enterpriseId: { type: "string", format: "uuid" },
            type: { type: "string", enum: ["Loyalty", "VIP", "Business", "Client"] },
            prefix: { type: "string", example: "NFC-CONC-" },
            quantity: { type: "integer", minimum: 1, maximum: 1000, example: 10 },
          },
        },
        AssignCardRequest: {
          type: "object",
          required: ["cardNumber", "clientName", "enterpriseId"],
          properties: {
            cardNumber: { type: "string", example: "NFC-CONC-0001" },
            clientName: { type: "string", example: "Jean Mensah" },
            email: { type: "string", format: "email" },
            phone: { type: "string" },
            level: { type: "string", enum: ["Silver", "Gold", "Platinum"], default: "Silver" },
            enterpriseId: { type: "string", format: "uuid" },
          },
        },

        // ─── Scan ───────────────────────────────────────────────
        Scan: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            clientName: { type: "string" },
            cardNumber: { type: "string" },
            enterpriseName: { type: "string" },
            action: { type: "string", example: "+50 points" },
            points: { type: "integer" },
            timestamp: { type: "string", format: "date-time" },
          },
        },

        // ─── Subscription ───────────────────────────────────────
        Subscription: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            plan: { type: "string", enum: ["Starter", "Pro", "Enterprise"] },
            status: { type: "string", enum: ["active", "paused", "cancelled"] },
            monthlyPrice: { type: "number", example: 99 },
            startDate: { type: "string", format: "date-time" },
            Enterprise: { $ref: "#/components/schemas/Enterprise" },
          },
        },

        // ─── Settings ───────────────────────────────────────────
        SettingItem: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            key: { type: "string", example: "platform_name" },
            value: { type: "string", example: "Maze NFC" },
            label: { type: "string", example: "Nom de la plateforme" },
            group: { type: "string", example: "general" },
          },
        },

        // ─── Réponses communes ──────────────────────────────────
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Une erreur est survenue" },
          },
        },
        PaginatedMeta: {
          type: "object",
          properties: {
            total: { type: "integer" },
            page: { type: "integer" },
            limit: { type: "integer" },
            pages: { type: "integer" },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
