"use strict";

module.exports = {

	"deprecate": function(fn, warn) {
		var _once = false;

		warn = warn || "";

		if (typeof warn == "object")
			warn = "\"" + (warn.dep || "") + "\" is deprecated. Use \"" + (warn.sub || "") + "\" instead";

		return function() {
			if (!_once) {
				console.warn(warn);

				_once = true;
			}

			return fn.apply(this, arguments);
		}
	}

};