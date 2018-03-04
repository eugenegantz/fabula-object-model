"use strict";

var utils = {
	"logic": require("./logic.js")
};

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

		if (utils.logic.isEmpty(val))
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
	}

};