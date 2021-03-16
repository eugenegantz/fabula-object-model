"use strict";

// ------------------------------------------------------
// Данные из базы о частных лицах

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
var voidFn = function() {};

var ClientsDataModel = function() {
	this.init();
};

ClientsDataModel.prototype = {

	"init": function() {
		this.dbModel = null;

		this.data = [];

		this._instances.push(this);
		this.dataRefByClientId = {};

		this.state = 0;
	},


	"_instances": [],


	"getInstance": function() {
		return this._instances[0] || new ClientsDataModel();
	},


	"sql": ""
	+ " SELECT "
	+   " [clid], [datenew], [doccount],"
	+   " [fio], [flag], [city], [addr],"
	+   " [phone], [card], [email], [bday],"
	+   " [sex], [tick]"
	+ " FROM ClientFIO"

	+ ";"
	+ " SELECT"
	+       " pid,"
	+       " extID,"
	+       " property,"
	+       " [value]"
	+ " FROM property"
	+ " WHERE"
	+       " extClass = 'ClientFIO'",


	/**
	 * @param {Object} arg
	 * @param {Function=} arg.callback
	 *
	 * @return {Promise}
	 * */
	"load": function(arg) {
		arg = arg || {};

		var callback = arg.callback || voidFn;
		var db = getContextDB.call(this);
		var self = this;

		return Promise.resolve().then(function() {
			if (!db)
				return Promise.reject('ClientsDataModel.load(): !db');

			return db.dbquery({
				"query": self.sql
			});

		}).then(function(dbres) {
			self.data = dbres[0].recs;

			self.dataRefByClientId = {};

			self.data.forEach(function(row) {
				self.dataRefByClientId[row.clid] = row;

				row.clientsPropertiesRef = [];
			});

			dbres[1].recs.forEach(function(row) {
				var obj = self.dataRefByClientId[row.extID];

				if (obj)
					obj.clientsPropertiesRef.push(row);
			});

			self.dataRefByClientId = new ObjectA(self.dataRefByClientId);

			self.state = 1;

			callback(null, self);
		});
	},


	/**
	 * @param {Object=} arg
	 * @param {Function=} arg.callback
	 * @param {Number} arg.clientId
	 *
	 * @return {Promise}
	 * */
	"loadClient": function(arg) {
		arg = arg || {};

		var callback = arg.callback || voidFn;
		var db = getContextDB.call(this);
		var self = this;

		return new Promise(function(resolve, reject) {
			if (!arg.clientId)
				return reject("ClientsDataModel().loadClient(): arg.clientId is not specified");

			var query = ""
				+ " SELECT "
				+   " [clid], [datenew], [doccount],"
				+   " [fio], [flag], [city], [addr],"
				+   " [phone], [card], [email], [bday],"
				+   " [sex], [tick]"
				+ " FROM ClientFIO"
				+ " WHERE"
				+   " clid = " + arg.clientId

				+ "; SELECT"
				+   "  pid"
				+   ", extID"
				+   ", property"
				+   ", [value]"
				+ " FROM property"
				+ " WHERE"
				+   " extClass = 'ClientFIO'"
				+   " AND extId = '" + arg.clientId + "'";

			return db.dbquery({
				"query": query
			});

		}).then(function(dbres) {
			var prevRow;
			var row = dbres[0].recs[0];

			if (!row)
				return;

			row.clientsPropertiesRef = [];

			dbres[1].recs.forEach(function(row) {
				row.clientsPropertiesRef.push(row);
			});

			if (prevRow = self.dataRefByClientId.get(row.clid + '')) {
				Object.assign(prevRow, row);

			} else {
				self.data.push(row);
				self.dataRefByClientId.set(row.clid + '', row);
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

module.exports = ClientsDataModel;