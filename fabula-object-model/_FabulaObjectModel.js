"use strict";

var FabulaObjModel = function(arg){
	/*#if browser,node*/
	this._dbInstance = this.mod.DBModel.prototype.getInstance(arg);
	/*#end*/

	/*#if browser-s*/
	if (typeof window == "object" && typeof document == "object"){
		if (typeof arg != "object")
			throw new Error("!arg");

		if (typeof arg.url != "string" || !arg.url)
			throw new Error("!arg.url");

		this.url = arg.url;
	}
	/*#end*/

	this.config = {};

	this.instances.push(this);
};

// ------------------------------------------------------------------------

FabulaObjModel.prototype = {};

/**
 * @deprecated use getModule instead
 * */
FabulaObjModel.prototype.mod = Object.create(null);

FabulaObjModel.prototype._lowMethods = Object.create(null);

// ------------------------------------------------------------------------

/**
 * @param {String} name
 * @param {Object | Function} _module
 * */
FabulaObjModel.prototype._setModule = function(name, _module){
	if (typeof name != "string")
		throw new Error("1st argument suppose to be String");

	name = name.trim();

	this.mod[name] = _module;
	this._lowMethods[name.toLowerCase()] = _module;
};

FabulaObjModel.setModule = function(name, _module) {
	FabulaObjModel.prototype._setModule(name, _module);
};

// ------------------------------------------------------------------------

FabulaObjModel.prototype._getModule = function(name){
	if (typeof name != "string")
		throw new Error("1st argument suppose to be String");

	return this._lowMethods[name.toLowerCase()];
};

FabulaObjModel.getModule = function(name) {
	return FabulaObjModel.prototype._getModule(name);
};

// ------------------------------------------------------------------------

FabulaObjModel.setModule("GandsDataModel", require("./data-models/GandsDataModel"));

FabulaObjModel.setModule("CalcDefaultPrint", require("./data-models/calc/DefaultPrintCalc"));
FabulaObjModel.setModule("CalcPrintDefault", require("./data-models/calc/DefaultPrintCalc"));
FabulaObjModel.setModule("CalcPrintBrochure", require("./data-models/calc/CalcPrintBrochure"));
FabulaObjModel.setModule("CalcPrintOffset", require("./data-models/calc/CalcPrintOffset"));
FabulaObjModel.setModule("CalcPrintCarton", require("./data-models/calc/CalcPrintCarton"));
FabulaObjModel.setModule("CalcPrintDigital", require("./data-models/calc/CalcPrintDigital"));
FabulaObjModel.setModule("CalcPrintPostprocCreasing", require("./data-models/calc/CalcPrintPostprocCreasing"));
FabulaObjModel.setModule("CalcPrintPostprocRounding", require("./data-models/calc/CalcPrintPostprocRounding"));
FabulaObjModel.setModule("CalcPrintPostprocFolding", require("./data-models/calc/CalcPrintPostprocFolding"));
FabulaObjModel.setModule("CalcPrintPostprocLaminating", require("./data-models/calc/CalcPrintPostprocLaminating"));
FabulaObjModel.setModule("CalcUtils", require("./data-models/calc/CalcUtils"));

FabulaObjModel.setModule("utils", require("./utils/utils"));
FabulaObjModel.setModule("utils.db", require("./utils/db"));
FabulaObjModel.setModule("utils.array", require("./utils/array"));
FabulaObjModel.setModule("utils.object", require("./utils/object"));
FabulaObjModel.setModule("utils.env", require("./utils/env"));
FabulaObjModel.setModule("utils.fabMarkup", require("./utils/fabMarkup"));
FabulaObjModel.setModule("utils.fn", require("./utils/fn"));
FabulaObjModel.setModule("utils.logic", require("./utils/logic"));
FabulaObjModel.setModule("utils.parse", require("./utils/parse"));
FabulaObjModel.setModule("utils.print", require("./utils/print"));
FabulaObjModel.setModule("utils.string", require("./utils/string"));
FabulaObjModel.setModule("utils.url", require("./utils/url"));
FabulaObjModel.setModule("dbUtils", require("./utils/db")); // историческое название
FabulaObjModel.setModule("printUtils", require("./utils/print")); // историческое название

FabulaObjModel.setModule("ObjectA", require("./data-models/ObjectA"));
FabulaObjModel.setModule("ObjectB", require("./data-models/ObjectB"));

/* #if browser,node */
FabulaObjModel.setModule("MField", require("./data-models/field-models/MField"));
FabulaObjModel.setModule("MFieldArray", require("./data-models/field-models/MFieldArray"));
FabulaObjModel.setModule("MFieldObject", require("./data-models/field-models/MFieldObject"));

FabulaObjModel.setModule("DefaultDataModel", require("./data-models/DefaultDataModel"));

FabulaObjModel.setModule("InterfaceEvents", require("./data-models/InterfaceEvents"));
FabulaObjModel.setModule("InterfaceFProperty", require("./data-models/InterfaceFProperty"));

FabulaObjModel.setModule("AgentsDataModel", require("./data-models/AgentsDataModel"));

FabulaObjModel.setModule("CompanesDataModel", require("./data-models/CompanesDataModel"));

FabulaObjModel.setModule("CompaniesDataModel", require("./data-models/CompanesDataModel"));

FabulaObjModel.setModule("DataModelAdapters", require("./data-models/DataModelAdapters"));

FabulaObjModel.setModule("DocDataModel", require("./data-models/DocDataModel"));

FabulaObjModel.setModule("FirmsDataModel", require("./data-models/FirmsDataModel"));
FabulaObjModel.setModule("FirmDataModel", require("./data-models/FirmDataModel"));

FabulaObjModel.setModule("MovDataModel", require("./data-models/MovDataModel"));

FabulaObjModel.setModule("PathsDataModel", require("./data-models/PathsDataModel"));

FabulaObjModel.setModule("TalksDataModel", require("./data-models/TalksDataModel"));

FabulaObjModel.setModule("DBModel", null);
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

	if (typeof this._lowMethods[name] == "undefined")
		throw new Error("Class \"" + name + "\" does not exist");

	// var rest = utils.arrayRest(arguments, 1);
	// TODO передать ...rest в конструктор. Например через bind
	var method = this._lowMethods[name],
		obj,
		type = this.mod.utils.getType(method);

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

	var callback = typeof arg.callback == "function" ? arg.callback : new Function(),
		self = this,
		gdm = this.create("GandsDataModel");

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