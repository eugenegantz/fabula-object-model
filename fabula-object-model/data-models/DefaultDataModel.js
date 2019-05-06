"use strict";

var InterfaceEvents = require("./InterfaceEvents"),
	MField = require("./field-models/MField.js"),
	utils = require("./../utils/utils.js");

/**
 * Предлагает методы для удобной работы с данными. Задуман как основа для расширения других классов.
 * @constructor
 * */
var DefaultDataModel = function() {
	InterfaceEvents.call(this);

	// хэш-таблица для экземпляров полей
	this._mDefaultFields = {};

	// Инициализация предварительно задекларированных полей для модели
	Object.keys(this._mDefaultPreDeclFields).forEach(function(k) {
		this.declField(k, new this._mDefaultPreDeclFields[k]({ modelCtx: this }));
	}, this);

	this._DataModelSettings = {
		"caseSensitiveProps": false
	};
};

// TODO Пересмотреть алиасы. добавить return
DefaultDataModel.prototype = utils.createProtoChain(
	InterfaceEvents.prototype,
	{
		"_objectsPrototyping": utils.createProtoChain.bind(utils),


		/**
		 * Хэш-таблица для моделей полей
		 * */
		"_mDefaultPreDeclFields": {},


		/**
		 * @param {String} key
		 * @param {Object=} arg
		 * @param {*=} useEvent
		 * @memberof DefaultDataModel
		 * */
		"get": function(key, arg, useEvent) {
			key = (key + "").toLowerCase();

			if (typeof useEvent == "undefined" || useEvent) {
				this.trigger("get");
				this.trigger("get:" + key);
			}

			if (!this.hasField(key))
				return;

			return this._mDefaultFields[key].get();
		},


		/**
		 * @param {String} key - ключ
		 * @param value - значение
		 * @param {Object=} arg - доп. аргументы, к примеру, на случай если ключ возвращается из функции.
		 * @param {*=} useEvent
		 * @memberof DefaultDataModel
		 * */
		"set": function(key, value, arg, useEvent) {
			// Множественное присваивание
			if (utils.getType(key) == "object") {
				return Object.keys(key).map(function(k) {
					return this.set(k, key[k]);
				}, this);
			}

			key = (key + "").toLowerCase();

			if (useEvent == void 0)
				useEvent = true;

			var eventProps = {
				"key"           : key,              // ключ свойства
				"prevValue"     : this.get(key),    // предыдущее значение
				"value"         : value,            // устанавливаемое значение
				"argument"      : arg               // переданные аргументы
			};

			var eventBeforeFld      = this._createEvent("set:" + key, eventProps),
			    eventAfterFld       = this._createEvent("afterset:" + key, eventProps),
			    eventAfter          = this._createEvent("afterset", eventProps),
			    eventBefore         = this._createEvent("beforeset", eventProps);

			if (useEvent) {
				this.trigger(eventBefore.type, eventBefore);
				this.trigger(eventBeforeFld.type, eventBeforeFld);
			}

			if (!this.hasField(key))
				this.declField(key, new MField({ modelCtx: this }));

			this._mDefaultFields[key].set(value);

			if (useEvent) {
				this.trigger(eventAfterFld.type, eventAfterFld);
				this.trigger(eventAfter.type, eventAfter);
			}
		},


		/**
		 * Проверить наличие поля
		 * @param {String} key
		 * @return {Boolean}
		 * */
		"hasField": function(key) {
			return (key + "").toLowerCase() in this._mDefaultFields;
		},


		/**
		 * Объявить поле, назначить экземпляр модели поля
		 * @param {String} key - название поля
		 * @param {MField} mdl - экземпляр класса поля
		 * */
		"declField": function(key, mdl) {
			this._mDefaultFields[(key + "").toLowerCase()] = mdl;

			mdl.setModelCtx(this);
		},


		/**
		 * Удалить поле
		 * @param {String} key
		 * */
		"unDeclField": function(key) {
			var mdl;

			key = (key + "").toLowerCase();

			if (!(mdl = this._mDefaultFields[key]))
				return;

			mdl.setModelCtx(void 0);

			delete this._mDefaultFields[key];
		},


		/**
		 * Получить объект поля
		 * @param {String} key
		 * @return {MField}
		 * */
		"getField": function(key) {
			return this._mDefaultFields[(key + "").toLowerCase()];
		},


		/**
		 * Возвращает массив с измененными ключами
		 * @return {Array}
		 * @memberof DefaultDataModel
		 * */
		"getChanged": function() {
			var self = this;

			return this.getKeys().reduce(function(arr, key) {
				self._mDefaultFields[key].isChanged() && arr.push(key);

				return arr;
			}, []);
		},


		/**
		 * Получить названия всех ключей
		 * @return {Array}
		 * */
		"getKeys": function() {
			return Object.keys(this._mDefaultFields);
		},


		/**
		 * Очищает историю изменений
		 * @memberof DefaultDataModel
		 * */
		"clearChanged": function() {
			this.getKeys().forEach(function(key) {
				this._mDefaultFields[key].clearHistory();
			}, this);
		},


		/**
		 * Вернуть модель как Object
		 * @return {Object}
		 * */
		"getPlainObject": function() {
			var self = this;

			return this.getKeys().reduce(function(obj, k) {
				obj[k] = self.get(k, null, !1);

				return obj;
			}, {});
		}

	}
);


DefaultDataModel.declField = function(_class, key, mdl) {
	// Объявлять поля только на своем уровне определения
	if (!_class.prototype.hasOwnProperty('_mDefaultPreDeclFields'))
		_class.prototype._mDefaultPreDeclFields = Object.create(_class.prototype._mDefaultPreDeclFields || {});

	_class.prototype._mDefaultPreDeclFields[(key + "").toLowerCase()] = mdl;
};

DefaultDataModel.unDeclField = function(_class, key) {
	if (!_class.prototype.hasOwnProperty('_mDefaultPreDeclFields'))
		return;

	// Удалять поля только на своем уровне определения
	if (!_class.prototype._mDefaultPreDeclFields.hasOwnProperty(key))
		return;

	delete _class.prototype._mDefaultPreDeclFields[(key + "").toLowerCase()];
};

DefaultDataModel.hasField = function(_class, key) {
	return (key + "").toLowerCase() in _class.prototype._mDefaultPreDeclFields;
};




module.exports = DefaultDataModel;