"use strict";

var ObjectA = require("./../data-models/ObjectA");
var utils = require("./utils.js");

module.exports = {

	"stringTypes": {
		"S": 1,
		"string": 1
	},


	"dateTypes": {
		"D": 1,
		"DT": 1,
		"date": 1
	},


	"numberTypes": {
		"float": 1,
		"double": 1,
		"integer": 1,
		"number": 1
	},


	"booleanTypes": {
		"boolean": 1,
		"B": 1
	},


	"mkVal": function(val, fldDecl) {
		var type = fldDecl.type,
			len = fldDecl.length;

		if (utils.isEmpty(val))
			return "NULL";

		if (this.stringTypes[type])
			return "\"" + this.secureStr(val).slice(0, len || 255) + "\"";

		if (this.dateTypes[type])
			return "CDate(\"" + this.secureDate(val) + "\")";

		if (this.booleanTypes[type])
			return val ? "-1" : "0";

		return val + "";
	},


	"mkFld": function(key) {
		return "[" + key + "]";
	},


	"secureStr": function(str) {
		if (!str || !(str += ""))
			return str || "";

		return str
			.replace(new RegExp(/["']/ig), "")
			// .replace(new RegExp(/[№]/ig), "N");
	},


	"secureDate": function(date, strict) {
		strict = !!strict;

		if (typeof date == "string")
			date = new Date(date.replace(/[-.]/gi, "/"));

		if (isNaN(date.getTime())) {
			if (strict)
				throw new Error("Wrong date format");

			date = new Date();
		}

		if (date instanceof Date == false) {
			if (strict)
				throw new Error("Only \"Date\" and \"String\" types");

			date = new Date();
		}

		return ""
			+ date.getFullYear()
			+ "." + (date.getMonth() + 1)
			+ "." + date.getDate()
			+ " " + date.getHours()
			+ ":" + date.getMinutes()
			+ ":" + date.getSeconds();
	},


	/**
	 * @param {Object} dbres
	 * @return {Array | null}
	 * */
	"fetchErrArrFromRes": function(dbres) {
		var a,
			err = [];

		if (Array.isArray(dbres)) {
			Object.keys(dbres).forEach(function(c) {
				(a = dbres[c].info.errors + "") && err.push(a);
			});

		} else {
			(a = dbres.info.errors + "") && err.push(a);
		}

		if (err.length)
			return err;

		return null;
	},


	"fetchErrStrFromRes": function(dbres) {
		return (this.fetchErrArrFromRes(dbres) || []).join("; ");
	},


	/**
	 * Вернуть уникальное PRIMARY поле из схемы БД
	 *
	 * @param {ObjectA} tableScheme
	 * */
	"getTablePrimaryFieldDecl": function(tableScheme) {
		var primaryField = null;

		Object.keys(tableScheme).some(function(key) {
			var fieldDecl = tableScheme.get(key);

			if (!fieldDecl)
				return;

			if (fieldDecl.primary)
				return primaryField = fieldDecl;
		});

		return primaryField;
	},


	/**
	 * Создать запрос на обновление строки в БД
	 *
	 * @param {Object} arg.prevFields
	 * @param {Object} arg.nextFields
	 * @param {ObjectA} arg.tableScheme
	 * @param {String} arg.tableName
	 *
	 * @return {String}
	 * */
	"createUpdateFieldsQueryString" : function(arg) {
		var _this           = this;

		var tableName       = arg.tableName;
		var tableScheme     = arg.tableScheme;
		var prevFields      = ObjectA.create(arg.prevFields || {});
		var nextFields      = ObjectA.create(arg.nextFields || {});

		var primaryKey      = _this.getTablePrimaryFieldDecl(tableScheme).key;
		var diff            = [];

		nextFields.getKeys().forEach(function(key) {
			var fieldDecl = tableScheme.get(key);

			if (!fieldDecl)
				return;

			if (primaryKey == key)
				return;

			if (prevFields.get(key) == nextFields.get(key))
				return;

			diff.push(
				_this.mkFld(key) + " = " +
				_this.mkVal(nextFields.get(key), fieldDecl)
			);
		});

		if (!diff.length)
			return "";

		return "UPDATE " + tableName + " SET " + diff.join(", ") + " WHERE [" + primaryKey + "] = " + nextFields[primaryKey];
	},


	/**
	 * Создать запрос на запись строки в БД
	 *
	 * @param {Object} arg.nextFields
	 * @param {ObjectA} arg.tableScheme
	 * @param {String} arg.tableName
	 *
	 * @return {String}
	 * */
	"createInsertFieldsQueryString": function(arg) {
		var nextFields  = ObjectA.create(arg.nextFields || {});

		var _this       = this;
		var tableScheme = arg.tableScheme;
		var tableName   = arg.tableName;
		var primaryKey  = this.getTablePrimaryFieldDecl(tableScheme).key;
		var keys        = [];
		var values      = [];

		nextFields.getKeys().forEach(function(key) {
			var fieldDecl = tableScheme.get(key);

			if (!fieldDecl)
				return;

			if (primaryKey == key)
				return;

			keys.push(_this.mkFld(key));
			values.push(_this.mkVal(nextFields.get(key), fieldDecl));
		});

		if (!values.length)
			return "";

		return "INSERT INTO " + tableName + " (" + keys.join(", ") + ") VALUES (" + values.join(", ") + ")";
	}

};