"use strict";

var voidFn      = function() {},
	utils       = require("./../utils/utils.js"),
	IFabModule  = require("./IFabModule.js");


/**
 * Для совместимости
 * @ignore
 * */
var getContextDB = function() {
	var FabulaObjectModel = require("./../_FabulaObjectModel.js"),
		DBModel = FabulaObjectModel.prototype._getModule("DBModel");

	if (this._fabulaInstance)
		return this._fabulaInstance.getDBInstance();

	return DBModel.prototype.getInstance();
};


/**
 * Данные из базы об агентах
 * @constructor
 * */
var AgentsDataModel = function() {
	IFabModule.call(this);

	this.init();
};

AgentsDataModel.prototype = utils.createProtoChain(IFabModule.prototype, {

	"init": function() {
		this.dbModel = null;
		this.data = [];
		this.instances.push(this);
		this.state = 0;
	},


	/**
	 * Массив экземпляров класса
	 * */
	"instances": [],


	/**
	 * Получить экземпляр класса
	 * */
	"getInstance": function() {
		return this.instances[0] || new AgentsDataModel();
	},


	/**
	 * Инициализация данных из БД
	 * */
	"load": function(arg) {
		arg = arg || {};

		var callback = arg.callback || voidFn,
			db = getContextDB.call(this),
			self = this;

		if (!db) return;

		var query = ""
			+ " SELECT"
			+   "   gsCodeNumber   AS AgentID"
			+   " , importName     AS FIO"
			+   " , gsName         AS NameShort"
			+   " , importName     AS NameFull"
			+   " , gsCop          AS [User]"
			+ " FROM Gands"
			+ " WHERE"
			+   " LEFT(GSID, 4) = 'SYСо'";

		return db.query({
			"dbcache": self.iFabModuleGetDBCache(arg.dbcache, { "m": "m-ag.load" }),
			"query": query
		}).then(function(res) {
			self.data = res.recs;
			self.state = 1;
			callback(null, self, self.data);

		}).catch(function(err) {
			callback(err, self)
		});
	},


	/**
	 * Получить инициализированные данные
	 * */
	"get": function() {
		return this.data;
	}

});

module.exports = AgentsDataModel;