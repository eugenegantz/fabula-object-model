"use strict";

var _utils = require("./../utils"),
	DefaultDataModel = require("./DefaultDataModel"),
	InterfaceFProperty = require("./InterfaceFProperty"),
	MovDataModel = require("./MovDataModel");

// Для совместимости
var getContextDB = function() {
	var FabulaObjectModel = require("./../_FabulaObjectModel.js"),
		DBModel = FabulaObjectModel.prototype._getModule("DBModel");

	if (this._fabulaInstance) {
		return this._fabulaInstance.getDBInstance();
	}

	return DBModel.prototype.getInstance();
};

// TODO пересмотреть алиасы
/**
 * @constructor
 * @augments DefaultDataModel
 * */
var DocDataModel = function() {
	DefaultDataModel.call(this);
	InterfaceFProperty.call(this);

	// var self = this;

	this.set({
		"Agent":            null, // Integer
		"Manager":          null, // Integer
		"Person":           null, // String
		"FirmContract":     null, // Integer
		"Sum1":             null, // Float
		"Debt":             null, // Float
		"DocID":            null, // String
		"DocType":          null, // String
		"Comment":          null, // String
		"Note":             null // String
	});

	// this.setAlias("get","Doc","DocID");
	// this.setAlias("set","Doc","DocID");

	this.on("set:docid", this._eventSetDocID);
	this.on("set:company", this._eventSetCompany);
	this.on("set:doctype", this._eventSetDocType);

	this.movs = [];

	this.set("_unique_sid", Math.random() * Math.pow(10, 17));

	this.clearChanged();

	if (!this._RB_DOC_CACHE.length) {
		this._initRB_DOC_CACHE();
	}
};

DocDataModel.prototype = DefaultDataModel.prototype._objectsPrototyping(
	DefaultDataModel.prototype,
	InterfaceFProperty.prototype,
	{
		"_docIDApply": function() {
			for (var c = 0; c < this.movs.length; c++) {
				if (!this.movs[c]) continue;
				if (this.movs[c].get("Doc1") != this.get("DocID")) {
					this.movs[c].set("Doc", this.get("DocID"));
				}
			}
		},


		"_eventSetDocID": function(self, e) {
			if (
				!e.value
				|| typeof e.value != "string"
				|| e.value.length != 10
			) {
				return;
			}

			self = this;

			this.parseDocID(
				e.value,
				function(parsed) {
					self.props.doctype = parsed.docType;
					self.props.company = parsed.company;
					self.propsChanged.doctype = true;
					self.propsChanged.company = true;
					self.movSet("Doc", e.value);
				}
			);
		},


		"_eventSetCompany": function(self, e) {
			self = this;

			this.parseDocID(
				this.get("DocID"),
				function(p) {
					self.set("DocID", e.value + p.year + p.prefix + p.code);
					self.movSet("Doc", self.get("DocID"));
				}
			)
		},


		"_eventSetDocType": function(self, e) {
			self = this;

			this.parseDocID(
				this.get("DocID"),
				function(p) {
					var docType = e.value,
						prefix = null,
						RBDOC = self._RB_DOC_CACHE;

					for (var c = 0; c < RBDOC.length; c++) {
						if (RBDOC[c].ID4.toLowerCase() == docType.toLowerCase()) {
							prefix = RBDOC[c].Prefix;
						}
					}

					if (!prefix) return;

					self.set("DocID", p.company + p.year + prefix + p.code);
					self.movSet("Doc", self.get("DocID"));
				}
			);
		},


		"_eventSetID": function() {

		},



		/**
		 * Примеить свойство ко всем задачам внутри заявки
		 * */
		"movSet": function() {
			for (var c = 0; c < this.movs.length; c++) {
				if (typeof this.movs[c] != "object") continue;
				this.movs[c].set.apply(this.movs[c], arguments);
			}

			return this;
		},


		/**
		 * @return {Array}
		 * @param {Object=} fieldsArg
		 * @param {Object=} propertyArg
		 * @memberof DocDataModel
		 * */
		"getMov": function(fieldsArg, propertyArg) {
			if (!arguments.length) return this.movs;

			if (typeof fieldsArg != "object" || !fieldsArg) fieldsArg = {};
			if (typeof propertyArg != "object" || !propertyArg) propertyArg = {};

			var c;

			if (fieldsArg instanceof  MovDataModel) {
				for (c = 0; c < this.movs.length; c++) {
					if (this.movs[c].get("_unique_sid") == fieldsArg.get("_unique_sid")) {
						return [this.movs[c]];
					}
				}

			} else {
				return this.movs.filter(
					function(mov) {
						if (!mov) return false;
						if (typeof mov != "object") return false;

						var keys, c, ret = true;

						keys = Object.getOwnPropertyNames(fieldsArg);

						for (c = 0; c < keys.length; c++) {
							if (mov.get(keys[c]) != fieldsArg[keys[c]]) ret = false;
						}

						keys = Object.getOwnPropertyNames(propertyArg);

						if (keys.length) {
							if (!mov.getProperty(propertyArg).length) ret = false;
						}

						return ret;
					}
				);
			}

			return [];
		},


		/**
		 * Добавить задачу в заявку
		 * @param {MovDataModel} mov  экземпляр задачи
		 * @return {DocDataModel}
		 * @memberof DocDataModel
		 * */
		"addMov": function(mov) {
			// TODO необходимо проверять тип
			mov.set("DocDataObject", this);

			if (mov.get("Doc1") != this.get("DocID"))
				mov.set("Doc", this.get("DocID"));

			this.movs.push(mov);

			this.trigger("add-mov");

			return this;
		},


		/**
		 * Удалить задачу из заявки
		 * @param {Object} keyValue  найти и удалить задачу по след. значениям
		 * @return {DocDataModel}
		 * @memberof DocDataModel
		 * */
		"deleteMov": function(keyValue) {
			if (typeof keyValue != "object") return this;

			if (keyValue instanceof MovDataModel) {
				this.movs = this.movs.filter(function(mov) {
					if (!mov) return false;
					if (typeof mov != "object") return false;
					return mov.get("_unique_sid") != keyValue.get("_unique_sid");
				});

				return this;
			}

			this.movs = this.movs.filter(function(mov) {
				if (!mov) return false;
				if (typeof mov != "object") return false;

				var c, keys = Object.getOwnPropertyNames(keyValue);

				for (c = 0; c < keys.length; c++)
					if (mov.get(keys[c]) != keyValue[keys[c]]) return true;

				return false;
			});

			this.trigger("delete-mov");

			return this;
		},


		/**
		 * Удалить все задачи в заявке
		 * @return {DocDataModel}
		 * @memberof DocDataModel
		 * */
		"deleteAllMovs": function() {
			this.movs = [];

			return this;
		},


		/**
		 * Удалить задачу из заявки
		 * @borrows deleteMov
		 * @memberof DocDataModel
		 * */
		"removeMov": function() {
			return this.deleteMov.apply(this, arguments);
		},


		/**
		 * @borrows deleteAllMovs
		 * @memberof DocDataModel
		 * */
		"removeAllMovs": function() {
			return this.deleteAllMovs();
		},


		/**
		 * Удалить заявку и все подчиненные ей записи из БД
		 * @param {Function=} arg.callback
		 * */
		"rm": function(arg) {
			var c,
				db          = getContextDB.call(this),
				callback    = arg.callback || new Function(),
				movs        = this.getMov(),
				docId       = this.get("docId", null, !1),
				promises    = [];

			if (!docId)
				return callback("DocDataMode.rm(): !this.docId");

			promises.push(
				new Promise(function(resolve, reject) {
					db.dbquery({
						"query": "" +
						"DELETE " +
						"FROM Property " +
						"WHERE " +
						"   extClass = 'DOCS'" +
						"   AND pid = 0" +
						"   AND extId = '" + docId + "';" +

						"DELETE " +
						"FROM Ps_property " +
						"WHERE " +
						"   extClass = 'DOCS'" +
						"   AND pid = 0" +
						"   AND extId = '" + docId + "';" +

						"DELETE " +
						"FROM Docs " +
						"WHERE " +
						"   docId = '" + docId + "'",

						"callback": function(dbres) {
							var c, err = [];

							for (c = 0; c<dbres.length; c++)
								err = err.concat(dbres[c].errors || []);

							if (err.length)
								return reject(err.join('; '));

							resolve();
						}
					});
				})
			);

			for (c = 0; c < movs.length; c++) {
				(function() {
					var mov = movs[c];

					if (!mov.get("mmid", null, !1)) return;

					promises.push(
						new Promise(function(resolve, reject) {
							mov.rm({
								"callback": function(err) {
									if (err)
										return reject(err);

									resolve();
								}
							});
						})
					);
				})();
			}

			Promise.all(promises)
				.then(function() {
					callback(null);
				})
				.catch(callback)
		},


		/**
		 * Сохранить (Добавить/обновить)
		 * @param {Object} arg
		 * @param {Function} arg.callback
		 * @return {DocDataModel}
		 * @memberof DocDataModel
		 * */
		"save": function(arg) {
			var saveMethod = null,
				self = this,
				selfArguments = arguments;

			if (typeof arg != "object")
				arg = Object.create(null);

			var dbawws = getContextDB.call(this),
				callback = typeof arg.callback == "function" ? arg.callback : new Function();

			new Promise(
				function(resolve, reject) {
					var GSID = arg.GSID,
						docType = null,
						companyID = null,
						c;

					if (typeof GSID != "string")
						for (c = 0; c < self.movs.length; c++)
							if (GSID = self.movs[c].get("GS", null, false)) break;

					docType = self.get("DocType");

					companyID = self.get("Company");

					if (!self.get("DocID", null, !1)) {
						self.getNewDocID({
							"GSID": GSID,
							"docType": docType,
							"companyID": companyID,
							"callback": function(err, Doc) {
								if (err)
									return reject(err);

								self.set("DocID", Doc);
								saveMethod = self.insert;
								resolve();
							}
						});

						return;
					}

					dbawws.dbquery({
						"query": "SELECT ID, DocID FROM DOCS WHERE DocID = '" + self.get("DocID") + "' OR id = " + self.get("ID"),
						"callback": function(dbres) {
							if (!dbres.recs.length) {
								if (self.get("DocID", null, !1)) {
									self.set("ID", null, null, !1);
									saveMethod = self.insert;

									return resolve();
								}

								return self.getNewDocID({
									"GSID": GSID,
									"docType": docType,
									"companyID": companyID,
									"callback": function(err, Doc) {
										if (err)
											return reject(err);

										self.set("ID", null);
										self.set("DocID", Doc);
										saveMethod = self.insert;

										resolve();
									}
								});
							}

							self.set("ID", dbres.recs[0].ID);
							saveMethod = self.update;

							resolve();
						}
					});
				}
			)
				.then(function() {
					saveMethod.apply(self, selfArguments);
				})
				.catch(function(reason) {
					callback(reason);
				});

			return this;
		},


		"insert": function(arg) {
			var self = this, c, prop;

			if (typeof arg != "object") arg = Object.create(null);

			var callback = (typeof arg.callback == "function" ? arg.callback : function() {
			} );

			var dbawws = getContextDB.call(this); // DBModel.prototype.getInstance();

			var err = [];

			var ownProps = this.getProperty(null);

			var dbq = [];

			// -------------------------------------------------------------------------------------------

			self.trigger("before-insert");

			// -------------------------------------------------------------------------------------------
			// Поля по-умолчанию

			var defaultFelds = _utils.objectKeysToLowerCase(this.__docDataModelsDefaultFields);
			var disabledFields = ["id"];

			var values = [], fields = [], value;

			for (prop in defaultFelds) {
				if (!defaultFelds.hasOwnProperty(prop)) continue;
				if (disabledFields.indexOf(prop) > -1) continue;

				value = defaultFelds[prop].value || this.get(prop);

				if (!value) continue;

				if (value instanceof Date) {
					value = ""
						+ [value.getDate(), value.getMonth() - 1, value.getFullYear()].join(".")
						+ " "
						+ [value.getHours(), value.getMinutes(), value.getSeconds()].join(";");
				}

				if (defaultFelds[prop].type == "S") {
					values.push(!value ? "NULL" : "\"" + _utils.DBSecureStr(value) + "\"");

				} else {
					values.push(!value ? "NULL" : value);

				}

				fields.push("[" + prop + "]");
			}

			dbq.push("INSERT INTO DOCS (" + fields.join(",") + ") VALUES (" + values.join(",") + ")");

			// -------------------------------------------------------------------------------------------
			// Запись свойств

			dbq.push("DELETE FROM Property WHERE ExtClass = 'DOCS' AND ExtID = '" + this.get("DocID") + "' ");

			var property, type, lowerName;
			var _interfaceFPropertyFields = InterfaceFProperty.prototype._interfaceFPropertyFields;

			for (c = 0; c < ownProps.length; c++) {
				property = ownProps[c];

				values = [];
				fields = [];

				if (typeof property != "object") continue;

				// ........... снижение регистра существующих полей
				property = _utils.objectKeysToLowerCase(property);

				// .......................................................................

				property.pid = 0;

				if (!property.hasOwnProperty("property") || !property.property) {
					continue;
				}

				if (!property.hasOwnProperty("value")) {
					continue;
				}

				if (!property.hasOwnProperty("extclass") || !property.extclass) {
					property.extclass = "DOCS";
				}

				if (
					(
						!property.hasOwnProperty("extid")
						|| !property.extid
					)
					&& self.get("DocID")
				) {
					property.extid = self.get("DocID");
				}

				for (prop in property) {
					if (!property.hasOwnProperty(prop)) continue;

					value = property[prop];
					lowerName = prop.toLowerCase();
					type = null;

					if (value === null || typeof value == "undefined") continue;
					if (
						!_interfaceFPropertyFields.hasOwnProperty(lowerName)
						|| _interfaceFPropertyFields[lowerName].spec
					) {
						continue;
					}

					type = _interfaceFPropertyFields[lowerName].type.toLowerCase();

					if (type == "string") {
						value = "\"" + _utils.DBSecureStr(value) + "\"";
					}

					fields.push("[" + prop + "]");
					values.push(value);

				}
				dbq.push(
					"INSERT INTO Property (" + fields.join(",") + ") VALUES (" + values.join(",") + ")"
				);
			}

			// -----------------------------------------------------------------

			if (err.length) {
				callback(err);
				return;
			}

			// -----------------------------------------------------------------

			var promises = [];

			if (dbq.length) {
				promises.push(
					function(resolve, reject) {
						dbawws.dbquery({
							"query": dbq.join("; "),
							"callback": function(dbres) {
								var tmpErr = [];
								for (var c = 0; c < dbres.length; c++) {
									if (dbres[c].info.errors.length) {
										tmpErr = tmpErr.concat(tmpErr, dbres[c].info.errors);
									}
								}
								if (tmpErr.length) {
									err = err.concat(tmpErr);
									reject(err);
									return;
								}
								resolve();
							}
						});
					}
				);
			}

			for (c = 0; c < self.movs.length; c++) {
				(function() {
					var cc = c;
					promises.push(
						function(resolve, reject) {
							if (self.movs[cc].get("Doc1") != self.get("DocID")) {
								self.movs[cc].set("Doc", self.get("DocID"));
							}
							self.movs[cc].save({
								"callback": function(err_b) {
									if (err_b) {
										err = err.concat(err_b);
										reject(err);
										return;
									}
									resolve();
								}
							})
						}
					);
				})();
			}

			if (!promises.length) {
				callback(null);
				return;
			}

			Promise.cascade(promises, { "stackSize": 1, "interval": 1000 })
				.then(function() {
					callback(null);
					self.trigger("after-insert");
				})
				.catch(function(err) {
					callback(err);
				});


		},

		/**
		 * @param {Object} ownArg                        // Аргументы для сохр. заявки
		 * @param {Function} ownArg.callback
		 * @param {Array} ownArg.excludeMovs        // Игнорировать изменения в перечисленных подчиненных задачах. Массив из MMID (integer)
		 * @param {Object} parentArg                    // Аргументы сохранения родительской заявки, если такая есть
		 * @param {Object} childrenArg                    // Аргумент сохр. подчиненной заявки, если такие есть
		 * @param {Object} movArg                        // Аргументы сохранения подчиненных задач // см. MovDataModel
		 * */
		"update": function(ownArg, parentArg, childrenArg, movArg) {
			var self = this;

			if (typeof ownArg != "object") ownArg = Object.create(null);

			if (typeof movArg != "object") movArg = Object.create(null);

			if (!_utils.objectHasOwnProperty(movArg, "callback")) movArg.callback = new Function();

			var callback = typeof ownArg.callback == "function" ? ownArg.callback : new Function();

			// var useNotification = typeof ownArg.useNotification == "undefined" ? true : Boolean(ownArg.useNotification);

			// var saveChildren = typeof ownArg.saveChildren == "undefined" ? true : Boolean(ownArg.saveChildren);

			// var saveParent = typeof ownArg.saveParent == "undefined" ? true : Boolean(ownArg.saveParent);

			var excludeMovs = _utils.parseArg({
					"value": typeof ownArg.excludeMovs == "undefined" ? null : ownArg.excludeMovs,
					"into": "array",
					"isInt": true,
					"toInt": true,
					"kickEmpty": true,
					"delimiters": [",", ";"]
				}) || [];

			/*
			 var includeMovs = _utils.parseArg({
			 "value": typeof ownArg.includeMovs == "undefined"? null : ownArg.includeMovs,
			 "into":			"array",
			 "isInt":			true,
			 "toInt":			true,
			 "kickEmpty":	true,
			 "delimiters":	[",",";"]
			 }) || [];
			 */

			// var onlyChanged = typeof ownArg.onlyChanged == "undefined" ? true : Boolean(ownArg.onlyChanged);

			var dbawws = getContextDB.call(this); // DBModel.prototype.getInstance();

			// ----------------------------------------------------------------------------

			self.trigger("before-update");

			// ----------------------------------------------------------------------------
			// Запись полей

			dbawws.dbquery({
				"query": [
					"SELECT uid, property, [value], ExtID  " +
					" FROM Property " +
					" WHERE " +
					" pid = 0" +
					" AND ExtClass = 'DOCS' " +
					" AND ExtID IN (SELECT DocID FROM DOCS WHERE ID = " + self.get("ID") + ")",

					"SELECT MMID FROM Movement WHERE Doc IN (SELECT DocID FROM DOCS WHERE ID = " + self.get("ID") + ") "
				].join("; "),
				"callback": function(dbres) {

					var changedFields = self.getChanged();
					var defaultFields = _utils.objectKeysToLowerCase(self.__docDataModelsDefaultFields);
					var disabledFields = ["id", "regdate", "datenew", "useredit", "dateedit"];

					var dbProps = dbres[0].recs;
					var dbMovs = dbres[1].recs;

					var
						values = [],
						value,
						fields = [],
						lowName,
						type,
						c,
					//tmp = [],
						prop,
						lowerName;

					var dbq = [];

					// -----------------------------------------------------------------
					// Обновление полей в строке
					{
						for (c = 0; c < changedFields.length; c++) {
							lowName = changedFields[c].toLowerCase();

							if (!defaultFields.hasOwnProperty(lowName)) continue;
							if (disabledFields.indexOf(lowName) > -1) continue;

							value = self.get(lowName);
							type = defaultFields[lowName].type;

							if (value instanceof Date) {
								value = ""
									+ [value.getDate(), value.getMonth() - 1, value.getFullYear()].join(".")
									+ " "
									+ [value.getHours(), value.getMinutes(), value.getSeconds()].join(";");
							}

							if (type == "S") {
								values.push(("[" + lowName + "]=") + (!value ? "NULL" : "\"" + _utils.DBSecureStr(value) + "\""));

							} else {
								values.push(("[" + lowName + "]=") + (!value ? "NULL" : value));

							}

						}

						if (values.length) {
							dbq.push("UPDATE DOCS SET " + values.join(", ") + " WHERE ID = " + self.get("ID"));
						}
					}

					// -----------------------------------------------------------------
					// Обработка свойств
					// Ссылки на собственные свойства

					var dbPropRef = {};
					var selfPropRef = {};
					var property;
					var tmp = [];

					for (c = 0; c < self._property.length; c++) {
						if (typeof self._property[c] != "object" || !self._property[0]) continue;

						property = _utils.objectKeysToLowerCase(self._property[c]);

						if (!property.hasOwnProperty("value") || property.value === null) continue;

						tmp.push(property);

						property.pid = 0;
						property.extid = self.get("DocID");
						property.extclass = "DOCS";

						if (!property.hasOwnProperty("uid") || !property.uid) continue;

						selfPropRef[property.uid] = property;

					}

					self._property = tmp;

					// ........................................................
					// Ссылки на свойства в БД
					for (c = 0; c < dbProps.length; c++) {
						property = _utils.objectKeysToLowerCase(dbProps[c]);

						if (!property.hasOwnProperty("uid") || !property.uid) continue;

						dbPropRef[property.uid] = property;
					}

					// ........................................................
					// INSERT

					var _interfaceFPropertyFields = InterfaceFProperty.prototype._interfaceFPropertyFields;

					for (c = 0; c < self._property.length; c++) {

						if (
							!self._property[c].uid
							|| !dbPropRef.hasOwnProperty(self._property[c].uid)
						) {
							fields = [];
							values = [];

							for (prop in self._property[c]) {
								if (!self._property[c].hasOwnProperty(prop)) continue;

								value = self._property[c][prop];
								lowerName = prop.toLowerCase();
								type = null;

								if (value === null || typeof value == "undefined") continue;
								if (
									!_interfaceFPropertyFields.hasOwnProperty(lowerName)
									|| _interfaceFPropertyFields[lowerName].spec
								) {
									continue
								}

								type = _interfaceFPropertyFields[lowerName].type;
								type = type.toLowerCase();

								if (type == "string") {
									value = (  value === null || value === "" ? "NULL" : "\"" + _utils.DBSecureStr(value) + "\""  );
								}

								values.push(value);
								fields.push("[" + lowerName + "]");
							}

							if (fields.length != values.length || !fields.length) continue;

							dbq.push("INSERT INTO Property (" + fields.join(",") + ") VALUES (" + values.join(",") + ")");
						}

					}

					// ........................................................
					// UPDATE & DELETE
					var deletedProps = [];

					for (c = 0; c < dbProps.length; c++) {
						if (!selfPropRef.hasOwnProperty(dbProps[c].uid)) {
							deletedProps.push(dbProps[c].uid);
							continue;
						}

						if (
							selfPropRef[dbProps[c].uid].value != dbProps[c].value
							|| dbProps[c].ExtID != self.get("DocID")
						) {
							dbq.push(
								"UPDATE Property " +
								" SET " +
								[
									"[value]=\"" + _utils.DBSecureStr(selfPropRef[dbProps[c].uid].value) + "\"",
									"[ExtID]='" + self.get("DocID") + "'",
									"[ExtClass]='DOCS'"
								].join(", ") +
								" WHERE " +
								" property = '" + dbProps[c].property + "' " +
								" AND uid = " + dbProps[c].uid
							);
						}
					}

					// ------------------------------------------------------------------

					var deletedChildren = [];
					var selfMovsRef = {};

					for (var v = 0; v < self.movs.length; v++) {
						if (typeof self.movs[v] != "object") continue;
						selfMovsRef[self.movs[v].get("MMID")] = self.movs[v];
					}

					for (c = 0; c < dbMovs.length; c++) {
						if (!selfMovsRef.hasOwnProperty(dbMovs[c].MMID)) {
							deletedChildren.push(dbMovs[c].MMID);
						}
					}

					// ------------------------------------------------------------------

					if (deletedProps.length) {
						dbq.push("DELETE FROM Property WHERE uid IN (" + deletedProps.join(",") + ")");
					}

					if (deletedChildren.length) {
						dbq.push("DELETE FROM Movement WHERE MMID IN (" + deletedChildren.join(",") + ")");
						dbq.push("DELETE FROM Property WHERE pid IN (" + deletedChildren.join(",") + ")")
					}

					// ----------------------------------------------------------------------------

					var promises = [];

					if (dbq.length) {
						promises.push(
							function(resolve, reject) {
								dbawws.dbquery({
									"query": dbq.join("; "),
									"callback": function(dbres) {
										var tmpErr = [];
										for (var c = 0; c < dbres.length; c++) {
											if (dbres[c].info.errors.length) {
												tmpErr = tmpErr.concat(tmpErr, dbres[c].info.errors);
											}
										}
										if (tmpErr.length) {
											// err = err.concat(tmpErr);
											reject(tmpErr);
											return;
										}
										resolve();
									}
								});
							}
						);
					}


					for (c = 0; c < self.movs.length; c++) {
						(function() {

							var cc = c;

							if (
								!self.movs[cc].getChanged().length
								&& !self.movs[cc].getChangedProperty().length
							) {
								return;
							}
							if (deletedChildren.indexOf(self.movs[cc].get("MMID")) > -1) {
								return;
							}
							if (excludeMovs.indexOf(self.movs[cc].get("MMID")) > -1) {
								return;
							}
							if (self.movs[cc].get("Doc1") != self.get("DocID")) {
								if (self.movs[cc].get("Doc") != self.get("DocID")) {
									self.movs[cc].set("Doc", self.get("DocID"));
								}
							}

							promises.push(
								function(resolve, reject) {

									var movCallback = movArg.callback;

									movArg.callback = function(err) {
										movCallback(err);
										if (err) {
											// err = err.concat(err_b);
											reject(err);
											return;
										}
										resolve();
									};

									self.movs[cc].save(movArg)
								}
							);
						})();
					}

					if (!promises.length) {
						callback(null);
						return;
					}

					Promise.cascade(promises, { "stackSize": 1, "interval": 1000 })
						.then(
						function() {
							callback(null);
							self.trigger("after-update");
						}
					)
						.catch(
						function(err) {
							callback(err);
						}
					);

				}
			});

		},


		"getJSON": function() {
			var c, lowKey,
				keys            = Object.getOwnPropertyNames(this.props),
				defaultFields   = _utils.objectKeysToLowerCase(this.__docDataModelsDefaultFields),
				ret             = { "className":"DocDataModel", "fields": {}, "movs": [] };

			for (c = 0; c < keys.length; c++) {
				lowKey = keys[c].toLowerCase();

				if (!defaultFields.hasOwnProperty(lowKey)) continue;

				ret.fields[lowKey] = this.props[keys[c]];
			}

			for (c = 0; c < this.movs.length; c++)
				ret.movs.push(this.movs[c].getJSON());

			return ret;
		},


		"load": function(arg) {

			if (typeof arg != "object")
				arg = Object.create(null);

			var self        = this,
				err         = [],
				callback    = typeof arg.callback == "function" ? arg.callback : new Function(),
				DocID       = typeof arg.DocID == "string" && arg.DocID.length == 10 ? arg.DocID : self.get("DocID"),
				taskModel   = typeof arg.taskModel == "function" ? arg.taskModel : MovDataModel,
				excludeGSID = typeof arg.excludeGSID == "object" ? arg.excludeGSID : [],
				includeGSID = typeof arg.includeGSID == "object" ? arg.includeGSID : [],
				useSubMovs  = typeof arg.useSubMovs == "undefined" ? false : Boolean(arg.useSubMovs);

			if (typeof arg.movModel == "function")
				taskModel = arg.movModel;

			// TODO var fields = typeof arg.fields == "undefined"

			var fields = _utils.parseArg({
				"value": arg.fields ? A.fields : null,
				"into": "array",
				"kickEmpty": true,
				"toLowerCase": true,
				"delimiters": [";", ","]
			});

			if (!fields || !fields.length) {
				fields = [
					"ID",
					"DocID",
					"Agent",
					"Manager",
					"User",
					"Person",
					"FirmContract",
					"[Sum1]",
					"[Debt]",
					"Company",
					"DocType",
					"Status",
					"Format(RegDate,'yyyy-mm-dd Hh:Nn:Ss') as RegDate"
				];
			}

			var DBq = [
				"SELECT " + fields.join(",") + " FROM DOCS WHERE DocID = '" + DocID + "' ",

				"SELECT MMID, GS FROM Movement WHERE Doc = '" + DocID + "' " + (useSubMovs ? " OR ParentDoc = '" + DocID + "' " : ""),

				"SELECT uid, extClass, extID, property, value FROM Property WHERE pid = 0 AND ExtClass = 'DOCS' AND ExtID = '" + DocID + "' "
			];

			var dbawws = getContextDB.call(this); // DBModel.prototype.getInstance();

			dbawws.dbquery({
				"query": DBq.join("; "),
				"callback": function(dbres) {
					var task, c, prop, tmp;

					if (!dbres[0].recs.length) {
						callback(["!doc.length"]);
						return;
					}

					var doc = dbres[0].recs[0];
					var movs = dbres[1].recs;
					var props = dbres[2].recs;

					// ------------------------------------------------------------------------------------------

					for (prop in doc) {
						if (!doc.hasOwnProperty(prop)) continue;
						self.set(prop, doc[prop]);
					}

					tmp = [];

					for (c = 0; c < props.length; c++) {
						tmp.push(props[c]);
					}

					self.addProperty(tmp);

					self.clearChanged();

					// ------------------------------------------------------------------------------------------

					if (typeof taskModel != "function") {

						callback(err.length ? err : null);

					} else {

						var movIDs = [];

						for (c = 0; c < movs.length; c++) {
							if (!parseInt(movs[c].MMID)) continue;
							if (movIDs.indexOf(movs[c].MMID) > -1) continue;
							if (includeGSID.length && includeGSID.indexOf(movs[c].GS) == -1) continue;
							if (excludeGSID.length && excludeGSID.indexOf(movs[c].GS) > -1) continue;

							movIDs.push(movs[c].MMID);
						}

						var promises = [];

						for (c = 0; c < movIDs.length; c++) {

							(function() {

								var movID = movIDs[c];

								promises.push(
									new Promise(
										function(resolve) {
											task = new taskModel();
											task.set("MMID", movID);
											self.addMov(task);
											task.load({
												"callback": function(err) {
													// TODO Решить: пропускать данную ошибку, или сообщать и блокировать выполнение.
													if (err) {
														console.error(new Error(err.join(";\n")));
														self.removeMov({ "MMID": task.get("MMID") });
													}
													resolve();
												}
											});
										}
									)
								);

							})();

						}

						Promise.all(promises)
							.then(
							function() {
								/*
								 * Одни и те же записи инициализированные в разном контексте (DocDM или MovDM),
								 * имеют разные уникальные номера, и потому не определяются как одинаковые
								 * => изменения не сквозные и происходят в разных объектах
								 * */
								var movs = self.getMov();
								var cMovs, mov;

								// Взаимозамена одинаковых записей
								for (var c = 0; c < movs.length; c++) {
									cMovs = movs[c].childrenMovs;
									for (var v = 0; v < cMovs.length; v++) {
										mov = self.getMov({ "MMID": cMovs[v].get("MMID") });
										if (mov.length) {
											cMovs[v] = mov[0];
										}
									}

								}

								// ---------------------------------------------------------------------------------

								self.clearChanged();
								self.clearChangedProperty();
								callback(err.length ? err : null, self);
							}
						)
							.catch(
							function(reason) {
								console.log(reason);
							}
						);

					}
				}
			});

		},


		"remove": function(arg) {
			if (typeof arg != "object") arg = Object.create(null);

			var callback = typeof arg.callback == "function" ? arg.callback : new Function();

			if (!this.get("DocID")) {
				callback("!DocID");

				return this;
			}

			var dbawws = getContextDB.call(this);

			dbawws.dbquery({
				"query": "DELETE FROM DOCS WHERE DocID='" + this.get("DocID") + "'",
				"callback": function(dbres) {
					if (dbres.info.errors.length)
						return callback(dbres.info.errors);

					callback(null);
				}
			});

			return this;
		},


		"_RB_DOC_CACHE": [],


		"_initRB_DOC_CACHE": function(callback) {
			var dbawws = getContextDB.call(this),
				self = this;

			dbawws.dbquery({
				"query": "SELECT ID4, DocName, Prefix, GSFilter, Sort FROM RB_DOC ORDER BY Sort ASC",
				"callback": function(dbres) {
					if (self instanceof DocDataModel) {
						Object.getPrototypeOf(self)._RB_DOC_CACHE = dbres.recs;

					} else {
						self._RB_DOC_CACHE = dbres.recs;
					}

					if (typeof callback == "function")
						callback(self._RB_DOC_CACHE);
				}
			});
		},


		"parseDocID": function(DocID, callback) {
			if (typeof DocID != "string") return this;

			var arg = arguments;

			var self = this;

			var res = {
				"code": DocID.slice(5),
				"prefix": DocID.slice(3, 5),
				"company": DocID.slice(0, 2),
				"year": DocID[2],
				"docType": null
			};

			if (!this._RB_DOC_CACHE.length) {
				Object.getPrototypeOf(this)._initRB_DOC_CACHE(function() {
					if (!self._RB_DOC_CACHE.length) return;
					self.parseDocID.apply(self, arg);
				})
			}

			var RBDOC = this._RB_DOC_CACHE;

			for (var c = 0; c < RBDOC.length; c++) {
				if (RBDOC[c].Prefix.toLowerCase() == res.prefix.toLowerCase()) {
					res.docType = RBDOC[c].ID4;
				}
			}

			if (typeof callback != "function") return this;

			callback(res);
		},


		"getNewDocID": function(arg) {
			if (typeof arg != "object") return this;

			if (typeof arg.callback != "function") return this;

			var self        = this,
				callback    = arg.callback,
				dbawws      = getContextDB.call(this),
				GSID        = typeof arg.GSID == "string" ? arg.GSID : null,
				docType     = typeof arg.docType == "string" ? arg.docType : null,
				companyID   = typeof arg.companyID == "string" ? arg.companyID : null;

			if (!companyID) {
				callback(["!arg.companyID"], null);

				return this;
			}

			var DBq = [
				"SELECT TOP 10 mid(DocID,6,5) as nDocID FROM DOCS WHERE right(Year(Date()),1) = mid(DocID,3,1) AND LEN(DocID) = 10 ORDER BY mid(DocID,6,5) DESC",
				"SELECT right(Year(Date()),1) as _year",
				"SELECT ID4, DocName, Prefix, GSFilter, Sort FROM RB_DOC ORDER BY Sort ASC"
			];

			dbawws.dbquery({
				"query": DBq.join("; "),
				"callback": function(dbres) {
					var newDocID, c, v, tmp,
						docTypePrefix = null;

					if (!dbres[2].recs.length) {
						// Выборка из таблицы RB_DOC пуста
						callback(["!RB_DOC.length"]);
						return;

					} else {
						var RBDOC = dbres[2].recs;

						self._RB_DOC_CACHE = RBDOC;

						if (docType) {
							for (c = 0; c < RBDOC.length; c++) {
								if (RBDOC[c].ID4.toLowerCase() == docType.toLowerCase()) {
									docTypePrefix = RBDOC[c].Prefix;
								}
							}

						} else if (GSID) {
							for (c = 0; c < dbres[2].recs.length; c++) {
								tmp = dbres[2].recs[c].GSFilter.split(";");

								for (v = 0; v < tmp.length; v++) {
									tmp[v] = tmp[v].trim().toLowerCase();
									if (!tmp[v]) continue;
									if (GSID.toLowerCase().match(new RegExp(tmp[v])))
										docTypePrefix = dbres[2].recs[c].Prefix;
								}
							}

						} else {
							callback(["!docType && !GSID"]);
							return;
						}
					}

					if (!docTypePrefix) {
						callback(["!docTypePrefix"], null);
						return;
					}

					// --------------------------------------------------------------------------------
					// Сборка кода заявки

					if (!dbres[0].recs.length) {
						newDocID = '00001';

					} else {
						newDocID = parseInt(dbres[0].recs[0].nDocID) + 1;
					}

					var year = dbres[1].recs[0]._year,
						numericRest = 5 - newDocID.toString().length;

					for (c = 0; c < numericRest; c++) {
						newDocID = "0" + newDocID.toString();
					}

					callback(null, companyID + year + docTypePrefix + newDocID);
				}
			});
		},


		/**
		 * Посчитать суммы полей sum, sum2 подчиненных задач
		 * @return {Object}
		 * */
		getSumOfMovs: function() {
			var c,
				sum1 = 0,
				sum2 = 0,
				movs = this.getMov();

			for (c = 0; c < movs.length; c++) {
				sum1 += +movs[c].get("sum", null, !1) || 0;
				sum2 += +movs[c].get("sum2", null, !1) || 0;
			}

			return {
				sum1: sum1,
				sum2: sum2
			};
		},


		/**
		 * Присвоить sum1, sum2 как суммы полей sum, sum2 подчиненных задач
		 * @return {DocDataModel}
		 * */
		calcAndApplySumOfMovs: function() {
			var sums = this.getSumOfMovs();

			this.set("sum1", sums.sum1, null, !1);
			this.set("sum2", sums.sum2, null, !1);

			return this;
		},


		"__docDataModelsDefaultFields": {
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
		}


	}
);

module.exports = DocDataModel;