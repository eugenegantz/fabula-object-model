"use strict";

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


var voidFn = function() {};


/**
 * Модель данных из базы о собственных филиалах
 * @constructor
 * */
var CompanesDataModel = function() {
	this.init();
};

CompanesDataModel.prototype = {
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
		return this.instances[0] || new CompanesDataModel();
	},


	/**
	 * Инициализация данных из БД
	 * */
	"load": function(arg) {
		arg = arg || {};

		var _this       = this;
		var callback    = arg.callback || voidFn;
		var db          = getContextDB.call(this);

		if (!db)
			return Promise.reject("CompanesDataModel.load: !db");

		return Promise.resolve().then(function() {
			return db.auth();

		}).then(function() {
			var knex = db.getKnexInstance();
			var query = knex.queryBuilder();

			query.select("CompanyID", "CompanyName ");
			query.from("Companes");

			query = query.toString();

			return db.query({
				"query": query,
			});

		}).then(function(res) {
			_this.data = res.recs;
			_this.state = 1;

			callback(_this.data);

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
};

module.exports = CompanesDataModel;