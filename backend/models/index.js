const Role = require("./roles");
const User = require("./users");
const Enterprise = require("./enterprise");
const Subscription = require("./subscription");
const Client = require("./client");
const NFCCard = require("./nfcCard");
const Scan = require("./scan");
const Setting = require("./setting");
const Service = require("./service");
const Reward = require("./reward");
const Redemption = require("./redemption");
const CardType = require("./cardType");
const AuditLog = require("./auditLog");

// CardType -> NFCCard
CardType.hasMany(NFCCard, { foreignKey: 'cardTypeId' });
NFCCard.belongsTo(CardType, { foreignKey: 'cardTypeId' });

// Role -> User
Role.hasMany(User, {
  foreignKey: "roleId",
});

User.belongsTo(Role, {
  foreignKey: "roleId",
});

// Enterprise -> Users (membres de l'entreprise : OWNER, MANAGER, EMPLOYEE)
Enterprise.hasMany(User, {
  foreignKey: "enterpriseId",
  as: "members",
});

User.belongsTo(Enterprise, {
  foreignKey: "enterpriseId",
  as: "enterprise",
});

// User -> Enterprise (créateur — conservé pour traçabilité)
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

// Service -> NFCCard (relation optionnelle pour le lien de scan)
Service.hasMany(NFCCard, {
  foreignKey: "serviceId",
});

NFCCard.belongsTo(Service, {
  foreignKey: "serviceId",
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

// Enterprise -> Service
Enterprise.hasMany(Service, {
  foreignKey: "enterpriseId",
});

Service.belongsTo(Enterprise, {
  foreignKey: "enterpriseId",
});

// Enterprise -> Reward
Enterprise.hasMany(Reward, {
  foreignKey: "enterpriseId",
});

Reward.belongsTo(Enterprise, {
  foreignKey: "enterpriseId",
});

// Service -> Scan (optional, to link scan to service used)
Service.hasMany(Scan, {
  foreignKey: "serviceId",
  allowNull: true,
});

Scan.belongsTo(Service, {
  foreignKey: "serviceId",
});

// Client -> Redemption
Client.hasMany(Redemption, {
  foreignKey: "clientId",
});

Redemption.belongsTo(Client, {
  foreignKey: "clientId",
});

// Enterprise -> Redemption
Enterprise.hasMany(Redemption, {
  foreignKey: "enterpriseId",
});

Redemption.belongsTo(Enterprise, {
  foreignKey: "enterpriseId",
});

// Reward -> Redemption
Reward.hasMany(Redemption, {
  foreignKey: "rewardId",
});

Redemption.belongsTo(Reward, {
  foreignKey: "rewardId",
});

// User -> AuditLog
User.hasMany(AuditLog, { foreignKey: "userId" });
AuditLog.belongsTo(User, { foreignKey: "userId" });

// Client -> AuditLog
Client.hasMany(AuditLog, { foreignKey: "clientId" });
AuditLog.belongsTo(Client, { foreignKey: "clientId" });

// Enterprise -> AuditLog
Enterprise.hasMany(AuditLog, { foreignKey: "enterpriseId" });
AuditLog.belongsTo(Enterprise, { foreignKey: "enterpriseId" });

module.exports = {
  User,
  Role,
  Enterprise,
  NFCCard,
  Client,
  Scan,
  Subscription,
  Setting,
  Service,
  Reward,
  Redemption,
  CardType,
  AuditLog,
};