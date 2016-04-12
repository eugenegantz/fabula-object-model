// --------------------------------------------------------------------------------
// FabulaObjectModel
(function(){
	require("./polyfills");
	require("eg-promise-cascade");
	var F = require("./../_FabulaObjectModel");

	// Установка модуля БД для браузера
	/*  #if browser,node */
	var dbModel = require("./DBModel");
	F.prototype._setModule("DBModel", dbModel);
	/*  #end */
	F.prototype._setModule("Ajax", require("./Ajax"));

	F.globalize = function(){
		var keys = Object.getOwnPropertyNames(this.prototype);
		for(var c=0; c<keys.length; c++){
			window[keys[c]] = this.prototype[keys[c]];
		}
	};
	window.FabulaObjectModel = F;
})();