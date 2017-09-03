"use strict";

var _utils                  = require("./../utils/utils"),
	dbUtils                 = require("./../utils/dbUtils.js"),
	emptyFn                 = function() {},
	DefaultDataModel        = require("./DefaultDataModel"),
	IMovCollection          = require("./IMovCollection.js"),
	InterfaceFProperty      = require("./InterfaceFProperty"),
	IFabModule              = require("./IFabModule.js"),
	ObjectA                 = require("./ObjectA.js"),
	MovDataModel            = require("./MovDataModel");

// TODO пересмотреть алиасы
/**
 * @constructor
 * @augments DefaultDataModel
 * */
var DocDataModel = function() {
	DefaultDataModel.call(this);
	InterfaceFProperty.call(this);
	IMovCollection.call(this);
	IFabModule.call(this);

	// -------------------------------------

	this.mDocEvents.getKeys().forEach(function(key) {
		this.mDocEvents.get(key).forEach(function(fn) {
			this.on(key, fn);
		}, this);
	}, this);

	// -------------------------------------

	this._mDocClsHistory();

	this.state = this.STATE_DOC_INITIAL;
};

DocDataModel.prototype = DefaultDataModel.prototype._objectsPrototyping(
	DefaultDataModel.prototype,
	InterfaceFProperty.prototype,
	IMovCollection.prototype,
	IFabModule.prototype,
	{
		// только что созданный, неинициализированный объект
		"STATE_DOC_INITIAL": Math.random(),


		// объект инициализирован из БД
		"STATE_DOC_READY": Math.random(),


		// объект удален из БД
		"STATE_DOC_REMOVED": Math.random(),


		"mDocEvents": new ObjectA({

			"set:docid": [
				function(self, e) {
					self = this;

					if (
						!e.value
						|| typeof e.value != "string"
						|| e.value.length != 10
					) {
						return;
					}

					var parsed = this.parseDocID(e.value);

					self.set("docType", parsed.docType, null, !1);
					self.set("company", parsed.company, null, !1);
					self.movSet("doc", e.value);
				}
			],

			"set:company": [
				function(self, e) {
					self = this;

					var docId = this.get("docId", null, !1);

					if (!docId)
						return;

					var p = this.parseDocID(docId);

					self.set("docId", e.value + p.year + p.prefix + p.code, null, !1);
					self.movSet("doc", self.get("docId", null, !1));
				}
			],

			"set:doctype": [
				function(self, e) {
					self = this;

					var gands = this.getGandsInstance(),
						docId = self.get("docId", null, !1);

					if (!docId)
						return;

					var p = this.parseDocID(self.get("docId", null, !1)),
						docType = e.value,
						prefix;

					var gsGroup = gands.dataRefByGSIDGroup.get("SYОП");

					gsGroup.some(function(row) {
						if (8 == row.GSID.length && row.GSID.slice(4) == docType)
							return prefix = row.GSCodeNumber;
					});

					if (!prefix)
						return;

					self.set("docId", p.company + p.year + prefix + p.code, null, !1);
					self.movSet("doc", self.get("docId"));
				}
			],

			"add-fab-mov": [
				function(self, e) {
					e.mov.set("doc", this.get("docId"))
				}
			]

		}),


		/**
		 * Примеить свойство ко всем задачам внутри заявки
		 * */
		"movSet": function() {
			var args = arguments;

			this.getMov().forEach(function(mov) {
				if (!mov || typeof mov != "object")
					return;

				mov.set.apply(mov, args);
			});

			return this;
		},


		/**
		 * Удалить заявку и все подчиненные ей записи из БД
		 * @param {Function=} arg.callback
		 * */
		"rm": function(arg) {
			var self        = this,
				db          = this.getDBInstance(),
				callback    = arg.callback || emptyFn,
				docId       = this.get("docId", null, !1);

			return Promise.resolve().then(function() {
				if (!docId)
					return Promise.reject("DocDataMode.rm(): !this.docId");

				if (self.state == self.STATE_DOC_READY)
					return Promise.resolve();

				return self.load();

			}).then(function() {
				var promises = [
					new Promise(function(resolve, reject) {
						db.dbquery({
							"query": ""
							+ " DELETE"
							+ " FROM Property"
							+ " WHERE"
							+   " extClass = 'DOCS'"
							+   " AND pid = 0"
							+   " AND extId = '" + docId + "'"

							+ "; DELETE"
							+ " FROM Ps_property"
							+ " WHERE"
							+   " extClass = 'DOCS'"
							+   " AND pid = 0"
							+   " AND extId = '" + docId + "'"

							+ "; DELETE"
							+   " FROM Docs"
							+   " WHERE"
							+       " docId = '" + docId + "'",

							"callback": function(dbres, err) {
								if (err = dbUtils.fetchErrStrFromRes(dbres))
									return reject(err);

								resolve();
							}
						});
					})
				];

				self.getMov().forEach(function(mov) {
					if (!mov.get("mmId", null, !1))
						return;

					promises.push(mov.rm());
				});

				return Promise.all(promises);

			}).then(function() {
				self.state = self.STATE_DOC_REMOVED;

				callback(null, self);

			}).catch(function(err) {
				callback(err, self);

				return Promise.reject(err);
			});
		},


		/**
		 * Сохранить (Добавить/обновить)
		 * @param {Object=} arg
		 * @param {Function=} arg.callback
		 * @return {Promise}
		 * */
		"save": function(arg) {
			arg = arg || {};

			var self            = this,
				dbawws          = self.getDBInstance(),
				callback        = arg.callback || emptyFn,
				docType         = self.get("docType", null, !1),
				companyID       = self.get("company", null, !1);

			delete arg.callback;

			return Promise.resolve().then(function() {
				if (!self.get("docId", null, !1)) {
					return self.getNewDocID({
						"docType": docType,
						"companyID": companyID
					}).then(function(docId) {
						self.set("docId", docId);

						return self.insert(arg);
					});
				}

				return new Promise(function(resolve, reject) {
					dbawws.dbquery({
						"query": "" +
						"SELECT" +
						"   ID," +
						"   DocID" +
						" FROM DOCS" +
						" WHERE" +
						"   DocID = '" + self.get("docId") + "'" +
						"   OR id = " + self.get("id"),
						"callback": function(dbres, err) {
							if (err = dbUtils.fetchErrStrFromRes(dbres))
								return reject(err);

							resolve(dbres);
						}
					});

				}).then(function(dbres) {
					if (dbres.recs.length) {
						self.set("id", dbres.recs[0].ID, null, !1);

						return self.update(arg);
					}

					if (self.get("docId", null, !1)) {
						self.set("id", null, null, !1);

						return self.insert(arg);
					}

					return self.getNewDocID({
						"docType": docType,
						"companyID": companyID
					}).then(function(docId) {
						self.set("id", null);
						self.set("docId", docId);

						return self.insert(arg);
					})
				});

			}).then(function() {
				callback(null, self)

			}).catch(function(err) {
				callback(err, self);

				return Promise.reject(err);
			});
		},


		/**
		 * @param {Object=} arg
		 * @param {Function=} arg.callback
		 * @return {Promise}
		 * */
		"insert": function(arg) {
			arg = arg || {};

			var self            = this,
				docId           = this.get("docId", null, !1),
				callback        = arg.callback || emptyFn,
				dbawws          = self.getDBInstance(),
				dbq             = [],
				docFieldsDecl   = this.__docDataModelsDefaultFields,
				disabledFields  = new ObjectA({ "id": 1 }),
				values          = [],
				fields          = [];

			self.trigger("before-insert");

			docFieldsDecl.getKeys().forEach(function(key) {
				if (disabledFields.get(key))
					return;

				var val,
					fldDecl = docFieldsDecl.get(key);

				// если поле пустое (кроме чисел) - пропустить
				if (
					_utils.isEmpty(val = self.get(key, null, !1))
					&& _utils.isEmpty(val = fldDecl.value)
				) {
					return;
				}

				values.push(dbUtils.mkVal(val, fldDecl));
				fields.push(dbUtils.mkFld(key));
			});

			dbq.push("INSERT INTO DOCS (" + fields.join(",") + ") VALUES (" + values.join(",") + ")");
			dbq.push("DELETE FROM Property WHERE extClass = 'DOCS' AND extId = '" + docId + "' ");

			dbq.push.apply(
				dbq,
				[].concat(
					self.getUpsertOrDelFPropsQueryStrByDBRes([], {
						"extClass": "DOCS",
						"extId": docId,
						"pid": 0
					}) || []
				)
			);

			return new Promise(function(resolve, reject) {
				dbawws.dbquery({
					"query": dbq.join("; "),
					"callback": function(dbres, err) {
						if (err = dbUtils.fetchErrStrFromRes(dbres))
							return reject(err);

						resolve();
					}
				});

			}).then(function() {
				var promises = [
					new Promise(function(resolve, reject) {
						dbawws.dbquery({
							"query": "SELECT id FROM Docs WHERE docId = '" + self.get("docId", null, !1) + "'",
							"callback": function(dbres, err) {
								if (err = dbUtils.fetchErrStrFromRes(dbres))
									return reject(err);

								self.set("id", dbres.recs[0].id, null, !1);

								resolve();
							}
						})
					})
				];

				promises.push.apply(
					promises,
					self.getMov().map(function(mov) {
						if (mov.get("doc1") != docId)
							mov.set("doc", docId);

						return mov.save();
					})
				);

				return Promise.all(promises);

			}).then(function() {
				self._mDocClsHistory();

				callback(null, self);

				self.trigger("after-insert");

			}).catch(function(err) {
				callback(err, self);

				return Promise.reject(err);
			});
		},


		/**
		 * @param {Object=} ownArg - аргументы для сохр. заявки
		 * @param {Function=} ownArg.callback
		 * @param {Array=} ownArg.excludeMovs - игнорировать изменения в перечисленных подчиненных задачах. Массив из MMID (integer)
		 * @param {Object=} parentArg - аргументы сохранения родительской заявки, если такая есть
		 * @param {Object=} childrenArg - аргумент сохр. подчиненной заявки, если такие есть
		 * @param {Object=} movArg - аргументы сохранения подчиненных задач // см. MovDataModel
		 * @return {Promise}
		 * */
		"update": function(ownArg, parentArg, childrenArg, movArg) {
			ownArg = ownArg || {};
			movArg = movArg || {};

			var self            = this,
				callback        = ownArg.callback || emptyFn,
				excludeMovs     = ownArg.excludeMovs || [],
				dbawws          = self.getDBInstance();

			self.trigger("before-update");

			return new Promise(function(resolve, reject) {
				dbawws.dbquery({
					"query": ""
					+ "SELECT"
					+   " uid,"
					+   " property,"
					+   " [value],"
					+   " ExtID"
					+ " FROM Property "
					+ " WHERE "
					+   " pid = 0"
					+   " AND ExtClass = 'DOCS' "
					+   " AND ExtID IN ("
					+       " SELECT DocID"
					+       " FROM DOCS"
					+       " WHERE"
					+           " id = " + self.get("id", null, !1)
					+   ")"

					+ ";"
					+ " SELECT MMID"
					+ " FROM Movement"
					+ " WHERE"
					+   " Doc IN ("
					+       " SELECT DocID"
					+       " FROM DOCS"
					+       " WHERE"
					+           " id = " + self.get("id", null, !1)
					+   ")",

					"callback": function(dbres, err) {
						if (err = dbUtils.fetchErrStrFromRes(dbres))
							return reject(err);

						resolve(dbres);
					}
				});

			}).then(function(dbres) {
				var changedFields = self.getChanged(),
					docFieldsDecl = self.__docDataModelsDefaultFields,

					disabledFields = new ObjectA({
						"id": 1,
						"regdate": 1,
						"datenew": 1,
						"useredit": 1,
						"dateedit": 1
					}),

					dbPropsRecs         = dbres[0].recs,
					dbMovsRecs          = dbres[1].recs,
					selfMovsRefByMMId   = {},
					values              = [],
					dbq                 = [];

				// ------------------------------------
				// Обновление полей в строке
				// ------------------------------------
				changedFields.forEach(function(key) {
					var fldDecl = docFieldsDecl.get(key);

					if (!fldDecl)
						return;

					if (disabledFields.get(key))
						return;

					values.push(
						dbUtils.mkFld(key) + " = " +
						dbUtils.mkVal(self.get(key), fldDecl)
					);
				});

				if (values.length)
					dbq.push("UPDATE DOCS SET " + values.join(", ") + " WHERE ID = " + self.get("ID"));

				// --------------------------------------

				dbq.push.apply(
					dbq,
					[].concat(
						self.getUpsertOrDelFPropsQueryStrByDBRes(dbPropsRecs, {
							"pid": 0,
							"extId": self.get("docId", null, !1),
							"extClass": "DOCS"
						}) || []
					)
				);

				// --------------------------------------

				self.getMov().forEach(function(mov) {
					if (!mov || typeof mov != "object")
						return;

					selfMovsRefByMMId[mov.get("mmid", null, !1)] = mov;
				});

				// --------------------------------------

				var promises = [];

				if (dbq.length) {
					promises.push(
						new Promise(function(resolve, reject) {
							dbawws.dbquery({
								"query": dbq.join("; "),
								"callback": function(dbres, err) {
									if (err = dbUtils.fetchErrStrFromRes(dbres))
										return reject(err);

									resolve();
								}
							});
						})
					);
				}

				// --------------------------------------
				// Список удаленных подчиненных задач
				// --------------------------------------
				dbMovsRecs.forEach(function(row) {
					if (selfMovsRefByMMId[row.MMID])
						return;

					var mov = new MovDataModel();

					mov.set("mmId", row.MMID);

					promises.push(mov.rm());
				});

				// --------------------------------------

				return Promise.all(promises).then(function() {
					return Promise.all(
						self.getMov().reduce(function(prev, mov) {
							if (!mov.getChanged().length && !mov.hasChangedFProperty())
								return prev;

							if (!!~excludeMovs.indexOf(mov.get("MMID")))
								return prev;

							if (
								mov.get("Doc1") != self.get("DocID")
								&& mov.get("Doc") != self.get("DocID")
							) {
								mov.set("Doc", self.get("DocID"));
							}

							prev.push(mov.save(movArg));

							return prev;
						}, [])
					);
				});

			}).then(function() {
				self._mDocClsHistory();

				callback(null, self);

				self.trigger("after-update");

			}).catch(function(err) {
				callback(err, self);

				return Promise.reject(err);
			});
		},


		"serializeObject": function() {
			var fieldsDecl = this.__docDataModelsDefaultFields,

				ret = {
					"className": "DocDataModel",
					"fields": {},
					"movs": [],
					"props": JSON.parse(JSON.stringify(this.getProperty()))
				};

			this.getKeys().forEach(function(key) {
				if (!fieldsDecl.get(key))
					return;

				ret.fields[key] = this.get(key);
			}, this);

			ret.movs = this.getMov().map(function(mov) {
				return mov.getJSON();
			});

			return ret;
		},


		/**
		 * @deprecated
		 * */
		"getJSON": function() {
			return this.serializeObject();
		},


		/**
		 * Инициализировать заявку
		 * @param {Object=} arg
		 * @param {Function=} arg.callback
		 * @return {Promise}
		 * */
		"load": function(arg) {
			arg = arg || {};

			var self        = this,
				dbawws      = self.getDBInstance(),
				callback    = arg.callback || emptyFn,
				docId       = self.get("docId", null, !1),
				useSubMovs  = !!arg.useSubMovs, // TODO переименовать arg.useSubMovs
				docFieldsDecl = self.__docDataModelsDefaultFields,
				fields      = arg.fields;

			if (!docId)
				return Promise.reject("DocDataModel.load(): docId field is not assigned");

			if (!fields || !fields.length) {
				fields = [
					"ID",
					"DocID",
					"Agent",
					"Manager",
					"User",
					"Person",
					"FirmContract",
					"Sum1",
					"Debt",
					"Company",
					"DocType",
					"Status",
					"Format(RegDate,'yyyy-mm-dd Hh:Nn:Ss') as RegDate"
				];
			}

			fields = fields.reduce(function(prev, fld) {
				if (!docFieldsDecl.get(fld))
					return prev;

				if (!/[()]/g.test(fld))
					fld = ("[" + fld + "]");

				prev.push(fld);

				return prev;
			}, []);

			return new Promise(function(resolve, reject) {
				dbawws.dbquery({
					"query": ""
					+ " SELECT " + fields.join(",")
					+ " FROM DOCS"
					+ " WHERE"
					+   " DocID = '" + docId + "'"

					+ ";"
					+ " SELECT mmid"
					+ " FROM Movement"
					+ " WHERE"
					+   " Doc = '" + docId + "'"
					+ (useSubMovs ? " OR ParentDoc = '" + docId + "' " : "")

					+ ";"
					+ " SELECT"
					+   " uid,"
					+   " extClass,"
					+   " extID,"
					+   " property,"
					+   " value"
					+ " FROM Property"
					+ " WHERE"
					+   " pid = 0"
					+   " AND ExtClass = 'DOCS'"
					+   " AND ExtID = '" + docId + "'",

					"callback": function(dbres, err) {
						if (err = dbUtils.fetchErrStrFromRes(dbres))
							return reject(err);

						resolve(dbres);
					}
				});

			}).then(function(dbres) {
				if (!dbres[0].recs.length)
					return reject("DocDataMode.load(): specified doc record have not found in DOCS table");

				var dbRecDoc = dbres[0].recs[0],
					dbRecsMovs = dbres[1].recs,
					dbRecsProps = dbres[2].recs;

				self.getKeys().forEach(function(k) {
					self.set(k, void 0, null, !1);
				});

				self.delMov({});

				self.deleteFProperty();

				self.set(dbRecDoc);

				self.addProperty(dbRecsProps);

				return Promise.all(
					dbRecsMovs.map(function(row) {
						var mov = new MovDataModel();

						mov.set(row);

						self.addMov(mov);

						return mov.load();
					})
				);

			}).then(function() {
				var docMovsIdxByMMId = {};

				/*
				* Связывание общих экземпляров задач.
				* Инициализированные mov и doc имеют разные экземпляры одинаковых записей
				* */
				self.getMov().forEach(function(mov, idx, movs) {
					var mmid = mov.get("mmid", null, !1);

					docMovsIdxByMMId[mmid] = idx;

					mov.getNestedMovs().forEach(function(mov) {
						var mmid = mov.get("mmid", null, !1);

						if (!(mmid in docMovsIdxByMMId))
							return;

						var idx = docMovsIdxByMMId[mmid];

						movs[idx] = mov;
					});
				});

				self._mDocClsHistory();

				self.state = self.STATE_DOC_READY;

				callback(null, self);

			}).catch(function(err) {
				callback(err, self);

				return Promise.reject(err);
			});
		},


		/**
		 * @return {Promise}
		 * @param {String} docId
		 * */
		"parseDocID": function(docId) {
			var gands = this.getGandsInstance();

			if (typeof docId != "string" || docId.length != 10) {
				throw new Error(
					"DocDataModel.parseDocID(): " +
					"1st argument expected to be String of length == 10. " + (typeof docId) + " is given"
				);
			}

			var res = {
				"code": docId.slice(5),
				"prefix": docId.slice(3, 5),
				"company": docId.slice(0, 2),
				"year": docId[2],
				"docType": null
			};

			var gsGroup = gands.dataRefByGSIDGroup.get("SYОП");

			gsGroup.some(function(row) {
				if (row.GSCodeNumber == res.prefix && 8 == row.GSID.length)
					return res.docType = row.GSID.slice(4);
			});

			return res;
		},


		/**
		 * Получить новый код номенклатуры
		 * @return {Promise}
		 * @param {String} arg.companyID
		 * @param {String=} arg.docType
		 * @param {Function=} arg.callback
		 * */
		"getNewDocID": function(arg) {
			if (typeof arg != "object") {
				throw new Error(
					"DocDataModel.getNewDocID(): " +
					"1st argument expected to be Object. " + (typeof arg) + " is given"
				);
			}

			var self            = this,
				callback        = arg.callback || emptyFn,
				dbawws          = self.getDBInstance(),
				gands           = this.getGandsInstance(),
				docType         = arg.docType,
				companyID       = arg.companyID,
				docTypeGsRow    = gands.dataRefByGSID.get("SYОП" + docType);

			return new Promise(function(resolve, reject) {
				if (typeof companyID != "string" || companyID.length != 2) {
					return reject(
						"!DocDataModel.getNewDocID(): " +
						"arg.companyID expected to be String of length == 2"
					);
				}

				if (typeof docType != "string" || docType.length != 4) {
					return Promise.reject(
						"DocDataModel.getNewDocID(): " +
						"arg.docType expected to be not empty String of length == 2"
					);
				}

				if (!docTypeGsRow) {
					return Promise.reject(
						"DocDataModel.getNewDocID(): " +
						"specified docType not found in GANDS"
					);
				}

				dbawws.dbquery({
					"query": "" +
						"SELECT docId FROM Docs;" +
						"SELECT RIGHT(YEAR(DATE()), 1) AS _year",
					"callback": function(dbres, err) {
						if (err = dbUtils.fetchErrStrFromRes(dbres))
							return reject(err);

						resolve(dbres);
					}
				});

			}).then(function(dbres) {
				var curr,
					prev,
					newDocID,
					docIds,
					prefix = docTypeGsRow.GSCodeNumber,
					year = dbres[1].recs[0]._year;

				if (!prefix)
					return Promise.reject("!docTypePrefix");

				var _excluded = [];

				docIds = dbres[0]
					.recs
					.reduce(function(prev, row) {
						if (10 != row.docId.length || year != row.docId[2]) {
							_excluded.push(row.docId);

							return prev;
						}

						var a = +row.docId.slice(5);

						if (a)
							prev.push(a);

						return prev;

					}, [])
					.sort(function(a, b) {
						// от меньшего к большему
						return a < b ? -1 : 1;
					});

				// --------------

				curr = docIds[0] || 1;
				prev = curr;

				docIds.some(function(a) {
					curr = a;

					if (Math.abs(curr - prev) > 1) {
						curr = prev;

						return true;
					}

					prev = a;

					return false;
				});

				curr++;

				// --------------

				newDocID = new Array(5 - (curr + "").length + 1).join("0") + (curr + "");

				var ret = ""
					+ companyID
					+ year
					+ prefix
					+ newDocID;

				callback(null, self, ret);

				return Promise.resolve(ret);

			}).catch(function(err) {
				callback(err, self);

				return Promise.reject(err);
			});
		},


		/**
		 * Посчитать суммы полей sum, sum2 подчиненных задач
		 * @return {Object}
		 * */
		getSumOfMovs: function() {
			return this.getMov().reduce(function(obj, mov) {
				obj.sum1 += +mov.get("sum", null, !1) || 0;
				obj.sum2 += +mov.get("sum2", null, !1) || 0;

				return obj;
			}, { sum1: 0, sum2: 0 });
		},


		/**
		 * Присвоить sum1, sum2 как суммы полей sum, sum2 подчиненных задач
		 * @return {DocDataModel}
		 * */
		calcAndApplySumOfMovs: function() {
			this.set(this.getSumOfMovs());

			return this;
		},


		"_mDocClsHistory": function() {
			this.clearChanged();
			this.clearFPropertyHistory();

			this.getMov().forEach(function(mov) {
				mov.clearChanged();
				mov.clearFPropertyHistory();
			});
		},


		"__docDataModelsDefaultFields": new ObjectA({
			"id":               { "type": "N" },
			"DocID":            { "type": "S" },
			"ParentDoc":        { "type": "S" },
			"ParentDoc2":       { "type": "S" },
			"Tick":             { "type": "N" },
			"OriginalDoc":      { "type": "S" },
			"Company":          { "type": "S" },
			"Status":           { "type": "S" },
			"DocType":          { "type": "S" },
			"User":             { "type": "S" },
			"RegDate":          { "type": "D", "value": "NOW()" },
			"DateAVR":          { "type": "D" },
			"DateAcc":          { "type": "D" },
			"TxtAcc":           { "type": "S" },
			"WorkName":         { "type": "S" },
			"Agent":            { "type": "S" },
			"Manager":          { "type": "S" },
			"FirmContract":     { "type": "N" },
			"Person":           { "type": "S" },
			"FirmCustomer":     { "type": "N" },
			"PayType":          { "type": "S" },
			"Discount":         { "type": "N" },
			"Disc_Text":        { "type": "S" },
			"Margin":           { "type": "N" },
			"Marg_Text":        { "type": "S" },
			"CurRate":          { "type": "N" },
			"Currency":         { "type": "S" },
			"Sum1":             { "type": "N" },
			"Sum2":             { "type": "N" },
			"Debt":             { "type": "N" },
			"SumExt":           { "type": "N" },
			"SumExt2":          { "type": "N" },
			"SumExt3":          { "type": "N" },
			"SumExtNDS":        { "type": "N" },
			"RateNDS":          { "type": "N" },
			"RateSpecTax":      { "type": "N" },
			"SumNDS":           { "type": "N" },
			"SumSpecTax":       { "type": "N" },
			"Notice":           { "type": "S" },
			"DocFlag":          { "type": "S" },
			"FilterGS":         { "type": "S" },
			"IsDeleted":        { "type": "N" },
			"DateNew":          { "type": "D" },
			"UserNew":          { "type": "S" },
			"DateEdit":         { "type": "D", "value": "NOW()" },
			"UserEdit":         { "type": "S" },
			"TextAVR":          { "type": "S" },
			"Addr":             { "type": "S" },
			"Debt2":            { "type": "N" },
			"SumExt4":          { "type": "N" }
		})

	}
);

module.exports = DocDataModel;