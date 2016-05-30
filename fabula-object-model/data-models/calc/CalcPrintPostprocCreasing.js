var dpc = require("./DefaultPrintCalc").prototype.getInstance();
var cConst = require("./CalcConsts");

var CPCreasing = function(){};

CPCreasing.prototype = {};

/**
 * @param {Object} arg
 * @param {Number} arg.value
 * */
CPCreasing.prototype.calc = function(arg){
	var value, amount;

	if (typeof arg != "object"){
		throw new Error("!arg");
	}

	if (arg.value && !isNaN(arg.value)){
		value = arg.value;
	}

	if (  !isNaN(arg.amount)  ){
		amount = +arg.amount;
	}

	if (!value || !amount) return 0;

	var GSID = value == 1 ? cConst.POSTPROC_CREASING_V1_GSID : cConst.POSTPROC_CREASING_V2_GSID;

	var discount = 0;

	if (  !isNaN(arg.discount)  ){
		discount = +arg.discount;
	}

	var salePrice = Boolean(arg.salePrice);

	var sum = dpc.calc({
		"amount": amount,
		"GSID": GSID,
		"salePrice": salePrice
	});

	sum = sum.sum - (sum.sum * discount / 100);

	return Math.round(sum * 100) / 100;
};

module.exports = CPCreasing;