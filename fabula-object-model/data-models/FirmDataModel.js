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


FirmDataModel.getTableScheme = function() {
	return FirmDataModel.prototype._firmsTableFldDecl;
};


FirmDataModel.getTableName = function() {
	return "Firms";
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


		"getTableScheme": function() {
			return FirmDataModel.getTableScheme();
		},


		"getTableName": function() {
			return FirmDataModel.getTableName();
		},


		/**
		 * Записать в таблицу _firms
		 * @private
		 * @param arg
		 * @param {String | Object=} arg.dbcache
		 * @return {Promise}
		 * */
		"_promiseInsertUsr": function(arg) {
			arg = arg || {};

			var self = this;

			return new Promise(function(resolve, reject) {
				var db = self.getDBInstance(),
					values = [],
					fields = [];

				self.getChanged().forEach(function(key) {
					var fldDecl = self._firmsTableFldDecl.get(key || ""),
						val = self.get(key, null, !1);

					if (!fldDecl || utils.isEmpty(val))
						return;

					fields.push(dbUtils.mkFld(key));
					values.push(dbUtils.mkVal(val, fldDecl));
				});

				db.dbquery({
					"dbworker": " ",
					"dbcache": self.iFabModuleGetDBCache(arg.dbcache, { "m": "m-firm.ins" }),
					"query": "INSERT INTO firms (" + fields.join(",") + ") VALUES (" + values.join(",") + ")",
					"callback": function(dbres, err) {
						if (err = dbUtils.fetchErrStrFromRes(dbres))
							return reject(err);

						resolve();
					}
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

			var self = this;

			return new Promise(function(resolve, reject) {
				var db = self.getDBInstance(),
					changed = self.getChanged(),
					cond = [];

				changed.forEach(function(key) {
					var fldDecl = self._firmsTableFldDecl.get(key || ""),
						val = self.get(key, null, !1);

					if (!fldDecl || utils.isEmpty(val))
						return;

					cond.push(dbUtils.mkFld(key) + " = " + dbUtils.mkVal(val, fldDecl));
				});

				db.dbquery({
					"dbworker": " ",
					"dbcache": self.iFabModuleGetDBCache(arg.dbcache, { "m": "m-firm.ins-id" }),
					"query": "SELECT firmId FROM firms WHERE " + cond.join(" AND "),
					"callback": function(dbres, err) {
						if (err = dbUtils.fetchErrStrFromRes(dbres))
							return reject(err);

						if (!dbres.recs.length)
							return reject('FirmDataModel._promiseGetInsertedId(): failed to get new "firmId"');

						var id = dbres.recs[0].firmId;

						self.set("firmId", id);

						resolve(id);
					}
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

			var self = this;

			return new Promise(function(resolve, reject) {
				var sealedFLd = new ObjectA({ "firmId": 1 }),
					db = self.getDBInstance(),
					changed = self.getChanged(),
					values = [];

				if (!changed.length)
					return resolve();

				changed.forEach(function(key) {
					var dbFldDecl = self._firmsTableFldDecl.get(key || ""),
						val = self.get(key, null, !1);

					if (!dbFldDecl || utils.isEmpty(val) || sealedFLd.get(key))
						return;

					values.push(dbUtils.mkFld(key) + " = " + dbUtils.mkVal(val, dbFldDecl));
				});

				if (!values.length)
					return resolve();

				db.dbquery({
					"dbworker": " ",
					"dbcache": self.iFabModuleGetDBCache(arg.dbcache, { "m": "m-firm.upd" }),
					"query": "UPDATE firms SET " + values.join(", ") + " WHERE firmId = " + self.get("firmId"),
					"callback": function(dbres, err) {
						if (err = dbUtils.fetchErrStrFromRes(dbres))
							return reject(err);

						resolve();
					}
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

			var _this           = this;
			var db              = _this.getDBInstance();
			var callback        = arg.callback || emptyFn;
			var cond            = [];

			["firmId", "tel3", "tel2", "tel1", "tel", "email"].forEach(function(fld) {
				var fieldDecl   = _this._firmsTableFldDecl.get(fld);
				var val         = _this.get(fld);

				if (!fieldDecl)
					return;

				if (!val)
					return;

				cond.push(dbUtils.mkFld(fld) + " = " + dbUtils.mkVal(val, fieldDecl));
			});

			return Promise.resolve().then(function() {
				if (!cond.length)
					return Promise.reject("FirmDataModel.load(): !cond.length");

				var columns = _this.getTableScheme().getKeys().map(function(column) {
					return "[" + column + "]";
				});

				var _query = ""
					+ " SELECT _fld_"
					+ " FROM firms AS t_firms"
					+ " WHERE " + cond.join(" OR ");

				var query = ""
					+ _query.replace("_fld_", columns)
					+ " OR parent_id IN (" + _query.replace("_fld_", "firmId") + ")";

				query += ";"
					+ " SELECT"
					+   " uid,"
					+   " value,"
					+   " extClass,"
					+   " property,"
					+   " extId"
					+ " FROM Property"
					+ " WHERE"
					+   " extClass = 'FIRMS'"
					+   " AND extId IN ("
					+       _query.replace("_fld_", "CAST(firmId AS VARCHAR)")
					+   ")";

				return db.query({
					"dbcache": _this.iFabModuleGetDBCache(arg.dbcache, { "m": "m-firm.load" }),
					"dbworker": arg.dbworker,
					"query": query
				});

			}).then(function(dbres) {
				var parentFirmRow,
					firmsTable = dbres[0].recs,
					propsTable = dbres[1].recs;

				if (!firmsTable.length)
					return Promise.reject("FirmDataModel.load(): !dbres.recs.length");

				_this._mFirmBranches = [];

				firmsTable.forEach(function(row) {
					var _row = new ObjectA(row),

						isParent = ["firmId", "tel", "email", "tel3", "tel2", "tel1"].some(function(key) {
							var value0 = (_this.get(key) + "").toLowerCase();
							var value1 = (_row.get(key) + "").toLowerCase();

							if (!value0 || !value1)
								return;

							return value0 == value1;
						});

					if (isParent) {
						parentFirmRow = row;

					} else {
						var firm = new FirmDataModel();

						firm.set('firmId', _row.get('firmId'));

						// Не записывать корневую фирму (не создавать рекурсию)
						if (firm.get('parent_id'))
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

			var self = this,
				callback = arg.callback || emptyFn;

			self.trigger("before-insert");

			return self.exists().then(function(isEx) {
				if (isEx)
					return Promise.reject("FirmDataModel.insert(): firm already exists");

			}).then(function() {
				return self._promiseInsertUsr();

			}).then(function() {
				return self._promiseGetInsertedId();

			}).then(function() {
				return new Promise(function(resolve, reject) {
					var firmId = self.get("firmId", null, !1);

					var query = self.getUpsertOrDelFPropsQueryStrByDBRes([], {
						"pid": firmId,
						"extClass": "FIRMS",
						"extId": firmId
					});

					if (!query)
						return resolve();

					self.getDBInstance().dbquery({
						"dbworker": " ",
						"dbcache": self.iFabModuleGetDBCache(arg.dbcache, { "m": "m-firm.ins-prop" }),
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
					self.getBranch().map(function(firm) {
						firm.set("parent_id", self.get("FirmId"));

						return firm.save();
					})
				);

			}).then(function() {
				self.clearChanged();

				self.trigger("after-insert");

				callback(self, null);

			}).catch(function(err) {
				callback(self, err);

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

			var self = this,
				db = this.getDBInstance(),
				callback = arg.callback || emptyFn;

			self.trigger("before-update");

			return self.exists().then(function(isEx) {
				if (!isEx)
					return Promise.reject("FirmDataModel.update(): firm do not exists");

			}).then(function() {
				return self._promiseUpdateUsr()

			}).then(function() {
				return new Promise(function(resolve, reject) {
					db.dbquery({
						"dbcache": self.iFabModuleGetDBCache(arg.dbcache, { "m": "m-firm.upd0" }),
						"dbworker": " ",
						"query": ""
						+ " SELECT uid, [value], property, extClass, extId"
						+ " FROM Property"
						+ " WHERE"
						+   " extClass = 'FIRMS'"
						+   " AND extId = '" + self.get('firmId') + "'",
						"callback": function(dbres, err) {
							if (err = dbUtils.fetchErrStrFromRes(dbres))
								return reject(err);

							resolve(dbres);
						}
					});

				});

			}).then(function(dbres) {
				return new Promise(function(resolve, reject) {
					var firmId = self.get("firmId", null, !1);

					var query = self.getUpsertOrDelFPropsQueryStrByDBRes(dbres.recs, {
						"pid": firmId,
						"extClass": "FIRMS",
						"extId": firmId
					});

					if (!query)
						return resolve();

					self.getDBInstance().dbquery({
						"dbcache": self.iFabModuleGetDBCache(arg.dbcache, { "m": "m-firm.upd1" }),
						"dbworker": " ",
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
					self.getBranch().map(function(firm) {
						if (firm.get("firmId") == self.get("firmId"))
							return;

						firm.set("parent_id", self.get("FirmId"));

						return firm.save();
					})
				);

			}).then(function() {
				self.clearChanged();

				self.trigger("after-update");

				callback(self, null);

			}).catch(function(err) {
				callback(self, err);

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

			var self = this,
				callback = arg.callback || emptyFn;

			return new Promise(function(resolve, reject) {
				var db = self.getDBInstance(),
					id = self.get("firmId");

				if (!id)
					return reject("FirmDataModel.rm(): !usrId");

				db.dbquery({
					"dbworker": " ",

					"dbcache": self.iFabModuleGetDBCache(arg.dbcache, { "m": "m-firm.rm" }),

					"query": ""
					+ "DELETE FROM Property WHERE extClass = 'FIRMS' AND extId = '" + id+ "" + "'"
					+ "; DELETE FROM firms WHERE firmId = " + id,

					"callback": function(dbres, err) {
						if (err = dbUtils.fetchErrStrFromRes(dbres))
							return reject(err);

						resolve();
					}
				});

			}).then(function() {
				callback(self, null)

			}).catch(function(err) {
				callback(self, err);

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

			if (utils.isEmpty(id)) {
				callback(_this, null, false);

				return Promise.resolve(false);
			}

			var query = ""
				+ " SELECT email"
				+ " FROM firms"
				+ " WHERE"
				+   " firmId = " + id;

			return db.dbquery({
				"dbcache": _this.iFabModuleGetDBCache(arg.dbcache, { "m": "m-firm.exs" }),
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

module.exports = FirmDataModel;