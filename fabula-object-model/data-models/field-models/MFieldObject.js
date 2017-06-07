"use strict";

var utils = require("./../../utils/utils.js"),
	MField = require("./MField.js");

function MFieldObject() {
	MField.apply(this, arguments);
}

MFieldObject.prototype = utils.createProtoChain(MField.prototype, {

	"isEq": function(val) {
		return JSON.stringify(this._val) == JSON.stringify(val);
	},


	"isValid": function(val) {
		return utils.getType(val) == "object";
	}

});

module.exports = MFieldObject;