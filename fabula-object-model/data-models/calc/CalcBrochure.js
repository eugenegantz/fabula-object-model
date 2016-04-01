var cUtils = require("./CalcUtils");
// var pUtils = require("./../PrintUtils");
var cConsts = require("./CalcConsts");
var GandsDataModel = require("./../GandsDataModel");
var Gm = GandsDataModel.prototype.getInstance();

var CalcBr = function(){

};

CalcBr.prototype.calc = function(arg){

	arg = {
		"format": "", // GSID - формат продукции, например, для брошуры это может быть А4
		"amount": 300,
		"collageFormat": null, // opt // GSID - формат запечатного листа, например А1
		"discount": 0,

		"inner": {
			"method": null, // opt
			"amount": 32,
			"colorCode": "4+4",
			"sum": 0 // +
		},

		"cover": {
			"method": null, // opt
			"colorCode": "4+4", // opt
			"amount": 1,
			"sum": 0
		}
	};

	// -------------------------------------------------------------------------------------

	arg.inner.method =
		arg.inner.paperAmount <= cConsts.DIGITAL_PRINT_MAX_AMOUNT
		? cConsts.DIGITAL_PRINT
		: cConsts.OFFSET_PRINT;

	arg.cover.method =
		arg.cover.colorCode == "1+1" || arg.cover.colorCode == "1+0"
		? cConsts.RISOGRAPH_PRINT
		: (
			arg.cover.paperAmount <= cConsts.DIGITAL_PRINT_MAX_AMOUNT
				? cConsts.DIGITAL_PRINT
				: cConsts.OFFSET_PRINT
		);

	// -------------------------------------------------------------------------------------

	var calcs = {
		inner: cUtils.createCalc(arg.inner.method),
		cover: cUtils.createCalc(arg.cover.method)
	};

	var sum = 0;

	for(var prop in calcs){
		if (  !calcs.hasOwnProperty(prop)  ) continue;
		sum += calcs[prop].calc();
	}

};

module.exports = CalcBr;

