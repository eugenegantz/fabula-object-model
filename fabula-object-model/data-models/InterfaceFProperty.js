"use strict";

var InterfaceEvents = require("./InterfaceEvents"),
	DefaultDataModel = require("./DefaultDataModel"),
	ObjectA = require("./ObjectA"),
	dbUtils = require("./../utils/dbUtils.js"),
	utils = require("./../utils/utils.js");

var propUtils = {

	toObjA: function(obj) {
		if (obj instanceof ObjectA)
			return obj;

		return new ObjectA(obj);
	},


	normalizePropRow: function(row) {
		var fieldsDecl = InterfaceFProperty.prototype._interfaceFPropertyFields;

		row = this.toObjA(row);

		row.getKeys().forEach(function(key) {
			if (!fieldsDecl.has(key))
				row.remove(key);

			var type = fieldsDecl.get(key).type;

			if ("string" == type)
				row.set(key, row.get(key) + "");

			if ("integer" == type)
				row.set(key, +row.get(key));

			if (!row.get("valueType")) {
				if (isFinite(row.get("value"))) {
					row.set("valueType", "N");

				} else {
					row.set("valueType", "C");
				}
			}
		});

		return row;
	}

};


/**
 * @interface
 * */
var InterfaceFProperty = function() {
	this._iFPropsData = [];
	this._iFPropsHasChanged = false;

	// changedFProperty

	InterfaceEvents.call(this);
};


InterfaceFProperty.mkDBInsertStr = function(argProp) {
	argProp = [].concat(argProp || []);

	var propDecl = InterfaceFProperty.prototype._interfaceFPropertyFields;

	var inserts = argProp.reduce(function(prev, row) {
		var fields = [],
			values = [];

		if (utils.isEmpty(row) || typeof row != "object")
			return prev;

		if (utils.isEmpty(row.get("property")))
			return prev;

		if (utils.isEmpty(row.get("value")))
			return prev;

		row.getKeys().forEach(function(colKey) {
			var colVal = row.get(colKey),
				fldDecl = propDecl.get(colKey);

			// Если значение свойства пустое - не записывать
			if (utils.isEmpty(colVal))
				return prev;

			// Если такого поля не существует или поле специальное - пропустить
			if (
				!fldDecl
				|| fldDecl.spec
			) {
				return prev;
			}

			fields.push(dbUtils.mkFld(colKey));
			values.push(dbUtils.mkVal(colVal, fldDecl));
		});

		if (!fields.length || !values.length)
			return prev;

		prev.push("INSERT INTO Property (" + fields.join(",") + ") VALUES (" + values.join(",") + ")");

		return prev;
	}, []);

	return inserts.join("; ");
};


/**
 * @abstract
 * */
InterfaceFProperty.prototype = DefaultDataModel.prototype._objectsPrototyping(
	InterfaceEvents.prototype,
	{

		"_interfaceFPropertyFields": new ObjectA({
			"uid":          { "type": "integer" },
			"pid":          { "type": "integer" },
			"sort":         { "type": "integer" },
			"value":        { "type": "string", "length": 250 },
			"valuetype":    { "type": "string" },
			"extclass":     { "type": "string" },
			"extid":        { "type": "string" },
			"property":     { "type": "string" },
			"tick":         { "type": "integer" },
			"[table]":      { "type": "string", "spec": 1 }
			// spec - специальное поле. Отсутсвует в таблице. Участвует в логике.
			// [table] указывает на название таблицы свойств
		}),


		"hasChangedFProperty": function() {
			return this._iFPropsHasChanged;
		},


		"clearFPropertyHistory": function() {
			this._iFPropsHasChanged = false;
		},


		"splitFProperty": function(property) {
			if (!property || typeof property != "object")
				throw new Error("1st argument expected to be Object or ObjectA");

			var value,
				props = [],
				limit = 120;

			property = propUtils.normalizePropRow(property);

			value = (property
				.get("value") || "")
				.match(new RegExp(".{1," + (limit - 1) + "}(\\s|$)|.{1," + limit + "}", "g")) || [];

			value.forEach(function(val) {
				var row = property.getClone();

				row.set("sort", props.length);
				row.set("value", val);

				props.push(row);
			});

			return props;
		},


		/**
		 * @deprecated
		 * */
		"splitProperty": function() {
			return this.splitFProperty.apply(this, arguments);
		},


		/**
		 * Добавить свойство
		 * @param {Object} property - объект-свойства. Ключи в объекте соответсвуют полям в таблице Property
		 * */
		"addFProperty": function(property) {
			this.trigger("add-fab-property");

			if (!property || typeof property != "object")
				return;

			if (Array.isArray(property)) {
				property.forEach(function(row) {
					this.addFProperty(row);
				}, this);

				return;
			}

			property = propUtils.normalizePropRow(property);

			this._iFPropsHasChanged = true;

			this._iFPropsData.push(property);
		},


		/**
		 * @deprecated
		 * */
		"addProperty": function() {
			return this.addFProperty.apply(this, arguments);
		},


		/**
		 * @alias addProperty
		 * */
		"appendProperty": function() {
			return this.addProperty.apply(this, arguments);
		},


		"setFProperty": function(arg) {
			if (Array.isArray(arg)) {
				return this._iFPropsData = arg;

			} else if (utils.getType(arg) == "object") {
				this._iFPropsData = [propUtils.normalizePropRow(arg)];
			}
		},


		/**
		 * Обновить свойство
		 * @param {object} getKeyValue - искомое свойство
		 * @param {Object} setKeyValue - свойство на замену
		 * */
		"updateFProperty": function(getKeyValue, setKeyValue) {
			if (typeof setKeyValue != "object" || !setKeyValue)
				return;

			setKeyValue = propUtils.normalizePropRow(setKeyValue);

			var props = this.getFPropertyA(getKeyValue);

			props.forEach(function(row) {
				ObjectA.assign(row, setKeyValue);
			});

			if (props.length)
				this._iFPropsHasChanged = true;
		},


		/**
		 * @deprecated
		 * */
		"updateProperty": function() {
			return this.updateFProperty.apply(this, arguments);
		},


		/**
		 * Обновляет существующее или записывает новое свойсто с указанными ключами
		 * @param {object} getKeyValue - искомое свойство
		 * @param {Object} insProperty - свойство на замену
		 * */
		"upsertFProperty": function(getKeyValue, insProperty) {
			var ownProperty = this.getFPropertyA(getKeyValue);

			[].concat(insProperty || []).forEach(function(insRow, c) {
				if (!insRow)
					return;

				insRow = propUtils.normalizePropRow(insRow);

				!ownProperty[c]
					? this.addFProperty(insRow)
					: ObjectA.assign(ownProperty[c], insRow);

				this._iFPropsHasChanged = true;
			}, this);
		},


		/**
		 * @deprecated
		 * */
		"upsertProperty": function() {
			return this.upsertFProperty.apply(this, arguments);
		},


		/**
		 * Получить свойство
		 * @param {Object=} argObj - искомое свойство
		 * @return {Array}
		 * */
		"getFProperty": function(argObj) {
			return this.getFPropertyA(argObj).map(function(row) {
				return row.getPlainObject();
			})
		},


		"getFPropertyA": function(argObj) {
			this.trigger("get-fab-property");

			if (
				!arguments.length
				|| !argObj
				|| !Object.keys(argObj).length
			) {
				return this._iFPropsData;
			}

			if (typeof argObj != "object")
				throw new Error("1st argument suppose to be type \"Object\"");

			if (argObj instanceof ObjectA) {
				return this.getFPropertyA().filter(function(row) {
					return row === argObj;
				});
			}

			return this.getFPropertyA().filter(function(row) {
				if (typeof row != "object" || !row)
					return false;

				return Object.keys(argObj).every(function(key) {
					return row.get(key) == argObj[key];
				});
			}, this);
		},


		/**
		 * @deprecated
		 * */
		"getProperty": function() {
			return this.getFProperty.apply(this, arguments);
		},


		/**
		 * Удалить свойство
		 * @param {Object=} argObj - искомое свойство на удаление
		 * */
		"deleteFProperty": function(argObj) {
			this.trigger("remove-fab-property");

			if (
				!arguments.length
				|| !argObj
				|| !Object.keys(argObj).length
			) {
				this._iFPropsData = [];

				return;
			}

			if (argObj instanceof ObjectA) {
				this._iFPropsData = this._iFPropsData.filter(function(row) {
					return row === argObj && (this._iFPropsHasChanged = true)
				}, this);

				return;
			}

			this.getFPropertyA(argObj).forEach(this.deleteFProperty.bind(this));
		},


		"_iFPropsStdMergePropFn": function(prev, next) {
			return !prev
				? next
				: ObjectA.assign(prev, next);
		},


		"_iFPropsStdMergeCmpPropFn": function(prev, next) {
			return prev.get("property").toLowerCase() == next.get("property").toLowerCase();
		},


		/**
		 * Объеденить свойства
		 *
		 * @param {Array} nextProps
		 * @param {Object} opt
		 * */
		"mergeFProps": function(nextProps, opt) {
			opt = opt || {};

			var diff        = [],
			    prevProps   = this.getFPropertyA(),
			    walkFn      = opt.walker || this._iFPropsStdMergePropFn,
			    cmpFn       = opt.cmp || this._iFPropsStdMergeCmpPropFn;

			nextProps.forEach(function(nextProp) {
				var prop;

				if (!nextProp || typeof nextProp != "object")
					return;

				if (!(nextProp instanceof ObjectA))
					nextProp = ObjectA.create(nextProp);

				// Найдено совпадение - обновить запись
				var _match = prevProps.some(function(prevProp, idx) {
					var prop;

					if (!cmpFn.call(this, prevProp, nextProp))
						return false;

					(prop = walkFn.call(this, prevProp, nextProp)) && diff.push(prop);

					// Исключить запись из следующих циклов
					return prevProps.splice(idx, 1);
				});

				// Совпадений не найдено - новая запись
				if (!_match)
					(prop = walkFn.call(this, void 0, nextProp)) && diff.push(prop);
			});

			prevProps.push.apply(prevProps, diff);
		},


		"getUpsertOrDelFPropsQueryStrByDBRes": function(dbPropsRecs, insProperty) {
			var self                    = this,
				dbq                     = [],
				selfFPropsRefByUId      = {},
				deletedPropsUId         = [],
				dbPropsRecsRefByUId     = {};

			insProperty = new ObjectA(insProperty);

			// ---------------------------------
			// Ссылки на свойства задачи
			// ---------------------------------
			self.setFProperty(
				self.getFPropertyA().filter(function(row) {
					if (!(row instanceof ObjectA))
						return false;

					var uid = row.get("uid");

					// Удалить все записи без названия и без значения
					if (!row.get("property") || !row.get("value"))
						return false;

					ObjectA.assign(row, insProperty);

					if (!uid)
						return true;

					selfFPropsRefByUId[uid] = row;

					return true;
				})
			);

			// ---------------------------------
			// Создание ссылок на свойства в базе.
			// Создание списка удаленных, добавленных и обновленных свойств
			// ---------------------------------
			dbPropsRecs.forEach(function(row) {
				row = new ObjectA(row);

				var sets = [],
					uid = row.get("uid"),
					selfRow = selfFPropsRefByUId[uid];

				dbPropsRecsRefByUId[uid] = row;

				if (!selfRow)
					return deletedPropsUId.push(uid);

				row.getKeys().forEach(function(k) {
					var fldDecl = self._interfaceFPropertyFields.get(k);

					if (!fldDecl || fldDecl.spec)
						return;

					if (selfRow.get(k) != row.get(k))
						sets.push(dbUtils.mkFld(k) + " = " + dbUtils.mkVal(selfRow.get(k), fldDecl));
				});

				if (!sets.length)
					return;

				dbq.push(""
					+ "UPDATE Property"
					+ " SET " + sets.join(", ")
					+ " WHERE"
					+   " [uid] = " + uid
				);
			});

			// ---------------------------------
			// Запись новых свойств
			// ---------------------------------
			self.getFPropertyA().forEach(function(row) {
				if (dbPropsRecsRefByUId[row.get("uid")])
					return;

				dbq.push.apply(dbq, [].concat(InterfaceFProperty.mkDBInsertStr(row) || []));
			});

			// ---------------------------------

			if (deletedPropsUId.length)
				dbq.push("DELETE FROM Property WHERE uid IN (" + deletedPropsUId.join(",") + ")");

			return dbq.join("; ");
		}

	}
);

module.exports = InterfaceFProperty;