"use strict";

module.exports = {

	"remove": function(arr, from, to) {
		var rest = arr.slice((to || from) + 1 || arr.length);

		arr.length = from < 0 ? arr.length + from : from;

		return arr.push.apply(arr, rest);
	},


	"rest": function(arr, n) {
		"use strict";

		if (typeof arr != "object")
			throw new Error("1st argument suppose to be Array");

		if (typeof n != "number")
			throw new Error("2nd argument suppose to be Number");

		return Array.prototype.slice.call(arr, Math.abs(n));
	}

};

module.exports.rm = module.exports.remove;