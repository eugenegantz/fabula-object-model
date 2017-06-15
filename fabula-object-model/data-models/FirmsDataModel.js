"use strict";

// ------------------------------------------------------
// Данные из базы о предприятиях

// Для совместимости
var getContextDB = function() {
	var FabulaObjectModel = require("./../_FabulaObjectModel.js");
	var DBModel = FabulaObjectModel.prototype._getModule("DBModel");

	if (this._fabulaInstance) {
		return this._fabulaInstance.getDBInstance();
	}
	return DBModel.prototype.getInstance();
};

var ObjectA = require("./ObjectA.js");

var FirmsDataModel = function() {
	this.init();
};

FirmsDataModel.prototype = {

	"init": function() {
		this.dbModel = null;

		this.data = [];

		this._instances.push(this);

		this.state = 0;
	},


	"_instances": [],


	"getInstance": function() {
		return this._instances[0] || new FirmsDataModel();
	},


	"sql": ""
	+ " SELECT"
	+       " FirmID,"
	+       " ID,"
	+       " NDS,"
	+       " Parent_ID,"
	+       " Name,"
	+       " FullName,"
	+       " UrName,"
	+       " City_ID,"
	+       " UrAddress,"
	+       " Tel,"
	+       " INN,"
	+       " OKPO,"
	+       " KPP,"
	+       " isAgency"
	+ " FROM _firms"

	+ ";"
	+ " SELECT"
	+       " pid,"
	+       " extID,"
	+       " property,"
	+       " [value]"
	+ " FROM property"
	+ " WHERE"
	+       " extClass = 'firms'",


	"load": function(arg) {
		arg = arg || {};

		var callback = arg.callback || function() {},
			db = getContextDB.call(this),
			self = this;

		return new Promise(function(resolve, reject) {
			if (!db)
				return reject('FirmsDataModel.load(): !db');

			db.dbquery({
				"query": self.sql,
				"callback": function(dbres) {
					resolve(dbres);
				}
			});

		}).then(function(dbres) {
			self.data = dbres[0].recs;

			self.dataRefByFirmId = {};

			self.data.forEach(function(row) {
				self.dataRefByFirmId[row.FirmID] = row;

				row.firmsPropertiesRef = [];
			});

			dbres[1].recs.forEach(function(row) {
				var obj = self.dataRefByFirmId[row.extID];

				if (obj)
					obj.firmsPropertiesRef.push(row);
			});

			self.dataRefByFirmId = new ObjectA(self.dataRefByFirmId);

			self.state = 1;

			callback(null, self);
		});
	},


	"get": function() {
		return this.data;
	}

};

module.exports = FirmsDataModel;