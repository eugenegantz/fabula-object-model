"use strict";

// --------------------------------------------------------------------------------
// Полфил CustomEvents для IE9+
// https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent
// --------------------------------------------------------------------------------
(function() {
	if (typeof window.CustomEvent === "function") return false;

	function CustomEvent(event, params) {
		params = params || { bubbles: false, cancelable: false, detail: undefined };
		var evt = document.createEvent('CustomEvent');
		evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
		return evt;
	}

	CustomEvent.prototype = window.Event.prototype;

	window.CustomEvent = CustomEvent;
})();

// --------------------------------------------------------------------------------
// Полифил Promise
// https://github.com/stefanpenner/es6-promise
// --------------------------------------------------------------------------------
if (typeof window.Promise != "function")
	window.Promise = require("./es6-promise.min.js").Promise;

// --------------------------------------------------------------------------------
// Полифил Object.assign()
// https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
// --------------------------------------------------------------------------------
require('./object-assign.js');