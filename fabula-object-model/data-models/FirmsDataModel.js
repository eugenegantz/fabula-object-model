"use strict";

// ------------------------------------------------------
// Данные из базы о предприятиях

// Для совместимости
var getContextDB = function() {
	var FabulaObjectModel = require("./../_FabulaObjectModel.js");
	var DBModel = FabulaObjectModel.prototype._getModule("DBModel");

	if (this._fabulaInstance) {
		return this._fabulaInstance.getDBInstance();
	}
	return DBModel.prototype.getInstance();
};

var dbUtils = require("./../utils/dbUtils"),
	ObjectA = require("./ObjectA.js"),
	voidFn = function() {};

var FirmsDataModel = function() {
	this.init();
};

FirmsDataModel.prototype = {

	"init": function() {
		this.dbModel = null;

		this.data = [];

		this._instances.push(this);

		this.state = 0;

		self.dataRefByFirmId = {};
		self.dataRefByINN = {};
	},


	"_instances": [],


	"getInstance": function() {
		return this._instances[0] || new FirmsDataModel();
	},


	"sql": "SELECT * FROM firms"

	+ ";"
	+ " SELECT"
	+       " pid,"
	+       " extID,"
	+       " property,"
	+       " [value]"
	+ " FROM property"
	+ " WHERE"
	+       " extClass = 'firms'",


	/**
	 * Обработать ответ от сервера. Основная таблица
	 *
	 * @param {Array} recs
	 * */
	"_processMainTableRecs": function(recs) {
		var _this               = this;
		var dataRefByFirmId     = new ObjectA();
		var dataRefByINN        = new ObjectA();

		recs.forEach(function(row) {
			var inn = ((row.INN || '') + '').trim();

			if (inn)
				dataRefByINN.set(inn, row);

			dataRefByFirmId.set(row.FirmID, row);

			row.firmsPropertiesRef = [];
		});

		_this.data              = recs;
		_this.dataRefByFirmId   = dataRefByFirmId;
		_this.dataRefByINN      = dataRefByINN;
	},


	/**
	 * Обработать ответ от сервера. Таблица Property
	 *
	 * @param {Array} recs
	 * */
	"_processPropsTableRecs": function(recs) {
		var _this = this;

		recs.forEach(function(row) {
			var obj;
			var extId = (row.extID || "");

			if (obj = _this.dataRefByFirmId.get(extId))
				obj.firmsPropertiesRef.push(row);
		});
	},


	/**
	 * Инициализировать всех контрагентов из БД
	 *
	 * @return {Promise}
	 * */
	"load": function(arg) {
		arg = arg || {};

		var _this           = this;
		var callback        = arg.callback || voidFn;
		var db              = getContextDB.call(_this);

		return Promise.resolve().then(function() {
			if (!db)
				return Promise.reject('FirmsDataModel.load(): !db');

			return db.query({ "query": _this.sql });

		}).then(function(dbres) {
			_this._processMainTableRecs(dbres[0].recs);
			_this._processPropsTableRecs(dbres[1].recs);

			_this.state = 1;

			callback(null, _this);

		}).catch(function(err) {
			callback(err, _this);

			return Promise.reject(err);
		});
	},


	/**
	 * Инициализировать конкретного контрагента из БД
	 *
	 * @param arg
	 * */
	"loadFirm": function(arg) {
		arg = arg || {};

		var callback    = arg.callback || voidFn;
		var db          = getContextDB.call(this);
		var self        = this;

		return Promise.resolve().then(function() {
			var firmId  = arg.firmId;
			var where   = arg.where;
			var _where  = [];

			if (firmId)
				_where.push("firmId = " + firmId);

			_where = _where.join(" OR ");

			if (where)
				_where = where;

			if (!_where)
				return reject('FirmsDataModel().loadFirm(): "arg.firmId" and "arg.where" is not specified');

			var query = ""
				+ " SELECT *"
				+ " FROM firms"
				+ " WHERE " + _where

				+ "; SELECT"
				+   "  pid"
				+   ", extID"
				+   ", property"
				+   ", [value]"
				+ " FROM property"
				+ " WHERE "
				+   " extClass = 'firms'"
				+   " AND pid IN ("
				+       " SELECT firmId"
				+       " FROM firms"
				+       " WHERE " + _where
				+   ")";

			return db.query({ "query": query });

		}).then(function(dbres) {
			var prevFirmRow,
				firmRow = dbres[0].recs[0];

			if (!firmRow)
				return;

			firmRow.firmsPropertiesRef = [];

			dbres[1].recs.forEach(function(row) {
				firmRow.firmsPropertiesRef.push(row);
			});

			if (prevFirmRow = self.dataRefByFirmId.get(firmRow.FirmID + '')) {
				Object.assign(prevFirmRow, firmRow);

			} else {
				self.data.push(firmRow);
				self.dataRefByFirmId.set(firmRow.FirmID + '', firmRow);
			}

			callback(null, self);

		}).catch(function(err) {
			callback(err);

			return Promise.reject(err);
		})
	},


	"get": function() {
		return this.data;
	}

};

module.exports = FirmsDataModel;