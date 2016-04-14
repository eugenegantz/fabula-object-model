var printUtils = require("./../PrintUtils");

var cLam = function(){};

cLam.prototype.calc = function(arg){
	if (typeof arg != "object") throw new Error("!arg");
	if (!arg.amount) throw new Error("!arg.amount");
	var amount = +arg.amount;
};

module.exports = cLam;