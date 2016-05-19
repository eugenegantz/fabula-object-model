"use strict";

// ------------------------------------------------------
// Данные из базы об агентах

/**
 * Для совместимости
 * @ignore
 * */
var getContextDB = function(){
	var FabulaObjectModel = require("./../_FabulaObjectModel.js");
	var DBModel = FabulaObjectModel.prototype._getModule("DBModel");

	if (  this._fabulaInstance ){
		return this._fabulaInstance.getDBInstance();
	}
	return DBModel.prototype.getInstance();
};


/**
 * @constructor
 * */
var AgentsDataModel = function(){
	this.init();
};

AgentsDataModel.prototype = {
	"init" : function(){

		this.dbModel = null;

		this.data = [];

		this.instances.push(this);

		this.state = 0;

	},


	/**
	 * Массив экземпляров класса
	 * */
	"instances" : [],


	/**
	 * Получить экземпляр класса
	 * */
	"getInstance" : function(){
		if (this.instances.length){
			return this.instances[0];
		}
		return new AgentsDataModel();
	},


	/**
	 * Инициализация данных из БД
	 * */
	"load" : function(A){
		if (typeof A == "undefined") A = Object.create(null);
		var callback = (typeof A.callback == "function" ? A.callback : function(){} );
		var db = getContextDB.call(this);
		var self = this;
		if (db){
			db.dbquery({
				"query" : "SELECT AgentID, FIO, NameShort, NameFull, User FROM Agents",
				"callback" : function(res){
					self.data = res.recs;
					self.state = 1;
					callback(self.data);
				}
			});
		}
	},


	/**
	 * Получить инициализированные данные
	 * */
	"get" : function(){
		return this.data;
	}
};

module.exports = AgentsDataModel;