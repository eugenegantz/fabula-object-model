"use strict";

// ------------------------------------------------------
// Данные из базы о собственных филиалах

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
var CompanesDataModel = function(){
	this.init();
};

CompanesDataModel.prototype = {
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
		return this.instances.length ? this.instances[0] : new CompanesDataModel();
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
				"query" : "SELECT CompanyID, CompanyName FROM Companes",
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

module.exports = CompanesDataModel;