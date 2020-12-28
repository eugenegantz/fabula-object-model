"use strict";

var stdUtils = require("./../utils/utils.js");

// Для совместимости
var getContextDB = function() {
	var FabulaObjectModel = require("./../_FabulaObjectModel.js"),
		DBModel = FabulaObjectModel.prototype._getModule("DBModel");

	if (this._fabulaInstance)
		return this._fabulaInstance.getDBInstance();

	return DBModel.prototype.getInstance();
};

var PathsDataModel = function() {
	this.init();
};

PathsDataModel.prototype = {
	"init": function() {
		this.dbModel = null;

		this.data = [];

		this.instances.push(this);

		this.state = 0;
	},


	"instances": [],


	"getInstance": function() {
		return this.instances[0] || new PathsDataModel();
	},


	"load": function(arg) {
		if (typeof arg == "undefined") arg = Object.create(null);

		var callback    = typeof arg.callback == "function" ? arg.callback : new Function();
		var db          = getContextDB.call(this);
		var self        = this;

		var query = ""
			+ " SELECT"
			+   "  gsExName AS [property]"
			+   ", gsExAttr1 AS [value]"
			+ " FROM GandsExt"
			+ " WHERE"
			+   "     gsexid = 'SYСПКТМП'"
			+   " AND gsExType = 'path'";

		if (db) {
			db.dbquery({
				"query": query,
				"callback": function(res) {
					self.data = res.recs;
					self.state = 1;
					callback(([res.info.errors] + '') || null, self.data);
				}
			});
		}
	},


	"get": function() {
		return this.data;
	},


	"toShort": function(argPath) {
		var c,
			longSubStr,
			longSubStrRegEx,
			paths = this.data;

		argPath = argPath.replace(/[\\]/ig, "/");

		for (c = 0; c < paths.length; c++) {
			if (!(longSubStr = (paths[c].value || "").trim().split(/[;,]/ig)[0]))
				continue;

			longSubStrRegEx = new RegExp("^" + longSubStr.replace(/[\\]/ig, "/"), "g");

			if (!argPath.match(longSubStrRegEx))
				continue;

			return argPath.replace(longSubStrRegEx, paths[c].property);
		}

		return argPath;
	},


	/**
	 * Приветсти путь к длинному виду
	 * @param {String} argPath - путь
	 * @return {String}
	 * */
	"toLong": function(argPath) {
		if (typeof argPath != "string") return "";

		var c, path,
			pattern,
			paths = this.data;

		for (c = 0; c < paths.length; c++) {
			pattern = new RegExp(
				"^" + paths[c]
					.property
					.replace("[", "\\[")
					.replace("]", "\\]"),
				"g"
			);

			if (!argPath.match(pattern)) continue;

			path = paths[c].value.split(/[;,]/ig)[0].trim();

			argPath = argPath.replace(pattern, "");
			argPath = (
				stdUtils.rtrim(path, ["\\", "/"])
				+ '/'
				+ stdUtils.trim(argPath, ["\\", "/"])
			).replace(/[\\]/g, "/");
		}

		return argPath;
	},


	/**
	 * Является ли путь коротким
	 * @param {String} path - путь
	 * @return {Boolean}
	 * */
	"isShort": function(path) {
		if (typeof path != "string")
			return false;

		var c,
			pattern,
			paths = this.data;

		for (c = 0; c < paths.length; c++) {
			pattern = new RegExp(
				"^" + paths[c]
					.property
					.replace("[", "\\[")
					.replace("]", "\\]"),
				"g"
			);

			if (path.match(pattern)) return true;
		}

		return false;
	}
};

module.exports = PathsDataModel;