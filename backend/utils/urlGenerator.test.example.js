/**
 * Tests d'exemple pour le générateur d'URLs
 * 
 * Pour exécuter ces tests, installez Jest :
 * npm install --save-dev jest
 * 
 * Puis ajoutez dans package.json :
 * "scripts": {
 *   "test": "jest"
 * }
 * 
 * Et exécutez : npm test
 */

const {
  slugify,
  generateScanUrl,
  generateServiceToken,
  generateCardCode,
} = require('./urlGenerator');

describe('urlGenerator', () => {
  describe('slugify', () => {
    test('convertit une chaîne en slug minuscule', () => {
      expect(slugify('Chez Marcel')).toBe('chez-marcel');
    });

    test('gère les accents', () => {
      expect(slugify('Café Français')).toBe('cafe-francais');
    });

    test('gère les caractères spéciaux', () => {
      expect(slugify("Coiff'Style & Beauty")).toBe('coiff-style-beauty');
    });

    test('gère les espaces multiples', () => {
      expect(slugify('Le   Grand   Restaurant')).toBe('le-grand-restaurant');
    });

    test('supprime les tirets en début et fin', () => {
      expect(slugify('  -Le Restaurant-  ')).toBe('le-restaurant');
    });
  });

  describe('generateScanUrl', () => {
    const baseParams = {
      cardType: 'Restaurant',
      enterpriseName: 'Chez Marcel',
      scanToken: 'a7f3e9d2c1b4a8f6',
      baseUrl: 'https://mzg.cards',
    };

    test('génère une URL valide avec tous les paramètres', () => {
      const url = generateScanUrl({
        ...baseParams,
        subtype: 'Luxe',
      });

      expect(url).toBe(
        'https://mzg.cards/restaurant/chez-marcel-restaurant-luxe/a7f3e9d2c1b4a8f6'
      );
    });

    test('génère une URL sans subtype', () => {
      const url = generateScanUrl(baseParams);

      expect(url).toBe(
        'https://mzg.cards/restaurant/chez-marcel-restaurant/a7f3e9d2c1b4a8f6'
      );
    });

    test('gère une baseUrl avec slash final', () => {
      const url = generateScanUrl({
        ...baseParams,
        baseUrl: 'https://mzg.cards/',
      });

      expect(url).toBe(
        'https://mzg.cards/restaurant/chez-marcel-restaurant/a7f3e9d2c1b4a8f6'
      );
    });

    test('gère les noms avec accents et caractères spéciaux', () => {
      const url = generateScanUrl({
        cardType: 'Salon',
        enterpriseName: "Beauté & Coiff'Style",
        subtype: 'Première Classe',
        scanToken: 'token123',
        baseUrl: 'https://mzg.cards',
      });

      expect(url).toBe(
        'https://mzg.cards/salon/beaute-coiff-style-salon-premiere-classe/token123'
      );
    });

    test('lance une erreur si un paramètre requis est manquant', () => {
      expect(() => {
        generateScanUrl({
          cardType: 'Restaurant',
          enterpriseName: 'Test',
          // scanToken manquant
          baseUrl: 'https://mzg.cards',
        });
      }).toThrow();
    });
  });

  describe('generateServiceToken', () => {
    test('génère un token de 32 caractères', () => {
      const token = generateServiceToken();
      expect(token).toHaveLength(32);
    });

    test('génère des tokens uniques', () => {
      const token1 = generateServiceToken();
      const token2 = generateServiceToken();
      expect(token1).not.toBe(token2);
    });

    test('génère des tokens hexadécimaux', () => {
      const token = generateServiceToken();
      expect(token).toMatch(/^[a-f0-9]{32}$/);
    });
  });

  describe('generateCardCode', () => {
    test('génère un code de 8 caractères', () => {
      const code = generateCardCode();
      expect(code).toHaveLength(8);
    });

    test('génère des codes uniques', () => {
      const code1 = generateCardCode();
      const code2 = generateCardCode();
      expect(code1).not.toBe(code2);
    });

    test('génère des codes en majuscules', () => {
      const code = generateCardCode();
      expect(code).toBe(code.toUpperCase());
    });

    test('génère des codes hexadécimaux', () => {
      const code = generateCardCode();
      expect(code).toMatch(/^[A-F0-9]{8}$/);
    });
  });
});

// Exemples d'URLs générées avec différents cas d'usage
describe('Exemples réels d\'URLs', () => {
  test('Restaurant Luxe', () => {
    const url = generateScanUrl({
      cardType: 'Restaurant',
      enterpriseName: 'Le Gourmet Parisien',
      subtype: 'Luxe',
      scanToken: 'a1b2c3d4e5f6g7h8',
      baseUrl: 'https://mzg.cards',
    });

    expect(url).toBe(
      'https://mzg.cards/restaurant/le-gourmet-parisien-restaurant-luxe/a1b2c3d4e5f6g7h8'
    );
  });

  test('Salon Standard', () => {
    const url = generateScanUrl({
      cardType: 'Salon',
      enterpriseName: 'Coiffure Moderne',
      subtype: 'Standard',
      scanToken: 'x9y8z7w6v5u4t3s2',
      baseUrl: 'https://mzg.cards',
    });

    expect(url).toBe(
      'https://mzg.cards/salon/coiffure-moderne-salon-standard/x9y8z7w6v5u4t3s2'
    );
  });

  test('Spa Premium', () => {
    const url = generateScanUrl({
      cardType: 'Spa',
      enterpriseName: 'Zen & Détente',
      subtype: 'Premium',
      scanToken: 'p0o9i8u7y6t5r4e3',
      baseUrl: 'https://mzg.cards',
    });

    expect(url).toBe(
      'https://mzg.cards/spa/zen-detente-spa-premium/p0o9i8u7y6t5r4e3'
    );
  });

  test('Boutique sans subtype', () => {
    const url = generateScanUrl({
      cardType: 'Boutique',
      enterpriseName: 'Mode & Style',
      scanToken: 'm1o2d3e4s5t6y7l8',
      baseUrl: 'https://mzg.cards',
    });

    expect(url).toBe(
      'https://mzg.cards/boutique/mode-style-boutique/m1o2d3e4s5t6y7l8'
    );
  });
});
