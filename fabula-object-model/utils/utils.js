var _utils          = Object.create(null),
    commonUtils     = require("./common.js"),
    dbUtils         = require("./db.js"),
    b64Utils        = require("./base64.js"),
    envUtils        = require("./env.js"),
    logicUtils      = require("./logic.js"),
    stringUtils     = require("./string.js"),
    fnUtils         = require("./fn"),
    objectUtils     = require("./object.js"),
    arrayUtils      = require("./array.js"),
    parseUtils      = require("./parse.js"),
    fabMarkupUtils  = require("./fabMarkup.js"),
    urlUtils        = require("./url.js");


/**
 * @deprecated - использовать dbUtils.secureStr
 * */
_utils.DBSecureStr = fnUtils.deprecate(dbUtils.secureStr, {
	"dep": "_utils.DBSecureStr",
	"sub": "utils.db.secureStr"
});


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
_utils.DBSecureDate = fnUtils.deprecate(dbUtils.secureDate, {
	"dep": "_utils.DBSecureDate",
	"sub": "utils.db.secureDate"
});


/**
 * @deprecated
 *
 * @param {Array} d Delimiters"
 * @param {String} s - String
 *
 * @return Array
 * */
_utils.msplit = fnUtils.deprecate(stringUtils.msplit, {
	"dep": "_utils.msplit",
	"sub": "utils.string.msplit"
});


/**
 * @deprecated
 *
 * @param {Array} d Delimiters
 * @param {String} s - String
 *
 * @return Array
 * */
_utils.split = fnUtils.deprecate(stringUtils.split, {
	"dep": "_utils.split",
	"sub": "utils.string.split"
});


/**
 * @deprecated
 *
 * @param {String} str - String
 * @param {String, Array} ch - Characters
 * @param {Number} di - 0 - left, 1 = right, -1 = both
 * */
_utils.trim = fnUtils.deprecate(stringUtils.trim, {
	"dep": "_utils.trim",
	"sub": "utils.string.trim"
});


/**
 * @deprecated
 *
 * @param {String} str - String
 * @param {String, Array} _chars - Characters
 * */
_utils.ltrim = fnUtils.deprecate(stringUtils.ltrim, {
	"dep": "_utils.ltrim",
	"sub": "utils.string.ltrim"
});


/**
 * @deprecated
 * @param {String} str - String
 * @param {String, Array} _chars - Characters
 * */
_utils.rtrim = fnUtils.deprecate(stringUtils.rtrim, {
	"dep": "_utils.rtrim",
	"sub": "utils.string.rtrim"
});


/**
 * @deprecated
 * */
_utils.arrayRemove = fnUtils.deprecate(arrayUtils.remove, {
	"dep": "_utils.arrayRemove",
	"sub": "utils.array.remove"
});


/**
 * @deprecated
 *
 * @param {Array} arr - Массив
 * @param {Number} n
 *
 * @return {Array}
 * */
_utils.arrayRest = fnUtils.deprecate(arrayUtils.rest, {
	"dep": "_utils.arrayRest",
	"sub": "utils.array.rest"
});


/**
 * @deprecated
 * */
_utils.objectHasOwnProperty = fnUtils.deprecate(objectUtils.hasOwnProperty, {
	"dep": "_utils.objectHasOwnProperty",
	"sub": "utils.object.hasOwnProperty"
});


/**
 * @deprecated
 * */
_utils.objectKeysToLowerCase = fnUtils.deprecate(objectUtils.keysToLowerCase, {
	"dep": "_utils.objectKeysToLowerCase",
	"sub": "utils.object.keysToLowerCase"
});


/**
 * @deprecated
 * */
_utils.objectKeysToUpperCase = fnUtils.deprecate(objectUtils.keysToUpperCase, {
	"dep": "_utils.objectKeysToUpperCase",
	"sub": "utils.object.keysToUpperCase"
});


/**
 * @deprecated
 * */
_utils.URLHashParse = fnUtils.deprecate(urlUtils.getHashParams, {
	"dep": "_utils.URLHashParse",
	"sub": "utils.url.getHashParams"
});


/**
 * @deprecated
 * */
_utils.URLHashSet = fnUtils.deprecate(urlUtils.setHashParams, {
	"dep": "_utils.URLHashSet",
	"sub": "utils.url.setHashParams"
});


/**
 * @deprecated
 * */
_utils.URLQueryParse = fnUtils.deprecate(urlUtils.getQueryParams, {
	"dep": "_utils.URLQueryParse",
	"sub": "utils.url.getQueryParams"
});


/**
 * @deprecated
 * */
_utils.URLQuerySet = fnUtils.deprecate(urlUtils.setQueryParams, {
	"dep": "_utils.URLQuerySet",
	"sub": "utils.url.setQueryParams"
});


/**
 * @deprecated
 * */
_utils.awwsBase64 = b64Utils;


/**
 * @deprecated
 * */
_utils.detectEnvironment = fnUtils.deprecate(envUtils.getExecEnv, {
	"dep": "_utils.detectEnvironment",
	"sub": "utils.env.getExecEnv"
});


/**
 * @deprecated
 * */
_utils.isBrowser = fnUtils.deprecate(envUtils.isBrowserEnv, {
	"dep": "_utils.isBrowser",
	"sub": "utils.env.isBrowserEnv"
});


/**
 * @deprecated
 * */
_utils.parseArg = fnUtils.deprecate(parseUtils.parseArg, {
	"dep": "_utils.parseArg",
	"sub": "parseUtils.parseArg"
});


/**
 * @deprecated
 * */
_utils.rmGsTags = fnUtils.deprecate(fabMarkupUtils.rmGsTags, {
	"dep": "_utils.rmGsTags",
	"sub": "utils.fabMarkup.rmGsTags"
});


/**
 * @deprecated
 * */
_utils.isEmpty = fnUtils.deprecate(logicUtils.isEmpty, {
	"dep": "_utils.isEmpty",
	"sub": "utils.logic.isEmpty"
});


/**
 * @deprecated
 * */
_utils.toBool = fnUtils.deprecate(logicUtils.toBool, {
	"dep": "_utils.toBool",
	"sub": "utils.logic.toBool"
});


/**
 * @deprecated
 * */
_utils.createProtoChain = fnUtils.deprecate(objectUtils.createPrototype, {
	"dep": "_utils.createProtoChain",
	"sub": "utils.object.createPrototype"
});


/**
 * @deprecated
 * */
_utils.getType = fnUtils.deprecate(commonUtils.getType, {
	"dep": "_utils.getType",
	"sub": "utils.common.getType"
});


module.exports = _utils;