"use strict";

var IEvent = require("./IEvent");

function IMovCollection() {
	this._iMovCollectionMovs = [];
}

IMovCollection.prototype = {

	/**
	 * @deprecated
	 * */
	"addCMov": function() {
		// console.warn("IMovCollection.prototype.addCMov is deprecated");

		return this.addMov.apply(this, arguments);
	},


	/**
	 * @deprecated
	 * */
	"getCMov": function() {
		// console.warn("IMovCollection.prototype.getCMov is deprecated");

		return this.getMov.apply(this, arguments);
	},


	/**
	 * Получить подчиненные ТиУ движения
	 * @param {MovDataModel | Object=} fldArg - фильтр "поля"
	 * @param {Object=} propArg - фильтр "свойства"
	 * @return {Array}
	 * */
	"getMov": function(fldArg, propArg) {
		if (!arguments.length)
			return this._iMovCollectionMovs;

		var MovDataModel = require("./MovDataModel.js");

		fldArg = fldArg || {};
		propArg = propArg || {};

		if (fldArg instanceof MovDataModel) {
			return this.getMov().filter(function(mov) {
				return mov === fldArg;
			});
		}

		return this._iMovCollectionMovs.filter(function(mov) {
			if (!mov || typeof mov != "object")
				return false;

			if (
				Object.keys(fldArg).some(function(key) {
					if (mov.get(key, null, !1) != fldArg[key])
						return true;
				})
			) {
				return false;
			}

			if (Object.keys(propArg).length)
				return mov.getProperty(propArg).length;

			return true;
		});
	},


	"getNestedMovs": function() {
		return this.getMov().reduce(function(prev, curr) {
			return prev.concat(curr, curr.getNestedMovs());
		}, []);
	},


	/**
	 * Добавить запись ТиУ движение
	 * @param {MovDataModel | Object} argMov
	 * @return {*}
	 * */
	"addMov": function(argMov) {
		var MovDataModel = require("./MovDataModel.js");

		if (
			!(
				Array.isArray(argMov)
				|| argMov instanceof MovDataModel
				|| argMov instanceof Object
			)
		) {
			throw new Error(
				"MovDataModel.addChildMov():" +
				"1st argument expected to be instance of MovDataModel or Object or Array"
			);
		}

		argMov = [].concat(argMov);

		argMov.forEach(function(mov) {
			if (!mov || typeof mov != "object")
				return;

			if (!(mov instanceof MovDataModel)) {
				mov = new MovDataModel();

				// запись полей из передаваемого объекта
				// в новосозданный mov
				mov.set(arguments[0]);
			}

			var e = new IEvent("add-fab-mov");

			e.mov = mov;

			this.trigger("add-fab-mov", e);

			this._iMovCollectionMovs.push(mov);
		}, this);

		return this;
	},


	/**
	 * Удалить запись ТиУ движение
	 * @param {MovDataModel | Object=} arg
	 * @return {*}
	 * */
	"delMov": function(arg) {
		if (!arg)
			return this;

		var MovDataModel = require("./MovDataModel.js");

		if (arg instanceof MovDataModel) {
			this._iMovCollectionMovs = this._iMovCollectionMovs.filter(function(mov) {
				if (!mov || typeof mov != "object")
					return false;

				return mov === arg;
			});

			return this;
		}

		if (!(arg instanceof Object)) {
			throw new Error(
				"MovDataModel.delMov(): " +
				"1st arguments expected to be instance of Object or MovDataModel"
			);
		}

		this.getMov(arg).forEach(this.delMov.bind(this));

		return this;
	}

};

module.exports = IMovCollection;