var cConst = require("./CalcConsts");
var pUtils = require("./../../utils/printUtils");
var gands = require("./../GandsDataModel").prototype.getInstance();
var _utils = require("./../../utils/utils");

module.exports = {


	/**
	 * @param {Object} arg
	 * @param {String} arg.GSID - номенклатурный номер
	 * */
	"detectCalcModel": function(arg){
		var c, arr = [
			{"Mod": require("./CalcPrintPostprocLaminating")}
		];

		for(c=0; c<arr.length; c++){
			if (  arr[c].Mod.prototype.getGSID  ){
				arr[c].GSID = arr[c].Mod.prototype.getGSID();
			}
		}

		if (typeof arg.GSID == "string" && arg.GSID){
			for(c=0; c<arr.length; c++){
				if (arr[c].GSID.indexOf(arg.GSID) > -1){
					return arr[c].Mod;
				}
			}
		}

		return void 0;
	},


	"getCalcModel": function(name){
		switch (name) {
			case cConst.OFFSET_PRINT:						return require("./CalcPrintOffset");
			case cConst.CARTON_PRINT:					return require("./CalcPrintCarton");
			case cConst.DIGITAL_PRINT:					return require("./CalcPrintDigital");
			case cConst.RISOGRAPH_PRINT:				return require("./CalcPrintRisograph");
			case cConst.POSTPROC_CREASING:			return require("./CalcPrintPostprocCreasing");
			case cConst.POSTPROC_FOLDING:				return require("./CalcPrintPostprocFolding");
			case cConst.POSTPROC_ROUNDING:			return require("./CalcPrintPostprocRounding");
			default: return void 0;
		}
	},


	"createCalc": function(name){
		if (Array.isArray(name)){
			var ret = [];
			for(var c=0; c<name.length; c++){
				ret.push(this.createCalc(name[c]));
			}
			return ret;
		}
		var tmp = this.getCalcModel(name);
		return new tmp();
	},


	"parseAmount": function(value){
		if (  isNaN(value)  ){
			return void 0;
		}
		return Math.abs(+value);
	},


	"parseColorCode": function(value) {
		if (_utils.getType(value) == "array") {
			if (
				value.length == 2
				&& !isNaN(value[0])
				&& !isNaN(value[1])
			) {
				return value;
			}

		} else if (typeof value == "string") {
			value = value.trim();

			if (!value) {
				return void 0;
			}

			var colorCode = value.split("+");

			if (colorCode.length != 2) {
				return void 0;
			}

			colorCode[0] = +colorCode[0];
			colorCode[1] = +colorCode[1];

			if (isNaN(colorCode[0]) || isNaN(colorCode[1])) {
				return void 0;
			}

			return colorCode;

		}

		return void 0;
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


	"parsePostproc": function(pp){
		var ret = [], c;
		if (typeof pp == "string"){
			ret = [{"m": this.createCalc(pp), "arg": {}}];

		} else if (  _utils.getType(pp) == "array"  ) {
			for(c=0; c<pp.length; c++){
				ret = ret.concat(this.parsePostproc(pp[c]));
			}

		} else if (typeof pp == "object") {
			if (typeof pp.calc == "function"){
				ret = [{"m": pp, "arg": {}}];

			} else if (typeof pp.type == "string") {
				ret = [{"m": this.createCalc(pp.type), "arg": pp}];

			}
		}
		return ret;
	},


	"parseFormat": function(value){
		if (typeof value == "string"){
			return pUtils.getFormat(value);

		} else if (typeof value == "object") {
			if (  isNaN(value.height) || isNaN(value.width)  ){
				return void 0;
			}
			if (!value.area) value.area = value.width * value.height;
			if (!value.long) value.long = value.width > value.height ? value.width : value.height;
			if (!value.short) value.short = value.width < value.height ? value.width : value.height;
			return value;
		} else {
			return void 0;
		}
	}

};