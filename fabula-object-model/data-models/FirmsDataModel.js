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

var _utils          = require("./../utils/utils");
var dbUtils         = require("./../utils/dbUtils");
var ObjectA         = require("./ObjectA.js");
var IFabModule      = require("./IFabModule.js");
var voidFn          = function() {};

var FirmsDataModel = function() {
	IFabModule.call(this);
	this.init();
};

FirmsDataModel.prototype = _utils.createProtoChain(IFabModule.prototype, {

	"init": function() {
		this.dbModel = null;

		this.data = [];

		this._instances.push(this);

		this.state = 0;
	},


	"_instances": [],


	"getInstance": function() {
		return this._instances[0] || new FirmsDataModel();
	},


	"query": null,


	"load": function(arg) {
		arg = arg || {};

		var callback    = arg.callback || voidFn;
		var db          = getContextDB.call(this);
		var _this       = this;

		if (!db)
			return reject('FirmsDataModel.load(): !db');

		return Promise.resolve().then(function() {
			return db.auth();

		}).then(function() {
			var query;
			var knex = db.getKnexInstance();
			var queryMain = knex.queryBuilder();
			var queryProps = knex.queryBuilder();

			// -----------------------------
			// Основная таблица
			// -----------------------------
			queryMain.select(
				  "FirmID",         "Tick",     "NDS",              "Parent_ID"
				, "isFict",         "Type",     "Name",             "FullName"
				, "UrName",         "City_ID",  "Selo_ID",          "Street_ID"
				, "House",          "Flat",     "Build_ID",         "PostIndex"
				, "PostAddress",    "Addr",     "EditPA",           "UrAddress"
				, "Tel",            "Fax",      "Email",            "ChiefPosition"
				, "ChiefName",      "ChiefSex", "ContactPosition",  "ContactName"
				, "LastEdit",       "User",     "INN",              "OKPO"
				, "KPP",            "Svid",     "Deleted",          "IsAgency"
				, "Tags",           "Tel1",     "Tel2",             "Tel3"
				, "DateNew",        "UserNew",  "DateEdit",         "UserEdit"
				, "sha1"
			);

			queryMain.from("Firms");

			// -----------------------------
			// Свойства
			// -----------------------------

			queryProps.select("pid", "extID", "property", "value");
			queryProps.from("Property");
			queryProps.where("extClass", "firms");

			// -----------------------------

			query = queryMain.toString() + "; " + queryProps.toString();

			// -----------------------------

			return db.query({
				"query": query
			});

		}).then(function(dbRes) {
			_this.data = dbRes[0].recs;

			_this.dataRefByFirmId = {};

			_this.data.forEach(function(row) {
				_this.dataRefByFirmId[row.FirmID] = row;

				row.firmsPropertiesRef = [];
			});

			dbRes[1].recs.forEach(function(row) {
				var obj = _this.dataRefByFirmId[row.extID];

				if (obj)
					obj.firmsPropertiesRef.push(row);
			});

			_this.dataRefByFirmId = new ObjectA(_this.dataRefByFirmId);

			_this.state = 1;

			callback(null, _this);
		});
	},


	"loadFirm": function(arg) {
		arg = arg || {};

		var query;
		var _this       = this;
		var callback    = arg.callback || voidFn;
		var db          = getContextDB.call(this);

		if (!arg.firmId)
			return Promise.reject("FirmsDataModel().loadFirm(): arg.firmId is not specified");

		// -----------------------------

		return Promise.resolve().then(function() {
			return db.auth();

		}).then(function() {
			var knex        = db.getKnexInstance();
			var queryMain   = knex.queryBuilder();
			var queryProps  = knex.queryBuilder();

			// -----------------------------
			// Основная таблица
			// -----------------------------
			queryMain.select(
				  "FirmID",         "Tick",     "NDS",              "Parent_ID"
				, "isFict",         "Type",     "Name",             "FullName"
				, "UrName",         "City_ID",  "Selo_ID",          "Street_ID"
				, "House",          "Flat",     "Build_ID",         "PostIndex"
				, "PostAddress",    "Addr",     "EditPA",           "UrAddress"
				, "Tel",            "Fax",      "Email",            "ChiefPosition"
				, "ChiefName",      "ChiefSex", "ContactPosition",  "ContactName"
				, "LastEdit",       "User",     "INN",              "OKPO"
				, "KPP",            "Svid",     "Deleted",          "IsAgency"
				, "Tags",           "Tel1",     "Tel2",             "Tel3"
				, "DateNew",        "UserNew",  "DateEdit",         "UserEdit"
				, "sha1"
			);

			queryMain.from("Firms");
			queryMain.where("firmId", +arg.firmId);


			// -----------------------------
			// Свойства
			// -----------------------------

			queryProps.select("pid", "extID", "property", "value");
			queryProps.from("Property");
			queryProps.where("extClass", "firms");
			queryProps.andWhere("extId", arg.firmId + "");

			// -----------------------------

			query = queryMain.toString() + "; " + queryProps.toString();

			return db.query({ "query": query });

		}).then(function(dbRes) {
			var prevFirmRow;
			var firmRow = dbRes[0].recs[0];

			if (!firmRow)
				return;

			firmRow.firmsPropertiesRef = [];

			dbRes[1].recs.forEach(function(row) {
				firmRow.firmsPropertiesRef.push(row);
			});

			if (prevFirmRow = _this.dataRefByFirmId.get(firmRow.FirmID + '')) {
				Object.assign(prevFirmRow, firmRow);

			} else {
				_this.data.push(firmRow);
				_this.dataRefByFirmId.set(firmRow.FirmID + '', firmRow);
			}

			callback(null, _this);

		}).catch(function(err) {
			callback(err);

			return Promise.reject(err);
		})
	},


	"get": function() {
		return this.data;
	}

});

module.exports = FirmsDataModel;