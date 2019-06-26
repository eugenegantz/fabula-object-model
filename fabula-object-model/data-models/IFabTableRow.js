"use strict";

var ObjectA = require("./ObjectA"),
	dbUtils = require("./../utils/dbUtils.js");

function IFabTableRow() {}


/**
 * @return {ObjectA}
 * */
IFabTableRow.prototype.getTableScheme = function() {
	throw new Error('method "getTableScheme" is not defined');
};


/**
 * @return {String}
 * */
IFabTableRow.prototype.getTableName = function() {
	throw new Error('method "getTableName" is not defined');
};


module.exports = IFabTableRow;