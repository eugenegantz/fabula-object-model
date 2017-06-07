"use strict";

var utils = require("./../../utils/utils.js"),
	MField = require("./MField.js");

function MFieldArray() {
	MField.apply(this, arguments);
}

MFieldArray.prototype = utils.createProtoChain(MField.prototype, {

	"isEq": function(val) {
		return JSON.stringify(this._val) == JSON.stringify(val);
	},


	"isValid": function(val) {
		return utils.getType(val) == "array";
	}

});

module.exports = MFieldArray;