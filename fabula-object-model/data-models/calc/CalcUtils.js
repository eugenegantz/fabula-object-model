var cConst = require("./CalcConsts");
var gands = require("./../GandsDataModel").prototype.getInstance();

module.exports = {

	"_initCache": function(){
		var gandsFormat = gands.get({"type":["print-formats"]});
		var formats = {}, tmp;

		for(var c=0; c<gandsFormat.length; c++){

			for(var v=0; v<gandsFormat[c].gandsPropertiesRef.length; v++){

				if (  !gandsFormat[c].gandsPropertiesRef[v].property.match(/размер/gi)  ) continue;

				tmp = gandsFormat[c].gandsPropertiesRef[v].value.split("x");

				if (tmp.length != 2) continue;

				tmp[0] = tmp[0].trim();
				tmp[1] = tmp[1].trim();

				formats[gandsFormat[c].GSID] = {
					"height": +tmp[1],
					"width": +tmp[0],
					"name": gandsFormat[c].GSName
				};

				tmp = formats[gandsFormat[c].GSID];
				
				tmp.area = tmp.height * tmp.width;

				tmp.long =
					tmp.width > tmp.height
					? tmp.width
					: tmp.height;
				
				tmp.short = 
					tmp.width < tmp.height
					? tmp.width 
					: tmp.height;
				
			}

		}

		this._cache.formats = formats;

	},


	"_cache": {
		"formats": null
	},


	"getFormats": function(){

		if (  !this._cache.formats  ) {
			this._initCache();
		}

		return this._cache.formats;

	},


	"getFormat": function(){
		// TODO
	},

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

	}


};