"use strict";

var utils = require("./utils.js");

module.exports = {

	"mkVal": function(val, type) {
		if (utils.isEmpty(val))
			return "NULL";

		if ("S" === type || "string" === type)
			return "\"" + this.secureStr(val) + "\"";

		if ("D" === type)
			return "CDate(\"" + this.secureDate(val) + "\")";

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
			.replace(new RegExp(/[№]/ig), "N");
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