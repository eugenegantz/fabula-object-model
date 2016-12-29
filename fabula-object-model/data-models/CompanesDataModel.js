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
		if (typeof arg == "undefined") arg = Object.create(null);

		var callback = typeof arg.callback == "function" ? arg.callback : new Function(),
			db = getContextDB.call(this),
			self = this;

		if (!db) return;

		db.dbquery({
			"query": "SELECT CompanyID, CompanyName FROM Companes",
			"callback": function(res) {
				self.data = res.recs;
				self.state = 1;
				callback(self.data);
			}
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