import User from "./users.js";
import Role from "./roles.js";

Role.hasMany(User, {
  foreignKey: "roleId",
});

User.belongsTo(Role, {
  foreignKey: "roleId",
});

export { User, Role };