"use strict";

var DefaultDataModel    = require("./DefaultDataModel"),
	InterfaceFProperty  = require("./InterfaceFProperty"),
	IFabModule          = require("./IFabModule.js"),
	ObjectA             = require("./ObjectA.js"),
	emptyFn             = function() {},
	dbUtils             = require("./../utils/dbUtils.js"),
	utils               = require("./../utils/utils");

var FirmDataModel = function() {

};

FirmDataModel.prototype = utils.createProtoChain(
	DefaultDataModel.prototype,
	IFabModule.prototype,
	InterfaceFProperty.prototype,
	{

		_firmsTableFldDecl: ObjectA.create({
			FirmID:             { type: 'integer' },
			Tick:               { type: 'integer' },
			ID:                 { type: 'integer' },
			NDS:                { type: 'boolean' },
			Parent_ID:          { type: 'integer' },
			IsFict:             { type: 'integer' },
			Type:               { type: 'string' },
			Name:               { type: 'string' },
			FullName:           { type: 'string' },
			UrName:             { type: 'string' },
			City_ID:            { type: 'integer' },
			Selo_ID:            { type: 'integer' },
			Street_ID:          { type: 'integer' },
			House:              { type: 'string' },
			Flat:               { type: 'string' },
			Build_ID:           { type: 'integer' },
			PostIndex:          { type: 'string' },
			PostAddress:        { type: 'string' },
			Addr:               { type: 'string' },
			EditPA:             { type: 'string' },
			UrAddress:          { type: 'string' },
			Tel:                { type: 'string' },
			Fax:                { type: 'string' },
			Email:              { type: 'string' },
			ChiefPosition:      { type: 'string' },
			ChiefName:          { type: 'string' },
			ChiefSex:           { type: 'integer' },
			ContactPosition:    { type: 'string' },
			ContactName:        { type: 'string' },
			LastEdit:           { type: 'date' },
			User:               { type: 'string' },
			INN:                { type: 'string' },
			OKPO:               { type: 'string' },
			KPP:                { type: 'string' },
			Svid:               { type: 'string' },
			Deleted:            { type: 'string' },
			IsAgency:           { type: 'boolean' },
			Tags:               { type: 'string' },
			Tel1:               { type: 'string' },
			Tel2:               { type: 'string' },
			Tel3:               { type: 'string' },
			DateNew:            { type: 'date' },
			UserNew:            { type: 'string' },
			DateEdit:           { type: 'date' },
			UserEdit:           { type: 'string' }
		}),


		/**
		 * Сохранить контрагента записать новый или обновить если уже существует
		 * @param {Object} arg
		 * @param {Function=} arg.callback
		 * @return {Promise}
		 * */
		"save": function(arg) {
			arg = arg || {};

			var self = this,
				callback = arg.callback || emptyFn;

			return this.exists().then(function(isEx) {
				if (isEx)
					return self.update();

				return this.insert();

			}).then(function() {
				callback(null);

			}).catch(function(err) {
				callback(err);

				return Promise.reject(err);
			});
		},


		/**
		 * Записать нового контрагента в таблицу Firms
		 * @param {Object} arg
		 * @param {Function=} arg.callback
		 * @return {Promise}
		 * */
		"insert": function(arg) {

		},


		/**
		 * Обновить контрагента в таблице Firms
		 * @param {Object} arg
		 * @param {Function=} arg.callback
		 * @return {Promise}
		 * */
		"update": function(arg) {

		},


		/**
		 * Проверить существование контрагента
		 * @param {Object=} arg
		 * @param {function=} arg.callback
		 * @return {Promise}
		 * */
		"exists": function(arg) {
			var self = this,
				callback = arg.callback || emptyFn,
				id = self.get("firmId"),
				db = this.getDBInstance();

			return new Promise(function(resolve, reject) {
				if (utils.isEmpty(db))
					return reject("FirmDataModel.exists(): firmId is empty");

				db.dbquery({
					query: ''
					+ " SELECT email"
					+ " FROM _firms AS firms"
					+ " WHERE"
					+   " firmId = " + id,
					"callback": function(dbres, err) {
						if (err = dbUtils.fetchErrStrFromRes(dbres)) {
							callback(err);

							return reject(err);
						}

						callback(null, !!dbres.recs.length);

						resolve(!!dbres.recs.length);
					}
				});
			});
		}

	}
);

module.exports = FirmDataModel;