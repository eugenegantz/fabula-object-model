"use strict";

var _utils                  = require("./../utils/utils"),
	dbUtils                 = require("./../utils/dbUtils.js"),
	emptyFn                 = function() {},
	DefaultDataModel        = require("./DefaultDataModel"),
	IMovCollection          = require("./IMovCollection.js"),
	InterfaceFProperty      = require("./InterfaceFProperty"),
	IFabModule              = require("./IFabModule.js"),
	IFabTableRow            = require("./IFabTableRow.js"),
	IEvent                  = require("./IEvent"),
	ObjectA                 = require("./ObjectA.js"),
	MField                  = require("./field-models/MField.js"),
	MovDataModel            = require("./MovDataModel");

debugger;

var MFieldDocId = (function() {
	var _protoSet = MField.prototype.set;

	function MFieldDocId() {
		MField.apply(this, arguments);
	}

	MFieldDocId.prototype = _utils.createProtoChain(MField.prototype, {

		"get": function() {
			var mCtx            = this.getModelCtx();
			var gands           = mCtx.getGandsInstance();

			var code            = mCtx.get("_docIdCode");
			var company         = mCtx.get("company");
			var docType         = mCtx.get("docType");
			var regDate         = mCtx.get("regDate");

			var _regDate        = new Date(regDate);
			var year            = _regDate.getFullYear().toString().slice(-1);

			var docTypeGSRow    = gands.dataRefByGSID.get("SYОП" + docType);

			if (
				   !docTypeGSRow
				|| !code
				|| !company
				|| !docType
				|| !regDate
			) {
				return null;
			}

			var prefix          = docTypeGSRow.GSCodeNumber;

			// Ел9ни03221
			return company + year + prefix + code;
		},

		"set": function(val) {
			if (!val)
				return _protoSet.call(this, val);

			var mCtx            = this.getModelCtx();
			var _docId          = mCtx.parseDocID(val);

			var code            = _docId.code;
			var company         = _docId.company;
			var docType         = _docId.docType;
			var year            = _docId.year;

			var now             = new Date();
			var _regDate        = new Date(mCtx.get('reDate'));
			var regDateFullYear = now.getFullYear().toString().slice(0, 3) + year;

			_regDate.setFullYear(regDateFullYear);

			// Format(RegDate,'yyyy-mm-dd Hh:Nn:Ss') as RegDate"

			var regDate = (""
				+       _regDate.getFullYear()
				+ "-" + (_regDate.getMonth() + 1)
				+ "-" + _regDate.getDate()

				+ " " + _regDate.getHours()
				+ ":" + _regDate.getMinutes()
				+ ":" + _regDate.getSeconds()
			);

			mCtx.set("_docIdCode", code, null, false);
			mCtx.set("company", company, null, false);
			mCtx.set("docType", docType, null, false);
			mCtx.set("regDate", regDate, null, false);

			return _protoSet.call(this, val);
		}

	});

	return MFieldDocId;
})();


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

	this.declField("docId", new MFieldDocId({ modelCtx: this }));

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


DocDataModel.getTableScheme = function() {
	return DocDataModel.prototype.__docDataModelsDefaultFields;
};


DocDataModel.getTableName = function() {
	return "Docs";
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

			"add-fab-mov": [
				function(self, e) {
					// rm: теперь doc, doc1, parentDoc в задачах считываются прямо из экземпляра заявки - единый источник правды
					// e.mov.set("doc", this.get("docId"));
					e.mov.setDocInstance(this);
				}
			]

		}),


		/**
		 * Удалить заявку и все подчиненные ей записи из БД
		 *
		 * @param {Object} arg
		 * @param {Function=} arg.callback
		 * @param {String | Object} arg.dbcache
		 *
		 * @return {Promise}
		 * */
		"rm": function(arg) {
			arg = arg || {};

			var self        = this;
			var db          = this.getDBInstance();
			var callback    = arg.callback || emptyFn;
			var docId       = this.get("docId", null, !1);

			return Promise.resolve().then(function() {
				if (!docId)
					return Promise.reject("DocDataMode.rm(): !this.docId");

			}).then(function() {
				return db.query({
					"dbcache": self.iFabModuleGetDBCache(arg.dbcache, { "m": "m-doc.rm-d" }),

					"dbworker": " ",

					"query": ""
					+ " DELETE"
					+ " FROM Property"
					+ " WHERE"
					+   "     extClass = 'DOCS'"
					+   " AND extId = '" + docId + "'"

					+ "; DELETE"
					+ " FROM Docs"
					+ " WHERE"
					+   " docId = '" + docId + "'"

					+ "; DELETE"
					+ " FROM Movement"
					+ " WHERE"
					+   " doc1 = '" + docId + "'"
				});

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
		 *
		 * @param {Object=} arg
		 * @param {Function=} arg.callback
		 * @param {String | Object=} arg.dbcache
		 *
		 * @return {Promise}
		 * */
		"save": function(arg) {
			arg = arg || {};

			var _this                   = this;
			var db                      = _this.getDBInstance();
			var _promise                = Promise.resolve();
			var dbDocRow                = null;
			var dbMovsRows              = [];
			var dbMovsRowsById          = {};
			var dbPropsRows             = [];
			var nextMovsById            = {};
			var callback                = arg.callback || emptyFn;
			var docType                 = _this.get("docType", null, !1);
			var companyID               = _this.get("company", null, !1);
			var isNew                   = !this.get('id') && !this.get('docId');
			var mAttrList               = ["mAttr1", "mAttr2", "mAttr3", "mAttr4"];
			var movsByMAttrRand         = {};

			delete arg.callback;

			function initNewDocId() {
				return _this.getNewDocID({
					"docType": docType,
					"companyID": companyID
				}).then(function(docId) {
					_this.set("docId", docId);
				});
			}

			if (isNew) {
				_promise = _promise.then(function() {
					return initNewDocId();
				});

			} else {
				_promise = _promise.then(function() {
					var _id      = _this.get("id") || "NULL";
					var _docId   = _this.get("docId") ? "'" + _this.get("docId") + "'" : "NULL";

					var query = ""
						+ " SELECT *, Format(RegDate,'yyyy-mm-dd Hh:Nn:Ss') AS RegDate"
						+ " FROM Docs"
						+ " WHERE"
						+   "    docId = " + _docId
						+   " OR id = " + _id

						+ "; SELECT"
						+   "  uid"
						+   ", property"
						+   ", [value]"
						+   ", ExtID"
						+ " FROM Property"
						+ " WHERE"
						+   "     extClass = 'DOCS'"
						+   " AND extId IN ("
						+       " SELECT docId"
						+       " FROM DOCS"
						+       " WHERE"
						+           "    docId = " + _docId
						+           " OR id = " + _id
						+   ")"

						+ "; SELECT *, Format(gsDate,'yyyy-mm-dd Hh:Nn:Ss') AS gsDate"
						+ " FROM Movement"
						+ " WHERE"
						+   " doc1 IN ("
						+       " SELECT docId"
						+       " FROM DOCS"
						+       " WHERE"
						+           "    docId = " + _docId
						+           " OR id = " + _id
						+   ")";

					return (
						db.dbquery({
							"dbcache": _this.iFabModuleGetDBCache(arg.dbcache, { "m": "m-doc.save-load" }),

							"dbworker": " ",

							"query": query
						})
					);

				}).then(function(dbRes) {
					dbDocRow        = dbRes[0].recs[0];
					dbPropsRows     = dbRes[1].recs;
					dbMovsRows      = dbRes[2].recs;

					if (!dbDocRow)
						return initNewDocId(isNew = true);

					var _dbDocRow = ObjectA.create(dbDocRow);

					if (!_this.get("docId"))
						_this.set("docId", _dbDocRow.get("docId"), null, false);

					if (!_this.get("id"))
						_this.set("id", _dbDocRow.get("id"), null, false);
				});
			}

			_promise = _promise.then(function() {
				var query;
				var toDelete            = [];
				var queries             = [];
				var updatedMovs         = [];
				var insertedMovs        = [];

				// ----------------------------------
				// Docs
				// ----------------------------------

				if (isNew) {
					// Собрать запрос на вставку новой записи
					query = dbUtils.createInsertFieldsQueryString({
						"nextFields"          : _this.serializeFieldsObject(),
						"tableScheme"         : _this.getTableScheme(),
						"tableName"           : _this.getTableName()
					});

					if (query)
						_this.trigger("before-insert");

				} else {
					// Собрать запрос на обновление полей
					query = dbUtils.createUpdateFieldsQueryString({
						"nextFields"          : _this.serializeFieldsObject(),
						"prevFields"          : dbDocRow,
						"tableScheme"         : _this.getTableScheme(),
						"tableName"           : _this.getTableName()
					});

					if (query)
						_this.trigger("before-update");
				}

				if (query)
					queries.push(query);

				// ----------------------------------
				// Movement
				// ----------------------------------

				dbMovsRows.forEach(function(row) {
					// регистронезависимые ключи
					// неизвестно как будет записан ключ "MMID"
					var _row = ObjectA.create(row);

					dbMovsRowsById[_row.get("mmId")] = row;
				});

				_this.getNestedMovs().forEach(function(mov) {
					var query;
					var nextFields;
					var mAttrRand;
					var id = mov.get("mmId");

					if (id)
						nextMovsById[id] = mov;

					// Собрать запрос на обновление уже существующих записей
					if (dbMovsRowsById[id]) {
						nextFields  = mov.serializeFieldsObject();

						query = dbUtils.createUpdateFieldsQueryString({
							"prevFields"    : dbMovsRowsById[id],
							"nextFields"    : nextFields,
							"tableScheme"   : mov.getTableScheme(),
							"tableName"     : mov.getTableName()
						});

						if (query) {
							// deprecated
							// для обратно совместимости с версией 0.9.1 и тестами
							mov.trigger("before-update");

							updatedMovs.push(mov);
						}

					} else {
						// -----------------------------------------------------------------
						// Если MAttr[n] не занято, записать в него случайное число
						// для повышения уникальности записи
						// -----------------------------------------------------------------
						mAttrRand   = Math.random().toString().slice(-16);

						mAttrList.some(function(key) {
							if (!mov.get(key, null, !1)) {
								mov.set(key, mAttrRand);

								return true;
							}
						});

						nextFields = mov.serializeFieldsObject();

						movsByMAttrRand[mAttrRand] = mov;

						// Собрать запрос на вставку новых записей
						query = dbUtils.createInsertFieldsQueryString({
							"nextFields"    : nextFields,
							"tableScheme"   : mov.getTableScheme(),
							"tableName"     : mov.getTableName()
						});

						if (query) {
							// deprecated
							// для обратно совместимости с версией 0.9.1 и тестами
							mov.trigger("before-insert");

							insertedMovs.push(mov);
						}
					}

					if (query)
						queries.push(query);
				});

				// Собрать идентификаторы удаленных задач
				dbMovsRows.forEach(function(row) {
					var _row = ObjectA.create(row);
					var id = _row.get("mmId");

					if (!nextMovsById[id])
						toDelete.push(id);
				});

				// Собирать запрос на удаление задач
				if (toDelete.length)
					queries.push("DELETE FROM Movement WHERE mmId IN (" + toDelete + ")");

				if (!queries.length)
					return;

				queries = queries.join("; ");

				return db.query({
					"dbcache": _this.iFabModuleGetDBCache(arg.dbcache, { "m": "m-doc.save-mov-1" }),

					"dbworker": " ",

					"query": queries
				}).then(function() {
					updatedMovs.forEach(function(mov) {
						mov.trigger("after-update");
					});
					insertedMovs.forEach(function(mov) {
						mov.trigger("after-insert");
					});
				});

			}).then(function() {
				// ----------------------------------
				// Movement.mmpid
				// ----------------------------------

				// Прочесть новые mmid
				var mAttrList = Object.keys(movsByMAttrRand).map(function(m) {
					return '"' + m + '"';
				});

				if (!mAttrList.length)
					return;

				var query = ""
					+ " SELECT mmid, mattr1, mattr2, mattr3, mattr4"
					+ " FROM Movement"
					+ " WHERE"
					+ "        mAttr1 IN (" + mAttrList + ")"
					+ "     OR mAttr2 IN (" + mAttrList + ")"
					+ "     OR mAttr3 IN (" + mAttrList + ")"
					+ "     OR mAttr4 IN (" + mAttrList + ")";

				return db.query({
					"dbcache": _this.iFabModuleGetDBCache(arg.dbcache, { "m": "m-doc.save-load-mov" }),

					"dbworker": " ",

					"query": query
				}).then(function(dbRes) {
					dbRes.recs.forEach(function(row) {
						var mov = (
							   movsByMAttrRand[row.mattr1]
							|| movsByMAttrRand[row.mattr2]
							|| movsByMAttrRand[row.mattr3]
							|| movsByMAttrRand[row.mattr4]
						);

						mov.set("mmId", row.mmid);
					});
				});

			}).then(function() {
				var queries = [];

				_this.getNestedMovs().forEach(function(mov) {
					var query;
					var id                  = mov.get("mmid");
					var pMov                = mov.getParentMovInstance();

					var _dbRow              = ObjectA.create(dbMovsRowsById[id] || {});

					// ----------------------------------
					// Movement.mmpid
					// ----------------------------------

					if (pMov && mov.get("mmpid") != pMov.get("mmid")) {
						query = dbUtils.createUpdateFieldsQueryString({
							"prevFields": {
								"mmpid": mov.get("mmpid")
							},
							"nextFields": {
								"mmpid": pMov.get("mmid")
							},
							"tableScheme": MovDataModel.getTableScheme(),
							"tableName": MovDataModel.getTableName()
						});

						mov.set("mmpid", pMov.get("mmid"));

						if (query)
							queries.push(query);
					}

					// ----------------------------------
					// Movement.mmflag
					// ----------------------------------

					if (
						mov.get("mmid")
						&& _dbRow.get("mmflag") != mov.get("mmflag")
					) {
						query = ""
							+ " INSERT INTO Talk (dt, txt, agent, [mm], [tm], [key], [part])"
							+ " SELECT"
							+   " NOW()"
							+   " ," + "'Фаза: " + _dbRow.get("mmid") + " &rArr; " + mov.get("mmflag") + "'"
							+   " ," + 999
							+   " ," + "mmId"
							+   " ," + "FORMAT(TIME(),'HH:MM')"
							+   " ," + "NOW()"
							+   " ," + 0
							+ " FROM Movement"
							+ " WHERE"
							+   " mmId = " + id
							+ ";";

						queries.push(query);
					}
				});

				if (!queries.length)
					return;

				queries = queries.join("; ");

				return db.query({
					"dbcache": _this.iFabModuleGetDBCache(arg.dbcache, { "m": "m-doc.save-mov-2" }),

					"dbworker": " ",

					"query": queries
				});

			}).then(function() {
				// ----------------------------------
				// Properties
				// ----------------------------------

				var query;
				var queries         = [];
				var nextProps       = [];

				// Собрать обновленные свойства
				nextProps.push.apply(nextProps, _this.getProperty());

				_this.getNestedMovs().forEach(function(mov) {
					var query;

					// Собрать обновленные свойства
					nextProps.push.apply(nextProps, mov.getProperty());

					if (query)
						queries.push(query);
				});

				// записать свойства
				// Собрать запрос на обновление, удаление, вставку свойств
				query = InterfaceFProperty.createUpsertDeleteQueryString({
					"prevProps": dbPropsRows,
					"nextProps": nextProps
				});

				if (!query)
					return;

				return db.query({
					"dbcache": _this.iFabModuleGetDBCache(arg.dbcache, { "m": "m-doc.save-props" }),

					"dbworker": " ",

					"query": query
				});

			}).then(function() {
				_this._mDocClsHistory();

				_this.getNestedMovs().forEach(function(mov) {
					mov._mMovClsHistory();
				});

				callback(null, _this)

			}).catch(function(err) {
				callback(err, _this);

				return Promise.reject(err);
			});

			return _promise;
		},


		/**
		 * Новая запись в БД
		 *
		 * @deprecated
		 *
		 * @param {Object=} arg
		 * @param {Function=} arg.callback
		 * @param {String | Object=} arg.dbcache
		 *
		 * @return {Promise}
		 * */
		"insert": function(arg) {
			// event: "before-insert"
			// event: "before-doc-insert"
			// event: "after-insert"
			// event: "doc-insert-error"

			console.warn("DocDataModel.insert(): deprecated");

			return this.save(arg);
		},


		"_getSaveOpt": function(arg) {
			function get2(obj) {
				return ['insert', 'update', 'delete'].reduce(function(obj, key) {
					if (!(key in obj))
						obj[key] = true;

					return obj;
				}, obj || {});
			}

			var ret = ['props', 'movs', 'fields'].reduce(function(obj, key) {
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
		 * @param {Object=} ownArg - аргументы для сохр. заявки
		 * @param {Function=} ownArg.callback
		 * @param {Object=} parentArg - аргументы сохранения родительской заявки, если такая есть
		 * @param {Object=} childrenArg - аргумент сохр. подчиненной заявки, если такие есть
		 * @param {Object=} movArg - аргументы сохранения подчиненных задач // см. MovDataModel
		 * @param {String | Object=} ownArg.dbcache
		 * @param {String=} ownArg.dbworker
		 *
		 * @return {Promise}
		 * */
		"update": function(ownArg, parentArg, childrenArg, movArg) {
			// event: "before-update"
			// event: "before-doc-update"
			// event: "after-update"
			// event: "after-doc-update"
			// event: "update-error"
			// event: "doc-update-error"
			// event: "doc-update-error"

			console.warn("DocDataModel.update(): deprecated");

			return this.save(ownArg);
		},


		"serializeFieldsObject": function() {
			var fields          = {};
			var movFieldsDecl   = this.getTableScheme();

			this.getKeys().forEach(function(key) {
				if (!movFieldsDecl.get(key))
					return;

				fields[key] = this.get(key);
			}, this);

			return fields;
		},


		"serializeObject": function() {
			var obj = {
				"className": "DocDataModel",
			};

			obj.props = JSON.parse(JSON.stringify(this.getProperty()));

			obj.fields = this.serializeFieldsObject();

			obj.movs = this.getMov().map(function(mov) {
				return mov.getJSON();
			});

			return obj;
		},


		/**
		 * @deprecated
		 * */
		"getJSON": function() {
			return this.serializeObject();
		},


		/**
		 * Инициализировать заявку из БД
		 *
		 * @param {Object=} arg
		 * @param {Function=} arg.callback
		 * @param {String} arg.dbworker
		 * @param {Object=} arg.movArg
		 * @param {String | Object=} arg.dbcache
		 * @param {function=} arg.loadAlgorithm
		 *
		 * @return {Promise}
		 * */
		"load": function(arg) {
			arg = Object.assign({}, arg);

			var _this               = this;
			var dbawws              = _this.getDBInstance();
			var callback            = arg.callback || emptyFn;
			var docId               = _this.get("docId", null, !1);

			return Promise.resolve().then(function() {
				if (!docId)
					return Promise.reject("DocDataModel.load(): docId field is not assigned");

				var query = ""
					+ " SELECT *, Format(RegDate,'yyyy-mm-dd Hh:Nn:Ss') as RegDate"
					+ " FROM DOCS"
					+ " WHERE"
					+   " docId = '" + docId + "'"

					+ "; SELECT *"
					+ " FROM Movement"
					+ " WHERE"
					+   " doc1 = '" + docId + "'"

					+ "; SELECT"
					+   "  uid"
					+   ", extClass"
					+   ", extID"
					+   ", property"
					+   ", value"
					+ " FROM Property"
					+ " WHERE"
					+   "     extClass = 'DOCS'"
					+   " AND extId = '" + docId + "'";

				return dbawws.query({
					"dbcache": _this.iFabModuleGetDBCache(arg.dbcache, { "m": "m-doc.load" }),

					"dbworker": arg.dbworker,

					"query": query
				});

			}).then(function(dbRes) {
				var movPropsByMMId          = {},
				    movsById                = {},
				    movsParentAwaitByPId    = {},
				    docRow                  = dbRes[0].recs[0],
				    movsRecs                = dbRes[1].recs,
				    propsRecs               = dbRes[2].recs;

				if (!docRow)
					return Promise.reject("DocDataModel.load(): specified doc record have not found in DOCS table");

				_this.getKeys().forEach(function(k) {
					_this.set(k, void 0, null, !1);
				});

				_this.delMov({});

				_this.deleteFProperty();

				_this.set(docRow);

				propsRecs.forEach(function(mRow) {
					if (!mRow.pid)
						return _this.addProperty(mRow);

					if (!movPropsByMMId[mRow.pid])
						movPropsByMMId[mRow.pid] = [];

					movPropsByMMId[mRow.pid].push(mRow);
				});

				movsRecs.forEach(function(row) {
					var mov = new MovDataModel();

					mov.set(row);

					var parent;
					var id          = mov.get("mmId");
					var pid         = mov.get("mmPId");
					var movDoc      = mov.get("doc");
					var movPDoc     = mov.get("parentDoc");

					// Привязать свойства к задаче
					mov.addProperty(movPropsByMMId[id] || []);

					movsById[id] = mov;

					if (pid) {
						parent = movsById[pid];

						if (parent) {
							parent.addMov(mov);

						} else {
							if (!movsParentAwaitByPId[pid])
								movsParentAwaitByPId[pid] = [];

							movsParentAwaitByPId[pid].push(mov);
						}
					}

					if (movsParentAwaitByPId[id]) {
						mov.addMov(movsParentAwaitByPId[id]);

						delete movsParentAwaitByPId[id];
					}

					// Привязать задачу к заявке
					_this.addMov(mov);

					// Привязать заявку к задаче
					if (movDoc == _this.get("docId"))
						mov.setDocInstance(_this);

					// Привязать родительскую заявку к задаче
					if (movPDoc == _this.get("docId"))
						mov.setParentDocInstance(_this);
				});

				_this._mDocClsHistory();

				_this.state = _this.STATE_DOC_READY;

				callback(null, _this);

			}).catch(function(err) {
				callback(err, _this);

				return Promise.reject(err);
			});
		},


		"_mDocStdMergeFieldFn": function(prev, next) {
			return next;
		},


		/**
		 * Объеденить с другой с записью
		 *
		 * @param {MovDataModel} doc
		 * @param {Object} opt
		 *
		 * @return {MovDataModel}
		 * */
		"merge": function(doc, opt) {
			if (!doc)
				return;

			opt         = opt || {};
			opt.mov     = opt.mov || {};
			opt.fields  = opt.fields || {};

			var fldFn   = opt.fields.walker || this._mDocStdMergeFieldFn;

			this.mergeFProps(doc.getFPropertyA(), opt.props);

			doc.getKeys().forEach(function(k) {
				this.set(
					k,
					fldFn(this.get(k), doc.get(k), k)
				);
			}, this);

			return this.mergeMovs(doc.getMov(), opt);
		},


		/**
		 * Разложить docId на составляющие
		 *
		 * @param {String} docId
		 *
		 * @return {Object}
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
		 *
		 * @param {String} arg.companyID
		 * @param {String=} arg.docType
		 * @param {Function=} arg.callback
		 * @param {String | Object=} arg.dbcache
		 *
		 * @return {Promise}
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
					return reject(
						"DocDataModel.getNewDocID(): " +
						"arg.docType expected to be not empty String of length == 2"
					);
				}

				if (!docTypeGsRow) {
					return reject(
						"DocDataModel.getNewDocID(): " +
						"specified docType not found in GANDS"
					);
				}

				dbawws.dbquery({
					"dbcache": self.iFabModuleGetDBCache(arg.dbcache, { "m": "m-doc.n-doc-id" }),

					"dbworker": " ",

					"query": "" +
						"  SELECT docId FROM Docs" +
						"; SELECT RIGHT(YEAR(DATE()), 1) AS _year",

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
		 *
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
		 *
		 * @return {DocDataModel}
		 * */
		calcAndApplySumOfMovs: function() {
			this.set(this.getSumOfMovs());

			return this;
		},


		/**
		 * Сбросить историю
		 * */
		"_mDocClsHistory": function() {
			this.clearChanged();
			this.clearFPropertyHistory();

			this.getMov().forEach(function(mov) {
				mov.clearChanged();
				mov.clearFPropertyHistory();
			});
		},


		"getTableScheme": function() {
			return DocDataModel.getTableScheme();
		},


		"getTableName": function() {
			return DocDataModel.getTableName();
		},


		"__docDataModelsDefaultFields": (function() {
			var fields = new ObjectA({
				"id":               { "type": "N", "primary": 1 },
				"DocID":            { "type": "S", "unique": 1 },
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
			});

			// продублировать ключи внутри деклараций полей
			// для удобства использования
			fields.getKeys().forEach(function(key) {
				fields.get(key).key = key;
			});

			return fields;
		})(),

	}
);


// Подмешивать docid в свойства
// Чтобы был единый источник правды
(function() {
	var _protoGetFPropertyA = DocDataModel.prototype.getFPropertyA;

	return DocDataModel.prototype.getFPropertyA = function() {
		var _this = this;
		var props = _protoGetFPropertyA.apply(this, arguments);

		props.forEach(function(propRow) {
			propRow.set("extClass", "DOCS");
			propRow.set("pid", 0);
			propRow.set("extId", _this.get("docId"));
		});

		return props;
	};
})();


module.exports = DocDataModel;