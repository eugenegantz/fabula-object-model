"use strict";

var dpc = require("./DefaultPrintCalc").prototype.getInstance();
var cConst = require("./CalcConsts");
var gm = require("./../GandsDataModel").prototype.getInstance();

var list = {
	">150": {
		"1": "ПЗРАФ2Ф2",
		"2": "ПЗРАФ2Ф6",
		"3": "ПЗРАФ2Ф7",
		"4": "ПЗРАФ2Ф8"
	},
	"<=150": {
		"1": "ПЗРАФаФ1",
		"2": "ПЗРАФаФ3",
		"3": "ПЗРАФаФ4",
		"4": "ПЗРАФаФ5"
	}
};

var fomConfig = gm.get({group:["fom-config"]})[0];
var last, dkey, prop;

if (fomConfig){
	for(var c=0; c<fomConfig.gandsPropertiesRef.length; c++){
		if (  fomConfig.gandsPropertiesRef[c].property.match(/фальцовка/ig)  ){
			prop = fomConfig.gandsPropertiesRef[c].property;
			last = prop[prop.length-1];
			if (  fomConfig.gandsPropertiesRef[c].property.match(/бигование/ig)  ){
				dkey = ">150";
			} else {
				dkey = "<=150";
			}
			list[dkey][prop] = fomConfig.gandsPropertiesRef[c].value;
		}
	}
}

var CPFolding = function(){

};

CPFolding.prototype.calc = function(arg){
	var value, amount, paperDensity, dkey;

	if (typeof arg != "object"){
		throw new Error("!arg");
	}

	if (arg.value){
		value = arg.value;
	}

	if (  !isNaN(arg.amount)  ){
		amount = +arg.amount;
	}

	if (  !isNaN(arg.paperDensity)  ){
		paperDensity = +arg.paperDensity;
	}

	if (!value || !amount || !paperDensity) return 0;

	// TODO брать коды из ссылки

	dkey = paperDensity > 150 ? ">150" : "<=150";

	if (  [1,2,3,4,"1","2","3","4"].indexOf(value) == -1  ){
		return 0;
	}

	var GSID = list[dkey][value];

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

module.exports = CPFolding;