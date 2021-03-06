"use strict";

var IEvent = require("./IEvent");
var _utils = require("./../utils/utils");

// Хак для nodejs
if (typeof CustomEvent == "undefined") var CustomEvent = IEvent;
if (typeof Event == "undefined") var Event = IEvent;


/**
 * @interface
 * @requires IEvent
 * @requires ./../utils
 * */
var EventsInterface = function(){
	this._iEventsListeners = {};
};

EventsInterface.prototype = {


	/**
	 * Запускает указанное событие
	 * @param {String} eventName - название события
	 * @param {CustomEvent | IEvent=} e - объект события
	 * */
	"trigger": function(eventName, e){

		if (typeof eventName != "string") return false;

		eventName = eventName.toLowerCase();

		if (
			typeof this._iEventsListeners[eventName] == "object"
			&& Array.isArray(this._iEventsListeners[eventName])
		){

			if (
				!(e instanceof IEvent)
				&& !(e instanceof CustomEvent)
				&& !(e instanceof Event)
			){
				e = this._createEvent(eventName, e);
			}

			var events = this._iEventsListeners[eventName];

			for(var c=0; c<events.length; c++){

				if (typeof events[c] != "function") continue;

				var event = events[c];

				if (events[c].isOnce){
					this._removeListener(eventName, events[c]._unique_id);
				}

				event.apply(this,[this, e]);

				event = null;

			}

		}

	},


	/**
	 * Устанавливает событие
	 * @param {String} eventName - название события
	 * @param {Function} fx - функция выполняемая при запуске события
	 * */
	"on": function(eventName, fx){
		// var c, self = this;

		if (
			typeof eventName != "string"
			|| typeof fx != "function"
		) {
			return false;
		}

		eventName = eventName.toLowerCase();

		if (
			typeof this._iEventsListeners[eventName] != "object"
			|| !Array.isArray(this._iEventsListeners[eventName])
		){

			this._iEventsListeners[eventName] = [];

		}

		fx._unique_id = Math.round(Math.random() * Math.pow(10,18));

		if (  typeof fx.isOnce == "undefined"  ) fx.isOnce = false;

		this._iEventsListeners[eventName].push(fx);

		return true;

	},


	/**
	 * Удалить событие
	 * @param {String} eventName - название события
	 * @param {*=} _unique_id - уникальный маркер события. Необходим если нужно удалить конкретный держатель события
	 * */
	"_removeListener": function(eventName, _unique_id){
		if (typeof _unique_id == "undefined"){
			this._iEventsListeners[eventName] = [];
			return;
		}
		if (
			typeof this._iEventsListeners[eventName] == "object"
			&& Array.isArray(this._iEventsListeners[eventName])
		){
			var tmp = [];
			var events = this._iEventsListeners[eventName];
			for(var c=0; c<events.length; c++){
				if (events[c]._unique_id == _unique_id){
					continue;
				}
				tmp.push(events[c])
			}
			this._iEventsListeners[eventName] = tmp;
		}
	},


	/**
	 * @private
	 * */
	"_createEvent": function(name, param){
		var event;

		if (  !_utils.isBrowser()  ){
			event = new IEvent(name);

		} else {
			var EventConstructor = CustomEvent || Event;
			event = new EventConstructor(name);

		}

		if (param && typeof param == "object"){
			for(var prop in param){
				if (  !Object.prototype.hasOwnProperty.call(param, prop)  ) continue;
				event[prop] = param[prop];
			}
		}

		return event;
	},


	/**
	 * Создать объект события
	 *
	 * @param {String} name
	 * @param {Object=} param
	 *
	 * @return {IEvent | CustomEvent}
	 * */
	"createEvent": function(name, param) {
		return this._createEvent(name, param);
	},


	/**
	 * Получить держатели событий
	 * @param {String} eventName
	 * @return {Array}
	 * */
	"getListeners": function(eventName){
		if (typeof eventName != "string"){
			return [];
		}
		if (  typeof this._iEventsListeners[eventName] != "object"  ){
			return [];
		}
		return this._iEventsListeners[eventName];
	},


	/**
	 * Установить событие, функция которой должна выполниться один раз
	 * @param {String} eventName
	 * @param {Function} fx
	 * */
	"once": function(eventName, fx){
		if (
			typeof fx != "function"
			|| typeof eventName != "string"
		){
			return false;
		}
		fx.isOnce = true;
		this.on(eventName, fx);
		return true;
	}

};

module.exports = EventsInterface;