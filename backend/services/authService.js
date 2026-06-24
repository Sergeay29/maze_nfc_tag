const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User, Role } = require("../models");

function sanitizeUser(user) {
  const plainUser = user.get({ plain: true });
  delete plainUser.password;
  return plainUser;
}

function signToken(user) {
  const roleName = user.Role?.name;

  return jwt.sign(
    {
      sub: user.id,
      role: roleName,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    }
  );
}

async function login(email, password) {
  const user = await User.findOne({
    where: { email },
    include: [
      {
        model: Role,
        attributes: ["id", "name", "description"],
      },
    ],
  });

  if (!user || !user.isActive) {
    const error = new Error("Email ou mot de passe incorrect");
    error.statusCode = 401;
    throw error;
  }

  const passwordIsValid = await bcrypt.compare(password, user.password);

  if (!passwordIsValid) {
    const error = new Error("Email ou mot de passe incorrect");
    error.statusCode = 401;
    throw error;
  }

  return {
    token: signToken(user),
    user: sanitizeUser(user),
  };
}

async function register({ firstName, lastName, email, password }) {
  const existingUser = await User.findOne({
    where: { email },
  });

  if (existingUser) {
    const error = new Error("Un utilisateur existe déjà avec cet email");
    error.statusCode = 409;
    throw error;
  }

  const role = await Role.findOne({
    where: { name: "OWNER" },
  });

  if (!role) {
    const error = new Error("Le rôle utilisateur est introuvable");
    error.statusCode = 500;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    roleId: role.id,
  });

  const userWithRole = await User.findByPk(user.id, {
    include: [
      {
        model: Role,
        attributes: ["id", "name", "description"],
      },
    ],
  });

  return {
    token: signToken(userWithRole),
    user: sanitizeUser(userWithRole),
  };
}

async function getProfile(userId) {
  const user = await User.findByPk(userId, {
    include: [
      {
        model: Role,
        attributes: ["id", "name", "description"],
      },
    ],
  });

  if (!user || !user.isActive) {
    const error = new Error("Utilisateur introuvable");
    error.statusCode = 404;
    throw error;
  }

  return sanitizeUser(user);
}

module.exports = {
  login,
  register,
  getProfile,
};
