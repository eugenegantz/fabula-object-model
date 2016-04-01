
var gands = require("./GandsDataModel").prototype.getInstance();

// ------------------------------------------------------------------------------------------

var PrintUtils = Object.create(null);


PrintUtils._cache = {
	"formats": null
};


PrintUtils._initFormatCache = function(){
	var gandsFormat = gands.get({"type":["print-formats"]});
	var formats = {}, tmp;

	for(var c=0; c<gandsFormat.length; c++){

		for(var v=0; v<gandsFormat[c].gandsPropertiesRef.length; v++){

			if (  !gandsFormat[c].gandsPropertiesRef[v].property.match(/размер/gi)  ) continue;

			tmp = gandsFormat[c].gandsPropertiesRef[v].value.split("x");

			if (tmp.length != 2) continue;

			tmp[0] = tmp[0].trim();
			tmp[1] = tmp[1].trim();

			tmp = formats[gandsFormat[c].GSID.toLowerCase()] = {
				"height": +tmp[1],
				"width": +tmp[0],
				"name": gandsFormat[c].GSName
			};

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

};


PrintUtils.getFormats = function(){

	if (  !this._cache.formats  ) {
		this._initFormatCache();
	}

	return this._cache.formats;

};


PrintUtils.getFormat = function(arg){

	var formats = this.getFormats();

	if (  typeof arg == "object"  ){
		return void 0;

	} else if (  typeof arg == "string"  ) {
		arg = arg.toLowerCase();
		if (  typeof formats[arg] == "object"  ){
			return formats[arg];
		}

	}

	return void 0;

};


PrintUtils.convertLength = function(from, to, value){
	var scale = {
		"mm"	:1, // миллиметры - базовая величина
		"cm"	:10,
		"m"	:1000,
		"in"	:25.4
	};

	if (
		typeof from != "string"
		|| typeof to != "string"
		|| typeof value == "undefined"
	){
		return null;
	}

	from = from.toLowerCase();
	to = to.toLowerCase();

	if (
		typeof scale[from] == "undefined"
		|| typeof scale[to] == "undefiend"
	){
		return null;
	}

	return (parseFloat(value) * scale[from]) / scale[to];
};

module.exports = PrintUtils;