// seeds/demo-scan.seed.js
// Script pour créer des données de démonstration pour tester la page de scan

const { Enterprise, Service, Client } = require("../models");

async function seedDemoScan() {
  try {
    console.log("🌱 Début du seed de démonstration pour le scan...");

    // 1. Trouver une entreprise existante ou en créer une
    let enterprise = await Enterprise.findOne({ where: { name: "Restaurant Chez Marcel" } });
    
    if (!enterprise) {
      console.log("📝 Création de l'entreprise de démonstration...");
      enterprise = await Enterprise.create({
        name: "Restaurant Chez Marcel",
        email: "contact@chezmarcel.fr",
        phone: "+33123456789",
        location: "123 rue de Paris, 75001 Paris",
        logo: "https://via.placeholder.com/200x200/6A35FF/FFFFFF?text=Marcel",
        status: "active",
        subscription: "Pro",
        adminFirstName: "Marcel",
        adminLastName: "Dupont",
      });
      console.log("✅ Entreprise créée:", enterprise.name);
    } else {
      console.log("ℹ️ Entreprise existante trouvée:", enterprise.name);
    }

    // 2. Créer des services de démonstration
    const services = [
      {
        name: "Menu du midi",
        description: "Commandez un menu du midi et gagnez des points",
        pointsToAdd: 10,
        icon: "🍽️",
        color: "#6A35FF",
        isActive: true,
        enterpriseId: enterprise.id,
      },
      {
        name: "Dessert offert",
        description: "Un dessert acheté = points bonus",
        pointsToAdd: 5,
        icon: "🍰",
        color: "#FF6B9D",
        isActive: true,
        enterpriseId: enterprise.id,
      },
      {
        name: "Menu complet",
        description: "Entrée + Plat + Dessert",
        pointsToAdd: 20,
        icon: "🍴",
        color: "#4CAF50",
        isActive: true,
        enterpriseId: enterprise.id,
      },
    ];

    for (const serviceData of services) {
      const existingService = await Service.findOne({
        where: { name: serviceData.name, enterpriseId: enterprise.id },
      });

      if (!existingService) {
        const service = await Service.create(serviceData);
        console.log(`✅ Service créé: ${service.name} (Token: ${service.scanToken})`);
        console.log(`   🔗 URL de test: http://localhost:5173/scan/${service.scanToken}`);
      } else {
        console.log(`ℹ️ Service existant: ${existingService.name} (Token: ${existingService.scanToken})`);
        console.log(`   🔗 URL de test: http://localhost:5173/scan/${existingService.scanToken}`);
      }
    }

    // 3. Créer quelques clients de démonstration
    const clients = [
      {
        name: "Sophie Martin",
        email: "sophie.martin@example.com",
        phone: "+33612345678",
        points: 50,
        level: "Silver",
        enterpriseId: enterprise.id,
      },
      {
        name: "Thomas Dubois",
        email: "thomas.dubois@example.com",
        phone: "+33687654321",
        points: 1500,
        level: "Gold",
        enterpriseId: enterprise.id,
      },
      {
        name: "Marie Leroy",
        email: "marie.leroy@example.com",
        phone: "+33698765432",
        points: 6000,
        level: "Platinum",
        enterpriseId: enterprise.id,
      },
    ];

    for (const clientData of clients) {
      const existingClient = await Client.findOne({
        where: { email: clientData.email },
      });

      if (!existingClient) {
        const client = await Client.create(clientData);
        console.log(`✅ Client créé: ${client.name} (${client.points} points - ${client.level})`);
      } else {
        console.log(`ℹ️ Client existant: ${existingClient.name}`);
      }
    }

    console.log("\n🎉 Seed de démonstration terminé avec succès !");
    console.log("\n📱 Pour tester la page de scan :");
    console.log("1. Démarrez le backend: npm run dev");
    console.log("2. Démarrez le frontend: npm run dev");
    console.log("3. Copiez une des URLs ci-dessus dans votre navigateur");
    console.log("4. Utilisez un des téléphones/emails ci-dessus ou créez un nouveau client");
    
  } catch (error) {
    console.error("❌ Erreur lors du seed:", error);
    throw error;
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  seedDemoScan()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = seedDemoScan;
