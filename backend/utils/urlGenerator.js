/**
 * Utilitaire pour générer les URLs de scan des cartes NFC
 * Format: nomdedomaine.com/typedecarte/entreprise-type/token
 */

const crypto = require("crypto");

/**
 * Normaliser une chaîne pour l'URL (slug)
 * @param {string} str - Chaîne à normaliser
 * @returns {string} - Slug de la chaîne
 */
const slugify = (str) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

/**
 * Générer une URL de scan pour une carte NFC
 * @param {Object} params - Paramètres pour générer l'URL
 * @param {string} params.cardType - Type de carte (ex: "Restaurant", "Salon")
 * @param {string} params.enterpriseName - Nom de l'entreprise
 * @param {string} params.subtype - Sous-type optionnel (ex: "Basic", "Luxe")
 * @param {string} params.scanToken - Token unique du service associé
 * @param {string} params.baseUrl - URL de base (depuis process.env.SCAN_BASE_URL)
 * @returns {string} - URL de scan complète
 */
const generateScanUrl = ({ cardType, enterpriseName, subtype, scanToken, baseUrl }) => {
  if (!cardType || !enterpriseName || !scanToken || !baseUrl) {
    throw new Error("cardType, enterpriseName, scanToken et baseUrl sont requis pour générer l'URL de scan");
  }

  // Nettoyer l'URL de base
  const cleanBaseUrl = baseUrl.replace(/\/$/, "");

  // Créer le slug du type de carte
  const typeSlug = slugify(cardType);

  // Créer le slug de l'entreprise avec le type
  let enterpriseTypeSlug = `${slugify(enterpriseName)}-${typeSlug}`;

  // Ajouter le subtype si présent
  if (subtype) {
    enterpriseTypeSlug += `-${slugify(subtype)}`;
  }

  // Construire l'URL finale
  return `${cleanBaseUrl}/${typeSlug}/${enterpriseTypeSlug}/${scanToken}`;
};

/**
 * Générer un token unique pour un service
 * @returns {string} - Token hexadécimal de 32 caractères
 */
const generateServiceToken = () => {
  return crypto.randomBytes(16).toString("hex");
};

/**
 * Générer un code de carte unique (court)
 * @returns {string} - Code alphanumérique en majuscules
 */
const generateCardCode = () => {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
};

module.exports = {
  slugify,
  generateScanUrl,
  generateServiceToken,
  generateCardCode,
};
