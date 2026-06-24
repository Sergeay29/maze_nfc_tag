const Role = require("./roles");
const User = require("./users");
const Enterprise = require("./enterprise");
const Subscription = require("./subscription");
const Client = require("./client");
const NFCCard = require("./nfcCard");
const Scan = require("./scan");
const Setting = require("./setting");

// Role -> User
Role.hasMany(User, {
  foreignKey: "roleId",
});

User.belongsTo(Role, {
  foreignKey: "roleId",
});

// User -> Enterprise (created by)
User.hasMany(Enterprise, {
  foreignKey: "createdBy",
});

Enterprise.belongsTo(User, {
  foreignKey: "createdBy",
  as: "creator",
});

// Enterprise -> Subscription
Enterprise.hasOne(Subscription, {
  foreignKey: "enterpriseId",
});

Subscription.belongsTo(Enterprise, {
  foreignKey: "enterpriseId",
});

// Enterprise -> Client
Enterprise.hasMany(Client, {
  foreignKey: "enterpriseId",
});

Client.belongsTo(Enterprise, {
  foreignKey: "enterpriseId",
});

// Enterprise -> NFCCard
Enterprise.hasMany(NFCCard, {
  foreignKey: "enterpriseId",
});

NFCCard.belongsTo(Enterprise, {
  foreignKey: "enterpriseId",
});

// Client -> NFCCard (assigned to)
Client.hasMany(NFCCard, {
  foreignKey: "assignedToClientId",
});

NFCCard.belongsTo(Client, {
  foreignKey: "assignedToClientId",
  as: "assignedClient",
});

// Enterprise -> Scan
Enterprise.hasMany(Scan, {
  foreignKey: "enterpriseId",
});

Scan.belongsTo(Enterprise, {
  foreignKey: "enterpriseId",
});

// NFCCard -> Scan
NFCCard.hasMany(Scan, {
  foreignKey: "cardId",
});

Scan.belongsTo(NFCCard, {
  foreignKey: "cardId",
});

// Client -> Scan
Client.hasMany(Scan, {
  foreignKey: "clientId",
});

Scan.belongsTo(Client, {
  foreignKey: "clientId",
});

module.exports = { User, Role, Enterprise, NFCCard, Client, Scan, Subscription, Setting };