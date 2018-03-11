"use strict";

// var _use = require("./RequireCustom");
// var modAjax = require("./Ajax");
// var modDBAwwS = _use("DBAwwS");
var modDBAwwS = require("eg-db-awws"),
	dbUtils = require("./../utils/dbUtils.js");

/**
 * @constructor
 * @param {Object} arg
 * @param {String} arg.dburl
 * @param {String} arg.dbname
 * @param {String} arg.dbsrc
 * */
var DBModel = function(arg) {

	if (!modDBAwwS.prototype.instances.length) {
		if (typeof arg != "object")
			throw new Error("1st argument suppose to be Object");

		var c, tmp = ["dburl", "dbname", "dbname"];

		for (c = 0; c < tmp.length; c++)
			if (!arg[tmp[c]])
				throw new Error("!arg." + tmp[c]);

		this.dbAwwS = modDBAwwS.prototype.getInstance(arg);
		this.dbAwwS.dburl = arg.dburl;
		this.dbAwwS.dbname = arg.dbname; // well.2015
		this.dbAwwS.dbsrc = arg.dbsrc; // main, common, stat

	} else {
		this.dbAwwS = modDBAwwS.prototype.getInstance();
	}

	this.instances.push(this);
};


DBModel.prototype.instances = [];


/**
 * @callback DBModel~dbqueryCallback
 * @param {Object} dbres
 * @param {Object} dbres.info.errors - Ошибки
 * @param {Array} dbres.recs - Таблица БД
 * */
/**
 * @param {Object} arg
 * @param {String} arg.query
 * @param {DBModel~dbqueryCallback} arg.callback
 * */
DBModel.prototype.dbquery = function(arg) {
	arg = Object.assign({}, arg);

	arg.format = "row[col]";

	if (!arg.callback)
		return this._pDBQuery(arg);

	if (!arg.query) {
		arg.callback({
			"info": {
				"errors": ["!arg.query"],
				"num_rows": 0
			},
			"recs": []
		});

		return;
	}


	this.dbAwwS.getDBData(arg);

};


DBModel.prototype._pDBQuery = function(arg) {
	if (!arg.query)
		return Promise.reject("!arg.query");

	return new Promise(function(resolve, reject) {
		arg.callback = function(dbres, err) {
			if (err = dbUtils.fetchErrStrFromRes(dbres))
				return reject(err);

			resolve(dbres);
		};

		this.dbAwwS.getDBData(arg);
	});
};


DBModel.prototype.getInstance = function(arg) {
	if (typeof arg != "object") {
		return this.instances.length ? this.instances[0] : new DBModel(void 0);
	}
	for (var c = 0; c < this.instances.length; c++) {
		if (
			typeof arg.dburl == "string"
			&& this.instances[c].dburl != arg.dburl
		) {
			continue;
		}
		if (
			typeof arg.dbname == "string"
			&& this.instances[c].dbname != arg.dbname
		) {
			continue;
		}
		if (
			typeof arg.dbsrc == "string"
			&& this.instances[c].dbsrc != arg.dbsrc
		) {
			continue;
		}
		return this.instances[c];
	}
	return new DBModel(arg);
};

module.exports = DBModel;