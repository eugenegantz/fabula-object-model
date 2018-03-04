"use strict";

var qs = require("query-string");


module.exports = {

	/**
	 * Вернуть hash-параметры из адресной строки
	 *
	 * @return {Object}
	 * */
	"getHashParams": function() {
		if (!location.hash)
			return {};

		return qs.parse(location.hash.replace(/^#/, ""));
	},


	/**
	 * Записать hash-параметры в адресную строку
	 *
	 * @param {Object} params
	 * */
	"setHashParams": function(params) {
		location.hash = "#" + qs.stringify(params);
	},


	/**
	 * Вернуть query-параметры из адресной строки
	 *
	 * @return {Object}
	 * */
	"getQueryParams": function() {
		if (!location.search)
			return {};

		return qs.parse(location.search.replace(/^\?/, ""));
	},


	/**
	 * Записать query-параметры в адресную строку
	 *
	 * @param {Object} params
	 * */
	"setQueryParams": function(params) {
		location.search = "?" + qs.stringify(params);
	}

};