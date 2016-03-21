(function(){
	var cascade = require("./cascade");
	var dbModel = require("./DBModel");
	var F = require("./../fabulaObjectModel");
	F.prototype.DBModel = dbModel;
	F.prototype._lowMethods.dbmodel = dbModel;
	F.globalize = function(){
		keys = Object.getOwnPropertyNames(this.prototype);
		for(c=0; c<keys.length; c++){
			window[keys[c]] = this.prototype[keys[c]];
		}
	};
	window.FabulaObjModel = F;
})();