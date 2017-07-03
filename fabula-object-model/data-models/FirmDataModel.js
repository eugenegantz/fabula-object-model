"use strict";

var DefaultDataModel    = require("./DefaultDataModel"),
	InterfaceFProperty  = require("./InterfaceFProperty"),
	IFabModule          = require("./IFabModule.js"),
	ObjectA             = require("./ObjectA.js"),
	emptyFn             = function() {},
	dbUtils             = require("./../utils/dbUtils.js"),
	utils               = require("./../utils/utils");

var FirmDataModel = function() {
	DefaultDataModel.call(this);
	IFabModule.call(this);
	InterfaceFProperty.call(this);

	this._mFirmBranches = [];
};

FirmDataModel.prototype = utils.createProtoChain(
	DefaultDataModel.prototype,
	IFabModule.prototype,
	InterfaceFProperty.prototype,
	{

		_firmsTableFldDecl: ObjectA.create({
			"FirmID":           { "type": "integer" },
			"Tick":             { "type": "integer" },
			"ID":               { "type": "integer" },
			"NDS":              { "type": "boolean" },
			"Parent_ID":        { "type": "integer" },
			"IsFict":           { "type": "integer" },
			"Type":             { "type": "string" },
			"Name":             { "type": "string" },
			"FullName":         { "type": "string" },
			"UrName":           { "type": "string" },
			"City_ID":          { "type": "integer" },
			"Selo_ID":          { "type": "integer" },
			"Street_ID":        { "type": "integer" },
			"House":            { "type": "string" },
			"Flat":             { "type": "string" },
			"Build_ID":         { "type": "integer" },
			"PostIndex":        { "type": "string" },
			"PostAddress":      { "type": "string" },
			"Addr":             { "type": "string" },
			"EditPA":           { "type": "string" },
			"UrAddress":        { "type": "string" },
			"Tel":              { "type": "string" },
			"Fax":              { "type": "string" },
			"Email":            { "type": "string" },
			"ChiefPosition":    { "type": "string" },
			"ChiefName":        { "type": "string" },
			"ChiefSex":         { "type": "integer" },
			"ContactPosition":  { "type": "string" },
			"ContactName":      { "type": "string" },
			"LastEdit":         { "type": "date" },
			"User":             { "type": "string" },
			"INN":              { "type": "string" },
			"OKPO":             { "type": "string" },
			"KPP":              { "type": "string" },
			"Svid":             { "type": "string" },
			"Deleted":          { "type": "string" },
			"IsAgency":         { "type": "boolean" },
			"Tags":             { "type": "string" },
			"Tel1":             { "type": "string" },
			"Tel2":             { "type": "string" },
			"Tel3":             { "type": "string" },
			"DateNew":          { "type": "date" },
			"UserNew":          { "type": "string" },
			"DateEdit":         { "type": "date" },
			"UserEdit":         { "type": "string" }
		}),


		"_promiseInsertUsr": function() {
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
					values.push(dbUtils.mkVal(val, fldDecl.type));
				});

				db.dbquery({
					"query": "INSERT INTO _firms (" + fields.join(",") + ") VALUES (" + values.join(",") + ")",
					"callback": function(dbres, err) {
						if (err = dbUtils.fetchErrStrFromRes(dbres))
							return reject(err);

						resolve();
					}
				});
			});
		},


		"_promiseGetInsertedId": function() {
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

					cond.push(dbUtils.mkFld(key) + " = " + dbUtils.mkVal(val, fldDecl.type));
				});

				db.dbquery({
					"query": "SELECT firmId FROM _firms WHERE " + cond.join(" AND "),
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


		"_promiseUpdateUsr": function() {
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

					values.push(dbUtils.mkFld(key) + " = " + dbUtils.mkVal(val, dbFldDecl.type));
				});

				db.dbquery({
					"query": "UPDATE _firms SET " + values.join(", ") + " WHERE firmId = " + self.get("firmId"),
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
		 * @return {Promise}
		 * */
		"load": function(arg) {
			arg = arg || {};

			var self = this,
				db = self.getDBInstance(),
				callback = arg.callback || emptyFn,
				cond = ["firmId = " + (self.get("firmId") || "NULL")];

			["tel3", "tel2", "tel1", "email"].forEach(function(fld) {
				self.get(fld) && cond.push("[" + fld + "] = " + "'" + self.get(fld) + "'")
			});

			var _query = ""
				+ " SELECT _fld_"
				+ " FROM _firms AS t_firms"
				+ " WHERE " + cond.join(" OR ");

			var query = ""
				+ _query.replace("_fld_", "*")
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
				+       _query.replace("_fld_", "CSTR(firmId)")
				+   ")";

			return new Promise(function(resolve, reject) {
				db.dbquery({
					"query": query,
					"callback": function(dbres, err) {
						if (err = dbUtils.fetchErrStrFromRes(dbres))
							return reject(err);

						resolve(dbres);
					}
				});

			}).then(function(dbres) {
				var parentFirmRow,
					firmsTable = dbres[0].recs,
					propsTable = dbres[1].recs;

				self._mFirmBranches = [];

				self.getKeys().forEach(function(k) {
					self.unDeclField(k);
				});

				self.deleteFProperty();

				if (!firmsTable.length)
					return Promise.reject("FirmDataModel.load(): !dbres.recs.length");

				firmsTable.forEach(function(row) {
					var _row = new ObjectA(row);

					if (!_row.get("parent_id")) {
						parentFirmRow = row;

					} else {
						var firm = new FirmDataModel();

						firm.set(row);

						self.addBranch(firm);
					}
				});

				if (!parentFirmRow)
					return Promise.reject("FirmDataModel.load(): parent firm not found");

				self.set(parentFirmRow);

				self.addFProperty(propsTable.filter(function(row) {
					return self.get("firmId", null, !1) == row.extId;
				}));

				return Promise.all(
					self.getBranch().map(function(firm) {
						return firm.load();
					})
				);

			}).then(function() {
				self.clearChanged();

				callback(self, null);

			}).catch(function(err) {
				callback(self, err);

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
		 * Записать нового контрагента в таблицу Firms
		 * @param {Object} arg
		 * @param {Function=} arg.callback
		 * @return {Promise}
		 * */
		"insert": function(arg) {
			arg = arg || {};

			var self = this,
				callback = arg.callback || emptyFn;

			self.trigger("before-insert");

			return self.exists()
				.then(function(isEx) {
					if (isEx)
						return Promise.reject("FirmDataModel.insert(): firm already exists");

					return Promise.resolve();
				})
				.then(self._promiseInsertUsr.bind(self))
				.then(self._promiseGetInsertedId.bind(self))
				.then(function() {
					return new Promise(function(resolve, reject) {
						var query = self.getUpsertOrDelFPropsQueryStrByDBRes([], {
							"pid": null,
							"extClass": "FIRMS",
							"extId": self.get("firmId", null, !1)
						});

						if (!query)
							return resolve();

						self.getDBInstance().dbquery({
							"query": query,
							"callback": function(dbres, err) {
								if (err = dbUtils.fetchErrStrFromRes(dbres))
									return reject(err);

								resolve();
							}
						});
					});
				})
				.then(function() {
					return Promise.all(
						self.getBranch().map(function(firm) {
							firm.set("parent_id", self.get("FirmId"));

							return firm.save();
						})
					);
				})
				.then(function() {
					self.clearChanged();

					self.trigger("after-insert");

					callback(self, null);
				})
				.catch(function(err) {
					callback(self, err);

					return Promise.reject(err);
				});
		},


		/**
		 * Обновить контрагента в таблице Firms
		 * @param {Object} arg
		 * @param {Function=} arg.callback
		 * @return {Promise}
		 * */
		"update": function(arg) {
			arg = arg || {};

			var self = this,
				db = this.getDBInstance(),
				callback = arg.callback || emptyFn;

			self.trigger("before-update");

			return self.exists()
				.then(function(isEx) {
					if (!isEx)
						return Promise.reject("FirmDataModel.update(): firm do not exists");

					return Promise.resolve();
				})
				.then(self._promiseUpdateUsr.bind(self))
				.then(function() {
					return new Promise(function(resolve, reject) {
						db.dbquery({
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

					})
				})
				.then(function(dbres) {
					return new Promise(function(resolve, reject) {
						var query = self.getUpsertOrDelFPropsQueryStrByDBRes(dbres.recs, {
							"pid": null,
							"extClass": "FIRMS",
							"extId": self.get("firmId", null, !1)
						});

						if (!query)
							return resolve();

						self.getDBInstance().dbquery({
							"query": query,
							"callback": function(dbres, err) {
								if (err = dbUtils.fetchErrStrFromRes(dbres))
									return reject(err);

								resolve();
							}
						});
					});
				})
				.then(function() {
					return Promise.all(
						self.getBranch().map(function(firm) {
							firm.set("parent_id", self.get("FirmId"));

							return firm.save();
						})
					);
				})
				.then(function() {
					self.clearChanged();

					self.trigger("after-update");

					callback(self, null);
				})
				.catch(function(err) {
					callback(self, err);

					return Promise.reject(err);
				});
		},


		/**
		 * Удалить контрагента из БД
		 * @param {Object} arg
		 * @param {Function=} arg.callback
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
					"query": "" +
					"DELETE FROM Property WHERE extClass = 'FIRMS' AND extId = '" + id + "';" +
					"DELETE FROM _firms WHERE firmId = " + id,
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
		 * @return {Promise}
		 * */
		"exists": function(arg) {
			var self = this,
				callback = arg.callback || emptyFn,
				id = self.get("firmId"),
				db = self.getDBInstance();

			return new Promise(function(resolve, reject) {
				if (utils.isEmpty(db))
					return reject("FirmDataModel.exists(): firmId is empty");

				db.dbquery({
					query: ""
					+ " SELECT email"
					+ " FROM _firms AS firms"
					+ " WHERE"
					+   " firmId = " + id,
					"callback": function(dbres, err) {
						if (err = dbUtils.fetchErrStrFromRes(dbres)) {
							callback(err);

							return reject(err);
						}

						callback(self, null, !!dbres.recs.length);

						resolve(!!dbres.recs.length);
					}
				});
			});
		}

	}
);

module.exports = FirmDataModel;