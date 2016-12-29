"use strict";

/**
 * Для совместимости
 * @ignore
 * */
var getContextDB = function() {
	var FabulaObjectModel = require("./../_FabulaObjectModel.js");
	var DBModel = FabulaObjectModel.prototype._getModule("DBModel");

	if (this._fabulaInstance) {
		return this._fabulaInstance.getDBInstance();
	}
	return DBModel.prototype.getInstance();
};


/**
 * Данные из базы об агентах
 * @constructor
 * */
var AgentsDataModel = function() {
	this.init();
};

AgentsDataModel.prototype = {
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
		if (typeof arg == "undefined") arg = Object.create(null);

		var callback = typeof arg.callback == "function" ? arg.callback : function() {},
			db = getContextDB.call(this),
			self = this;

		if (!db) return;

		db.dbquery({
			"query": "SELECT AgentID, FIO, NameShort, NameFull, User FROM Agents",
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

module.exports = AgentsDataModel;