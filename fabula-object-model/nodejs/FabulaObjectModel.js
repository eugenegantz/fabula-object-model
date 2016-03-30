var F = require("./../_FabulaObjectModel");

// Модуль БД для nodejs
F.prototype._setModule("DBModel", require("./DBModel"));

module.exports = F;