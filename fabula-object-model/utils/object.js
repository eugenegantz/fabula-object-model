"use strict";

module.exports = {

	/**
	 * Проверить наличие собственных свойств у объекта
	 *
	 * @param {Object} obj
	 * @param {String} key
	 *
	 * @return {Boolean}
	 * */
	"hasOwnProperty": function(obj, key) {
		return Object.prototype.hasOwnProperty.call(obj, key);
	},


	/**
	 * Вернуть новый объект с ключами в нижнем регистре
	 *
	 * @param obj
	 *
	 * @return {Object}
	 * */
	"keysToLowerCase": function(obj) {
		if (typeof obj != "object")
			return null;

		var prop,
		    res = {};

		for (prop in obj) {
			if (!Object.prototype.hasOwnProperty.call(obj, prop))
				continue;

			res[prop.toLowerCase()] = obj[prop];
		}

		return res;
	},


	/**
	 * Вернуть новый объект с ключами в верхнем регистре
	 *
	 * @param {Object} obj
	 *
	 * @return {Object}
	 * */
	"keysToUpperCase": function(obj) {
		"use strict";

		if (typeof obj != "object") return null;

		var prop,
		    res = {};

		for (prop in obj) {
			if (!Object.prototype.hasOwnProperty.call(obj, prop))
				continue;

			res[prop.toUpperCase()] = obj[prop];
		}

		return res;
	},


	/**
	 * Создать цепочку прототипов
	 *
	 * @return {Object}
	 * */
	"createPrototype": function() {
		var args = Array.prototype.slice.call(arguments, 0),
			proto,
			base = args.shift();

		if (!args.length)
			return;

		function protoReduce(obj, key) {
			obj[key] = {
				"writable": true,
				"configurable": true,
				"enumerable": true,
				"value": proto[key]
			};

			return obj;
		}

		function argsReduce(base, _proto) {
			proto = _proto;

			if (typeof proto != "object")
				return base;

			return Object.create(
				base,
				Object.keys(proto).reduce(protoReduce, {})
			);
		}

		return args.reduce(argsReduce, base);
	}

};