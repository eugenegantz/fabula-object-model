"use strict";

var _use = require("./RequireCustom");
var modAjax = require("./Ajax");
var modDBAwwS = _use("DBAwwS");

/**
 * @constructor
 * @param {Object} arg
 * @param {String} arg.dburl
 * @param {String} arg.dbname
 * @param {String} arg.dbsrc
 * */
var DBModel = function(arg){
	if (typeof arg != "object") {
		throw new Error("1st argument suppose to be Object");
	}

	var tmp = ["dburl", "dbname", "dbname"];

	for(let c=0; c<tmp.length; c++){
		if (!arg[tmp[c]]){
			throw new Error("!arg." + tmp[c]);
		}
	}

	this.dbAwwS					= modDBAwwS.prototype.getInstance(arg);
	this.dbAwwS.dburl			= arg.dburl;
	this.dbAwwS.dbname		= arg.dbname; // well.2015
	this.dbAwwS.dbsrc			= arg.dbsrc; // main, common, stat

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
DBModel.prototype.dbquery = function(arg){
	if (typeof arg != "object") return;

	var dbquery		= typeof arg.query == "string" ? arg.query : null;
	var callback		= typeof arg.callback == "function" ? arg.callback : new Function();

	if (  !dbquery  ){
		callback({
			"info":{
				"errors": ["!dbquery"],
				"num_rows": 0
			},
			"recs": []
		});
		return;
	}

	arg.format = "row[col]";

	this.dbAwwS.getDBData(arg)

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