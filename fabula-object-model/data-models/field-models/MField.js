"use strict";

function MField(arg) {
	this.mFieldConstructor(arg);
}

MField.prototype = {

	"mFieldConstructor": function(arg) {
		arg = arg || {};

		this.maxHistoryLen = 100;
		this._stash = {};
		this._val = void 0;
		this._modelCtx = arg.modelCtx;

		this.clearHistory();
	},


	"get": function() {
		return this._val;
	},


	"set": function(val) {
		this._val = val;

		this._pushHistory(val);

		if (this._history.length > this.maxHistoryLen)
			this._history[0] = this._history.shift();
	},


	"getModelCtx": function() {
		return this._modelCtx;
	},


	"setModelCtx": function(ctx) {
		this._modelCtx = ctx;
	},


	"_pushHistory": function(val) {
		if (!this._history.length)
			return this._history.push(void 0, val);

		this._history.push(val);
	},


	"getHistory": function() {
		return this._history;
	},


	"clearHistory": function() {
		this._history = [this.get()];
	},


	"isChanged": function() {
		return !this.isEq(this._history[0]);
	},


	"goPrevState": function() {
		this._val = this._history.pop();
	},


	"stashState": function(key) {
		this._stash[key] = this._val;
	},


	"unStashState": function(key) {
		this.set(this._stash[key]);

		delete this._stash[key];
	},


	"isEq": function(val) {
		return this.get() == val;
	},


	"isValid": function() {
		return true;
	}

};

module.exports = MField;