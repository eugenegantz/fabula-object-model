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

var dbUtils = require("./../utils/dbUtils"),
	ObjectA = require("./ObjectA.js"),
	voidFn = function() {};

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


	"sql": "SELECT * FROM firms"

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


	"loadFirm": function(arg) {
		arg = arg || {};

		var callback = arg.callback || voidFn,
			db = getContextDB.call(this),
			self = this;

		return new Promise(function(resolve, reject) {
			if (!arg.firmId)
				return reject("FirmsDataModel().loadFirm(): arg.firmId is not specified");

			var query = ""
				+ " SELECT *"
				+ " FROM firms"
				+ " WHERE"
				+   " firmId = " + arg.firmId

				+ "; SELECT"
				+   "  pid"
				+   ", extID"
				+   ", property"
				+   ", [value]"
				+ " FROM property"
				+ " WHERE"
				+   " extClass = 'firms'"
				+   " AND extId = '" + arg.firmId + "'";

			db.dbquery({
				"query": query,
				"callback": function(dbres, err) {
					if (err = dbUtils.fetchErrStrFromRes(dbres))
						return reject(err);

					resolve(dbres);
				}
			});

		}).then(function(dbres) {
			var prevFirmRow,
				firmRow = dbres[0].recs[0];

			if (!firmRow)
				return;

			firmRow.firmsPropertiesRef = [];

			dbres[1].recs.forEach(function(row) {
				firmRow.firmsPropertiesRef.push(row);
			});

			if (prevFirmRow = self.dataRefByFirmId.get(firmRow.FirmID + '')) {
				Object.assign(prevFirmRow, firmRow);

			} else {
				self.data.push(firmRow);
				self.dataRefByFirmId.set(firmRow.FirmID + '', firmRow);
			}

			callback(null, self);

		}).catch(function(err) {
			callback(err);

			return Promise.reject(err);
		})
	},


	"get": function() {
		return this.data;
	}

};

module.exports = FirmsDataModel;