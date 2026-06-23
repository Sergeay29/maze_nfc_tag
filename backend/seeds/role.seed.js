const { Role } = require("../models");

async function seedRoles() {
  const roles = [
    {
      name: "SUPER_ADMIN",
      description: "Administrateur global",
    },
    {
      name: "OWNER",
      description: "Propriétaire entreprise",
    },
    {
      name: "MANAGER",
      description: "Gestionnaire",
    },
    {
      name: "EMPLOYEE",
      description: "Employé",
    },
  ];

  for (const role of roles) {
    await Role.findOrCreate({
      where: {
        name: role.name,
      },
      defaults: role,
    });
  }

  console.log("Rôles initialisés");
}

module.exports = seedRoles;
