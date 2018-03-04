"use strict";

var utils = {
	"string": require("./string.js")
};


module.exports = {

	/**
	 * Парсинг строчных аргументов, в массив
	 * Проверка типа, преобразование типов
	 * Например: "100,200;;300;400,abc" => ['100','200','300','400'];
	 *
	 * @param {Object} arg
	 * @param {*} arg.value - входящие данные
	 * @param {String} arg.into - тип преобразования
	 * @param {Boolean} arg.kickEmpty - отбросить пустые значения
	 * @param {Boolean} arg.toLowerCase - понизить регистр
	 * @param {Boolean} arg.toUpperCase - повысить регистр
	 * @param {Boolean} arg.toInt - привести к целым числам
	 * @param {Boolean} arg.toFloat - привести с числамс плавающей точкой
	 * @param {Array} arg.delimiters - массив разделителей для входящей строки
	 * @param {Array, String} arg.trim - срезать символы в уже разделенной строке
	 *
	 * @return {*}
	 * */
	"parseArg": function(arg) {
		"use strict";

		var into = ( typeof arg.into == "string" ? arg.into.toLowerCase() : "array" ),
		    value = ( typeof arg.value != "undefined" ? arg.value : null ),
		    kickEmpty = ( typeof arg.kickEmpty == "boolean" ? arg.kickEmpty : true ),
		    toLowerCase = ( typeof arg.toLowerCase == "boolean" ? arg.toLowerCase : false ),
		    toUpperCase = ( typeof arg.toUpperCase == "boolean" ? arg.toUpperCase : false ),
		    toInt = ( typeof arg.toInt == "boolean" ? arg.toInt : false ),
		    toFloat = ( typeof arg.toFloat == "boolean" ? arg.toFloat : false ),
		    isInt = ( typeof arg.isInt == "boolean" ? arg.isInt : false ),
		    isFloat = ( typeof arg.isFloat == "boolean" ? arg.isFloat : false ),
		    delimiters = ( Array.isArray(arg.delimiters) && arg.delimiters.length ? arg.delimiters : [";", ","] );

		var trim = typeof arg.trim == "undefined"
			? [" "]
			: (
				Array.isArray(arg.trim)
					? arg.trim
					: (
						typeof arg.trim == "string"
							? arg.trim.split("")
							: null
					)
			);

		// --------------------------------------------------------------------------------

		if (value === null) {
			return null;
		}

		if (into == "array") {

			if (Array.isArray(value)) {

			} else if (typeof value == "string") {

				value = utils.string.msplit(delimiters, value);

			} else if (!isNaN(value)) {

				value = [value];

			} else {
				return null;
			}

			var tmp = [];

			for (var c = 0; c < value.length; c++) {
				var val = value[c];

				// trim
				if (
					trim !== null
					&& typeof val == "string"
				) {
					val = utils.string.trim(val, trim);
				}

				// Если пустая ячейка
				if (
					kickEmpty
					&& (
						val === ""
						|| val === null
					)
				) {
					continue;
				}

				// Привести в нижний регистр
				if (toLowerCase && typeof val == "string") val = val.toLowerCase();

				// Перевести в верхний регистр
				if (toUpperCase && typeof val == "string") val = val.toUpperCase();

				// Откинуть все НЕ цифры
				if (isInt || isFloat) {
					if (typeof val == "string" && !isNaN(val)) {
						val = val.trim();
						if (isFloat) {
							val = val.replace(",", ".");
							if (!val.match('/[.]/')) continue;
						} else if (isInt) {
							val = val.replace(",", ".");
							if (val.match('/[.]/')) continue;
						}
					} else if (isInt && (val - Math.floor(val)) > 0) {
						continue;
					} else if (isFloat && (val - Math.floor(val)) == 0) {
						continue;
					}
				}

				// Привести к целому
				if (toInt) {
					val = parseInt(val);
				}

				// Привести к десятичной
				if (toFloat) {
					val = parseFloat(val);
				}

				tmp.push(val);

			}

			return tmp;

		}

	}

};