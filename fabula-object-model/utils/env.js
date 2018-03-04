module.exports = {

	/**
	 * Определить среду выполнения
	 *
	 * @return {String}
	 * */
	"getExecEnv": function() {
		// Странное поведение в nodejs 8.2.1
		// new Function(...) - возвращает undefined
		var ctx = (new Function("return this;") || function() { return this; })(),
		    globClassName = Object.prototype.toString.call(ctx);

		if (globClassName == "[object Window]")
			return "browser";

		if (globClassName == "[object global]")
			return "node";
	},


	/**
	 * Среда выполнения браузер?
	 *
	 * @return {Boolean}
	 * */
	"isBrowserEnv": function() {
		return this.getExecEnv() == "browser";
	},


	/**
	 * Среда выполнения сервер? (nodejs)
	 *
	 * @return {Boolean}
	 * */
	"isNodeEnv": function() {
		return this.getExecEnv() == "node";
	},


	/**
	 * Определить браузер
	 *
	 * @return {String}
	 * */
	"detectBrowser": function() {
		// Opera 8.0+
		if ((!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(" OPR/") >= 0)
			return "opera";

		// Firefox 1.0+
		if (typeof InstallTrigger !== "undefined")
			return "firefox";

		// Safari 3.0+ "[object HTMLElementConstructor]"
		if (
			/constructor/i.test(window.HTMLElement)
			|| (function(p) {
				return p.toString() === "[object SafariRemoteNotification]";
			})(
				!window["safari"]
				|| (
					typeof safari !== "undefined"
					&& safari.pushNotification
				)
			)
		) {
			return "safari";
		}

		// Internet Explorer 6-11
		if (/*@cc_on!@*/false || !!document.documentMode)
			return "ie";

		// Edge 20+
		if (!!window.StyleMedia)
			return "edge";

		// Chrome 1+
		if (!!window.chrome && !!window.chrome.webstore)
			return "chrome";
	},

};