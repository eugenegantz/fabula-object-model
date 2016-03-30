
var FabulaObjModel = function(arg){
	this._dbInstance = this.mod.DBModel.prototype.getInstance(arg);
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

FabulaObjModel.prototype._setModule("AgentsDataModel", require("./data-models/AgentsDataModel"));

FabulaObjModel.prototype._setModule("DataModelAdapters", require("./data-models/DataModelAdapters"));

FabulaObjModel.prototype._setModule("DefaultDataModel", require("./data-models/DefaultDataModel"));

FabulaObjModel.prototype._setModule("DocDataModel", require("./data-models/DocDataModel"));

FabulaObjModel.prototype._setModule("FirmsDataModel", require("./data-models/FirmsDataModel"));

FabulaObjModel.prototype._setModule("GandsDataModel", require("./data-models/GandsDataModel"));

FabulaObjModel.prototype._setModule("InterfaceEvents", require("./data-models/InterfaceEvents"));

FabulaObjModel.prototype._setModule("InterfaceFProperty", require("./data-models/InterfaceFProperty"));

FabulaObjModel.prototype._setModule("MovDataModel	", require("./data-models/MovDataModel"));

FabulaObjModel.prototype._setModule("PathsDataModel", require("./data-models/PathsDataModel"));

FabulaObjModel.prototype._setModule("TalksDataModel",  require("./data-models/TalksDataModel"));

FabulaObjModel.prototype._setModule("CalcDefaultPrint",  require("./data-models/calc/DefaultPrintCalc"));

FabulaObjModel.prototype._setModule("utils", require("./utils"));

FabulaObjModel.prototype._setModule("ObjectA", require("./data-models/ObjectA"));

FabulaObjModel.prototype._setModule("DBModel", null);

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
			obj = new method();

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
	return this.instances.length ? this.instances[0] : new FabulaObjModel(arg);
};

// ------------------------------------------------------------------------

module.exports = FabulaObjModel;