"use strict";

module.exports = {

	/**
	 * Определить тип данных
	 *
	 * @param {*} value
	 *
	 * @return {String}
	 * */
	"getType": function(value) {
		if (Object.prototype.toString.call(value) == "[object Array]")
			return "array";

		else if (Object.prototype.toString.call(value) == "[object Object]")
			return "object";

		else if (value === null)
			return "null";

		else if (Object.prototype.toString.call(value) == "[object Date]")
			return "date";

		else if (Object.prototype.toString.call(value) == "[object File]")
			return "file";

		else if (Object.prototype.toString.call(value) == "[object FileList]")
			return "filelist";

		else
			return typeof value;
	}

};