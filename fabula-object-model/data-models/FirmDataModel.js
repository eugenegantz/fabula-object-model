"use strict";

var DefaultDataModel    = require("./DefaultDataModel"),
	InterfaceFProperty  = require("./InterfaceFProperty"),
	IFabModule          = require("./IFabModule.js"),
	ObjectA             = require("./ObjectA.js"),
	emptyFn             = function() {},
	dbUtils             = require("./../utils/dbUtils.js"),
	utils               = require("./../utils/utils");

var FirmDataModel = function() {
	InterfaceFProperty.call(this);
	DefaultDataModel.call(this);
	IFabModule.call(this);

	this._mFirmBranches = [];
};

FirmDataModel.prototype = utils.createProtoChain(
	InterfaceFProperty.prototype,
	DefaultDataModel.prototype,
	IFabModule.prototype,
	{

		_firmsTableFldDecl: ObjectA.create({
			"FirmID":           { "type": "integer", "primary": 1 },
			"Tick":             { "type": "integer" },
			"ID":               { "type": "integer" },
			"NDS":              { "type": "boolean" },
			"Parent_ID":        { "type": "integer" },
			"IsFict":           { "type": "integer" },
			"Type":             { "type": "string", "length": 30 },
			"Name":             { "type": "string", "length": 150 },
			"FullName":         { "type": "string", "length": 250 },
			"UrName":           { "type": "string", "length": 250 },
			"City_ID":          { "type": "integer" },
			"Selo_ID":          { "type": "integer" },
			"Street_ID":        { "type": "integer" },
			"House":            { "type": "string", "length": 40 },
			"Flat":             { "type": "string", "length": 40 },
			"Build_ID":         { "type": "integer" },
			"PostIndex":        { "type": "string", "length": 6 },
			"PostAddress":      { "type": "string", "length": 100 },
			"Addr":             { "type": "string", "length": 50 },
			"EditPA":           { "type": "string", "length": 1 },
			"UrAddress":        { "type": "string", "length": 100 },
			"Tel":              { "type": "string", "length": 50 },
			"Fax":              { "type": "string", "length": 30 },
			"Email":            { "type": "string", "length": 50 },
			"ChiefPosition":    { "type": "string", "length": 30 },
			"ChiefName":        { "type": "string", "length": 50 },
			"ChiefSex":         { "type": "integer" },
			"ContactPosition":  { "type": "string", "length": 30 },
			"ContactName":      { "type": "string", "length": 50 },
			"LastEdit":         { "type": "date" },
			"User":             { "type": "string", "length": 4 },
			"INN":              { "type": "string", "length": 12 },
			"OKPO":             { "type": "string", "length": 20 },
			"KPP":              { "type": "string", "length": 12 },
			"Svid":             { "type": "string", "length": 100 },
			"Deleted":          { "type": "string", "length": 1 },
			"IsAgency":         { "type": "boolean" },
			"Tags":             { "type": "string", "length": 20 },
			"Tel1":             { "type": "string", "length": 24 },
			"Tel2":             { "type": "string", "length": 16 },
			"Tel3":             { "type": "string", "length": 16 },
			"DateNew":          { "type": "date" },
			"UserNew":          { "type": "string", "length": 20 },
			"DateEdit":         { "type": "date" },
			"UserEdit":         { "type": "string", "length": 20 },
			"sha1":             { "type": "string", "length": 50 }
		}),


		/**
		 * Записать в таблицу _firms
		 * @private
		 * @param arg
		 * @param {String | Object=} arg.dbcache
		 * @return {Promise}
		 * */
		"_promiseInsertUsr": function(arg) {
			arg = arg || {};

			var _this = this;

			return Promise.resolve().then(function() {
				var query;
				var db          = _this.getDBInstance();
				var knex        = db.getKnexInstance();
				var _insert     = {};

				_this.getChanged().forEach(function(key) {
					var fldDecl = _this._firmsTableFldDecl.get(key || ""),
						val = _this.get(key, null, !1);

					if (!fldDecl || utils.isEmpty(val))
						return;

					_insert[key] = val;
				});

				query = knex.queryBuilder();
				query.insert(_insert);
				query.into("Firms");

				query = query.toString();

				return db.query({
					"dbworker": " ",
					"dbcache": _this.iFabModuleGetDBCache(arg.dbcache, { "m": "m-firm.ins" }),
					"query": query
				});
			});
		},


		/**
		 * Вернуть id новой записи
		 * @private
		 * @param {Object} arg
		 * @param {String | Object=} arg.dbcache
		 * @return {Promise}
		 * */
		"_promiseGetInsertedId": function(arg) {
			arg = arg || {};

			var _this = this;

			return Promise.resolve().then(function() {
				var db          = _this.getDBInstance();
				var knex        = db.getKnexInstance();
				var changed     = _this.getChanged();

				var query = knex.queryBuilder();
				query.from("Firms");
				query.select("firmId");

				changed.forEach(function(key) {
					var fldDecl = _this._firmsTableFldDecl.get(key || ""),
						val = _this.get(key, null, !1);

					if (!fldDecl || utils.isEmpty(val))
						return;

					query.andWhere(key, val);
				});

				query = query.toString();

				return db.query({
					"dbworker": " ",
					"dbcache": _this.iFabModuleGetDBCache(arg.dbcache, { "m": "m-firm.ins-id" }),
					"query": query,
				}).then(function(dbres) {
					if (!dbres.recs.length)
						return Promise.reject('FirmDataModel._promiseGetInsertedId(): failed to get new "firmId"');

					var id = dbres.recs[0].firmId;

					_this.set("firmId", id);

					return id;
				});
			});
		},


		/**
		 * Обновить запись в таблице "_firms"
		 * @private
		 * @param {Object} arg
		 * @param {String | Object=} arg.dbcache
		 * @return {Promise}
		 * */
		"_promiseUpdateUsr": function(arg) {
			arg = arg || {};

			var _this = this;

			return Promise.resolve().then(function() {
				var sealedFields    = new ObjectA({ "firmId": 1 });
				var db              = _this.getDBInstance();
				var knex            = db.getKnexInstance();
				var changed         = _this.getChanged();
				var _update         = {};

				if (!changed.length)
					return Promise.resolve();

				var query = knex.queryBuilder();

				query.into("Firms");
				query.where("firmId", +_this.get("firmId"));

				changed.forEach(function(key) {
					var dbFldDecl = _this._firmsTableFldDecl.get(key || ""),
						val = _this.get(key, null, !1);

					if (!dbFldDecl || utils.isEmpty(val) || sealedFields.get(key))
						return;

					_update[key] = val;
				});

				if (!Object.keys(_update).length)
					return Promise.resolve();

				query.update(_update);

				query = query.toString();

				return db.query({
					"dbworker": " ",
					"dbcache": _this.iFabModuleGetDBCache(arg.dbcache, { "m": "m-firm.upd" }),
					"query": query,
				});
			});
		},


		/**
		 * Инициализировать контрагента из БД
		 * @param {Object} arg
		 * @param {Function=} arg.callback
		 * @param {String=} arg.dbworker
		 * @param {String | Object=} arg.dbcache
		 * @return {Promise}
		 * */
		"load": function(arg) {
			arg = arg || {};

			var subQuery;
			var queryProps;
			var queryMain;
			var _this           = this;
			var db              = _this.getDBInstance();
			var knex            = db.getKnexInstance();
			var callback        = arg.callback || emptyFn;
			var hasCond         = false;

			subQuery = knex.queryBuilder();
			subQuery.select("firmId");
			subQuery.from("Firms");

			["firmId", "tel3", "tel2", "tel1", "tel", "email"].forEach(function(fld) {
				var fieldDecl   = _this._firmsTableFldDecl.get(fld);
				var val         = _this.get(fld);

				if (!fieldDecl)
					return;

				if (!val)
					return;

				hasCond = true;

				subQuery.andWhere(fld, val);
			});

			return Promise.resolve().then(function() {
				if (!hasCond)
					return Promise.reject("FirmDataModel.load(): !cond.length");

				queryMain = subQuery.clone();
				queryMain.clearSelect();
				queryMain.select("*");
				queryMain.orWhere("parent_id", "in", subQuery);

				queryProps = knex.queryBuilder();
				queryProps.select("uid", "value", "extClass", "property", "extId");
				queryProps.from("Property");
				queryProps.where("extClass", "FIRMS");
				queryProps.andWhere("extId", "in",
					subQuery.clone().clearSelect().select(knex.functionHelper.cast(knex.functionHelper.columnize("firmId"), "varchar"))
				);

				var query = queryMain.toString() + "; " + queryProps.toString();

				return db.query({
					"dbcache": _this.iFabModuleGetDBCache(arg.dbcache, { "m": "m-firm.load" }),
					"dbworker": arg.dbworker,
					"query": query
				});

			}).then(function(dbres) {
				var parentFirmRow;
				var firmsTable = dbres[0].recs;
				var propsTable = dbres[1].recs;

				if (!firmsTable.length)
					return Promise.reject("FirmDataModel.load(): !dbres.recs.length");

				_this._mFirmBranches = [];

				firmsTable.forEach(function(row) {
					var _row = new ObjectA(row),

						isParent = ["firmId", "tel3", "tel2", "tel1", "tel", "email"].some(function(key) {
							return _this.get(key) == _row.get(key);
						});

					if (isParent) {
						parentFirmRow = row;

					} else {
						var firm = new FirmDataModel();

						firm.set('firmId', _row.get('firmId'));

						_this.addBranch(firm);
					}
				});

				if (!parentFirmRow)
					return Promise.reject("FirmDataModel.load(): parent firm not found");

				// ------------

				_this.getKeys().forEach(function(k) {
					_this.set(k, void 0, null, !1);
				});

				_this.deleteFProperty();

				// ------------

				_this.set(parentFirmRow);

				_this.addFProperty(propsTable.filter(function(row) {
					return _this.get("firmId", null, !1) == row.extId;
				}));

				return Promise.all(
					_this.getBranch().map(function(firm) {
						return firm.load();
					})
				);

			}).then(function() {
				_this.clearChanged();

				callback(_this, null);

			}).catch(function(err) {
				callback(_this, err);

				return Promise.reject(err);
			});
		},


		/**
		 * Вернуть афилированные предприятия
		 * @return {Array}
		 * */
		"getBranch": function() {
			return this._mFirmBranches;
		},


		"addBranch": function(firm) {
			this._mFirmBranches.push(firm);
		},


		"delBranch": function() {
			// TODO
		},


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

			return self.exists().then(function(isEx) {
				if (isEx)
					return self.update();

				return self.insert();

			}).then(function() {
				callback(self, null);

			}).catch(function(err) {
				callback(self, err);

				return Promise.reject(err);
			});
		},


		/**
		 * Записать нового контрагента в таблицу "_firms"
		 * @param {Object} arg
		 * @param {Function=} arg.callback
		 * @param {String | Object=} arg.dbcache
		 * @return {Promise}
		 * */
		"insert": function(arg) {
			arg = arg || {};

			var _this       = this;
			var callback    = arg.callback || emptyFn;

			_this.trigger("before-insert");

			return _this.exists().then(function(isEx) {
				if (isEx)
					return Promise.reject("FirmDataModel.insert(): firm already exists");

			}).then(function() {
				return _this._promiseInsertUsr();

			}).then(function() {
				return _this._promiseGetInsertedId();

			}).then(function() {
				return new Promise(function(resolve, reject) {
					var firmId = _this.get("firmId", null, !1);

					var query = _this.getUpsertOrDelFPropsQueryStrByDBRes([], {
						"pid": firmId,
						"extClass": "FIRMS",
						"extId": firmId
					});

					if (!query)
						return resolve();

					_this.getDBInstance().dbquery({
						"dbworker": " ",
						"dbcache": _this.iFabModuleGetDBCache(arg.dbcache, { "m": "m-firm.ins-prop" }),
						"query": query,
						"callback": function(dbres, err) {
							if (err = dbUtils.fetchErrStrFromRes(dbres))
								return reject(err);

							resolve();
						}
					});
				});

			}).then(function() {
				return Promise.all(
					_this.getBranch().map(function(firm) {
						firm.set("parent_id", _this.get("FirmId"));

						return firm.save();
					})
				);

			}).then(function() {
				_this.clearChanged();

				_this.trigger("after-insert");

				callback(_this, null);

			}).catch(function(err) {
				callback(_this, err);

				return Promise.reject(err);
			});
		},


		/**
		 * Обновить контрагента в таблице "_firms"
		 * @param {Object} arg
		 * @param {Function=} arg.callback
		 * @param {String | Object=} arg.dbcache
		 * @return {Promise}
		 * */
		"update": function(arg) {
			arg = arg || {};

			var _this       = this;
			var db          = this.getDBInstance();
			var knex        = db.getKnexInstance();
			var callback    = arg.callback || emptyFn;

			_this.trigger("before-update");

			return _this.exists().then(function(isEx) {
				if (!isEx)
					return Promise.reject("FirmDataModel.update(): firm do not exists");

			}).then(function() {
				return _this._promiseUpdateUsr()

			}).then(function() {
				var query = knex.queryBuilder();

				query.select("uid", "value", "property", "extClass", "extId");
				query.from("Property");
				query.where("extClass", "FIRMS");
				query.andWhere("extId", _this.get("firmId") + "");

				query = query.toString();

				return db.query({
					"dbcache": _this.iFabModuleGetDBCache(arg.dbcache, { "m": "m-firm.upd0" }),
					"dbworker": " ",
					"query": query
				});

			}).then(function(dbres) {
				var firmId = _this.get("firmId", null, !1);

				var query = _this.getUpsertOrDelFPropsQueryStrByDBRes(dbres.recs, {
					"pid": firmId,
					"extClass": "FIRMS",
					"extId": firmId
				});

				if (!query)
					return resolve();

				_this.getDBInstance().dbquery({
					"dbcache": _this.iFabModuleGetDBCache(arg.dbcache, { "m": "m-firm.upd1" }),
					"dbworker": " ",
					"query": query,
					"callback": function(dbres, err) {
						if (err = dbUtils.fetchErrStrFromRes(dbres))
							return reject(err);

						resolve();
					}
				});

			}).then(function() {
				return Promise.all(
					_this.getBranch().map(function(firm) {
						firm.set("parent_id", _this.get("FirmId"));

						return firm.save();
					})
				);

			}).then(function() {
				_this.clearChanged();

				_this.trigger("after-update");

				callback(_this, null);

			}).catch(function(err) {
				callback(_this, err);

				return Promise.reject(err);
			});
		},


		/**
		 * Удалить контрагента из БД
		 * @param {Object} arg
		 * @param {Function=} arg.callback
		 * @param {String | Object=} arg.dbcache
		 * @return {Promise}
		 * */
		"rm": function(arg) {
			arg = arg || {};

			var _this       = this;
			var callback    = arg.callback || emptyFn;

			return Promise.resolve().then(function() {
				var query;
				var db              = _this.getDBInstance();
				var id              = _this.get("firmId");
				var knex            = db.getKnexInstance();
				var queryProps      = knex.queryBuilder();
				var queryMain       = knex.queryBuilder();

				if (!id)
					return Promise.reject("FirmDataModel.rm(): !usrId");

				queryProps.del();
				queryMain.from("Property");
				queryProps.where("extClass", "FIRMS");
				queryProps.andWhere("extId", id + "");

				queryMain.del();
				queryMain.from("Firms");
				queryMain.where("firmId", id);

				query = queryProps.toString() + "; " + queryMain.toString();

				return db.query({
					"dbworker": " ",

					"dbcache": _this.iFabModuleGetDBCache(arg.dbcache, { "m": "m-firm.rm" }),

					"query": query,
				});

			}).then(function() {
				callback(_this, null)

			}).catch(function() {
				callback(_this, err);

				return Promise.reject(err);
			});
		},


		/**
		 * Проверить существование контрагента в БД
		 * @param {Object=} arg
		 * @param {function=} arg.callback
		 * @param {String | Object=} arg.dbcache
		 * @return {Promise}
		 * */
		"exists": function(arg) {
			arg = arg || {};

			var _this       = this;
			var callback    = arg.callback || emptyFn;
			var id          = _this.get("firmId");
			var db          = _this.getDBInstance();

			return Promise.resolve().then(function() {
				if (utils.isEmpty(db))
					return Promise.reject("FirmDataModel.exists(): firmId is empty");

				var knex    = db.getKnexInstance();
				var query   = knex.queryBuilder();

				query.select("email");
				query.from("Firms");
				query.where("firmId", id);

				query = query.toString();

				return db.query({
					"dbcache": _this.iFabModuleGetDBCache(arg.dbcache, { "m": "m-firm.exs" }),
					"query": query,
				});

			}).then(function(dbres) {
				callback(_this, null, !!dbres.recs.length);

				return !!dbres.recs.length;

			}).catch(function(err) {
				callback(_this, err);

				return Promise.reject(err);
			});
		}

	}
);

module.exports = FirmDataModel;