var cConst = require("./CalcConsts");
var pUtils = require("./../PrintUtils");
var gands = require("./../GandsDataModel").prototype.getInstance();


module.exports = {

	"getCalcModel": function(name){
		switch (name) {
			case cConst.OFFSET_PRINT: return require("./CalcPrintOffset");
			case cConst.CARTON_PRINT: return require("./CalcPrintCarton");
			case cConst.DIGITAL_PRINT: return require("./CalcPrintDigital");
			case cConst.RISOGRAPH_PRINT: return require("./CalcPrintRisograph");
			default: return void 0;
		}
	},


	"createCalc": function(name){
		return new this.getCalcModel(name)();
	},


	"parseAmount": function(value){
		if (  isNaN(value)  ){
			return void 0;
		}
		return Math.abs(+value);
	},


	"parseColorCode": function(value){
		if (typeof value != "string"  ){
			return void 0;
		}

		value = value.trim();

		if (!value){
			return void 0;
		}

		var colorCode = value.split("+");

		if (colorCode.length != 2){
			return void 0;
		}

		colorCode[0] = +colorCode[0];
		colorCode[1] = +colorCode[1];

		if (  isNaN(colorCode[0]) || isNaN(colorCode[1])  ){
			return void 0;
		}

		return colorCode;
	},


	"parseMaterial": function(value){
		if (typeof value != "string"){
			return void 0;
		}

		value = value.trim();

		if (!value){
			return void 0;
		}

		return value;
	},


	"parseFormat": function(value){
		if (typeof value == "string"){
			return pUtils.getFormat(value);

		} else if (typeof value == "object") {
			if (  isNaN(value.height) || isNaN(value.width)  ){
				return void 0;
			}
			value.area = value.width * value.height;
			return value;
		} else {
			return void 0;
		}
	}

};