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


	"_mkValOld": function(val, fldDecl) {
		var type = fldDecl.type,
			len = fldDecl.length;

		// Если поле допускает запись пустых строк
		if ("" === val && fldDecl.emptyString)
			return "\"\"";

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


	"mkVal": function(val, fldDecl, arg) {
		var db = arg.db;
		var knex = db.getKnexInstance();
		var type = fldDecl.type;
		var len = fldDecl.length;

		// Если поле допускает запись пустых строк
		if ("" === val && fldDecl.emptyString)
			return "";

		if (utils.isEmpty(val))
			return null;

		if (this.stringTypes[type])
			return this.secureStr(val).slice(0, len || 255);

		if (this.dateTypes[type]) {
			return knex.functionHelper.cast(knex.functionHelper.stringify(this.secureDate(val)), "datetime");
		}

		if (this.booleanTypes[type])
			return val ? knex.functionHelper.true() : knex.functionHelper.false();

		if (this.numberTypes[type]) {
			val = +val;

			if (isNaN(val))
				return null;

			return val;
		}

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

		tableScheme.getKeys().some(function(key) {
			var fieldDecl = tableScheme.get(key);

			if (!fieldDecl)
				return;

			if (fieldDecl.primary)
				return primaryField = fieldDecl;
		});

		return primaryField;
	},


	/**
	 * @param {Object | Array} arg.fields
	 * @param arg.tableScheme
	 *
	 * @return {String}
	 * */
	"createDeleteQueryString": function(arg) {
		arg = arg || {};

		var query;
		var db              = arg.db;
		var knex            = db.getKnexInstance();
		var _this           = this;
		var fields          = arg.fields;
		var tableScheme     = arg.tableScheme;
		var tableName       = arg.tableName;
		var toDelete        = [];
		var primaryDecl     = _this.getTablePrimaryFieldDecl(tableScheme);

		fields = [].concat(fields || []);

		fields.forEach(function(row) {
			toDelete.push(
				_this.mkVal(
					row[primaryDecl.key],
					primaryDecl
				)
			);
		});

		if (!toDelete.length)
			return "";

		query = knex.queryBuilder();
		query.del();
		query.from(tableName);
		query.where(primaryDecl.key, "in", toDelete);

		return query.toString();

		// return _this.mkFld(primaryDecl.key) + " IN (" + toDelete + ")"
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

		var _update         = {};
		var db              = arg.db;
		var knex            = db.getKnexInstance();
		var tableName       = arg.tableName;
		var tableScheme     = arg.tableScheme;
		var prevFields      = ObjectA.create(arg.prevFields || {});
		var nextFields      = ObjectA.create(arg.nextFields || {});

		var primaryKey      = _this.getTablePrimaryFieldDecl(tableScheme).key;

		nextFields.getKeys().forEach(function(key) {
			var type;
			var fieldDecl = tableScheme.get(key);

			if (!fieldDecl)
				return;

			if (primaryKey == key)
				return;

			if (prevFields.get(key) == nextFields.get(key))
				return;

			if (!_this._isChanged(prevFields.get(key), nextFields.get(key), fieldDecl))
				return;

			_update[key] = _this.mkVal(nextFields.get(key), fieldDecl, { "db": db });
		});

		if (!Object.keys(_update).length)
			return "";

		var query = knex.queryBuilder();

		query.into(tableName);
		query.update(_update);
		query.where(primaryKey, nextFields.get(primaryKey));

		return query.toString();

		// return "UPDATE " + tableName + " SET " + diff.join(", ") + " WHERE [" + primaryKey + "] = " + nextFields.get(primaryKey);
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

		var query;
		var _this       = this;
		var db          = arg.db;
		var knex        = db.getKnexInstance();
		var tableScheme = arg.tableScheme;
		var tableName   = arg.tableName;
		var primaryKey  = this.getTablePrimaryFieldDecl(tableScheme).key;
		var _insert     = {};

		nextFields.getKeys().forEach(function(key) {
			var fieldDecl = tableScheme.get(key);

			if (!fieldDecl)
				return;

			if (primaryKey == key)
				return;

			_insert[key] = _this.mkVal(nextFields.get(key), fieldDecl, { "db": db });
		});

		if (!Object.keys(_insert).length)
			return "";

		query = knex.queryBuilder();
		query.insert(_insert);
		query.into(tableName);

		return query.toString();

		// return "INSERT INTO " + tableName + " (" + keys.join(", ") + ") VALUES (" + values.join(", ") + ")";
	},


	"_dateValueToPrimitiveNumber": function(value, decl) {
		if (!value)
			return null;

		if (value instanceof Date)
			return value.getTime();

		if (typeof value == "string")
			return (new Date(value)).getTime();

		return null;
	},


	"_numberValueToPrimitive": function(value, decl) {
		if (typeof value == "number")
			return value;

		if (utils.isEmpty(value))
			return null;

		return +value;
	},


	"_stringValueToPrimitive": function(value, decl) {
		if (decl.emptyString && value === "")
			return value;

		if (utils.isEmpty(value))
			return null;

		return value + "";
	},


	"_booleanValueToPrimitive": function(value, decl) {
		return !!value;
	},


	"_valueToPrimitive": function(value, decl) {
		var type = decl.type;

		if (this.booleanTypes[type])
			return this._booleanValueToPrimitive(value, decl);

		if (this.stringTypes[type])
			return this._stringValueToPrimitive(value, decl);

		if (this.numberTypes[type])
			return this._numberValueToPrimitive(value, decl);

		if (this.dateTypes[type])
			return this._dateValueToPrimitiveNumber(value, decl);

		return value;
	},


	"_isChanged": function(value1, value2, fieldDecl) {
		value1 = this._valueToPrimitive(value1, fieldDecl);
		value2 = this._valueToPrimitive(value2, fieldDecl);

		return value1 != value2;
	}

};