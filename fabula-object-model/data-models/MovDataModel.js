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
		"GSDate": new Date(),
		"MMFlag": "1"
	});

	// -------------------------------------

	this.on("set:mmid", this._eventSetMMID);
	this.on("set:doc", this._eventSetDoc);
	this.on("afterset:parentdoc", this._eventSetParentDoc);
	this.on("add-fab-mov", this._eventAddFabMov);

	this._mMovClsHistory();
}

MovDataModel.prototype = _utils.createProtoChain(
	DefaultDataModel.prototype,
	InterfaceFProperty.prototype,
	IFabModule.prototype,
	IMovCollection.prototype,
	{

		"_eventAddFabMov": function(self, e) {
			e.mov.set("mmPId", this.get("mmId"));
		},


		"_eventSetMMID": function() {
			var e = arguments[1];

			this.getMov().forEach(function(mov) {
				mov.set("MMPID", e.value, null, false);
			});

			this.updateFProperty(null, { "pid": e.value });
		},


		"_eventSetDoc": function() {
			var e           = arguments[1],
				parentDoc   = this.get("ParentDoc", null, !1),
				prevDocId   = this.get("Doc"),
				docId       = e.value;

			this.getMov().forEach(function(mov) {
				if (prevDocId == mov.get("doc1", null, !1))
					mov.set("doc1", docId);

				if (prevDocId == mov.get("doc"))
					mov.set("doc", docId);
			});

			// Если у заявки присутствует "doc", то "doc1" приравнивается "doc"
			// Если у заявки отсутствует "doc", то "doc1" приравнивается "parentDoc"

			!docId
				? this.set("doc1", parentDoc)
				: this.set("doc1", docId);

			this.updateFProperty(null, { "extId": this.get("doc1", null, !1) });
		},


		"_eventSetParentDoc": function() {
			var e = arguments[1],
				nextParentDocId     = e.value,
				prevParentDocId     = this.get("parentDoc"),
				prevDocId           = this.get("doc"),
				prevDocId1          = this.get("doc1");

			if (!nextParentDocId && prevDocId1 == prevParentDocId)
				this.set("doc1", prevDocId, null, !1);

			else if (nextParentDocId && !prevDocId1)
				this.set("doc1", nextParentDocId, null, !1);
		},


		/**
		 * Удалить запись и подчинен. ей записи
		 * @param {Function} arg.callback
		 * */
		"rm": function(arg) {
			arg = arg || {};

			var db = this.getDBInstance(),
				callback = arg.callback || emptyFn,
				movs = this.getMov(),
				mmid = this.get("mmid", null, !1),

				promises = [
					new Promise(function(resolve, reject) {
						db.dbquery({
							"query": "" +
							"DELETE FROM Movement WHERE MMID = " + mmid +
							";" +

							"DELETE " +
							"FROM Property " +
							"WHERE " +
							"   extClass = 'DOCS'" +
							"   AND pid = " + mmid +
							";" +

							"DELETE " +
							"FROM Ps_property " +
							"WHERE " +
							"   extClass = 'DOCS'" +
							"   AND pid = " + mmid +
							";" +

							"DELETE FROM talk WHERE mm = " + mmid,

							"callback": function(dbres, err) {
								if (err = dbUtils.fetchErrStrFromRes(dbres))
									return reject(err);

								resolve();
							}
						});
					})
				];

			movs.reduce(
				function(prev, mov) {
					if (!mov || !mov.get("mmid", null, !1))
						return prev;

					prev.push(mov.rm());

					return prev;
				},
				promises
			);

			return Promise.all(promises)
				.then(function() {
					callback(null);
				})
				.catch(function(err) {
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
					if (/[()]/g.test(fld))
						return fld;

					return "[" + fld + "]";
				});

				var query = "" +
					// Записи движения ТиУ
					"SELECT " + fields.join(",") +
					" FROM Movement " +
					" WHERE" +
					"   mmid = " + mmid +
					"   OR mmpid = " + mmid +
					" ORDER BY mmpid ASC;" +

					// Свойства записи
					" SELECT uid, pid, ExtClass, ExtID, property, value FROM Property WHERE pid = " + mmid;

				dbawws.dbquery({
					"query": query,
					"callback": function(dbres, err) {
						if (err = dbUtils.fetchErrStrFromRes(dbres))
							reject(err);

						resolve(dbres);
					}
				});

			}).then(function(dbres) {
				if (!dbres[0].recs.length)
					return Promise.reject("MovDataModel.load(): !mov.length");

				var movsDBRows = dbres[0].recs,
					_arg = Object.assign({}, arg);

				delete _arg.callback;

				self.set(movsDBRows.shift());
				self.addProperty(dbres[1].recs);

				self.addMov(movsDBRows);

				return Promise.all(
					self.getMov().map(function(mov) {
						return mov.load(_arg);
					})
				);

			}).then(function() {
				self._mMovClsHistory();

				callback(null, self);

			}).catch(function(err) {
				callback(err, self);

				return Promise.reject(err);
			});
		},


		"_insertMov": function() {
			var self = this;

			return new Promise(function(resolve, reject) {
				var dbawws = self.getDBInstance(),
					movFieldsDecl = self.__movDataModelDefaultFields,
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

					values.push(dbUtils.mkVal(val, fldDecl.type));
					fields.push(dbUtils.mkFld(key));
				});

				dbawws.dbquery({
					"query": "INSERT INTO Movement (" + fields.join(",") + ") VALUES (" + values.join(",") + ")",
					"callback": function(dbres) {
						var err = dbUtils.fetchErrStrFromRes(dbres);

						if (err)
							return reject(err);

						resolve();
					}
				});
			});
		},


		"_getInsertedMMId": function() {
			var self = this;

			return new Promise(function(resolve, reject) {
				var dbawws = self.getDBInstance(),
					cond = [],
					movFieldsDecl = self.__movDataModelDefaultFields;

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
							+ dbUtils.mkVal(Math.ceil(val), fldDecl.type)
						);
					}

					cond.push(dbUtils.mkFld(key) + " = " + dbUtils.mkVal(val, fldDecl.type));
				});

				dbawws.dbquery({
					"query": "SELECT mmid FROM Movement WHERE " + cond.join(" AND ") + " ORDER BY mmid DESC",
					"callback": function(dbres) {
						var err = dbUtils.fetchErrStrFromRes(dbres);

						if (err)
							return reject(err);

						resolve(dbres.recs[0].mmid);
					}
				});
			});
		},


		"_insertProps": function() {
			var self = this;

			return new Promise(function(resolve, reject) {
				var db = self.getDBInstance(),
					mmid = self.get("mmid", null, !1),
					docId = self.get("Doc", null, !1),
					selfFabProps = self.getFPropertyA(),
					query = "DELETE FROM Property WHERE ExtClass = 'DOCS' AND pid = " + mmid + ";";

				selfFabProps.forEach(function(row) {
					if (!row || typeof row != "object")
						return;

					row.set("pid", mmid);
					row.set("extClass", "DOCS");
					row.set("extId", docId);
				});

				query += InterfaceFProperty.mkDBInsertStr(selfFabProps) + ";";

				db.dbquery({
					"query": query,
					"callback": function(dbres, err) {
						if (err = dbUtils.fetchErrStrFromRes(dbres))
							return reject(err);

						resolve();
					}
				});
			});
		},


		"insert": function(arg) {
			arg = arg || {};

			var self = this,
				mAttrRnd = (Math.random() * Math.pow(10, 16) + '').slice(0, 16),
				callback = arg.callback || emptyFn;

			// -----------------------------------------------------------------

			self.trigger("before-insert");

			console.log("MOV-INSERT(" + (self.get("mmid", null, !1) || "AWAIT") + ")");

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

			return this._insertMov(arg)
				.then(function() {
					if (self.get("mmid", null, false))
						return;

					return self._getInsertedMMId().then(function(mmid) {
						self.set("mmid", mmid, null, !1);
						console.log("MOV-AWAITED-MMID: " + mmid);
					});
				})
				.then(self._insertProps.bind(self))
				.then(function() {
					var promises = self.getMov().map(function(mov) {
						mov.set("MMPID", self.get("MMID", null, false));

						return mov.save();
					});

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

					return Promise.reject(err);
				});
		},


		/**
		 * @param {Boolean} arg.updTalk - Включатель уведомление о смене фазы
		 * @param {Boolean} arg.saveChildren - Применить изменения в подчиненных задачах
		 * @param {Boolean} arg.saveParent - Применить изменения в родительской задаче // НЕ РАБОТАЕТ
		 * @param {Array} arg.excludeMovs - Игнорировать изменения в перечисленных задачах. Массив из MMID (целые числа)
		 * @param {Array} arg.excludeMovs - Применить изменения только в перечисленных задачах // НЕ РАБОТАЕТ
		 * @param {Function} arg.callback(err) - callback
		 * */
		"update": function(arg) {
			arg = arg || {};

			var self = this,
				dbawws = this.getDBInstance(),
				callback = arg.callback || emptyFn,
				updTalk = !("updTalk" in arg) || arg.updTalk, // по умолчанию true
				saveChildren = !("saveChildren" in arg) || arg.saveChildren,
				MMID = self.get("MMID", null, false),
				excludeMovs = arg.excludeMovs || [];

			// ------------------------------------------------------------------------------

			self.trigger("before-update");

			console.log("MOV-UPDATE(" + self.get("mmid", null, !1) + ")");

			// ------------------------------------------------------------------------------

			return new Promise(function(resolve, reject) {
				dbawws.dbquery({
					"query": ""
					// Получение записи движения ТиУ
					+ "SELECT MMID FROM Movement WHERE MMID = " + MMID + ";"

					// Получение свойств записи
					+ "SELECT uid, pid, ExtClass, ExtID, property, [value] FROM Property WHERE pid = " + MMID + ";"

					+ "SELECT MMID FROM Movement WHERE MMPID = " + MMID,
					"callback": function(dbres) {
						var err = dbUtils.fetchErrStrFromRes(dbres);

						if (err)
							return reject(err);

						resolve(dbres);
					}
				});

			}).then(function(dbres) {
				var values,
					value,
					dbq = [],
					changedFields = self.getChanged(),
					disabledFields = new ObjectA({ "gsdate": 1, "mmid": 1 });

				if (!dbres[0].recs.length)
					return Promise.reject("MovDataModel.update(): !movs.length");

				var movFieldsDecl               = self.__movDataModelDefaultFields,

					dbPropsRecs                 = dbres[1].recs,
					dbCMovsRecs                 = dbres[2].recs,

					dbPropsRecsRefByUId         = {}, // Ссылки на свойства в БД

					deletedPropsUId             = [],
					deletedChildrenMMId         = [],

					selfFPropsRefByUId          = {}, // Ссылки на свойства в обьекте
					selfCMovsByMMId             = {};

				// -----------------------------------------------------------------
				// Ссылки на подчиненные задачи по MMID
				// -----------------------------------------------------------------
				self.getMov().forEach(function(mov) {
					var mmid = mov.get("mmId");

					selfCMovsByMMId[mmid] = mov;
				});

				// ------------------------------------------------------------------
				// Ссылки на свойства задачи
				// ------------------------------------------------------------------
				self.setFProperty(
					self.getFPropertyA().filter(function(row) {
						if (typeof row != "object" || !row)
							return false;

						if (!row.get("property") || !row.get("value"))
							return false;

						row.set("pid", self.get("MMID", null, false));
						row.set("extClass", "DOCS");
						row.set("extId", self.get("Doc", null, false));

						if (!row.get("uid"))
							return true;

						selfFPropsRefByUId[row.get("uid")] = row;

						return true;
					})
				);

				// ------------------------------------------------------------------
				// Создание ссылок на свойства в базе.
				// Создание списка удаленных, добавленных и обновленных свойств
				// ------------------------------------------------------------------
				dbPropsRecs.forEach(function(row) {
					dbPropsRecsRefByUId[row.uid] = row;

					if (!selfFPropsRefByUId[row.uid])
						return deletedPropsUId.push(row.uid);

					if (selfFPropsRefByUId[row.uid].get("value") != row.value) {
						dbq.push(
							""
							+ "UPDATE Property"
							+ " SET"
							+   " [value] = " + dbUtils.mkVal(selfFPropsRefByUId[row.uid].get("value"), "S")
							+   ", [ExtClass] = 'DOCS'"
							+   ", [ExtID] = " + dbUtils.mkVal(self.get("Doc", null, !1), "S")
							+ " WHERE"
							+   " property = '" + row.property + "'"
							+   " AND uid = " + row.uid
						);
					}
				});

				// ------------------------------------------------------------------
				// Запись новых свойств
				// ------------------------------------------------------------------
				self.getFPropertyA().forEach(function(row) {
					if (dbPropsRecsRefByUId[row.get("uid")])
						return;

					dbq.push.apply(dbq, [].concat(InterfaceFProperty.mkDBInsertStr(row) || []));
				});

				// ------------------------------------------------------------------

				if (deletedPropsUId.length)
					dbq.push("DELETE FROM Property WHERE uid IN (" + deletedPropsUId.join(",") + ")");

				// -----------------------------------------------------------------
				// Обновление полей в строке
				// -----------------------------------------------------------------
				values = changedFields.reduce(function(prev, fldKey) {
					if (!movFieldsDecl.get(fldKey))
						return prev;

					if (disabledFields.get(fldKey))
						return prev;

					var value = self.get(fldKey, null, !1),
						type = movFieldsDecl.get(fldKey).type;

					prev.push(dbUtils.mkFld(fldKey) + " = " + dbUtils.mkVal(value, type));

					return prev;
				}, []);

				if (values.length)
					dbq.push("UPDATE Movement SET " + values.join(", ") + " WHERE MMID = " + MMID);

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
				dbCMovsRecs.forEach(function(row) {
					if (selfCMovsByMMId[row.MMID])
						return;

					var mov = new MovDataModel();

					mov.set("mmId", row.MMID);

					promises.push(mov.rm());
				});

				// -----------------------------------------------------------------

				if (saveChildren) {
					self.getMov().forEach(function(mov) {
						var selfMMID = self.get("MMID", null, false),
							eachMMID = mov.get("MMID", null, false);

						// Если в списке исключений, игнорировать любые изменения
						if (!!~excludeMovs.indexOf(eachMMID))
							return;

						// Если ничего не менялось, то и выполнять сохранения нет смысла
						if (!mov.getChanged().length && !mov.hasChangedFProperty())
							return;

						if (mov.get("MMPID", null, !1) != selfMMID)
							mov.set("MMPID", selfMMID, null, !1);

						promises.push(mov.save({ "useNotification": false }));
					});
				} // close.save.children

				// -----------------------------------------------------------------

				if (
					updTalk
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

				return Promise.reject(err);
			});
		},


		"_mMovClsHistory": function() {
			this.clearChanged();
			this.clearFPropertyHistory();

			this.getMov().forEach(function(mov) {
				mov.clearChanged();
				mov.clearFPropertyHistory();
			});
		},


		"__movDataModelDefaultFields": new ObjectA({
			"MMID":         {"type": "integer"},
			"MMPID":        {"type": "integer"},
			"IsDraft":      {"type": "integer"},
			"Tick":         {"type": "integer"},
			"Doc":          {"type": "string"},
			"Doc1":         {"type": "string"},
			"ParentDoc":    {"type": "string"},
			"MMFlag":       {"type": "string"},
			"InOut":        {"type": "integer"},
			"GSDate":       {"type": "date"},
			"GSDate2":      {"type": "date"},
			"Mark":         {"type": "boolean"},
			"CodeOp":       {"type": "string"},
			"CodeDc":       {"type": "string"},
			"ExtCode":      {"type": "string"},
			"Storage":      {"type": "string"},
			"GS":           {"type": "string"},
			"GSSpec":       {"type": "string"},
			"GSExt":        {"type": "integer"},
			"Consigment":   {"type": "integer"},
			"Amount":       {"type": "float"},
			"Rest":         {"type": "float"},
			"RestSum":      {"type": "float"},
			"Price":        {"type": "float"},
			"PrimeCost":    {"type": "float"},
			"Sum":          {"type": "float"},
			"Sum2":         {"type": "float"},
			"MAttr1":       {"type": "string"},
			"MAttr2":       {"type": "string"},
			"MAttr3":       {"type": "string"},
			"MAttr4":       {"type": "string"},
			"FirmProduct":  {"type": "integer"},
			"Remark":       {"type": "string"},
			"NameAVR":      {"type": "string"},
			"Agent2":       {"type": "string"},
			"Manager2":     {"type": "string"},
			"Performer":    {"type": "string"},
			"Stock":        {"type": "boolean"}
		}),


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