// --------------------------------------------------------------------------------
// Полфил CustomEvents для IE9+
// https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent
(function () {
	if ( typeof window.CustomEvent === "function" ) return false;

	function CustomEvent ( event, params ) {
		params = params || { bubbles: false, cancelable: false, detail: undefined };
		var evt = document.createEvent( 'CustomEvent' );
		evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
		return evt;
	}

	CustomEvent.prototype = window.Event.prototype;

	window.CustomEvent = CustomEvent;
})();

// --------------------------------------------------------------------------------
// FabulaObjectModel
(function(){
	require("./cascade");
	// var dbModel = require("./DBModel");
	var F = require("./../_FabulaObjectModel");

	// Установка модуля БД для браузера
	// F.prototype._setModule("DBModel", dbModel);

	F.globalize = function(){
		var keys = Object.getOwnPropertyNames(this.prototype);
		for(var c=0; c<keys.length; c++){
			window[keys[c]] = this.prototype[keys[c]];
		}
	};
	window.FabulaObjectModel = F;
})();