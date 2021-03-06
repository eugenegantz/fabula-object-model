"use strict";

// var _use = require("./RequireCustom");
// var modAjax = require("./Ajax");
// var modDBAwwS = _use("DBAwwS");
var modDBAwwS = require("eg-db-awws");
var dbUtils = require("../utils/dbUtils.js");
var voidFn = function() {};

/**
 * @constructor
 * @param {Object} arg
 * @param {String} arg.dburl
 * @param {String} arg.dbname
 * @param {String} arg.dbsrc
 * */
var DBModel = function(arg) {
	var self = this;

	if (  !modDBAwwS.prototype.instances.length  ){
		if (typeof arg != "object") {
			throw new Error("1st argument suppose to be Object");
		}

		var tmp = ["dburl", "dbname", "dbname"];

		for(var c = 0; c < tmp.length; c++){
			if (!arg[tmp[c]]){
				throw new Error("!arg." + tmp[c]);
			}
		}

		this.dbAwwS = modDBAwwS.prototype.getInstance(arg);

		[
			"wsurl",
			"dburl",
			"dbname",
			"dbsrc",
			"loginhash",
			"loginurl",
			"loginorigin",
			"login",
			"login2"
		].forEach(function(key) {
			self[key] = arg[key];
		});

	} else {
		this.dbAwwS = modDBAwwS.prototype.getInstance();

	}

	this.instances.push(this);
};

DBModel.prototype.instances = [];


DBModel.prototype.getConnection = function() {
	return this.dbAwwS;
};


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
DBModel.prototype.query = function(arg){
	arg = arg || {};

	arg.format = "row[col]";

	if (!arg.callback)
		return this._dbQueryPromise(arg);

	return this._dbQueryCallback(arg);
};


/**
 * @deprecated
 * */
DBModel.prototype.dbquery = DBModel.prototype.query;


DBModel.prototype._dbQueryPromise = function(arg) {
	var _this = this;

	if (!arg.query)
		return Promise.reject("!dbquery");

	return (
		new Promise(function(resolve, reject) {
			arg.callback = function(dbRes, err) {
				if (err = dbUtils.fetchErrStrFromRes(dbRes))
					return reject(err);

				resolve(dbRes);
			};

			_this.dbAwwS.getDBData(arg);
		})
	);
};


DBModel.prototype._dbQueryCallback = function(arg) {
	if (!arg.query) {
		return arg.callback({
			"info":{
				"errors": ["!dbquery"],
				"num_rows": 0
			},
			"recs": []
		});
	}

	this.dbAwwS.getDBData(arg);
};


DBModel.prototype.getInstance = function(arg){
	if (typeof arg != "object"){
		return this.instances.length ? this.instances[0] : new DBModel(void 0);
	}
	for(var c=0; c<this.instances.length; c++){
		if (
			typeof arg.dburl == "string"
			&& this.instances[c].dburl != arg.dburl
		){
			continue;
		}
		if (
			typeof arg.dbname == "string"
			&& this.instances[c].dbname != arg.dbname
		){
			continue;
		}
		if (
			typeof arg.dbsrc == "string"
			&& this.instances[c].dbsrc != arg.dbsrc
		){
			continue;
		}
		return this.instances[c];
	}
	return new DBModel(arg);
};


module.exports = DBModel;