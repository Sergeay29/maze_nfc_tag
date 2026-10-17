const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { User, Role } = require("../models");

const TEAM_ROLE_NAMES = ["RESTAURANT_MANAGER", "RESTAURANT_STAFF"];

function generatePassword(length = 12) {
  return crypto.randomBytes(length).toString("base64url").slice(0, length);
}

function serializeMember(user) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
    roleId: user.roleId,
    createdBy: user.createdBy || null,
    createdByUser: user.createdByUser ? {
      id: user.createdByUser.id,
      firstName: user.createdByUser.firstName,
      lastName: user.createdByUser.lastName,
      email: user.createdByUser.email,
    } : null,
    role: user.Role ? {
      id: user.Role.id,
      name: user.Role.name,
      description: user.Role.description,
    } : null,
    createdAt: user.createdAt,
  };
}

async function getTeamRole(roleId) {
  const role = await Role.findByPk(roleId);
  return role && TEAM_ROLE_NAMES.includes(role.name) ? role : null;
}

exports.getTeam = async (req, res) => {
  try {
    const [members, roles] = await Promise.all([
      User.findAll({
        where: { enterpriseId: req.user.enterpriseId },
        include: [
          { model: Role, attributes: ["id", "name", "description"] },
          { model: User, as: "createdByUser", attributes: ["id", "firstName", "lastName", "email"] },
        ],
        order: [["createdAt", "ASC"]],
      }),
      Role.findAll({
        where: { name: TEAM_ROLE_NAMES },
        order: [["name", "ASC"]],
        attributes: ["id", "name", "description"],
      }),
    ]);

    return res.json({
      success: true,
      data: {
        members: members.map(serializeMember),
        roles,
      },
    });
  } catch (error) {
    console.error("Get enterprise team error:", error);
    return res.status(500).json({ success: false, message: "Erreur lors du chargement de l'équipe" });
  }
};

exports.createMember = async (req, res) => {
  try {
    const { firstName, lastName, email, password, roleId } = req.body || {};
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !roleId) {
      return res.status(400).json({ success: false, message: "Prénom, nom, email et rôle sont obligatoires" });
    }

    const role = await getTeamRole(roleId);
    if (!role) return res.status(400).json({ success: false, message: "Rôle Restaurant invalide" });

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ where: { email: normalizedEmail } });
    if (existing) return res.status(409).json({ success: false, message: "Un utilisateur avec cet email existe déjà" });

    const generatedPassword = password?.trim() || generatePassword();
    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(generatedPassword, 10),
      roleId: role.id,
      enterpriseId: req.user.enterpriseId,
      createdBy: req.user.id,
      isActive: true,
      mustChangePassword: true,
    });

    const created = await User.findByPk(user.id, {
      include: [
        { model: Role, attributes: ["id", "name", "description"] },
        { model: User, as: "createdByUser", attributes: ["id", "firstName", "lastName", "email"] },
      ],
    });
    return res.status(201).json({
      success: true,
      message: "Membre ajouté à l'équipe Restaurant",
      data: { member: serializeMember(created), generatedPassword: password?.trim() ? undefined : generatedPassword },
    });
  } catch (error) {
    console.error("Create enterprise team member error:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la création du membre" });
  }
};

exports.updateMember = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: "Le propriétaire ne peut pas modifier son propre rôle ici" });
    }

    const member = await User.findOne({
      where: { id: req.params.id, enterpriseId: req.user.enterpriseId },
      include: [{ model: Role, attributes: ["id", "name", "description"] }],
    });
    if (!member) return res.status(404).json({ success: false, message: "Membre introuvable" });
    if (member.Role?.name === "OWNER") return res.status(403).json({ success: false, message: "Le propriétaire ne peut pas être modifié ici" });

    const { firstName, lastName, email, roleId, isActive } = req.body || {};
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = String(firstName).trim();
    if (lastName !== undefined) updateData.lastName = String(lastName).trim();
    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase();
      const existing = await User.findOne({ where: { email: normalizedEmail } });
      if (existing && existing.id !== member.id) return res.status(409).json({ success: false, message: "Un utilisateur avec cet email existe déjà" });
      updateData.email = normalizedEmail;
    }
    if (roleId !== undefined) {
      const role = await getTeamRole(roleId);
      if (!role) return res.status(400).json({ success: false, message: "Rôle Restaurant invalide" });
      updateData.roleId = role.id;
    }
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    await member.update(updateData);
    const updated = await User.findByPk(member.id, {
      include: [
        { model: Role, attributes: ["id", "name", "description"] },
        { model: User, as: "createdByUser", attributes: ["id", "firstName", "lastName", "email"] },
      ],
    });
    return res.json({ success: true, data: serializeMember(updated) });
  } catch (error) {
    console.error("Update enterprise team member error:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la mise à jour du membre" });
  }
};
