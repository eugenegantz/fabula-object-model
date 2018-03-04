"use strict";

module.exports = {

	/**
	 * Пустое значение?
	 *
	 * @param {Array | String | null | undefined} val
	 *
	 * @return {Boolean}
	 * */
	"isEmpty": function(val) {
		return ![].concat(val).join("");
	},


	/**
	 * Привести к Boolean
	 * */
	"toBool": function(val) {
		var s = (val + "").toLowerCase(),
			n = +val;

		if (s === "да")
			return true;

		if (s === "нет")
			return false;

		return Boolean(n);
	}

};