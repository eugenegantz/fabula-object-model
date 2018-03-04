"use strict";

module.exports = {

	/**
	 * @deprecated
	 *
	 * @param {Array} d Delimiters"
	 * @param {String} s - String
	 *
	 * @return Array
	 * */
	"msplit": function(d, s) {
		"use strict";

		if (typeof d == "string") {
			d = [d];

		} else if (Array.isArray(d)) {

		} else {
			throw new Error("First argument suppose to be \"Array\" or \"String\"");
		}

		if (typeof s != "string")
			throw new Error("Second argument suppose to be \"String\"");

		var regx = new RegExp('[' + d.join('') + ']', 'g');

		s = s.replace(regx, d[0]);

		return s.split(d[0]);
	},


	/**
	 * @deprecated
	 *
	 * @param {Array} d Delimiters
	 * @param {String} s - String
	 *
	 * @return Array
	 * */
	"split": function(d, s) {
		return this.msplit.apply(this, arguments);
	},


	/**
	 * @deprecated
	 *
	 * @param {String} str - String
	 * @param {String, Array} ch - Characters
	 * @param {Number} di - 0 - left, 1 = right, -1 = both
	 *
	 * @return {String}
	 * */
	"trim": function(str, ch, di) {
		"use strict";

		var regEx = [];

		if (!di || di == -1)
			regEx.push("^[" + ch + "]+");

		if (di == 1 || di == -1)
			regEx.push("[" + ch + "]+$");

		return str.replace(new RegExp(regEx.join("|"), "g"), '');
	},


	/**
	 * @deprecated
	 *
	 * @param {String} str - String
	 * @param {String, Array} _chars - Characters
	 *
	 * @return {String}
	 * */
	"ltrim": function(str, _chars) {
		"use strict";

		var arg = Array.prototype.slice.call(arguments, 0);

		arg[2] = 0;

		return this.trim.apply(this, arg);
	},


	/**
	 * @deprecated
	 *
	 * @param {String} str - String
	 * @param {String, Array} _chars - Characters
	 *
	 * @return {String}
	 * */
	"rtrim": function(str, _chars) {
		"use strict";

		var arg = Array.prototype.slice.call(arguments, 0);

		arg[2] = 1;

		return this.trim.apply(this, arg);
	}

};