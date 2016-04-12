var F = require("./../_FabulaObjectModel");

require("eg-promise-cascade");

// Модуль БД для nodejs
F.prototype._setModule("DBModel", require("./DBModel"));

module.exports = F;