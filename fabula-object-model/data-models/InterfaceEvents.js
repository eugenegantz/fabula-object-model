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
	 *
	 * @param {String} eventName - название события
	 * @param {CustomEvent | IEvent=} e - объект события
	 * */
	"trigger": function(eventName, e) {

		if (typeof eventName != "string") {
			return false;
		}

		eventName = eventName.toLowerCase();

		if (
			typeof this._iEventsListeners[eventName] == "object"
			&& Array.isArray(this._iEventsListeners[eventName])
		) {

			if (
				   !(e instanceof IEvent)
				&& !(e instanceof CustomEvent)
				&& !(e instanceof Event)
			) {
				e = this._createEvent(eventName, e);
			}

			var events = this._iEventsListeners[eventName];

			for (var c = 0; c < events.length; c++) {

				if (typeof events[c] != "function") {
					continue;
				}

				var event = events[c];

				if (events[c].isOnce) {
					this._removeListener(eventName, events[c]._unique_id);
				}

				event.apply(this, [this, e]);

				event = null;

			}

		}

	},


	/**
	 * Устанавливает событие
	 *
	 * @param {String} eventName - название события
	 * @param {Function} handler - функция выполняемая при запуске события
	 * */
	"on": function(eventName, handler) {
		if (
			   typeof eventName != "string"
			|| typeof handler != "function"
		) {
			return false;
		}

		eventName = eventName.toLowerCase();

		if (
			typeof this._iEventsListeners[eventName] != "object"
			|| !Array.isArray(this._iEventsListeners[eventName])
		) {
			this._iEventsListeners[eventName] = [];
		}

		handler._unique_id = Math.round(Math.random() * Math.pow(10,18));

		if (  typeof handler.isOnce == "undefined"  ) {
			handler.isOnce = false;
		}

		this._iEventsListeners[eventName].push(handler);

		return true;
	},


	/**
	 * Удалить событие
	 *
	 * @param {String} eventName - название события
	 * @param {function|number} [handler] - обработчик события или уникальный маркер события. Необходим если нужно удалить конкретный держатель события
	 * */
	"removeListener": function(eventName, handler) {
		this._removeListener(eventName, handler);
	},


	/**
	 * Удалить событие
	 *
	 * @private
	 *
	 * @param {String} eventName - название события
	 * @param {function|number} [handler] - обработчик события или уникальный маркер события. Необходим если нужно удалить конкретный держатель события
	 * */
	"_removeListener": function(eventName, handler) {
		// _unique_id является legacy решением.
		// Оставлен на всякий случай для обратной совместимости.

		if (typeof handler == "undefined"){
			this._iEventsListeners[eventName] = [];

			return;
		}

		if (  !Array.isArray(this._iEventsListeners[eventName])  ) {
			return;
		}

		var c = 0;
		var events = this._iEventsListeners[eventName];

		while (events[c]) {
			if (  (events[c] == handler) || (events[c]._unique_id == handler)  ) {
				events.splice(c, 1);
			} else {
				c++;
			}
		}
	},


	/**
	 * @private
	 * */
	"_createEvent": function(name, param) {
		var event;

		if (  !_utils.isBrowser()  ) {
			event = new IEvent(name);

		} else {
			var EventConstructor = CustomEvent || Event;
			event = new EventConstructor(name);
		}

		if (param && typeof param == "object") {
			for(var prop in param) {
				if (  !Object.prototype.hasOwnProperty.call(param, prop)  ) {
					continue;
				}

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
	 *
	 * @param {String} eventName
	 * @return {Array}
	 * */
	"getListeners": function(eventName) {
		if (typeof eventName != "string") {
			return [];
		}

		if (  typeof this._iEventsListeners[eventName] != "object"  ) {
			return [];
		}

		return this._iEventsListeners[eventName];
	},


	/**
	 * Установить событие, функция которой должна выполниться один раз
	 *
	 * @param {String} eventName
	 * @param {Function} handler
	 * */
	"once": function(eventName, handler) {
		if (
			   typeof handler != "function"
			|| typeof eventName != "string"
		) {
			return false;
		}

		handler.isOnce = true;

		this.on(eventName, handler);

		return true;
	}

};

module.exports = EventsInterface;