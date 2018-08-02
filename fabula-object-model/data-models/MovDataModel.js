"use strict";

var DefaultDataModel    = require("./DefaultDataModel"),
	InterfaceFProperty  = require("./InterfaceFProperty"),
	IMovCollection      = require("./IMovCollection.js"),
	TalksDataModel      = require("./TalksDataModel"),
	IFabModule          = require("./IFabModule.js"),
	ObjectA             = require("./ObjectA.js"),
	emptyFn             = function() {},
	dbUtils             = require("./../utils/dbUtils.js"),
	_utils              = require("./../utils/utils");

// TODO пересмотреть алиасы
/**
 * @constructor
 **/
function MovDataModel() {
	DefaultDataModel.call(this);
	IFabModule.call(this);
	IMovCollection.call(this);
	InterfaceFProperty.call(this);

	this.set({
		"GSDate": new Date()
	});

	// -------------------------------------

	this.mMovEvents.getKeys().forEach(function(key) {
		this.mMovEvents.get(key).forEach(function(fn) {
			this.on(key, fn);
		}, this);
	}, this);

	// -------------------------------------

	this._mMovClsHistory();

	this.state = this.STATE_MOV_INITIAL;
}

MovDataModel.prototype = _utils.createProtoChain(
	DefaultDataModel.prototype,
	InterfaceFProperty.prototype,
	IFabModule.prototype,
	IMovCollection.prototype,
	{
		// только что созданный, неинициализированный объект
		"STATE_MOV_INITIAL": Math.random(),


		// объект инициализирован из БД
		"STATE_MOV_READY": Math.random(),


		// объект удален из БД
		"STATE_MOV_REMOVED": Math.random(),


		"mMovEvents": new ObjectA({

			"add-fab-mov": [
				function(self, e) {
					e.mov.set("mmPId", this.get("mmId"));
					e.mov._setParentMovInstance(self);
				}
			],

			"set:parentdoc": [
				function() {
					var e                   = arguments[1],
					    nextParentDocId     = e.value,
					    prevParentDocId     = this.get("parentDoc"),
					    prevDocId           = this.get("doc"),
					    prevDocId1          = this.get("doc1");

					if (!nextParentDocId)
						return this.set("doc1", prevDocId);

					if (prevParentDocId == prevDocId1)
						this.set("doc1", nextParentDocId);
				}
			],

			"set:doc1": [
				function() {
					var e           = arguments[1],
					    doc1        = e.value;

					this.updateFProperty(null, { "extId": doc1 });
				}
			],

			"set:doc": [
				function() {
					var e           = arguments[1],
					    arg         = e.argument || {},
					    recursive   = "recursive" in arg ? arg : true,
					    parentDoc   = this.get("ParentDoc", null, !1),
					    prevDocId   = this.get("Doc"),
					    nextDocId   = e.value;

					if (recursive) {
						this.getMov().forEach(function(mov) {
							if (prevDocId == mov.get("doc1", null, !1))
								mov.set("doc1", nextDocId);

							if (prevDocId == mov.get("doc"))
								mov.set("doc", nextDocId);
						});
					}

					// Если у заявки присутствует "doc", то "doc1" приравнивается "doc"
					// Если у заявки отсутствует "doc", то "doc1" приравнивается "parentDoc"

					!nextDocId
						? this.set("doc1", parentDoc)
						: this.set("doc1", nextDocId);
				}
			],

			"set:mmid": [
				function() {
					var e = arguments[1];

					this.getMov().forEach(function(mov) {
						mov.set("MMPID", e.value, null, false);
					});

					this.updateFProperty(null, { "pid": e.value });
				}
			]

		}),


		/**
		 * Удалить запись и подчинен. ей записи из БД
		 *
		 * @param {Object=} arg
		 * @param {Function=} arg.callback
		 * @param {String | Object=} arg.dbcache
		 *
		 * @return {Promise}
		 * */
		"rm": function(arg) {
			arg = arg || {};

			var self        = this,
				db          = this.getDBInstance(),
				callback    = arg.callback || emptyFn,
				mmid        = this.get("mmid", null, !1);

			return Promise.resolve().then(function() {
				if (self.state == self.STATE_MOV_READY)
					return Promise.resolve();

				// Если модель не инициализирована - инициализировать и получить подчиненные
				return self.load({
					"dbworker": " ",
					"dbcache": arg.dbcache
				});

			}).then(function() {
				var promises = [
					new Promise(function(resolve, reject) {
						db.dbquery({
							"dbcache": self.iFabModuleGetDBCache(arg.dbcache, { "m": "m-mov.rm-d" }),
							"dbworker": " ",
							"query": ""
							+ "DELETE FROM Movement WHERE MMID = " + mmid

							+ "; DELETE"
							+ " FROM Property"
							+ " WHERE"
							+   "     extClass = 'DOCS'"
							+   " AND pid = " + mmid

							+ "; DELETE"
							+ " FROM Ps_property"
							+ " WHERE"
							+   "     extClass = 'DOCS'"
							+   " AND pid = " + mmid

							+ "; DELETE FROM talk WHERE mm = " + mmid,

							"callback": function(dbres, err) {
								if (err = dbUtils.fetchErrStrFromRes(dbres))
									return reject(err);

								resolve();
							}
						});
					})
				];

				self.getMov().reduce(
					function(prev, mov) {
						if (!mov || !mov.get("mmid", null, !1))
							return prev;

						prev.push(
							mov.rm({
								"dbcache": arg.dbcache
							})
						);

						return prev;
					},
					promises
				);

				return Promise.all(promises);

			}).then(function() {
				self.state = self.STATE_MOV_REMOVED;

				callback(null);

			}).catch(function(err) {
				callback(err);

				return Promise.reject(err);
			});
		},


		"serializeObject": function() {
			var movFieldsDecl = this.__movDataModelDefaultFields,

				ret = {
					"className": "MovDataModel",
					"fields": {},
					"movs": [],
					"props": JSON.parse(JSON.stringify(this.getProperty()))
				};

			this.getKeys().forEach(function(key) {
				if (!movFieldsDecl.get(key))
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
		 * Инициализировать запись из БД
		 *
		 * @param {Object=} arg
		 * @param {Function=} arg.callback
		 * @param {Array=} arg.fields
		 * @param {String | Object=} arg.dbcache
		 * @param {String=} arg.dbworker
		 *
		 * @return {Promise}
		 * */
		"load": function(arg) {
			arg = arg || {};

			var mmid,
				self = this,
				callback = arg.callback || emptyFn,
				dbawws = self.getDBInstance();

			return new Promise(function(resolve, reject) {
				if (!(mmid = +self.get("mmid")))
					return reject("!mmid");

				var fields = arg.fields;

				if (_utils.isEmpty(fields)) {
					fields = [
						"MMID",
						"MMPID",
						"ParentDoc",
						"Doc",
						"Doc1",
						"GS",
						"GSSpec",
						"MMFlag",
						"Amount",
						"Sum",
						"Sum2",
						"Price",
						"CodeOp",
						"Performer",
						"Manager2",
						"Agent2",
						"Format(GSDate,'yyyy-mm-dd Hh:Nn:Ss') as GSDate"
					];
				}

				fields = fields.map(function(fld) {
					fld = (fld + "").toLowerCase();

					if (/[()]/g.test(fld))
						return fld;

					return "[" + fld + "]";
				});

				var query = ""
					// Записи движения ТиУ
					+ " SELECT " + fields.join(",")
					+ " FROM Movement "
					+ " WHERE"
					+   "    mmid = " + mmid
					+   " OR mmpid = " + mmid

					// Свойства записи
					+ "; SELECT"
					+   "  uid"
					+   ", pid"
					+   ", ExtClass"
					+   ", ExtID"
					+   ", property"
					+   ", value"
					+ " FROM Property"
					+ " WHERE"
					+   " pid = " + mmid;

				dbawws.dbquery({
					"dbcache": self.iFabModuleGetDBCache(arg.dbcache, { "m": "m-mov.load" }),
					"dbworker": arg.dbworker,
					"query": query,
					"callback": function(dbres, err) {
						if (err = dbUtils.fetchErrStrFromRes(dbres))
							reject(err);

						resolve(dbres);
					}
				});

			}).then(function(dbres) {
				if (!dbres[0].recs.length)
					return Promise.reject("MovDataModel.load(): !movs.length");

				var movRow,
					cMovsRows   = dbres[0].recs,
					_arg        = Object.assign({}, arg);

				// ----------------

				cMovsRows = cMovsRows.filter(function(row) {
					if (row.mmid == self.get("mmid"))
						movRow = row;

					return row.mmid != self.get("mmid");
				});

				if (!movRow)
					return Promise.reject("MovDataModel.load(): !movRow");

				// ----------------

				_arg.callback = void 0;

				self.getKeys().forEach(function(k) {
					self.set(k, void 0, null, !1);
				});

				self.delMov({});

				self.deleteFProperty();

				// ----------------

				self.set(movRow);

				self.addFProperty(dbres[1].recs);

				self.addMov(cMovsRows);

				return Promise.all(
					self.getMov().map(function(mov) {
						mov._setParentMovInstance(self);

						if (mov._isRecursiveMov())
							return;

						return mov.load(_arg);
					})
				);

			}).then(function() {
				self._mMovClsHistory();

				self.state = self.STATE_MOV_READY;

				callback(null, self);

			}).catch(function(err) {
				callback(err, self);

				return Promise.reject(err);
			});
		},


		/**
		 * Записать в таблицу
		 *
		 * @private
		 *
		 * @param {Object=} arg
		 * @param {String | Object=} arg.dbcache
		 *
		 * @return {Promise} - Promise.Resolve(mmId)
		 * */
		"_reqInsertMov": function(arg) {
			var self = this;

			arg = arg || {};

			return new Promise(function(resolve, reject) {
				var dbawws = self.getDBInstance(),
					query = ""
						       + self._mkQueryInsertMov()
						+ "; " + self._mkQueryGetInsertedMovMMId();

				dbawws.dbquery({
					"dbworker": " ",
					"dbcache": self.iFabModuleGetDBCache(arg.dbcache, { "m": "m-mov.ins-0" }),
					"query": query,
					"callback": function(dbres) {
						var err = dbUtils.fetchErrStrFromRes(dbres);

						if (err)
							return reject(err);

						if (!dbres[1].recs[0])
							return reject("MovDataModel._reqInsertMov(): could not get a new MMId");

						resolve(dbres[1].recs[0].mmid);
					}
				});
			});
		},


		/**
		 * Вернуть текст запроса на запись в таблицу Movement
		 *
		 * @return {String}
		 * */
		"_mkQueryInsertMov": function() {
			var self = this,
				movFieldsDecl = this.__movDataModelDefaultFields,
				values = [],
				fields = [];

			movFieldsDecl.get("gsdate").value = "NOW()";

			movFieldsDecl.getKeys().forEach(function(key) {
				var val,
					fldDecl = movFieldsDecl.get(key);

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

			return "INSERT INTO Movement (" + fields.join(",") + ") VALUES (" + values.join(",") + ")";
		},


		/**
		 * Вернуть текст запроса на полученого только что записанного MMID
		 *
		 * @return {String}
		 * */
		"_mkQueryGetInsertedMovMMId": function() {
			var self = this,
				cond = [],
				movFieldsDecl = this.__movDataModelDefaultFields;

			movFieldsDecl.getKeys().forEach(function(key) {
				var fldDecl = movFieldsDecl.get(key),
					val = self.get(key, null, !1) || fldDecl.value || null;

				if (!val)
					return;

				// БД отрезает дробную часть - прямое сравнение не работает
				// сравнить результаты округления
				if (dbUtils.numberTypes[fldDecl.type]) {
					return cond.push(
						"-INT(-" + dbUtils.mkFld(key) + ")"
						+ " = "
						+ dbUtils.mkVal(Math.ceil(val), fldDecl)
					);
				}

				cond.push(dbUtils.mkFld(key) + " = " + dbUtils.mkVal(val, fldDecl));
			});

			return "SELECT mmid FROM Movement WHERE " + cond.join(" AND ");
		},


		/**
		 * Записать свойства в БД
		 *
		 * @param {Object=} arg
		 * @param {String | Object=} arg.dbcache
		 *
		 * @return {Promise}
		 * */
		"_insertProps": function(arg) {
			var self = this;

			arg = arg || {};

			return new Promise(function(resolve, reject) {
				var db = self.getDBInstance(),
					query = ""
						+ " DELETE"
						+ " FROM Property"
						+ " WHERE"
						+   "     ExtClass = 'DOCS'"
						+   " AND pid = " + self.get("mmid", null, !1) + ";";

				query += self.getUpsertOrDelFPropsQueryStrByDBRes([], {
					"pid": self.get("mmid", null, !1),
					"extClass": "DOCS",
					"extId": self.get("Doc", null, !1)
				});

				db.dbquery({
					"dbworker": " ",
					"dbcache": self.iFabModuleGetDBCache(arg.dbcache, { "m": "m-mov.ins-p" }),
					"query": query,
					"callback": function(dbres, err) {
						if (err = dbUtils.fetchErrStrFromRes(dbres))
							return reject(err);

						resolve();
					}
				});
			});
		},


		/**
		 * Новая запись в ДБ
		 *
		 * @param {Object=} arg
		 * @param {Function=} arg.callback
		 * @param {String | Object=} arg.dbcache
		 *
		 * @return {Promise}
		 * */
		"insert": function(arg) {
			arg = arg || {};

			var self = this,
				mAttrRnd = (Math.random() * Math.pow(10, 16) + "").slice(0, 16),
				callback = arg.callback || emptyFn;

			// -----------------------------------------------------------------

			self.trigger("before-insert");

			// -----------------------------------------------------------------
			// Если MAttr[n] не занято, записать в него случайное число
			// для повышения уникальности записи
			// -----------------------------------------------------------------
			["mAttr1", "mAttr2", "mAttr3", "mAttr4"].some(function(key) {
				if (!self.get(key, null, !1)) {
					self.set(key, mAttrRnd);

					return true;
				}
			});

			// -----------------------------------------------------------------

			return this._reqInsertMov(arg).then(function(mmid) {
				self.set("mmid", mmid, null, !1);

				return self._insertProps(arg);

			}).then(function() {
				var promises = self.getMov().map(function(mov) {
					mov.set("MMPID", self.get("MMID", null, false));

					return mov.save({
						"dbcache": arg.dbcache
					});
				});

				promises.push(
					new Promise(function(resolve, reject) {
						var docDataObj = self.get("DocDataObject"),
							talksInstance = TalksDataModel.prototype.getInstance();

						talksInstance.postTalk({
							"MMID": self.get("MMID", null, !1),
							"MMFlag": self.get("MMFlag", null, !1),
							"agent": !docDataObj ? "999" : (docDataObj.get("agent", null, !1) || 999),
							"dbcache": arg.dbcache,
							"callback": function(err) {
								if (err)
									return reject(err);

								resolve();
							}
						});
					})
				);

				return Promise.all(promises);

			}).then(function() {
				self._mMovClsHistory();

				callback(null, self);

				self.trigger("after-insert");

			}).catch(function(err) {
				callback(err, self);

				self.trigger("insert-error");

				return Promise.reject(err);
			});
		},


		_getSaveOpt: function(arg) {
			function get2(obj) {
				return ["insert", "update", "delete"].reduce(function(obj, key) {
					if (!(key in obj))
						obj[key] = true;

					return obj;
				}, obj || {});
			}

			var ret = ["props", "movs", "fields", "talk"].reduce(function(obj, key) {
				obj[key] = get2(obj[key]);

				return obj;
			}, arg || {});

			ret.movs.except = ret.movs.except || {};
			ret.movs.except.fields = ret.movs.except.fields || {};
			ret.movs.except.fields.mmid = [];

			return ret;
		},


		/**
		 * Обновить запись в БД
		 *
		 * @param {Object=} arg
		 * @param {Boolean=} arg.saveParent - Применить изменения в родительской задаче // НЕ РАБОТАЕТ
		 * @param {Function=} arg.callback(err) - callback
		 * @param {String | Object=} arg.dbcache
		 * @param {String=} arg.dbworker
		 *
		 * @return {Promise}
		 * */
		"update": function(arg) {
			arg = arg || {};

			var self = this,
				dbawws          = this.getDBInstance(),
				callback        = arg.callback || emptyFn,
				MMID            = self.get("mmId", null, false);

			arg.saveOpt = this._getSaveOpt(arg.saveOpt);

			// ------------------------------------------------------------------------------

			self.trigger("before-update");

			// ------------------------------------------------------------------------------

			return new Promise(function(resolve, reject) {
				dbawws.dbquery({
					"dbcache": self.iFabModuleGetDBCache(arg.dbcache, { "m": "m-mov.upd-s" }),

					"dbworker": arg.dbworker,

					"query": ""
					// Получение записи движения ТиУ
					+ " SELECT MMID"
					+ " FROM Movement"
					+ " WHERE"
					+   "    MMID = " + MMID
					+   " OR MMPID = " + MMID

					// Получение свойств записи
					+ "; SELECT uid, pid, ExtClass, ExtID, property, [value]"
					+ " FROM Property"
					+ " WHERE"
					+   " pid = " + MMID,

					"callback": function(dbres) {
						var err = dbUtils.fetchErrStrFromRes(dbres);

						if (err)
							return reject(err);

						resolve(dbres);
					}
				});

			}).then(function(dbres) {
				var values,
					dbq                         = [],
					changedFields               = self.getChanged(),
					disabledFields              = new ObjectA({ "mmid": 1 }),
					movFieldsDecl               = self.__movDataModelDefaultFields,
					dbCMovsRecs                 = dbres[0].recs,
					dbPropsRecs                 = dbres[1].recs,
					dbMovRec                    = void 0,
					dbCMovsRefByMMId            = {},
					selfCMovsRefByMMId          = {};

				// Оставить только подчиненные задачи
				dbCMovsRecs = dbCMovsRecs.filter(function(row) {
					if (row.MMID == MMID) {
						// выбрать текущую задача
						dbMovRec = row;

						return false;
					}

					return true;
				});

				// Такой строки в БД нет
				if (!dbMovRec)
					return Promise.reject("MovDataModel.update(): entry with mmId = " + MMID + " is not exists");

				// -----------------------------------------------------------------
				// Ссылки на подчиненные задачи по MMID
				// -----------------------------------------------------------------
				self.getMov().forEach(function(mov) {
					selfCMovsRefByMMId[mov.get("mmId", null, !1)] = mov;
				});

				dbCMovsRecs.forEach(function(row) {
					dbCMovsRefByMMId[row.MMID] = row;
				});

				// -----------------------------------------------------------------
				// upd, ins, del property
				// -----------------------------------------------------------------
				if (
					   arg.saveOpt.props.insert
					&& arg.saveOpt.props.update
					&& arg.saveOpt.props.delete
				) {
					dbq.push.apply(
						dbq,
						[].concat(self.getUpsertOrDelFPropsQueryStrByDBRes(dbPropsRecs, {
							"pid": self.get("MMID", null, false),
							"extClass": "DOCS",
							"extId": self.get("Doc", null, false)
						}) || [])
					);
				}

				// -----------------------------------------------------------------
				// Обновление полей в строке
				// -----------------------------------------------------------------
				if (arg.saveOpt.fields.update) {
					values = changedFields.reduce(function(prev, fldKey) {
						if (!movFieldsDecl.get(fldKey))
							return prev;

						if (disabledFields.get(fldKey))
							return prev;

						var value = self.get(fldKey, null, !1),
							fldDecl = movFieldsDecl.get(fldKey);

						prev.push(dbUtils.mkFld(fldKey) + " = " + dbUtils.mkVal(value, fldDecl));

						return prev;
					}, []);

					if (values.length)
						dbq.push("UPDATE Movement SET " + values.join(", ") + " WHERE MMID = " + MMID);
				}

				// -----------------------------------------------------------------
				// Если ничего не изменилось вернуть успешный промис
				// -----------------------------------------------------------------
				if (!dbq.length)
					return Promise.resolve(null);

				// -----------------------------------------------------------------
				// Если есть изм-я начать сборку пачки промисов
				// -----------------------------------------------------------------
				var promises = [
					new Promise(function(resolve, reject) {
						dbawws.dbquery({
							"dbcache": self.iFabModuleGetDBCache(arg.dbcache, { "m": "m-mov.upd-0" }),
							"dbworker": " ",
							"query": dbq.join("; "),
							"callback": function(dbres, err) {
								if (err = dbUtils.fetchErrStrFromRes(dbres))
									return reject(err);

								resolve();
							}
						});
					})
				];

				// -----------------------------------------------------------------
				// Список удаленных подчиненных задач
				// -----------------------------------------------------------------
				if (arg.saveOpt.movs.delete) {
					dbCMovsRecs.forEach(function(row) {
						if (selfCMovsRefByMMId[row.MMID])
							return;

						var mov = new MovDataModel();

						mov.set("mmId", row.MMID);

						promises.push(
							mov.rm({
								"dbcache": arg.dbcache
							})
						);
					});
				}

				// -----------------------------------------------------------------

				self.getMov().forEach(function(mov) {
					var selfMMID = self.get("MMID", null, false),
						eachMMID = mov.get("MMID", null, false);

					// Если в списке исключений, игнорировать любые изменения
					if (!!~arg.saveOpt.movs.except.fields.mmid.indexOf(eachMMID))
						return;

					// Если ничего не менялось, то и выполнять сохранения нет смысла
					if (!mov.getChanged().length && !mov.hasChangedFProperty())
						return;

					if (dbCMovsRefByMMId[eachMMID] && !arg.saveOpt.movs.update)
						return;

					if (!dbCMovsRefByMMId[eachMMID] && !arg.saveOpt.movs.insert)
						return;

					if (mov.get("MMPID", null, !1) != selfMMID)
						mov.set("MMPID", selfMMID, null, !1);

					promises.push(
						mov.save({
							"dbcache": arg.dbcache,
							"useNotification": false
						})
					);
				});

				// -----------------------------------------------------------------

				if (
					arg.saveOpt.talk.update
					&& self.get("MMFlag", null, !1)
					&& self.get("MMID", null, !1)
					&& !!~changedFields.indexOf("mmflag")
				) {
					promises.push(
						new Promise(function(resolve, reject) {
							var docDataObj = self.get("DocDataObject"),
								talksInstance = TalksDataModel.prototype.getInstance();

							talksInstance.postTalk({
								"MMID": self.get("MMID", null, !1),
								"MMFlag": self.get("MMFlag", null, !1),
								"agent": !docDataObj ? "999" : (docDataObj.get("agent", null, !1) || 999),
								"callback": function(err) {
									if (err)
										return reject();

									resolve();
								}
							});
						})
					);
				}

				// -----------------------------------------------------------------

				return Promise.all(promises);

			}).then(function() {
				self._mMovClsHistory();

				callback(null, self);

				self.trigger("after-update");

			}).catch(function(err) {
				callback(err, self);

				self.trigger("update-error");

				return Promise.reject(err);
			});
		},


		/**
		 * Спросить историю
		 * */
		"_mMovClsHistory": function() {
			this.clearChanged();
			this.clearFPropertyHistory();

			this.getMov().forEach(function(mov) {
				mov.clearChanged();
				mov.clearFPropertyHistory();
			});
		},


		"__movDataModelDefaultFields": new ObjectA({
			"MMID":         { "type": "integer" },
			"MMPID":        { "type": "integer" },
			"IsDraft":      { "type": "integer" },
			"Tick":         { "type": "integer" },
			"Doc":          { "type": "string" },
			"Doc1":         { "type": "string" },
			"ParentDoc":    { "type": "string" },
			"MMFlag":       { "type": "string" },
			"InOut":        { "type": "integer" },
			"GSDate":       { "type": "date" },
			"GSDate2":      { "type": "date" },
			"Mark":         { "type": "boolean" },
			"CodeOp":       { "type": "string" },
			"CodeDc":       { "type": "string" },
			"ExtCode":      { "type": "string" },
			"Storage":      { "type": "string" },
			"GS":           { "type": "string" },
			"GSSpec":       { "type": "string", "length": 120 },
			"GSExt":        { "type": "integer" },
			"Consigment":   { "type": "integer" },
			"Amount":       { "type": "float" },
			"Rest":         { "type": "float" },
			"RestSum":      { "type": "float" },
			"Price":        { "type": "float" },
			"PrimeCost":    { "type": "float" },
			"Sum":          { "type": "float" },
			"Sum2":         { "type": "float" },
			"MAttr1":       { "type": "string" },
			"MAttr2":       { "type": "string" },
			"MAttr3":       { "type": "string" },
			"MAttr4":       { "type": "string" },
			"FirmProduct":  { "type": "integer" },
			"Remark":       { "type": "string" },
			"NameAVR":      { "type": "string" },
			"Agent2":       { "type": "string" },
			"Manager2":     { "type": "string" },
			"Performer":    { "type": "string" },
			"Stock":        { "type": "boolean" }
		}),


		"_isRecursiveMov": function() {
			var c = 0,
				pMov = this;

			while (pMov = pMov._getParentMovInstance()) {
				if (++c >= 100)
					throw new Error("MovDataModel._isRecursiveMov(): Превышено допустимое количество итераций");

				if (pMov.get("mmId", null, !1) == this.get("mmId", null, !1))
					return true;
			}

			return false;
		},


		"setDocInstance": function(doc) {
			this._mMovDocInstance = doc;
		},


		"getDocInstance": function() {
			return this._mMovDocInstance;
		},


		"_setParentMovInstance": function(mov) {
			this._mMovParentMovInstance = mov;
		},


		"_getParentMovInstance": function() {
			return this._mMovParentMovInstance;
		},


		/**
		 * Получить экземпляр родительской задачи
		 * @return {MovDataModel}
		 * */
		"getParentMovInstance": function() {
			return this._getParentMovInstance();
		},


		"_mMovStdMergeFieldFn": function(prev, next) {
			return next;
		},


		/**
		 * Объеденить с другой с записью
		 *
		 * @param {MovDataModel} mov
		 * @param {Object} opt
		 *
		 * @return {MovDataModel}
		 * */
		"merge": function(mov, opt) {
			if (!mov)
				return;

			opt         = opt || {};
			opt.mov     = opt.mov || {};
			opt.fields  = opt.fields || {};

			var fldFn   = opt.fields.walker || this._mMovStdMergeFieldFn;

			this.mergeFProps(mov.getFPropertyA(), opt.props);

			mov.getKeys().forEach(function(k) {
				this.set(
					k,
					fldFn(this.get(k), mov.get(k), k)
				);
			}, this);

			return this.mergeMovs(mov.getMov(), opt);
		},


		"mergeByGSId": function(mov, opt) {
			opt     = opt || {};
			opt.mov = opt.mov || {};

			opt.mov.cmp = function(prev, next) {
				return prev.get("gs") == next.get("gs");
			};

			return this.merge(mov, opt);
		},


		/**
		 * @param {Object=} arg
		 * @param {Function=} arg.callback
		 * @return {Promise}
		 * */
		"save": function(arg) {
			arg = arg || {};

			var promise,
				self = this,
				mmid = this.get("MMID", null, !1),
				callback = arg.callback || emptyFn,
				dbawws = self.getDBInstance();

			delete arg.callback;

			if (!mmid) {
				promise = self.insert(arg);

			} else {
				promise = new Promise(function(resolve, reject) {
					dbawws.dbquery({
						"dbworker": arg.dbworker,
						"dbcache": self.iFabModuleGetDBCache(arg.dbcache, { "m": "m-mov.save" }),
						"query": "SELECT mmid FROM Movement WHERE mmid = " + mmid,
						"callback": function(dbres, err) {
							if (err = dbUtils.fetchErrStrFromRes(dbres))
								return reject(err);

							resolve(dbres);
						}
					});

				}).then(function(dbres) {
					if (!dbres.recs.length)
						return self.insert(arg);

					return self.update(arg);
				});
			}

			return promise.then(function() {
				callback(null);

				return Promise.resolve();

			}).catch(function(err) {
				callback(err);

				return Promise.reject(err);
			});
		}

	}
);

module.exports = MovDataModel;