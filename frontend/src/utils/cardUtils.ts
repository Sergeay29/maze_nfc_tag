// Fonction pour générer les initiales du nom d'entreprise
export const getEnterpriseInitials = (name: string): string => {
  // Nettoyer le nom : remplacer les tirets, underscores, etc. par des espaces
  const cleanedName = name.replace(/[-_\s]+/g, ' ').trim();
  
  // Séparer en mots
  const words = cleanedName.split(/\s+/).filter(word => word.length > 0);
  
  if (words.length === 0) return 'ENT';
  
  // Si 1 mot : prendre les 4 premières lettres
  if (words.length === 1) {
    return words[0].slice(0, 4).toUpperCase();
  }
  
  // Si 2 mots : prendre 2 premières lettres du 1er + 2 premières du 2ème
  if (words.length === 2) {
    return (words[0].slice(0, 2) + words[1].slice(0, 2)).toUpperCase();
  }
  
  // Si 3+ mots : prendre initiales des 3 premiers mots
  return words
    .slice(0, 3)
    .map(word => word[0].toUpperCase())
    .join('');
};

// Mapping des types de carte pour les initiales
export const typeMap: Record<string, string> = {};

// Génère les initiales d'un type de carte dynamiquement
export const getTypeInitials = (typeName: string): string => {
  const words = typeName.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[-_]+/g, ' ').trim().split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return 'TYP';
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.slice(0, 3).map(w => w[0].toUpperCase()).join('');
};

// Mapping des subtypes pour les initiales
export const subtypeMap: Record<string, string> = {
  "Basic": "BAS",
  "Standard": "STD",
  "Luxe": "LUX"
};

// Fonction pour générer le préfixe de carte
export const getCardPrefix = (
  enterpriseName: string,
  cardType: string,
  cardSubtype?: string
): string => {
  const enterpriseInitials = getEnterpriseInitials(enterpriseName);
  const typeInitials = getTypeInitials(cardType);
  let prefix = `${enterpriseInitials}-${typeInitials}`;
  if (cardSubtype) {
    const subtypeInitials = getTypeInitials(cardSubtype);
    prefix += `-${subtypeInitials}`;
  }
  return prefix;
};
