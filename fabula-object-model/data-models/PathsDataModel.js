"use strict";

var stdUtils = require("./../utils.js");

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

		var callback = typeof arg.callback == "function" ? arg.callback : new Function(),
			db = getContextDB.call(this),
			self = this;

		if (db) {
			db.dbquery({
				"query": "SELECT Value, Property FROM Property WHERE ExtClass = 'path' ",
				"callback": function(res) {
					self.data = res.recs;
					self.state = 1;
					callback(self.data);
				}
			});
		}
	},


	"get": function() {
		return this.data;
	},


	"toShort": function(path) {
		var v,
			tmp,
			pathCache = this.data;

		for (v = 0; v < pathCache.length; v++) {
			if (!pathCache[v].value.trim()) continue;

			tmp = pathCache[v].value.split(/[;,]/ig);

			if (!tmp.length) continue;

			path = path.replace(new RegExp("^" + pathCache[v].property), "");
			path = modPath.join(
				stdUtils.trim(tmp[0], ["\\", "/"]),
				stdUtils.trim(path, ["\\", "/"])
			).replace(/[\\]/g, "/");
		}

		return path;
	},


	/**
	 * Приветсти путь к длинному виду
	 * @param {String} path - путь
	 * @return {String}
	 * */
	"toLong": function(path) {
		if (typeof path != "string") return "";

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

			if (!path.match(pattern)) continue;

			path = paths[c].value.split(/[;,]/ig)[0].trim();

			path = path.replace(pattern, "");
			path = modPath.join(
				stdUtils.rtrim(path, ["\\", "/"]),
				stdUtils.trim(path, ["\\", "/"])
			).replace(/[\\]/g, "/");
		}

		return path;
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