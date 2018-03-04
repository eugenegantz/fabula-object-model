"use strict";

module.exports = {

	/**
	 * @param {String} str
	 *
	 * @return {String}
	 * */
	"rmGsTags": function(str) {
		return str.replace(/\[\/?[a-zA-Zа-яА-Я\s=+\-_!@#$%^&*()|\\/]+]/ig, "");
	}

};