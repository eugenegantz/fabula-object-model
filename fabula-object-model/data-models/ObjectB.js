"use strict";

/**
 * Коллкция ключ-значение, где ключами могут выступать любые типы кроме undefined
 * Аналог современных Map, Set
 * Может быть востребована в связи с неполной поддержкой Map и Set браузерами
 * Интерфес ObjectB совместим с ObjectA
 * */

/**
 * @Constructor
 * */
var ObjectB = function(){

	if (this instanceof ObjectB === false){
		throw new Error("Wrong context");
	}

	this._keys = [];
	this._values = Object.create(null);
	this._length = 0;

};


/**
 * @param {Object} obj
 * */
ObjectB.create = function(obj){
	return new ObjectB(obj);
};


ObjectB.prototype = {

	/**
	 * Возвращает все присвоенные ключи в объекте
	 * */
	"getKeys": function(){
		var keys = [];
		for(var c=0; c<this._keys.length; c++){
			if (  this._keys[c] === void 0  ) continue;
			keys.push(this._keys[c]);
		}
		return keys;
	},


	/**
	 * Возвращает количество ключей
	 * */
	"getLength": function(){
		return this._length;
	},

	/**
	 * Возвращает значение по ключу
	 * @param {String} key
	 * */
	"get": function(key){

		return this._values[this._keys.indexOf(key)];

	},


	/**
	 * Присваивает значенеи по ключу
	 * @param {String} key
	 * @param {all} value
	 * */
	"set": function(key, value){

		if (arguments.length < 2){
			throw new Error("Suppose to be 2 arguments");
		}

		if (typeof key == "undefined"){
			throw new Error("Argument suppose to be any type except \"undefined\"");
		}

		var index = this._keys.indexOf(key);

		if (  index > -1  ){
			this._values[index] = value;

		} else {
			this._values[this._keys.push(key) - 1] = value;
			this._length++;
		}

	},


	/**
	 * Проверяет наличие ключа
	 * @param {String} key
	 * */
	"has": function(key){
		return this._keys.indexOf(key) > -1;
	},


	/**
	 * Удаляет ключ
	 * @param {String} key
	 * */
	"remove": function(key){
		if (typeof key == "undefined"){
			throw new Error("Argument suppose to be any type except \"undefined\"");
		}
		var key_ = this._keys.indexOf(key);
		delete this._keys[key_];
		delete this._values[key_];
		if (key_ > -1) this._length--;

		if (this._keys.length - this._length > 1000){
			this._remap();
		}
	},


	/**
	 * @ignore
	 * */
	"_remap": function(){
		var _keys = [];
		var _values = Object.create(null);
		var _key;
		for(var c=0; c<this._keys.length; c++){
			if (this._keys[c] === void 0) continue;
			_key = _keys.push(this._keys[c]) - 1;
			_values[_key] = this._values[c];
		}
		this._values = _values;
		this._keys = _keys;
	}

};

module.exports = ObjectB;