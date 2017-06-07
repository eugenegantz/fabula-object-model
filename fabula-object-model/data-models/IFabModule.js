"use strict";

var IFabModule = function() {};

module.exports = IFabModule;

module.exports.prototype = {

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