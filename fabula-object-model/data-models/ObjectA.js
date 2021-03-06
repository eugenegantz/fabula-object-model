"use strict";

/**
 * @Constructor
 * @param {Object} obj
 * */
var ObjectA = function(obj) {
	if (this instanceof ObjectA === false)
		throw new Error("Wrong context");

	this._props = Object.create(null);

	if (!arguments.length)
		return;

	if (typeof obj != "object")
		throw new Error("Argument suppose to be type \"Object\"");

	if (obj) {
		var keys = Object.getOwnPropertyNames(obj);

		for (var c = 0; c < keys.length; c++) {
			this.set(keys[c], obj[keys[c]]);
		}
	}
};


/**
 * @param {Object} obj
 * */
ObjectA.create = function(obj) {
	return new ObjectA(obj);
};


ObjectA.assign = function() {
	var args = Array.prototype.slice.call(arguments, 0);

	return args.reduce(function(prev, curr) {
		Object.assign(prev._props, curr._props);

		return prev;
	});
};


ObjectA.prototype = {

	/**
	 * Возвращает все присвоенные ключи в объекте
	 * */
	"getKeys": function() {
		return Object.keys(this._props);
	},


	/**
	 * Возвращает количество ключей
	 * */
	"getLength": function() {
		return this.getKeys().length;
	},


	/**
	 * Возвращает значение по ключу
	 * @param {String} key
	 * */
	"get": function(key) {
		if (typeof key != "string")
			throw new Error("Argument suppose to be type \"String\"");

		key = key.toLowerCase();

		return this.has(key) ? this._props[key] : void 0;
	},


	/**
	 * Присваивает значенеи по ключу
	 * @param {String} key
	 * @param {all} value
	 * */
	"set": function(key, value) {
		if (arguments.length < 2)
			throw new Error("Suppose to be 2 arguments");

		if (typeof key != "string")
			throw new Error("Argument suppose to be type \"String\"");

		this._props[key.toLowerCase()] = value;
	},


	/**
	 * Проверяет наличие ключа
	 * @param {String} key
	 * */
	"has": function(key) {
		if (typeof key != "string")
			throw new Error("Argument suppose to be type \"String\"");

		return Boolean(Object.getOwnPropertyDescriptor(this._props, key.toLowerCase()));
	},


	/**
	 * Удаляет ключ
	 * @param {String} key
	 * */
	"remove": function(key) {
		if (typeof key != "string")
			throw new Error("Argument suppose to be type \"String\"");

		delete this._props[key.toLowerCase()];
	},


	/**
	 * Вернуть дубликат объекта
	 * @return {ObjectA}
	 * */
	"getClone": function() {
		return new ObjectA(this._props);
	},


	"getPlainObject": function() {
		return this._props;
	}

};

module.exports = ObjectA;