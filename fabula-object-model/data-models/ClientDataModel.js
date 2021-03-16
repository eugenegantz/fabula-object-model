"use strict";

var DefaultDataModel    = require("./DefaultDataModel");
var InterfaceFProperty  = require("./InterfaceFProperty");
var IFabModule          = require("./IFabModule.js");
var ObjectA             = require("./ObjectA.js");
var emptyFn             = function() {};
var dbUtils             = require("./../utils/dbUtils.js");
var utils               = require("./../utils/utils");

var ClientDataModel = function() {
	InterfaceFProperty.call(this);
	DefaultDataModel.call(this);
	IFabModule.call(this);
};


ClientDataModel.getTableScheme = function() {
	return ClientDataModel.prototype._clientsTableFldDecl;
};


ClientDataModel.getTableName = function() {
	return "ClientFIO";
};


ClientDataModel.prototype = utils.createProtoChain(
	InterfaceFProperty.prototype,
	DefaultDataModel.prototype,
	IFabModule.prototype,
	{
		_clientsTableFldDecl: ObjectA.create({
			"ClID"              : { "type": "integer", "primary": 1 },
			"DateNew"           : { "type": "date" },
			"DocCount"          : { "type": "integer" },
			"FIO"               : { "type": "string", "length": 255 },
			"Flag"              : { "type": "integer" },
			"city"              : { "type": "integer" },
			"Addr"              : { "type": "string", "length": 255 },
			"Phone"             : { "type": "string", "length": 50 },
			"Card"              : { "type": "string", "length": 50 },
			"Email"             : { "type": "string", "length": 255 },
			"BDay"              : { "type": "date" },
			"Sex"               : { "type": "string", "length": 1 },
			"Tick"              : { "type": "integer" }
		}),


		"getTableScheme": function() {
			return ClientDataModel.getTableScheme();
		},


		"getTableName": function() {
			return ClientDataModel.getTableName();
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

			var _this           = this;
			var db              = _this.getDBInstance();
			var callback        = arg.callback || emptyFn;
			var cond            = [];

			["clid", "phone", "email"].forEach(function(fld) {
				var fieldDecl   = _this._clientsTableFldDecl.get(fld);
				var val         = _this.get(fld);

				if (!fieldDecl || !val)
					return;

				cond.push(dbUtils.mkFld(fld) + " = " + dbUtils.mkVal(val, fieldDecl));
			});

			return Promise.resolve().then(function() {
				if (!cond.length)
					return Promise.reject("ClientDataModel.load(): !cond.length");

				var columns = _this.getTableScheme().getKeys().map(function(column) {
					return "[" + column + "]";
				});

				var _query = ""
					+ " SELECT _fld_"
					+ " FROM ClientFIO"
					+ " WHERE " + cond.join(" OR ");

				var query = _query.replace("_fld_", columns);

				query += ";"
					+ " SELECT"
					+   "  uid"
					+   ", value"
					+   ", extClass"
					+   ", property"
					+   ", extId"
					+ " FROM Property"
					+ " WHERE"
					+   " extClass = 'ClientFIO'"
					+   " AND extId IN ("
					+       _query.replace("_fld_", "CAST(clid AS VARCHAR)")
					+   ")";

				return db.query({
					"dbcache": _this.iFabModuleGetDBCache(arg.dbcache, { "m": "m-client.load" }),
					"dbworker": arg.dbworker,
					"query": query
				});

			}).then(function(dbres) {
				var clientsTable = dbres[0].recs;
				var propsTable = dbres[1].recs;

				if (clientsTable.length > 1)
					return Promise.reject("ClientDataModel.load(): dbres.recs.length > 1");

				if (!clientsTable.length)
					return Promise.reject("ClientDataModel.load(): !dbres.recs.length");

				// сбросить старые поля
				_this.getKeys().forEach(function(k) {
					_this.set(k, void 0, null, !1);
				});

				// сбросить старые свойства
				_this.deleteFProperty();

				// установить новые поля
				_this.set(clientsTable[0]);

				// установить новые свойства
				_this.addFProperty(
					propsTable.filter(function(row) {
						return _this.get("clid", null, !1) == row.extId;
					})
				);

				_this.clearChanged();

				callback(_this, null);

			}).catch(function(err) {
				callback(_this, err);

				return Promise.reject(err);
			});
		},


		/**
		 * Вернуть афилированные предприятия
		 *
		 * @return {Array}
		 * */
		"getBranch": function() {
			return []; // TODO
		},


		"addBranch": function() {
			// TODO
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

			var _this = this;
			var callback = arg.callback || emptyFn;

			return _this.exists().then(function(isExists) {
				if (isExists) {
					return _this.update();
				}

				return _this.insert();

			}).then(function() {
				callback(_this, null);

			}).catch(function(err) {
				callback(_this, err);

				return Promise.reject(err);
			});
		},


		/**
		 * Записать нового контрагента в таблицу "ClientFIO"
		 *
		 * @param {Object} arg
		 * @param {Function=} arg.callback
		 * @param {String | Object=} arg.dbcache
		 *
		 * @return {Promise}
		 * */
		"insert": function(arg) {
			arg = arg || {};

			var _this = this;
			var callback = arg.callback || emptyFn;
			var db = _this.getDBInstance();

			_this.trigger("before-insert");

			return _this.exists().then(function(isExists) {
				if (isExists) {
					return Promise.reject("ClientDataModel.insert(): client already exists");
				}

			}).then(function() {
				var values = [];
				var fields = [];

				_this.getChanged().forEach(function(key) {
					var fldDecl = _this._clientsTableFldDecl.get(key || "");
					var val = _this.get(key, null, !1);

					if (!fldDecl || utils.isEmpty(val))
						return;

					fields.push(dbUtils.mkFld(key));
					values.push(dbUtils.mkVal(val, fldDecl));
				});

				var query = "INSERT INTO ClientFIO (" + fields.join(",") + ") VALUES (" + values.join(",") + ")";

				return db.dbquery({
					"dbworker": " ",
					"dbcache": _this.iFabModuleGetDBCache(arg.dbcache, { "m": "m-client.ins" }),
					"query": query
				});

			}).then(function() {
				var changed = _this.getChanged();
				var cond = [];

				changed.forEach(function(key) {
					var fldDecl = _this._clientsTableFldDecl.get(key || "");
					var val = _this.get(key, null, !1);

					if (!fldDecl || utils.isEmpty(val))
						return;

					cond.push(dbUtils.mkFld(key) + " = " + dbUtils.mkVal(val, fldDecl));
				});

				var query = "SELECT clid FROM ClientFIO WHERE " + cond.join(" AND ");

				return db.dbquery({
					"dbworker": " ",
					"dbcache": _this.iFabModuleGetDBCache(arg.dbcache, { "m": "m-client.ins-id" }),
					"query": query
				});

			}).then(function(dbres) {
				if (!dbres.recs.length)
					return reject('ClientDataModel.insert(): failed to get new client id');

				var id = dbres.recs[0].clid;

				_this.set("clid", id);

			}).then(function() {
				var clid = _this.get("clid", null, !1);

				var query = _this.getUpsertOrDelFPropsQueryStrByDBRes([], {
					"pid": clid,
					"extClass": "ClientFIO",
					"extId": clid
				});

				if (!query)
					return;

				return db.dbquery({
					"dbworker": " ",
					"dbcache": _this.iFabModuleGetDBCache(arg.dbcache, { "m": "m-client.ins-prop" }),
					"query": query
				});

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
		 * Обновить клиента в таблице "ClientFIO"
		 * @param {Object} arg
		 * @param {Function=} arg.callback
		 * @param {String | Object=} arg.dbcache
		 * @return {Promise}
		 * */
		"update": function(arg) {
			arg = arg || {};

			var _this = this;
			var db = this.getDBInstance();
			var callback = arg.callback || emptyFn;

			_this.trigger("before-update");

			return _this.exists().then(function(isExists) {
				if (!isExists) {
					return Promise.reject("ClientDataModel.update(): client do not exists");
				}

			}).then(function() {
				var sealedFLd   = new ObjectA({ "clid": 1 });
				var changed     = _this.getChanged();
				var values      = [];

				if (!changed.length)
					return;

				changed.forEach(function(key) {
					var dbFldDecl   = _this._clientsTableFldDecl.get(key || "");
					var val         = _this.get(key, null, !1);

					if (!dbFldDecl || utils.isEmpty(val) || sealedFLd.get(key))
						return;

					values.push(dbUtils.mkFld(key) + " = " + dbUtils.mkVal(val, dbFldDecl));
				});

				if (!values.length)
					return;

				var query = "UPDATE ClientFIO SET " + values.join(", ") + " WHERE clid = " + _this.get("clid");

				return db.dbquery({
					"dbworker": " ",
					"dbcache": _this.iFabModuleGetDBCache(arg.dbcache, { "m": "m-client.upd" }),
					"query": query
				});

			}).then(function() {
				var query = ""
					+ " SELECT uid, [value], property, extClass, extId"
					+ " FROM Property"
					+ " WHERE"
					+   " extClass = 'ClientFIO'"
					+   " AND extId = '" + _this.get('clid') + "'";

				return db.dbquery({
					"dbcache": _this.iFabModuleGetDBCache(arg.dbcache, { "m": "m-client.upd0" }),
					"dbworker": " ",
					"query": query
				});

			}).then(function(dbres) {
				var clid = _this.get("clid", null, !1);

				var query = _this.getUpsertOrDelFPropsQueryStrByDBRes(dbres.recs, {
					"pid": clid,
					"extClass": "ClientFIO",
					"extId": clid
				});

				if (!query)
					return;

				return db.dbquery({
					"dbcache": _this.iFabModuleGetDBCache(arg.dbcache, { "m": "m-client.upd1" }),
					"dbworker": " ",
					"query": query
				});

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
		 * Удалить частное лицо из БД
		 *
		 * @param {Object} arg
		 * @param {Function=} arg.callback
		 * @param {String | Object=} arg.dbcache
		 *
		 * @return {Promise}
		 * */
		"rm": function(arg) {
			arg = arg || {};

			var _this = this;
			var db = _this.getDBInstance();
			var callback = arg.callback || emptyFn;

			return new Promise(function(resolve, reject) {

				var id = _this.get("clid");

				if (!id)
					return reject("ClientDataModel.rm(): !clid");

				var query = ""
					+ "  DELETE FROM Property WHERE extClass = 'ClientFIO' AND extId = '" + id + "" + "'"
					+ "; DELETE FROM ClientFIO WHERE clid = " + id;

				return db.dbquery({
					"dbworker": " ",
					"dbcache": _this.iFabModuleGetDBCache(arg.dbcache, { "m": "m-client.rm" }),
					"query": query
				});

			}).then(function() {
				callback(_this, null);

			}).catch(function(err) {
				callback(_this, err);

				return Promise.reject(err);
			});
		},


		/**
		 * Проверить существование контрагента в БД
		 *
		 * @param {Object=} arg
		 * @param {function=} arg.callback
		 * @param {String | Object=} arg.dbcache
		 *
		 * @return {Promise}
		 * */
		"exists": function(arg) {
			arg = arg || {};

			var _this = this;
			var callback = arg.callback || emptyFn;
			var id = _this.get("clid");
			var db = _this.getDBInstance();

			if (utils.isEmpty(id)) {
				callback(_this, null, false);

				return Promise.resolve(false);
			}

			var query = ""
				+ " SELECT clid"
				+ " FROM ClientFIO"
				+ " WHERE"
				+   " clid = " + id;

			return db.dbquery({
				"dbcache": _this.iFabModuleGetDBCache(arg.dbcache, { "m": "m-client.exs" }),
				"query": query
			}).then(function(dbres) {
				callback(_this, null, !!dbres.recs.length);

				return !!dbres.recs.length;

			}).catch(function(err) {
				callback(err);

				return Promise.reject(err);
			});
		}

	}
);

module.exports = ClientDataModel;