"use strict";

var gands = require("./../data-models/GandsDataModel").prototype.getInstance();

// ------------------------------------------------------------------------------------------

var PrintUtils = Object.create(null);

/**
 * @ignore
 * */
PrintUtils._cache = {
	"formats": null,
	"_init_timestamp": null
};


/**
 * Кеширование форматов
 * @ignore
 * */
PrintUtils._initFormatCache = function(){
	var gandsFormat = gands.get({"type":["print-formats"]});
	var formats = {}, tmp;

	for(var c=0; c<gandsFormat.length; c++){

		for(var v=0; v<gandsFormat[c].gandsPropertiesRef.length; v++){

			if (  !gandsFormat[c].gandsPropertiesRef[v].property.match(/размер/gi)  ) continue;

			// ха - кириллическая, икс - латинский
			tmp = gandsFormat[c].gandsPropertiesRef[v].value.split(/[xх]/);

			if (tmp.length != 2) continue;

			tmp[0] = tmp[0].trim();
			tmp[1] = tmp[1].trim();

			tmp = formats[gandsFormat[c].GSID.toLowerCase()] = {
				"GSID": gandsFormat[c].GSID,
				"id": gandsFormat[c].GSID,
				"height": +tmp[1],
				"width": +tmp[0],
				"name": gandsFormat[c].GSName
			};

			this._applyShortLongArea(tmp);

		}

	}

	this._cache._init_timestamp = gands._init_timestamp;
	this._cache.formats = formats;

};


/**
 * Возвращает массив с объектами содержащие информацию о форматах
 * @return {Object}
 * */
PrintUtils.getFormats = function(){

	if (
		!this._cache.formats
		|| gands._init_timestamp != this._cache._init_timestamp
	) {
		this._initFormatCache();
	}

	return this._cache.formats;

};


/**
 * Получить объект формата с ключами: ширина, высота, площадь, короткая и длинная стороны
 * @example {"width": Number, "height": Number, "area": Number, "long": Number, "short": Number}
 * @param {Object, String} arg
 * @return {Object}
 * */
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


/**
 * Подсчитывает количество форматов (изделий) умещаемых на других форматах (печатном листе)
 * @param {String} big - формат на который печатают и режут
 * @param {String} small - формат продукции
 * */
PrintUtils.formatFill = function(big, small){
	if (typeof big == "object"){
		this._applyShortLongArea(big);

	} else {
		big = this.getFormat(big);

	}

	if (  typeof small == "object"  ){
		this._applyShortLongArea(small)

	} else {
		small = this.getFormat(small);

	}

	var W = Math.floor(big.long / small.long) * Math.floor(big.short / small.short);
	var L = Math.floor(big.long / small.short) * Math.floor(big.short / small.long);
	return W > L ? W : L;
};


/**
 * Конвертирует величины: mm, cm, m, in
 * @param {String} from
 * @param {String} to,
 * @param {Number} value
 * */
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


PrintUtils._applyShortLongArea = function(a){
	if (a.width || a.height){
		if (!a.area) a.area = a.width * a.height;
		if (!a.long) a.long = a.width > a.height ? a.width : a.height;
		if (!a.short) a.short = a.width < a.height ? a.width : a.height;
	}
	return a;
};


module.exports = PrintUtils;