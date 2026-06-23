const User = require("./users");
const Role = require("./roles");

Role.hasMany(User, {
  foreignKey: "roleId",
});

User.belongsTo(Role, {
  foreignKey: "roleId",
});

module.exports = { User, Role };