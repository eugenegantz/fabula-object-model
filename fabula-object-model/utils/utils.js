"use strict";

var utils = {
	"common"        : require("./common.js"),
	"db"            : require("./db.js"),
	"b64"           : require("./base64.js"),
	"env"           : require("./env.js"),
	"logic"         : require("./logic.js"),
	"string"        : require("./string.js"),
	"fn"            : require("./fn"),
	"object"        : require("./object.js"),
	"array"         : require("./array.js"),
	"parse"         : require("./parse.js"),
	"fabMarkup"     : require("./fabMarkup.js"),
	"url"           : require("./url.js")
};


module.exports = {

	/**
	 * @deprecated - использовать dbUtils.secureStr
	 * */
	"DBSecureStr": utils.fn.deprecate(utils.db.secureStr.bind(utils.db), {
		"dep": "_utils.DBSecureStr",
		"sub": "utils.db.secureStr"
	}),


	/**
	 * Служебный метод. Используется в процессе записи даты в поля.
	 * Необходим для безопасной записи полей DateTime
	 *
	 * @deprecated
	 *
	 * @param {Date, String} date - дата для записи
	 * @param {*=false} strict - Выбрасывать ошибки?
	 * @return String В формате YYYY.MM.DD HH:mm:ss
	 * */
	"DBSecureDate": utils.fn.deprecate(utils.db.secureDate.bind(utils.db), {
		"dep": "_utils.DBSecureDate",
		"sub": "utils.db.secureDate"
	}),


	/**
	 * @deprecated
	 *
	 * @param {Array} d Delimiters"
	 * @param {String} s - String
	 *
	 * @return Array
	 * */
	"msplit": utils.fn.deprecate(utils.string.msplit.bind(utils.string), {
		"dep": "_utils.msplit",
		"sub": "utils.string.msplit"
	}),


	/**
	 * @deprecated
	 *
	 * @param {Array} d Delimiters
	 * @param {String} s - String
	 *
	 * @return Array
	 * */
	"split": utils.fn.deprecate(utils.string.split.bind(utils.string), {
		"dep": "_utils.split",
		"sub": "utils.string.split"
	}),


	/**
	 * @deprecated
	 *
	 * @param {String} str - String
	 * @param {String, Array} ch - Characters
	 * @param {Number} di - 0 - left, 1 = right, -1 = both
	 * */
	"trim": utils.fn.deprecate(utils.string.trim.bind(utils.string), {
		"dep": "_utils.trim",
		"sub": "utils.string.trim"
	}),


	/**
	 * @deprecated
	 *
	 * @param {String} str - String
	 * @param {String, Array} _chars - Characters
	 * */
	"ltrim": utils.fn.deprecate(utils.string.ltrim.bind(utils.string), {
		"dep": "_utils.ltrim",
		"sub": "utils.string.ltrim"
	}),


	/**
	 * @deprecated
	 * @param {String} str - String
	 * @param {String, Array} _chars - Characters
	 * */
	"rtrim": utils.fn.deprecate(utils.string.rtrim.bind(utils.string), {
		"dep": "_utils.rtrim",
		"sub": "utils.string.rtrim"
	}),


	/**
	 * @deprecated
	 * */
	"arrayRemove": utils.fn.deprecate(utils.array.remove.bind(utils.array), {
		"dep": "_utils.arrayRemove",
		"sub": "utils.array.remove"
	}),


	/**
	 * @deprecated
	 *
	 * @param {Array} arr - Массив
	 * @param {Number} n
	 *
	 * @return {Array}
	 * */
	"arrayRest": utils.fn.deprecate(utils.array.rest.bind(utils.array), {
		"dep": "_utils.arrayRest",
		"sub": "utils.array.rest"
	}),


	/**
	 * @deprecated
	 * */
	"objectHasOwnProperty": utils.fn.deprecate(utils.object.hasOwnProperty.bind(utils.object), {
		"dep": "_utils.objectHasOwnProperty",
		"sub": "utils.object.hasOwnProperty"
	}),


	/**
	 * @deprecated
	 * */
	"objectKeysToLowerCase": utils.fn.deprecate(utils.object.keysToLowerCase.bind(utils.object), {
		"dep": "_utils.objectKeysToLowerCase",
		"sub": "utils.object.keysToLowerCase"
	}),


	/**
	 * @deprecated
	 * */
	"objectKeysToUpperCase": utils.fn.deprecate(utils.object.keysToUpperCase.bind(utils.object), {
		"dep": "_utils.objectKeysToUpperCase",
		"sub": "utils.object.keysToUpperCase"
	}),


	/**
	 * @deprecated
	 * */
	"URLHashParse": utils.fn.deprecate(utils.url.getHashParams.bind(utils.url), {
		"dep": "_utils.URLHashParse",
		"sub": "utils.url.getHashParams"
	}),


	/**
	 * @deprecated
	 * */
	"URLHashSet": utils.fn.deprecate(utils.url.setHashParams.bind(utils.url), {
		"dep": "_utils.URLHashSet",
		"sub": "utils.url.setHashParams"
	}),


	/**
	 * @deprecated
	 * */
	"URLQueryParse": utils.fn.deprecate(utils.url.getQueryParams.bind(utils.url), {
		"dep": "_utils.URLQueryParse",
		"sub": "utils.url.getQueryParams"
	}),


	/**
	 * @deprecated
	 * */
	"URLQuerySet": utils.fn.deprecate(utils.url.setQueryParams.bind(utils.url), {
		"dep": "_utils.URLQuerySet",
		"sub": "utils.url.setQueryParams"
	}),


	/**
	 * @deprecated
	 * */
	"awwsBase64": utils.b64,


	/**
	 * @deprecated
	 * */
	"detectEnvironment": utils.fn.deprecate(utils.env.getExecEnv.bind(utils.env), {
		"dep": "_utils.detectEnvironment",
		"sub": "utils.env.getExecEnv"
	}),


	/**
	 * @deprecated
	 * */
	"isBrowser": utils.fn.deprecate(utils.env.isBrowserEnv.bind(utils.env), {
		"dep": "_utils.isBrowser",
		"sub": "utils.env.isBrowserEnv"
	}),


	/**
	 * @deprecated
	 * */
	"parseArg": utils.fn.deprecate(utils.parse.parseArg.bind(utils.parse), {
		"dep": "_utils.parseArg",
		"sub": "parseUtils.parseArg"
	}),


	/**
	 * @deprecated
	 * */
	"rmGsTags": utils.fn.deprecate(utils.fabMarkup.rmGsTags.bind(utils.fabMarkup), {
		"dep": "_utils.rmGsTags",
		"sub": "utils.fabMarkup.rmGsTags"
	}),


	/**
	 * @deprecated
	 * */
	"isEmpty": utils.fn.deprecate(utils.logic.isEmpty.bind(utils.logic), {
		"dep": "_utils.isEmpty",
		"sub": "utils.logic.isEmpty"
	}),


	/**
	 * @deprecated
	 * */
	"toBool": utils.fn.deprecate(utils.logic.toBool.bind(utils.logic), {
		"dep": "_utils.toBool",
		"sub": "utils.logic.toBool"
	}),


	/**
	 * @deprecated
	 * */
	"createProtoChain": utils.fn.deprecate(utils.object.createPrototype.bind(utils.object), {
		"dep": "_utils.createProtoChain",
		"sub": "utils.object.createPrototype"
	}),


	/**
	 * @deprecated
	 * */
	"getType": utils.fn.deprecate(utils.common.getType.bind(utils.common), {
		"dep": "_utils.getType",
		"sub": "utils.common.getType"
	})

};