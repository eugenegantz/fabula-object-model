"use strict";

var emptyFn                 = function() {},
	DefaultDataModel        = require("./DefaultDataModel"),
	IMovCollection          = require("./IMovCollection.js"),
	InterfaceFProperty      = require("./InterfaceFProperty"),
	IFabModule              = require("./IFabModule.js"),
	IFabTableRow            = require("./IFabTableRow.js"),
	IEvent                  = require("./IEvent"),
	ObjectA                 = require("./ObjectA.js"),
	MField                  = require("./field-models/MField.js"),
	MovDataModel            = require("./MovDataModel");

var utils = {
	"common": require("./../utils/utils.js"),
	"string": require("./../utils/string.js"),
	"math": require("./../utils/math.js"),
	"db": require("./../utils/dbUtils.js")
};

var MFieldDocId = (function() {
	var _protoSet = MField.prototype.set;

	function MFieldDocId() {
		MField.apply(this, arguments);
	}

	MFieldDocId.prototype = utils.common.createProtoChain(MField.prototype, {

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
			var _regDate        = new Date(mCtx.get('regDate'));
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

	this.trigger("constructor");
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
			],

			"constructor": []

		}),


		_mDocNewIdLock: {},


		isLockedDocId(id) {
			return !!this._mDocNewIdLock[id];
		},


		lockDocId(id) {
			this._mDocNewIdLock[id] = 1;
		},


		unlockDocId(id) {
			delete this._mDocNewIdLock[id];
		},


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

			var _this       = this;
			var db          = this.getDBInstance();
			var callback    = arg.callback || emptyFn;
			var id          = _this.get("id");
			var docId       = _this.get("docId");
			var knex        = db.getKnexInstance();

			return Promise.resolve().then(function() {
				if (!docId && !id)
					return Promise.reject("DocDataMode.rm(): !docId && !id");

			}).then(function() {
				var query;
				var queryMain;
				var queryProps;
				var queryMovs;
				var queryTalk;
				var subQuery = knex.queryBuilder();

				subQuery.from("Docs");

				if (docId)
					subQuery.where("docId", _this.get("docId"));

				if (id)
					subQuery.orWhere("id", id);

				// ----------------------------------------

				queryMain = subQuery.clone().del();

				// ----------------------------------------

				queryTalk = knex.queryBuilder();
				queryTalk.del();
				queryTalk.from("Talk");
				queryTalk.where("doc", "in", subQuery);

				// ----------------------------------------

				queryProps = knex.queryBuilder();
				queryProps.del();
				queryProps.from("Property");
				queryProps.where("extId", "in", subQuery);
				queryProps.andWhere("extClass", "DOCS");

				// ----------------------------------------

				queryMovs = knex.queryBuilder();
				queryMovs.del();
				queryMovs.from("Movement");
				queryMovs.where("doc1", "in", subQuery);

				// ----------------------------------------

				query = ""
					       + queryTalk.toString()
					+ "; " + queryProps.toString()
					+ "; " + queryMovs.toString()
					+ "; " + queryMain.toString();

				return db.query({
					"dbcache": _this.iFabModuleGetDBCache(arg.dbcache, { "m": "m-doc.rm-d" }),

					"dbworker": " ",

					"query": query
				});

			}).then(function() {
				_this.state = _this.STATE_DOC_REMOVED;

				callback(null, _this);

			}).catch(function(err) {
				callback(err, _this);

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
			var knex                    = db.getKnexInstance();
			var _promise                = Promise.resolve();
			var dbMovsRowsById          = {};
			var nextMovsById            = {};
			var callback                = arg.callback || emptyFn;
			var docType                 = _this.get("docType", null, !1);
			var companyID               = _this.get("company", null, !1);
			var isNew                   = !this.get('id') && !this.get('docId');
			var mAttrList               = ["mAttr1", "mAttr2", "mAttr3", "mAttr4"];
			var _dbDoc                  = new DocDataModel();
			var updatedMovs             = [];
			var insertedMovs            = [];

			delete arg.callback;

			function createMovKey(mov) {
				var movKey      = "";
				var keys        = ["mmid", "mattr1", "mattr2", "mattr3", "mattr4", "gs", "gsspec"];

				if (mov instanceof MovDataModel)
					mov = mov.serializeFieldsObject();

				keys.forEach(function(key) {
					if (mov[key])
						movKey += mov[key];
				});

				return movKey;
			}

			function initNewDocId() {
				return _this.getNewDocID({
					"docType": docType,
					"companyID": companyID
				}).then(function(docId) {
					_this.lockDocId(docId);
					_this.set("docId", docId);
				});
			}

			if (isNew) {
				_promise = _promise.then(function() {
					return initNewDocId();
				});

			} else {
				_promise = _promise.then(function() {
					_dbDoc.set("id", _this.get("id"));
					_dbDoc.set("docId", _this.get("docId"));

					return _dbDoc.load({
						"dbcache": {
							"m": "m-doc.save-load"
						},
						"dbworker": " "
					}).then(function() {
						if (!_this.get("docId"))
							_this.set("docId", _dbDoc.get("docId"), null, false);

						if (!_this.get("id"))
							_this.set("id", _dbDoc.get("id"), null, false);

					}).catch(function(err) {
						var _err = err + "";

						if (!!~_err.indexOf("specified doc record have not found in DOCS table"))
							return isNew = true;

						return err;
					});
				});
			}

			_promise = _promise.then(function() {
				var query;
				var loopAttempts = 3;

				if (!isNew)
					return;

				// ----------------------------------
				// Docs
				// ----------------------------------
				// deprecated
				// Прежде чем соберется запрос
				// Чтобы иметь доступ к еще незаписанным полям
				_this.trigger("before-insert");

				function _loop() {
					// Собрать запрос на вставку новой записи
					query = utils.db.createInsertFieldsQueryString({
						"nextFields"          : _this.serializeFieldsObject(),
						"tableScheme"         : _this.getTableScheme(),
						"tableName"           : _this.getTableName(),
						"db"                  : db
					});

					return db.query({
						"dbcache": _this.iFabModuleGetDBCache(arg.dbcache, { "m": "m-doc.save-mov-1" }),

						"dbworker": " ",

						"query": query
					}).catch(function(err) {
						// На случай ошибки:
						//      Error: Error Exec: Изменения не были успешно внесены из-за повторяющихся значений в индексе,
						//      ключевых полях или связях.  Измените данные в поле или полях, содержащих повторяющиеся значения,
						//      удалите индекс или переопределите его, чтобы разрешить повторяющиеся значения, и повторите попытку.(0);

						// Ошибка, скорее всего, указывает на то, что полученный docId к моменту записи устарел
						// Произвести повторуню выборку и запись

						var _err = err + "";

						if (
							--loopAttempts
							&& !!~_err.indexOf("Изменения не были успешно внесены из-за повторяющихся значений в индексе")
						) {
							return (
								new Promise(function(resolve) {
									var timeout = utils.math.getRandomIntInclusive(500, 5000);

									setTimeout(function() {
										resolve();
									}, timeout);
								})

							).then(function() {
								return initNewDocId();

							}).then(function() {
								return _loop();
							});
						}

						return Promise.reject(err);
					});
				}

				return _loop();

			}).then(function() {
				var query;
				var toDelete            = [];
				var queries             = [];

				// ----------------------------------
				// Docs
				// ----------------------------------
				if (!isNew) {
					// deprecated
					// Прежде чем соберется запрос
					// Чтобы иметь доступ к еще незаписанным полям
					_this.trigger("before-update");

					// Собрать запрос на обновление полей
					query = utils.db.createUpdateFieldsQueryString({
						"nextFields"          : _this.serializeFieldsObject(),
						"prevFields"          : _dbDoc.serializeFieldsObject(),
						"tableScheme"         : _this.getTableScheme(),
						"tableName"           : _this.getTableName(),
						"db"                  : db
					});
				}

				if (query)
					queries.push(query);

				// ----------------------------------
				// Movement
				// ----------------------------------

				_dbDoc.getNestedMovs().forEach(function(mov) {
					dbMovsRowsById[mov.get("mmId")] = mov;
				});

				_this.getNestedMovs().forEach(function(mov) {
					var query;
					var nextFields;
					var prevFields;
					var mAttrRand;
					var id = mov.get("mmId");

					if (id)
						nextMovsById[id] = mov;

					if (dbMovsRowsById[id]) {
						nextFields = mov.serializeFieldsObject();
						prevFields = dbMovsRowsById[id].serializeFieldsObject();

						// Собрать запрос на обновление уже существующих записей
						query = utils.db.createUpdateFieldsQueryString({
							"prevFields"    : prevFields,
							"nextFields"    : nextFields,
							"tableScheme"   : mov.getTableScheme(),
							"tableName"     : mov.getTableName(),
							"db"            : db
						});

						if (query) {
							// deprecated
							// для обратно совместимости с версией 0.9.1 и тестами
							// В отличии от MovDataModel, нет возможности изменить поля
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

						// Собрать запрос на вставку новых записей
						query = utils.db.createInsertFieldsQueryString({
							"nextFields"    : nextFields,
							"tableScheme"   : mov.getTableScheme(),
							"tableName"     : mov.getTableName(),
							"db"            : db
						});

						if (query) {
							// deprecated
							// для обратно совместимости с версией 0.9.1 и тестами
							// В отличии от MovDataModel, нет возможности изменить поля
							mov.trigger("before-insert");

							insertedMovs.push(mov);
						}
					}

					if (query)
						queries.push(query);
				});

				// Собрать идентификаторы удаленных задач
				_dbDoc.getNestedMovs().forEach(function(mov) {
					var id = mov.get("mmId");

					if (!nextMovsById[id])
						toDelete.push(id);
				});

				// Собирать запрос на удаление задач
				if (toDelete.length) {
					query = knex.queryBuilder();
					query.del();
					query.from("Movement");
					query.where("mmId", "in", toDelete);
					queries.push(query.toString());

					query = knex.queryBuilder();
					query.del();
					query.from("Talk");
					query.where("mm", "in", toDelete);
					queries.push(query.toString());
				}

				if (!queries.length)
					return;

				queries = queries.join("; ");

				return db.query({
					"dbcache": _this.iFabModuleGetDBCache(arg.dbcache, { "m": "m-doc.save-mov-1" }),

					"dbworker": " ",

					"query": queries
				});

			}).then(function() {
				// ----------------------------------
				// Movement.mmpid
				// ----------------------------------

				var query = knex.queryBuilder();

				query.select("mmid", "mattr1", "mattr2", "mattr3", "mattr4", "gs", "gsspec");
				query.from("Movement");
				query.where("doc1", _this.get("docId"));

				query = query.toString();

				return db.query({
					"dbcache": _this.iFabModuleGetDBCache(arg.dbcache, { "m": "m-doc.save-load-mov" }),

					"dbworker": " ",

					"query": query
				}).then(function(dbRes) {
					var movsByKey = {};

					// только новые и измененные
					// если новый mmid
					// если изменился mmid
					updatedMovs.concat(insertedMovs).forEach(function(mov) {
						movsByKey[createMovKey(mov)] = mov;
					});

					dbRes.recs.forEach(function(row) {
						var movKey  = createMovKey(Object.assign({}, row, { "mmid": null }));
						var mov     = movsByKey[movKey];

						if (mov)
							mov.set("mmId", row.mmid);
					});

					updatedMovs.forEach(function(mov) {
						mov.trigger("after-update");
					});

					insertedMovs.forEach(function(mov) {
						mov.trigger("after-insert");
					});
				});

			}).then(function() {
				var queries = [];

				_this.getNestedMovs().forEach(function(mov) {
					var query;
					var id                  = mov.get("mmid");
					var pMov                = mov.getParentMovInstance();
					var dbMov               = dbMovsRowsById[id] || new ObjectA();
					var prevFlag            = dbMov.get("mmflag");
					var nextFlag            = mov.get("mmflag");

					// ----------------------------------
					// Movement.mmpid
					// ----------------------------------

					// если есть родительская задача
					// если в родительской задаче изменилось значение для "mmid"
					// отразить изменение о подчинении в БД
					if (pMov && !!~pMov.getChanged().indexOf("mmid")) {
						query = utils.db.createUpdateFieldsQueryString({
							"prevFields": {
								"mmid": mov.get("mmid"),
								"mmpid": null
							},
							"nextFields": {
								"mmid": mov.get("mmid"),
								"mmpid": pMov.get("mmid")
							},
							"tableScheme": MovDataModel.getTableScheme(),
							"tableName": MovDataModel.getTableName(),
							"db": db
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
						&& prevFlag != nextFlag
					) {
						query = knex.queryBuilder();
						query.into("Talk");
						query.insert({
							  "dt": knex.functionHelper.now()
							, "txt": knex.functionHelper.concat("Фаза: ", (prevFlag || ""), " &rArr; ", nextFlag || "")
							, "agent": 999
							, "mm": id
							, "doc": mov.get("doc1")
							, "tm": knex.functionHelper.format(knex.functionHelper.now(), "hh:mm")
							, "key": utils.string.random(8)
							, "part": 0
						});
						queries.push(query.toString());
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
				var nextProps       = [];
				var prevProps       = [];

				// Собрать обновленные свойства
				nextProps.push.apply(nextProps, _this.getProperty());

				// Собрать обновленные свойства
				_this.getNestedMovs().forEach(function(mov) {
					nextProps.push.apply(nextProps, mov.getProperty());
				});

				// Собрать старые свойства
				prevProps.push.apply(prevProps, _dbDoc.getFPropertyA());

				// Собрать старые свойства
				_dbDoc.getNestedMovs().forEach(function(mov) {
					prevProps.push.apply(prevProps, mov.getProperty());
				});

				// записать свойства
				// Собрать запрос на обновление, удаление, вставку свойств
				query = _this.createUpsertDeleteQueryString({
					"prevProps": prevProps,
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

				isNew
					? _this.trigger("after-insert")
					: _this.trigger("after-update");

				setTimeout(function() {
					_this.unlockDocId(_this.get("docId"));
				}, 2500);

				callback(null, _this);

			}).catch(function(err) {
				callback(err, _this);

				isNew
					? _this.trigger("insert-error")
					: _this.trigger("update-error");

				setTimeout(function() {
					_this.unlockDocId(_this.get("docId"));
				}, 2500);

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
		 * @param {String | Object=} ownArg.dbcache
		 * @param {String=} ownArg.dbworker
		 *
		 * @return {Promise}
		 * */
		"update": function(ownArg) {
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


		"serializeFieldsObject": function(arg) {
			arg = Object.assign(arg || {});

			var fields          = {};
			var movFieldsDecl   = this.getTableScheme();

			if (!('strictToTableScheme' in arg))
				arg.strictToTableScheme = true;

			this.getKeys().forEach(function(key) {
				if (arg.strictToTableScheme && !movFieldsDecl.get(key))
					return;

				fields[key] = this.get(key);
			}, this);

			return fields;
		},


		"serializeObject": function(arg) {
			arg = Object.assign(arg || {});

			var obj = {
				"className": "DocDataModel",
			};

			obj.props = JSON.parse(JSON.stringify(this.getProperty()));

			obj.fields = this.serializeFieldsObject(arg.fields);

			obj.movs = this.getMov().map(function(mov) {
				return mov.serializeObject(arg);
			});

			return obj;
		},


		/**
		 * @deprecated
		 * */
		"getJSON": function(arg) {
			return this.serializeObject(arg);
		},


		/**
		 * Инициализировать заявку из БД
		 *
		 * @param {Object=} arg
		 * @param {Function=} arg.callback
		 * @param {String} arg.dbworker
		 * @param {String=} arg.where
		 * @param {String | Object=} arg.dbcache
		 *
		 * @return {Promise}
		 * */
		"load": function(arg) {
			arg = Object.assign({}, arg);

			var queryMain;
			var queryProps;
			var queryMovs;
			var subQuery;
			var _this               = this;
			var db                  = _this.getDBInstance();
			var knex                = db.getKnexInstance();
			var callback            = arg.callback || emptyFn;
			var where               = arg.where;
			var docId               = _this.get("docId", null, !1);
			var id                  = +_this.get("id", null, !1);

			return Promise.resolve().then(function() {
				if (
					   !where
					&& !docId
					&& !id
				) {
					return Promise.reject('DocDataModel.load(): "docId" and "id" and "args.where" field is not assigned');
				}

				subQuery = knex.queryBuilder();
				subQuery.from("Docs");
				subQuery.select("docId");

				if (where) {
					subQuery.where(knex.raw(where));

				} else {
					if (docId)
						subQuery.andWhere("docId", docId);

					if (id)
						subQuery.andWhere("id", id);
				}

				// -------------------------------------------

				queryMain = subQuery.clone();
				queryMain.clearSelect();
				queryMain.select();
				queryMain.column(
					"*",
					knex.functionHelper.asColumn(knex.functionHelper.format("RegDate", "yyyy-MM-dd hh:mm:ss"), "RegDate")
				);

				// -------------------------------------------

				queryMovs = knex.queryBuilder();
				queryMovs.from("Movement");
				queryMovs.select();
				queryMovs.column(
					"*",
					knex.functionHelper.asColumn(knex.functionHelper.format("gsDate", "yyyy-MM-dd hh:mm:ss"), "gsDate"),
					knex.functionHelper.asColumn(knex.functionHelper.format("gsDate2", "yyyy-MM-dd hh:mm:ss"), "gsDate2")
				);
				queryMovs.where("doc1", "in", subQuery);

				// -------------------------------------------

				queryProps = knex.queryBuilder();
				queryProps.from("Property");
				queryProps.select();
				queryProps.column(["uid", "extClass", "extID", "property", "value", "pid"]);
				queryProps.where("extClass", "DOCS");
				queryProps.andWhere("extId", "in", subQuery);

				// -------------------------------------------

				var query = ""
					       + queryMain.toString()
					+ "; " + queryMovs.toString()
					+ "; " + queryProps.toString();

				return db.query({
					"dbcache": _this.iFabModuleGetDBCache(arg.dbcache, { "m": "m-doc.load" }),

					"dbworker": arg.dbworker,

					"query": query
				});

			}).then(function(dbRes) {
				var movsById                = {};
				var docRow                  = dbRes[0].recs[0];
				var movsRecs                = dbRes[1].recs;
				var propsRecs               = dbRes[2].recs;

				if (!docRow)
					return Promise.reject("DocDataModel.load(): specified doc record have not found in DOCS table");

				_this.getKeys().forEach(function(k) {
					_this.set(k, void 0, null, !1);
				});

				_this.delMov({});

				_this.deleteFProperty();

				_this.set(docRow);

				// удалить рудиментарные поля
				_this.unDeclField("docs.regdate");

				movsRecs.map(function(row) {
					// Собрать задачи
					var mov         = new MovDataModel();

					// Записать поля задачи
					mov.set(row);

					// удалить рудиментарные поля
					_this.unDeclField("movement.gsdate");
					_this.unDeclField("movement.gsdate2");

					var id          = mov.get("mmId");

					// Собрать HashMap задач по mmId
					movsById[id] = mov;

					return mov;

				}).forEach(function(mov) {
					var pid         = mov.get("mmpid");
					var pMov        = movsById[pid];
					var movDoc      = mov.get("doc");
					var movPDoc     = mov.get("parentDoc");

					// Связать задачи между собой
					if (pMov)
						pMov.addMov(mov);

					// Подчинить заявке задачи, которые не подчинены задачам в текущей заявке
					if (!pMov)
						_this.addMov(mov);

					// Привязать заявку к задаче
					movDoc == _this.get("docId")
						? mov.setDocInstance(_this)
						: mov.setDocInstance(void 0);

					// Привязать родительскую заявку к задаче
					movPDoc == _this.get("docId")
						? mov.setParentDocInstance(_this)
						: mov.setParentDocInstance(void 0);
				});

				propsRecs.forEach(function(mRow) {
					// Привязать свойства к заявке
					if (!+mRow.pid)
						return _this.addProperty(mRow);

					// Привязать свойства к задаче
					if (movsById[mRow.pid])
						movsById[mRow.pid].addFProperty(mRow);
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

			var queryDocs;
			var queryYear;
			var _this           = this;
			var callback        = arg.callback || emptyFn;
			var db              = _this.getDBInstance();
			var knex            = db.getKnexInstance();
			var gands           = this.getGandsInstance();
			var docType         = arg.docType;
			var companyID       = arg.companyID;
			var docTypeGsRow    = gands.dataRefByGSID.get("SYОП" + docType);

			return Promise.resolve().then(function() {
				if (typeof companyID != "string" || companyID.length != 2) {
					return Promise.reject(
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

				// --------------------------

				queryDocs = knex.queryBuilder();

				queryDocs.select("docId");
				queryDocs.from("Docs");

				// --------------------------

				queryYear = (
					knex.queryBuilder().select(
						knex.functionHelper.asColumn(
							knex.functionHelper.right(
								knex.functionHelper.format(
									knex.functionHelper.now(),
									"yyyy"
								),
								1
							),
							"_year"
						)
					)
				);

				// --------------------------

				var query = queryDocs + "; " + queryYear.toString();

				// --------------------------

				return db.query({
					"dbcache": _this.iFabModuleGetDBCache(arg.dbcache, { "m": "m-doc.n-doc-id" }),

					"dbworker": " ",

					"query": query
				});

			}).then(function(dbres) {
				var currIndex;
				var prevIndex;
				var docIndexList;
				var newDocId = void 0;
				var prefix = docTypeGsRow.GSCodeNumber;
				var year = dbres[1].recs[0]._year;

				if (!prefix)
					return Promise.reject("!docTypePrefix");

				// Собрать выборку сквозной нумерации
				docIndexList = dbres[0].recs.reduce(function(prev, row) {
					if (
						   10 != row.docId.length
						|| year != row.docId[2]
					) {
						return prev;
					}

					var a = +row.docId.slice(5); // либо число либо NaN

					if (a)
						prev.push(a);

					return prev;
				}, []);

				// От меньшего к большему
				docIndexList = docIndexList.sort(function(a, b) {
					return a < b ? -1 : 1;
				});

				// --------------

				function _createDocIdString(fields) {
					var _index          = fields.index;
					var _companyID      = fields.companyID || companyID;
					var _year           = fields.year || year;
					var _prefix         = fields.prefix || prefix;

					_index = _index + "";
					_index = "0".repeat(5 - _index.length) + _index;

					return ""
						+ _companyID
						+ _year
						+ _prefix
						+ _index;
				}

				// --------------

				currIndex = prevIndex = docIndexList[0] || 1;

				// --------------

				docIndexList.some(function(a) {
					currIndex = a;

					if (Math.abs(currIndex - prevIndex) > 1) {
						var _newDocId = _createDocIdString({ index: prevIndex + 1 });

						if (!_this.isLockedDocId(_newDocId))
							return newDocId = _newDocId;
					}

					prevIndex = currIndex;
				});

				// --------------

				if (!newDocId) {
					(function(_newDocId) {
						do {
							_newDocId = _createDocIdString({ index: ++currIndex });
						}

						while (_this.isLockedDocId(_newDocId));

						newDocId = _newDocId;
					})();
				}

				// --------------

				callback(null, _this, newDocId);

				return newDocId;

			}).catch(function(err) {
				callback(err, _this);

				return Promise.reject(err);
			});
		},


		"clone": function() {
			var _this   = this;
			var clone     = new DocDataModel();

			this.getKeys().forEach(function(key) {
				clone.set(key, _this.get(key, null, false), null, false);
			});

			_this.getMov().forEach(function(mov) {
				clone.addMov(mov.clone());
			});

			_this.getFPropertyA().forEach(function(propRow) {
				clone.addFProperty(propRow.getClone());
			});

			clone.clearModelHistory();

			return clone;
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

			this.getNestedMovs().forEach(function(mov) {
				mov.clearModelHistory();
			});
		},


		"clearModelHistory": function() {
			this._mDocClsHistory();
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