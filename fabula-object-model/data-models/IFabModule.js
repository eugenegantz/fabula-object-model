"use strict";

var IFabModule = function() {};

module.exports = IFabModule;

module.exports.prototype = {

	DB_CACHE_RAND: Math.random().toString().replace("0.", ""),


	iFabModuleGetDBCache(arg) {
		arg = arg || {};

		if (arg.dbcache == this.DB_CACHE_RAND)
			return this.iFabModuleDefDBCacheStr + Math.random().toString().replace("0.", "");

		return arg.dbcache || this.iFabModuleDefDBCacheStr;
	},


	iFabModuleSetDefDBCache(str) {
		this.iFabModuleDefDBCacheStr = str;
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