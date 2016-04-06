var dpc = require("./DefaultPrintCalc").prototype.getInstance();
var cConst = require("./CalcConsts");

var CPFolding = function(){

};

CPFolding.prototype.calc = function(){
	var value, amount;

	if (typeof arg != "object"){
		throw new Error("!arg");
	}

	if (arg.value){
		value = arg.value;
	}

	if (  !isNaN(arg.amount)  ){
		amount = +arg.amount;
	}

	if (!value || !amount) return 0;

	var GSID = value == "H" ? cConst.POSTPROC_FOLDING_H_GSID : cConst.POSTPROC_FOLDING_M_GSID;

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

	return Math.round(sum * 1000) / 1000;
};

module.exports = CPFolding;