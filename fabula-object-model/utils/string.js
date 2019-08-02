"use strict";

var utils = {
	"math": require("./math.js")
};

var _symbols = "1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM";

module.exports = {

	"random": function(len) {
		len = len || 16;

		var str = "";

		for (var c = 0; c < len; c++)
			str += _symbols[utils.math.getRandomIntInclusive(0, _symbols.length - 1)];

		return str;
	}

};