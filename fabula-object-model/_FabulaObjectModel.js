"use strict";

var FabulaObjModel = function(arg){
	/*#if browser,node*/
	this._dbInstance = this.mod.DBModel.prototype.getInstance(arg);
	/*#end*/

	/*#if browser-s*/
	if (typeof window == "object" && typeof document == "object"){
		if (typeof arg != "object"){
			throw new Error("!arg");
		}

		if (typeof arg.url != "string" || !arg.url){
			throw new Error("!arg.url");
		}

		this.url = arg.url;
	}
	/*#end*/

	this.instances.push(this);
};

// ------------------------------------------------------------------------

FabulaObjModel.prototype = {};

FabulaObjModel.prototype.mod = Object.create(null);

FabulaObjModel.prototype._lowMethods = Object.create(null);

// ------------------------------------------------------------------------

/**
 * @param {String} name
 * @param {Object | Function} _module
 * */
FabulaObjModel.prototype._setModule = function(name, _module){
	if (typeof name != "string"){
		throw new Error("1st argument suppose to be String");
	}
	name = name.trim();
	this.mod[name] = _module;
	this._lowMethods[name.toLowerCase()] = _module;
};

// ------------------------------------------------------------------------

FabulaObjModel.prototype._getModule = function(name){
	if (typeof name != "string"){
		throw new Error("1st argument suppose to be String");
	}
	return this._lowMethods[name.toLowerCase()];
};

// ------------------------------------------------------------------------

FabulaObjModel.prototype._setModule("GandsDataModel", require("./data-models/GandsDataModel"));

FabulaObjModel.prototype._setModule("CalcDefaultPrint",  require("./data-models/calc/DefaultPrintCalc"));

FabulaObjModel.prototype._setModule("CalcPrintDefault",  require("./data-models/calc/DefaultPrintCalc"));

FabulaObjModel.prototype._setModule("CalcPrintBrochure",  require("./data-models/calc/CalcPrintBrochure"));

FabulaObjModel.prototype._setModule("CalcPrintOffset",  require("./data-models/calc/CalcPrintOffset"));

FabulaObjModel.prototype._setModule("CalcPrintCarton",  require("./data-models/calc/CalcPrintCarton"));

FabulaObjModel.prototype._setModule("CalcPrintDigital",  require("./data-models/calc/CalcPrintDigital"));

FabulaObjModel.prototype._setModule("CalcPrintPostprocCreasing",  require("./data-models/calc/CalcPrintPostprocCreasing"));

FabulaObjModel.prototype._setModule("CalcPrintPostprocRounding",  require("./data-models/calc/CalcPrintPostprocRounding"));

FabulaObjModel.prototype._setModule("CalcPrintPostprocFolding",  require("./data-models/calc/CalcPrintPostprocFolding"));

FabulaObjModel.prototype._setModule("CalcPrintPostprocLaminating",  require("./data-models/calc/CalcPrintPostprocLaminating"));

FabulaObjModel.prototype._setModule("CalcUtils",  require("./data-models/calc/CalcUtils"));

FabulaObjModel.prototype._setModule("PrintUtils",  require("./data-models/PrintUtils"));

FabulaObjModel.prototype._setModule("utils", require("./utils"));

FabulaObjModel.prototype._setModule("ObjectA", require("./data-models/ObjectA"));

FabulaObjModel.prototype._setModule("ObjectB", require("./data-models/ObjectB"));

/* #if browser,node */
	FabulaObjModel.prototype._setModule("DefaultDataModel", require("./data-models/DefaultDataModel"));

	FabulaObjModel.prototype._setModule("InterfaceEvents", require("./data-models/InterfaceEvents"));

	FabulaObjModel.prototype._setModule("InterfaceFProperty", require("./data-models/InterfaceFProperty"));

	FabulaObjModel.prototype._setModule("AgentsDataModel", require("./data-models/AgentsDataModel"));

	FabulaObjModel.prototype._setModule("CompanesDataModel", require("./data-models/CompanesDataModel"));

	FabulaObjModel.prototype._setModule("CompaniesDataModel", require("./data-models/CompanesDataModel"));

	FabulaObjModel.prototype._setModule("DataModelAdapters", require("./data-models/DataModelAdapters"));

	FabulaObjModel.prototype._setModule("DocDataModel", require("./data-models/DocDataModel"));

	FabulaObjModel.prototype._setModule("FirmsDataModel", require("./data-models/FirmsDataModel"));

	FabulaObjModel.prototype._setModule("MovDataModel	", require("./data-models/MovDataModel"));

	FabulaObjModel.prototype._setModule("PathsDataModel", require("./data-models/PathsDataModel"));

	FabulaObjModel.prototype._setModule("TalksDataModel",  require("./data-models/TalksDataModel"));

	FabulaObjModel.prototype._setModule("DBModel", null);
/* #end */

// ------------------------------------------------------------------------

/**
 * @param {String} name
 * @param {Array} arg
 * @return {Object}
 * */
FabulaObjModel.prototype.create = function(name, arg){
	if (typeof name != "string"){
		throw new Error("1st argument suppose to be String");
	}

	name = name.toLowerCase().trim();

	if (typeof this._lowMethods[name] == "undefined"){
		throw new Error("Class \"" + name + "\" does not exist");
	}

	// var rest = utils.arrayRest(arguments, 1);
	// TODO передать ...rest в конструктор. Например через bind
	var method = this._lowMethods[name];
	var obj;
	var type = this.mod.utils.getType(method);

	if (  type == "object"  ) {
		obj = method;

	} else if (type == "function") {
		if (  typeof method.prototype.getInstance == "function"  ){
			obj = method.prototype.getInstance();

		} else {
			// Костыль для передачи множества аргументов в конструктор
			if (arguments.length > 2){
				method = method
					.bind
					.apply(
						method,
						[].concat(
							method,
							Array.prototype.slice.call(arguments, 1)
						)
					);
				obj = new method();

			} else {
				obj = new method(arg);

			}

		}
	}

	if (obj) obj._fabulaInstance = this;

	return obj;
};

// ------------------------------------------------------------------------

FabulaObjModel.prototype.getDBInstance = function(){
	return this._dbInstance;
};

// ------------------------------------------------------------------------

FabulaObjModel.prototype.instances = [];

// ------------------------------------------------------------------------

FabulaObjModel.prototype.getInstance = function(arg){
	return this.instances[0] || new FabulaObjModel(arg);
};

FabulaObjModel.getInstance = function(arg){
	return this.prototype.instances[0] || new FabulaObjModel(arg);
};

// ------------------------------------------------------------------------

// Инициализация всех важных компонентов
FabulaObjModel.prototype.load = function(arg){
	var _utils = this.create("utils");
	if (_utils.getType(arg) != "object") arg = Object.create(null);
	var callback = typeof arg.callback == "function" ? arg.callback : new Function();
	var self = this;

	var gdm = this.create("GandsDataModel");

	gdm.load({
		callback: function(err){
			self._initCalcConst();
			callback(err, self);
		}
	});
};


/**
 * Получение из БД констант для калькулятора
 * */
FabulaObjModel.prototype._initCalcConst = function(){
	var cConst = require("./data-models/calc/CalcConsts");
	cConst._init();
};

// ------------------------------------------------------------------------

module.exports = FabulaObjModel;