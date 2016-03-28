var keys, c;

// ------------------------------------------------------------------------

var FabulaObjModel = function(arg){
	this._dbInstance = this.DBModel.prototype.getInstance(arg);
	this.instances.push(this);
};

// ------------------------------------------------------------------------

FabulaObjModel.prototype = {};

FabulaObjModel.prototype.AgentsDataModel			= require("./data-models/AgentsDataModel");

FabulaObjModel.prototype.DataModelAdapters		= require("./data-models/DataModelAdapters");

FabulaObjModel.prototype.DefaultDataModel			= require("./data-models/DefaultDataModel");

FabulaObjModel.prototype.DocDataModel				= require("./data-models/DocDataModel");

FabulaObjModel.prototype.FirmsDataModel			= require("./data-models/FirmsDataModel");

FabulaObjModel.prototype.GandsDataModel			= require("./data-models/GandsDataModel");

FabulaObjModel.prototype.InterfaceEvents			= require("./data-models/InterfaceFProperty");

FabulaObjModel.prototype.InterfaceFProperty		= require("./data-models/InterfaceFProperty");

FabulaObjModel.prototype.MovDataModel				= require("./data-models/MovDataModel");

FabulaObjModel.prototype.PathsDataModel			= require("./data-models/PathsDataModel");

FabulaObjModel.prototype.TalksDataModel				= require("./data-models/TalksDataModel");

FabulaObjModel.prototype.utils								= require("./utils");

FabulaObjModel.prototype.ObjectA						= require("./data-models/ObjectA");

FabulaObjModel.prototype.DBModel						= require("./browser/DBModel");

// ------------------------------------------------------------------------

FabulaObjModel.prototype._lowMethods = Object.create(null);
keys = Object.getOwnPropertyNames(FabulaObjModel.prototype);
for(c=0; c<keys.length; c++){
	if (keys[c] == "_lowMethods") continue;
	FabulaObjModel.prototype._lowMethods[keys[c].toLowerCase()] = FabulaObjModel.prototype[keys[c]];
}

// ------------------------------------------------------------------------

/**
 * @param {String} name
 * @param {Array} arg
 * */
FabulaObjModel.prototype.create = function(name, arg){
	if (typeof name != "string"){
		throw new Error("1st argument suppose to be String");
	}

	name = name.toLowerCase();

	if (typeof this._lowMethods[name] == "undefined"){
		throw new Error("Class \"" + name + "\" does not exist");
	}

	// var rest = utils.arrayRest(arguments, 1);
	// TODO передать ...rest в конструктор. Например через bind
	var method = this._lowMethods[name];
	var obj;
	var type = _utils.getType(method);

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

FabulaObjModel.prototype.getDBInstance = function(){
	return this._dbInstance;
};

// ------------------------------------------------------------------------

FabulaObjModel.prototype.instances = [];

FabulaObjModel.prototype.getInstance = function(arg){
	return this.instances.length ? this.instances[0] : new FabulaObjModel(arg);
};

// ------------------------------------------------------------------------

module.exports = FabulaObjModel;