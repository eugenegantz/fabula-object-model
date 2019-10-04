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
	 *
	 * @param {Function=} arg.callback
	 * @param {String | Object=} arg.dbcache
	 *
	 * @return {Promise}
	 * */
	"load": function(arg) {
		arg = arg || {};

		var _this       = this;
		var callback    = arg.callback || voidFn;
		var db          = getContextDB.call(this);

		if (!db)
			return;

		return Promise.resolve().then(function() {
			return db.auth();

		}).then(function() {
			var knex = db.getKnexInstance();
			var query = knex.queryBuilder();

			query.select("AgentID", "FIO", "NameShort", "NameFull", "User");
			query.from("Agents");

			query = query.toString();

			return db.dbquery({
				"dbcache": _this.iFabModuleGetDBCache(arg.dbcache, { "m": "m-ag.load" }),
				"query": query,
			});

		}).then(function(res) {
			_this.data          = res.recs;
			_this.state         = 1;

			callback(null, _this, _this.data);

		}).catch(function(err) {
			callback(err);

			return Promise.reject(err);
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