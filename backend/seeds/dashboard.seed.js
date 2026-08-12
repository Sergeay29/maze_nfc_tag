// seeds/dashboard.seed.js

const bcrypt = require("bcryptjs");
const { Enterprise, NFCCard, Client, Scan, Subscription, User, Role } = require("../models");
const { getSubscriptionPlanConfig } = require("../utils/subscriptionPlans");

// Fonction pour générer les initiales du nom d'entreprise
const getEnterpriseInitials = (name) => {
  return name
    .split(/\s+/)
    .filter(word => word.length > 0)
    .map(word => word[0].toUpperCase())
    .join('')
    .slice(0, 4); // Limite à 4 initiales max pour garder le préfixe court
};

// Mapping des types de carte pour les initiales
const typeMap = {
  "Fidélité Entreprise": "FID",
  "Restaurant": "RES",
  "Carte de visite": "CDV"
};

// Mapping des subtypes pour les initiales
const subtypeMap = {
  "Basic": "BAS",
  "Standard": "STD",
  "Luxe": "LUX"
};

async function seedDashboardData() {
  try {
    // Vérifier si les données existent déjà
    const existingEnterprises = await Enterprise.count();
    if (existingEnterprises > 0) {
      console.log("Dashboard data already seeded. Skipping...");
      return;
    }

    // 1. Créer 5 entreprises
    const enterprises = await Promise.all([
      Enterprise.create({
        name: "Conciergerie Premium",
        email: "marie@conciergerie.fr",
        phone: "+33 1 23 45 67 89",
        location: "Paris, France",
        adminFirstName: "Marie",
        adminLastName: "Dupont",
        subscription: "Pro",
        status: "active",
        modules: ["Fidélité", "Conciergerie", "Notifications", "Récompenses"],
        logo: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=100",
      }),
      Enterprise.create({
        name: "Auto Spa Luxe",
        email: "jean@autospa.fr",
        phone: "+33 1 98 76 54 32",
        location: "Lyon, France",
        adminFirstName: "Jean",
        adminLastName: "Martin",
        subscription: "Enterprise",
        status: "active",
        modules: ["Fidélité", "Récompenses"],
        logo: "https://images.pexels.com/photos/3806289/pexels-photo-3806289.jpeg?auto=compress&cs=tinysrgb&w=100",
      }),
      Enterprise.create({
        name: "Hôtel Riviera",
        email: "sophie@riviera.com",
        phone: "+33 4 56 78 90 12",
        location: "Nice, France",
        adminFirstName: "Sophie",
        adminLastName: "Bernard",
        subscription: "Pro",
        status: "active",
        modules: ["Fidélité", "Conciergerie", "Notifications"],
        logo: "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=100",
      }),
      Enterprise.create({
        name: "Restaurant Gastronomique",
        email: "pierre@gastro.fr",
        phone: "+33 1 34 56 78 90",
        location: "Bordeaux, France",
        adminFirstName: "Pierre",
        adminLastName: "Leroy",
        subscription: "Starter",
        status: "suspended",
        modules: ["Fidélité"],
        logo: "https://images.pexels.com/photos/1414234/pexels-photo-1414234.jpeg?auto=compress&cs=tinysrgb&w=100",
      }),
      Enterprise.create({
        name: "Fitness Club Elite",
        email: "claire@fitness-elite.fr",
        phone: "+33 1 45 67 89 01",
        location: "Marseille, France",
        adminFirstName: "Claire",
        adminLastName: "Moreau",
        subscription: "Pro",
        status: "active",
        modules: ["Fidélité", "Notifications", "Récompenses"],
        logo: "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=100",
      }),
    ]);

    // 2. Créer subscriptions pour chaque entreprise + compte OWNER lié
    const ownerRole = await Role.findOne({ where: { name: "OWNER" } });
    const hashedPassword = await bcrypt.hash("owner123456", 10);

    for (const enterprise of enterprises) {
      const planConfig = getSubscriptionPlanConfig(enterprise.subscription);

      await Subscription.create({
        enterpriseId: enterprise.id,
        plan: enterprise.subscription,
        monthlyPrice: planConfig.monthlyPrice,
        cardsLimit: planConfig.cardsLimit,
      });

      // Créer le compte OWNER pour cette entreprise (email = email de l'entreprise)
      if (ownerRole) {
        const existingUser = await User.findOne({ where: { email: enterprise.email } });
        if (!existingUser) {
          // Extraire prénom/nom depuis adminFirstName/adminLastName
          await User.create({
            firstName: enterprise.adminFirstName || enterprise.name,
            lastName: enterprise.adminLastName || "",
            email: enterprise.email,
            password: hashedPassword,
            roleId: ownerRole.id,
            enterpriseId: enterprise.id,
            isActive: true,
          });
        }
      }
    }

    // 3. Créer des clients pour la première entreprise
    const conciergerieEnterprise = enterprises[0];
    const clients = await Promise.all([
      Client.create({
        name: "Alice Martin",
        email: "alice@email.com",
        phone: "+33 6 12 34 56 78",
        enterpriseId: conciergerieEnterprise.id,
        points: 1520,
        level: "Platinum",
        photo: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100",
        status: "active",
      }),
      Client.create({
        name: "Bob Durand",
        email: "bob@email.com",
        phone: "+33 6 23 45 67 89",
        enterpriseId: conciergerieEnterprise.id,
        points: 680,
        level: "Gold",
        photo: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100",
        status: "active",
      }),
      Client.create({
        name: "Charles Petit",
        email: "charles@email.com",
        phone: "+33 6 34 56 78 90",
        enterpriseId: conciergerieEnterprise.id,
        points: 320,
        level: "Silver",
        photo: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100",
        status: "active",
      }),
    ]);

    // 4. Créer des cartes NFC
    const cardTypes = ["Fidélité Entreprise", "Restaurant", "Carte de visite"];
    const subtypes = ["Basic", "Standard", "Luxe"];
    const cards = [];
    const baseUrl = "http://localhost:5173/scan/";

    for (let i = 0; i < 50; i++) {
      const enterprise = enterprises[Math.floor(Math.random() * enterprises.length)];
      const client = i < 3 ? clients[i] : null;
      const type = cardTypes[Math.floor(Math.random() * cardTypes.length)];
      const subtype = type === "Restaurant" ? subtypes[Math.floor(Math.random() * subtypes.length)] : null;
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();

      // Construire le préfixe avec initiales
      const enterpriseInitials = getEnterpriseInitials(enterprise.name);
      const typeInitials = typeMap[type] || "XXX";
      let dynamicPrefix = `${enterpriseInitials}-${typeInitials}`;
      
      if (type === "Restaurant" && subtype) {
        const subtypeInitials = subtypeMap[subtype] || "XXX";
        dynamicPrefix += `-${subtypeInitials}`;
      }

      const suffix = String(i + 1).padStart(4, "0");

      const card = await NFCCard.create({
        cardNumber: `${dynamicPrefix}-${suffix}`,
        cardCode: code,
        enterpriseId: enterprise.id,
        type,
        subtype,
        scanUrl: `${baseUrl}${code}`,
        status: client ? "active" : "unassigned",
        assignedToClientId: client?.id || null,
        assignedAt: client ? new Date() : null,
      });

      cards.push(card);

      // Incrémenter le count de cartes pour l'entreprise
      enterprise.cardsCount += 1;
      await enterprise.save();
    }

    // 5. Créer des scans
    const today = new Date();
    for (let i = 0; i < 100; i++) {
      const card = cards[Math.floor(Math.random() * cards.length)];
      const client = clients[Math.floor(Math.random() * clients.length)];
      const enterprise = enterprises.find((e) => e.id === card.enterpriseId);

      const scanDate = new Date(today.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);

      await Scan.create({
        cardId: card.id,
        clientId: client.id,
        enterpriseId: enterprise.id,
        scannedAt: scanDate,
        pointsAdded: Math.floor(Math.random() * 100) + 10,
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
        ipAddress: `192.168.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      });

      // Incrémenter le count de scans
      enterprise.scansCount += 1;
    }

    // Sauvegarder les counts finaux
    for (const enterprise of enterprises) {
      await enterprise.save();
    }

    console.log("✅ Dashboard data seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding dashboard data:", error);
    throw error;
  }
}

module.exports = seedDashboardData;
