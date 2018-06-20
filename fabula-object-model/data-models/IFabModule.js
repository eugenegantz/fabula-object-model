"use strict";

var _utils = {
	db: {
		awws: require('eg-db-awws/src/db-awws-utils.js')
	}
};

var IFabModule = function() {};

module.exports = IFabModule;

module.exports.prototype = {

	iFabModuleGetDBCache: function() {
		var dbcache = Array.prototype.slice.call(arguments, 0);

		dbcache = dbcache.reduce(function(obj, dbc, idx) {
			if (typeof dbc == "string")
				obj[idx] = dbc;

			else if (typeof dbc == "object")
				Object.assign(obj, dbc);

			return obj;
		}, {
			r: Math.random().toString().replace("0.", "").slice(-4),
			"*": 1
		});

		return _utils.db.awws.dbCacheToString(dbcache);
	},


	getFabulaInstance: function() {
		return this._fabulaInstance;
	},


	getDBInstance: function() {
		var fab = this.getFabulaInstance();

		return (fab && fab.getDBInstance()) || this.getGlobDBInstance();
	},


	getGlobDBInstance: function() {
		return require("./../_FabulaObjectModel.js")
			.prototype
			._getModule("DBModel")
			.prototype
			.getInstance();
	},


	getGandsInstance: function() {
		var fab = this.getFabulaInstance();

		return (fab && fab.create("GandsDataModel")) || this.getGlobGandsInstance();
	},


	getGlobGandsInstance: function() {
		return require("./../_FabulaObjectModel.js")
			.prototype
			._getModule("GandsDataModel")
			.prototype
			.getInstance();
	}

};