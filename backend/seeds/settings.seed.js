const { Setting } = require("../models");

async function seedSettings() {
  const defaults = [
    {
      key: "platform_name",
      value: "Maze NFC",
      label: "Nom de la plateforme",
      group: "general",
    },
    {
      key: "support_email",
      value: "support@mazenfc.com",
      label: "Email de support",
      group: "general",
    },
    {
      key: "api_url",
      value: "https://api.mazenfc.com",
      label: "URL de l'API",
      group: "general",
    },
    {
      key: "nfc_base_url",
      value: "https://mzg.cards/c/",
      label: "URL de base des cartes NFC",
      group: "general",
    },
    {
      key: "notify_email_alerts",
      value: "true",
      label: "Alertes email",
      group: "notifications",
    },
    {
      key: "notify_push",
      value: "true",
      label: "Notifications push",
      group: "notifications",
    },
    {
      key: "notify_weekly_report",
      value: "false",
      label: "Rapports hebdomadaires",
      group: "notifications",
    },
  ];

  for (const setting of defaults) {
    await Setting.findOrCreate({
      where: { key: setting.key },
      defaults: setting,
    });
  }

  console.log("Paramètres initialisés");
}

module.exports = seedSettings;
