/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/*!*******************************************!*\
  !*** ./sfom/browser/FabulaObjectModel.js ***!
  \*******************************************/
/***/ function(module, exports, __webpack_require__) {

	// --------------------------------------------------------------------------------
	// Полфил CustomEvents для IE9+
	// https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent
	(function () {
		if ( typeof window.CustomEvent === "function" ) return false;
	
		function CustomEvent ( event, params ) {
			params = params || { bubbles: false, cancelable: false, detail: undefined };
			var evt = document.createEvent( 'CustomEvent' );
			evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
			return evt;
		}
	
		CustomEvent.prototype = window.Event.prototype;
	
		window.CustomEvent = CustomEvent;
	})();
	
	// --------------------------------------------------------------------------------
	// FabulaObjectModel
	(function(){
		__webpack_require__(/*! ./cascade */ 1);
		// var dbModel = require("./DBModel");
		var F = __webpack_require__(/*! ./../_FabulaObjectModel */ 2);
	
		// Установка модуля БД для браузера
		// F.prototype._setModule("DBModel", dbModel);
	
		F.globalize = function(){
			var keys = Object.getOwnPropertyNames(this.prototype);
			for(var c=0; c<keys.length; c++){
				window[keys[c]] = this.prototype[keys[c]];
			}
		};
		window.FabulaObjectModel = F;
	})();

/***/ },
/* 1 */
/*!*********************************!*\
  !*** ./sfom/browser/cascade.js ***!
  \*********************************/
/***/ function(module, exports) {

	/**
	 * Promise.cascade execute promises as separate groups of promises with interval between them.
	 * It can be useful if you want to set limit
	 * for simultaneously executing promise functions in one moment of time.
	 * */
	
	(function(){
		if (typeof Promise == "undefined") return;
		if (typeof Promise.cascade != "undefined") return;
	
		Promise.cascade = function(promises, options){
	
			if (typeof options != "object" || typeof options.join == "functions") options = Object.create(null);
	
			// Interval between stacks
			var interval = (
				typeof options.interval == "undefined"
					? 0
					: (
					isNaN(options.interval)
						? 0
						: parseInt(options.interval)
				)
			);
	
			/*
			 * Number of promises in stack.
			 * Promise inside stack proceeds through Promise.all(), parallel.
			 * */
			var stackSize = (
				typeof options.stackSize == "undefined"
					? 1
					: (
					isNaN(options.stackSize)
						? 1
						: parseInt(options.stackSize)
				)
			);
	
			// Objects into Array
			var tmp = [];
			for(var prop in promises){
				if (!promises.hasOwnProperty(prop)) continue;
				tmp.push(promises[prop]);
			}
			promises = tmp;
	
			// Cycled promise function
			var func = function(resolve, reject){
				var promiseStack = [];
	
				var tmp = [], c;
				for (c = 0; c < promises.length; c++) {
					if (promises[c] === null) continue;
					tmp.push(promises[c]);
				}
				promises = tmp;
	
				for (c = 0; c < promises.length; c++) {
					if (typeof promises[c] == "function") promiseStack.push(new Promise(promises[c]));
	
					promises[c] = null;
	
					if (
						promiseStack.length >= stackSize
						|| promises.length == (c + 1)
					) {
						break;
					}
				}
	
				if (!promises.length){
					resolve();
				}
	
				Promise.all(promiseStack)
				.then(
					function () {
						setTimeout(
							function () {
								func(resolve,reject);
							},
							interval
						)
					}
				)
				.catch(
					function(e){
						reject(e);
					}
				);
	
			};
	
			return new Promise(func);
	
		};
	
	})();

/***/ },
/* 2 */
/*!************************************!*\
  !*** ./sfom/_FabulaObjectModel.js ***!
  \************************************/
/***/ function(module, exports, __webpack_require__) {

	
	var FabulaObjModel = function(arg){
		this._dbInstance = null; // this.mod.DBModel.prototype.getInstance(arg);
	
		if (typeof arg != "object"){
			throw new Error("!arg");
		}
	
		if (typeof arg.url != "string" || !arg.url){
			throw new Error("!arg.url");
		}
	
		this.url = arg.url;
	
		this.instances.push(this);
	};
	
	// ------------------------------------------------------------------------
	
	FabulaObjModel.prototype = {};
	
	FabulaObjModel.prototype.mod = Object.create(null);
	
	FabulaObjModel.prototype._lowMethods = Object.create(null);
	
	// ------------------------------------------------------------------------
	
	/**
	 * @param {String} name
	 * @param {Object | Function} _module
	 * */
	FabulaObjModel.prototype._setModule = function(name, _module){
		if (typeof name != "string"){
			throw new Error("1st argument suppose to be String");
		}
		name = name.trim();
		this.mod[name] = _module;
		this._lowMethods[name.toLowerCase()] = _module;
	};
	
	// ------------------------------------------------------------------------
	
	// FabulaObjModel.prototype._setModule("AgentsDataModel", require("./data-models/AgentsDataModel"));
	
	// FabulaObjModel.prototype._setModule("DataModelAdapters", require("./data-models/DataModelAdapters"));
	
	FabulaObjModel.prototype._setModule("DefaultDataModel", __webpack_require__(/*! ./data-models/DefaultDataModel */ 3));
	
	// FabulaObjModel.prototype._setModule("DocDataModel", require("./data-models/DocDataModel"));
	
	// FabulaObjModel.prototype._setModule("FirmsDataModel", require("./data-models/FirmsDataModel"));
	
	FabulaObjModel.prototype._setModule("GandsDataModel", __webpack_require__(/*! ./data-models/GandsDataModel */ 6));
	
	FabulaObjModel.prototype._setModule("InterfaceEvents", __webpack_require__(/*! ./data-models/InterfaceEvents */ 4));
	
	// FabulaObjModel.prototype._setModule("InterfaceFProperty", require("./data-models/InterfaceFProperty"));
	
	// FabulaObjModel.prototype._setModule("MovDataModel	", require("./data-models/MovDataModel"));
	
	// FabulaObjModel.prototype._setModule("PathsDataModel", require("./data-models/PathsDataModel"));
	
	// FabulaObjModel.prototype._setModule("TalksDataModel",  require("./data-models/TalksDataModel"));
	
	FabulaObjModel.prototype._setModule("CalcDefaultPrint",  __webpack_require__(/*! ./data-models/calc/DefaultPrintCalc */ 7));
	
	FabulaObjModel.prototype._setModule("utils", __webpack_require__(/*! ./utils */ 8));
	
	FabulaObjModel.prototype._setModule("ObjectA", __webpack_require__(/*! ./data-models/ObjectA */ 9));
	
	// FabulaObjModel.prototype._setModule("DBModel", null);
	
	// ------------------------------------------------------------------------
	
	/**
	 * @param {String} name
	 * @param {Array} arg
	 * @return {Object}
	 * */
	FabulaObjModel.prototype.create = function(name, arg){
		if (typeof name != "string"){
			throw new Error("1st argument suppose to be String");
		}
	
		name = name.toLowerCase().trim();
	
		if (typeof this._lowMethods[name] == "undefined"){
			throw new Error("Class \"" + name + "\" does not exist");
		}
	
		// var rest = utils.arrayRest(arguments, 1);
		// TODO передать ...rest в конструктор. Например через bind
		var method = this._lowMethods[name];
		var obj;
		var type = this.mod.utils.getType(method);
	
		if (  type == "object"  ) {
			obj = method;
	
		} else if (type == "function") {
			if (  typeof method.prototype.getInstance == "function"  ){
				obj = method.prototype.getInstance();
	
			} else {
				obj = new method();
	
			}
		}
	
		if (obj) obj._fabulaInstance = this;
	
		return obj;
	};
	
	// ------------------------------------------------------------------------
	
	FabulaObjModel.prototype.getDBInstance = function(){
		return this._dbInstance;
	};
	
	// ------------------------------------------------------------------------
	
	FabulaObjModel.prototype.instances = [];
	
	// ------------------------------------------------------------------------
	
	FabulaObjModel.prototype.getInstance = function(arg){
		return this.instances.length ? this.instances[0] : new FabulaObjModel(arg);
	};
	
	// ------------------------------------------------------------------------
	
	module.exports = FabulaObjModel;

/***/ },
/* 3 */
/*!**********************************************!*\
  !*** ./sfom/data-models/DefaultDataModel.js ***!
  \**********************************************/
/***/ function(module, exports, __webpack_require__) {

	// ------------------------------------------------------
	// Прототип модели данных
	
	var InterfaceEvents = __webpack_require__(/*! ./InterfaceEvents */ 4);
	
	var _objectsPrototyping = function(){
		var tmp, c, prop;
	
		if (arguments.length < 2) return;
	
		var main = arguments[0];
	
		for(c=1; c<arguments.length; c++) {
	
			if (typeof arguments[c] != "object") continue;
	
			tmp = {};
	
			// var ownProps = Object.getOwnPropertyNames(arguments[c]);
			// var enumOwnProps = Object.keys(arguments[c]);
	
			for(prop in arguments[c]){
	
				if (  !arguments[c].hasOwnProperty(prop)  ) continue;
	
				tmp[prop] = {
					"writable": true,
					"configurable": true,
					"enumerable": true,
					"value": arguments[c][prop]
				};
	
			}
	
			main = Object.create(main, tmp);
	
		}
	
		return main;
	};
	
	var DefaultDataModel = function(){
	
		this.props 						= Object.create(null);
		this.aliases 						= Object.create(null);
		this.aliases.get 				= Object.create(null);
		this.aliases.getMethods 	= Object.create(null);
		this.aliases.set 				= Object.create(null);
		this.aliases.setMethods 	= Object.create(null);
		this.propsChanged 			= Object.create(null);
	
		this._DataModelSettings = {
			"caseSensitiveProps": false
		};
	
		InterfaceEvents.call(this);
	
		this.on("set", this._defaultEventSet);
	
		this.on("get", this._defaultEventGet);
	
		this.clearChanged();
	
	};
	
	// TODO Пересмотреть алиасы. добавить return
	DefaultDataModel.prototype = _objectsPrototyping(
		InterfaceEvents.prototype,
		{
	
			"_objectsPrototyping": _objectsPrototyping,
	
	
			"_defaultEventSet": function(obj, e){
				this.trigger(e.type, e);
			},
	
	
			"_defaultEventGet": function(obj, e){
				this.trigger(e.type, e);
			},
	
			/**
			 * @param {String} purpose
			 * @param {String} key - старый ключ
			 * @param {String,Function} alias - новый ключ
			 * */
			"setAlias": function(purpose, key, alias){
				// key - старый ключ
				// alias - новый ключ
	
				if (typeof purpose != "string") return;
				// if (typeof alias != "string") return;
				if (typeof key != "string") return;
	
				if (!this._DataModelSettings.caseSensitiveProps){
					key = key.toLowerCase();
					if (typeof alias == "string"){
						alias = alias.toLowerCase();
					}
				}
	
				if (purpose == "get") {
					this.aliases.get[alias] = key;
	
				} else if (
					purpose == "getMethod"
					&& typeof alias == "function"
				){
					this.aliases.getMethods[key] = alias;
	
				} else if ( purpose == "set" ) {
					this.aliases.set[alias] = key;
	
				} else if (
					purpose == "setMethod"
					&& typeof alias == "function"
				) {
					this.aliases.setMethods[key] = alias;
	
				}
	
			},
	
			/**
			 * @param {String} key
			 * @param {Object} arg
			 * @param {*} useEvent
			 * */
			"get" : function(key, arg, useEvent){
	
				if (typeof key != "string") return;
	
				if (!this._DataModelSettings.caseSensitiveProps){
					key = key.toLowerCase();
				}
	
				if ( typeof this.aliases.get[key] == "string" ) {
					key = this.aliases.get[key];
				}
	
				if (  typeof useEvent == "undefined"  ) useEvent = true;
	
				if (  useEvent  ){
					this.trigger("get:"+key);
				}
	
				if ( typeof this.aliases.getMethods[key] != "undefined" ) {
	
					if (typeof arg == "undefined") arg = Object.create(null);
	
					if (  typeof this.aliases.getMethods[key] == "string"  ){
	
						key = this.aliases.getMethods[key];
	
						if (typeof this[key] != "function") return;
	
						return this[key].apply(this, [arg]);
	
					} else if (  typeof this.aliases.getMethods[key] == "function"  ) {
	
						return this.aliases.getMethods[key].apply(this, [arg]);
	
					} else {
	
						return;
	
					}
	
				}
	
				if ( typeof this.props[key] != "undefined" ) {
					return this.props[key];
				}
			},
	
	
			/**
			 * @param {String} key - ключ
			 * @param value - значение
			 * @param {Object} arg - доп. аргументы, к примеру, на случай если ключ возвращается из функции.
			 * @param {*} useEvent
			 * */
			"set" : function(key, value, arg, useEvent){
	
				if (typeof key == "undefined") return false;
	
				// Множественное присваивание
				if ( typeof key == "object" ){
					var return_ = Object.create(null);
					for(var prop in key){
						if (!key.hasOwnProperty(prop)) continue;
						return_[prop] = this.set(prop, key[prop]);
					}
					return return_;
				}
	
				if (typeof key != "string") return false;
	
				if (!this._DataModelSettings.caseSensitiveProps){
					key = key.toLowerCase();
				}
	
				if ( typeof this.aliases.set[key] == "string" ) {
					key = this.aliases.set[key];
				}
	
				// ........................................
	
				if (  typeof useEvent == "undefined"  ) useEvent = true;
	
				if (useEvent) {
					var eventBefore = this._createEvent("set:" + key, {"value": value, "argument": arg}); // createEvent("set:" + key);
					var eventAfter = this._createEvent("afterset:" + key, {"value": value, "argument": arg}); // createEvent("afterset:" + key);
					this.trigger(eventBefore.type, eventBefore);
				}
	
				// ........................................
	
				/*
				* Логичный вопрос: почему не присваивать
				* результат работы метод-алиса по передаваемому в аргументе ключу?
				* Ответ: результат работы метода может быть не одно значение
				* и присваиваться оно может не по собственному ключу а сразу по нескольким
				* */
				var ret = true;
	
				if (  typeof this.aliases.setMethods[key] != "undefined"  ) {
	
					if (typeof arg == "undefined") arg = Object.create(null);
	
					if (typeof this.aliases.setMethods[key] == "string") {
						var methodKey = this.aliases.setMethods[key];
						if (typeof this[methodKey] != "function") {
							return false;
						}
						this.propsChanged[key] = true;
						ret = this[methodKey].apply(this, [value, arg]);
	
					} else if (  typeof this.aliases.setMethods[key] == "function"  ) {
						this.propsChanged[key] = true;
						ret = this.aliases.setMethods[key].apply(this, [value, arg]);
	
					} else {
						return false
	
					}
	
				} else {
					this.propsChanged[key] = true;
					this.props[key] = value;
	
				}
	
				if (useEvent){
					this.trigger(eventAfter.type, eventAfter);
				}
	
				return ret || true;
			},
	
	
			"getChanged": function(){
				var tmp = [];
				for(var prop in this.propsChanged){
					if (typeof this.propsChanged.hasOwnProperty == "function"){
						if (!this.propsChanged.hasOwnProperty(prop)) continue;
					}
					tmp.push(prop);
				}
				return tmp;
			},
	
	
			"clearChanged": function(){
				this.propsChanged = Object.create(null);
			}
	
	
		}
	);
	
	module.exports = DefaultDataModel;

/***/ },
/* 4 */
/*!*********************************************!*\
  !*** ./sfom/data-models/InterfaceEvents.js ***!
  \*********************************************/
/***/ function(module, exports, __webpack_require__) {

	var IEvent = __webpack_require__(/*! ./IEvent */ 5);
	
	// Хак для nodejs
	if (typeof CustomEvent == "undefined") var CustomEvent = IEvent;
	if (typeof Event == "undefined") var Event = IEvent;
	
	var EventsInterface = function(){
		this._events = {};
	};
	
	EventsInterface.prototype = {
	
		"trigger": function(eventName, e){
	
			if (typeof eventName != "string") return false;
	
			eventName = eventName.toLowerCase();
	
			if (
				typeof this._events[eventName] == "object"
				&& Array.isArray(this._events[eventName])
			){
	
				if (
					e instanceof IEvent
					&& e instanceof CustomEvent === false
					&& e instanceof Event === false
				){
					e = this._createEvent(eventName);
				}
	
				var events = this._events[eventName];
	
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
				typeof this._events[eventName] != "object"
				|| !Array.isArray(this._events[eventName])
			){
	
				this._events[eventName] = [];
	
			}
	
			fx._unique_id = Math.round(Math.random() * Math.pow(10,18));
	
			if (  typeof fx.isOnce == "undefined"  ) fx.isOnce = false;
	
			this._events[eventName].push(fx);
	
			return true;
	
		},
	
	
		"_removeListener": function(eventName, _unique_id){
			if (typeof _unique_id == "undefined"){
				this._events[eventName] = [];
				return;
			}
			if (
				typeof this._events[eventName] == "object"
				&& Array.isArray(this._events[eventName])
			){
				var tmp = [];
				var events = this._events[eventName];
				for(var c=0; c<events.length; c++){
					if (events[c]._unique_id == _unique_id){
						continue;
					}
					tmp.push(events[c])
				}
				this._events[eventName] = tmp;
			}
		},
	
	
		/**
		 * ������� �������
		 * @param {String} name
		 * @param {Object=} param
		 * */
		"_createEvent": function(name, param){
			if (  typeof document != "object"  ){
				return new IEvent(name);
			}
			var EventConstructor = CustomEvent || Event;
			var event = new EventConstructor(name);
	
			if (typeof param == "object"){
				for(var prop in param){
					if (  param.hasOwnProperty  ){
						if (  !param.hasOwnProperty(prop)  ) continue;
					}
					event[prop] = param[prop];
				}
			}
	
			return event;
		},
	
	
		"getListeners": function(eventName){
			if (typeof eventName != "string"){
				return [];
			}
			if (  typeof this._events[eventName] != "object"  ){
				return [];
			}
			return this._events[eventName];
		},
	
	
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

/***/ },
/* 5 */
/*!************************************!*\
  !*** ./sfom/data-models/IEvent.js ***!
  \************************************/
/***/ function(module, exports) {

	// TODO IEvent
	
	var IEvent = function(type){
		if (typeof type != "string"){
			throw new Error("1st argument suppose to be String");
		}
		this.type					= type;
		this.timestamp			= Date.now();
		this.currentTarget		= null;
		this.cancelable				= false;
		this.detail					= null;
		this.eventPhase			= null;
		this.target					= null;
	};
	
	module.exports = IEvent;

/***/ },
/* 6 */
/*!********************************************!*\
  !*** ./sfom/data-models/GandsDataModel.js ***!
  \********************************************/
/***/ function(module, exports, __webpack_require__) {

	// ------------------------------------------------------
	// Номенклатура
	var Ajax = __webpack_require__(/*! ./../browser/Ajax */ 10);
	
	var GandsDataModel = function(){
		this.init();
	};
	
	GandsDataModel.prototype = {
		"init" : function(){
	
			this.dbModel = null;
	
			this.data = [];
	
			this.instances.push(this);
	
			this.GSUnits = Object.create(null);
	
			this.state = 0;
	
		},
	
		"instances" : [],
	
		"getInstance" : function(){
			if (this.instances.length){
				return this.instances[0];
			}
			return new GandsDataModel();
		},
	
		"load" : function(A){
			if (typeof A == "undefined") A = Object.create(null);
			var callback = (typeof A.callback == "function" ? A.callback : function(){} );
			var self = this;
	
			Ajax.req({
				url: self._fabulaInstance.url,
				method: "POST",
				data: {
					model: "GandsDataModel"
				},
				callback: function(http){
					var res = JSON.parse(http.responseText);
	
					self.data = res.data;
					self.state = 1;
	
					var c, L, gandsRef = Object.create(null);
	
					for(c=0; c<self.data.length; c++){
						gandsRef[self.data[c].GSID] = self.data[c];
						self.data[c].gandsExtRef = [];
					}
	
					var gandsExt = res.ext;
	
					for(c=0; c<gandsExt.length; c++){
						if (  typeof gandsRef[gandsExt[c].GSExID] == "undefined"  ) continue;
						gandsRef[gandsExt[c].GSExID].gandsExtRef.push(gandsExt[c]);
					}
	
					var gandsProps = res.props;
	
					for(c=0; c<gandsProps.length; c++){
						if (  typeof gandsRef[gandsProps[c].extID] == "undefined"  ) continue;
						gandsRef[gandsProps[c].extID].gandsPropertiesRef.push(gandsProps[c]);
					}
	
					for(c= 0, L=self.data.length; c<L; c++){
						if (typeof self.GSUnits[self.data[c].GSID] == "undefined") {
							self.GSUnits[self.data[c].GSID] = self.data[c].GSUnit
						}
					}
	
					self.dataReferences = gandsRef;
	
					callback(self.data);
	
				},
				onerror: function(http){
					console.error(http);
				}
			});
	
		},
	
		"get" : function(A){
			if (typeof A != "object") A = Object.create(null);
			var type = (typeof A.type != "object" ? [] : A.type );
			var cop = typeof A.cop != "object" ? [] : A.cop;
	
			if (!type.length && !cop.length) return this.data;
	
			var tmp = [], c, v;
	
			for (c = 0; c < this.data.length; c++) {
	
				if (  tmp.indexOf(this.data[c]) > -1  ) continue;
	
				// Соответсвует ТМЦ / Бумага
				// Сюда могут быть включены: картон, самокопирка и пр.
				if (
					type.indexOf("material-paper") > -1
					&& this.data[c].GSID.toLowerCase().match(/тцбу/gi)
					&& this.data[c].GSID.length > 4
				) {
					tmp.push(this.data[c]);
				}
	
				// Выбирает из ТМЦ / Бумага только конкретно бумагу
				if (
					type.indexOf("paper") > -1
					&& this.data[c].GSID.toLowerCase().match(/тцбуме|тцбуоф|тцбуса|тцбуск|тцбуцп|тцбуфб/gi)
				) {
					tmp.push(this.data[c]);
				}
	
				if (
					type.indexOf("materials:print") > -1
					&& this.data[c].GSID.match(/тцмп/gi)
				){
					if (
						this.data[c].GSID.match(/тцмпбг|тцмпкк|тцмпкл|тцмпкр|тцмпкт|тцмпрс|тцмпс1|тцмпск|тцмпто/gi)
						|| this.data[c].GSID.length <= 6
					){
						continue;
					}
					tmp.push(this.data[c]);
				}
	
				if (
					type.indexOf("carton") > -1
					&& this.data[c].GSID.toLowerCase().match(/тцбуд1|тцбуд3|тцбукр|тцбупр/gi)
				) {
					tmp.push(this.data[c]);
				}
	
				if (
					type.indexOf("envelope") > -1
					&& this.data[c].GSID.toLowerCase().match(/тцбуко/)
				) {
					tmp.push(this.data[c]);
				}
	
				if (type.indexOf("products") > -1) {
					if (
						this.data[c].GSCOP.match(/17/)
						|| this.data[c].GSCOP.match(/27/)
					) {
						if (!this.data[c].GSCOP.match(/276|176/)) {
							tmp.push(this.data[c]);
						}
					}
				}
	
				if (type.indexOf("print") > -1) {
					if (
						this.data[c].GSCOP.match(/17/)
						|| this.data[c].GSCOP.match(/27/)
						|| this.data[c].GSCOP.match(/07/)
					) {
						tmp.push(this.data[c]);
					}
				}
	
				if (type.indexOf("products:print") > -1) {
					if (
						this.data[c].GSCOP.match(/17/)
						|| this.data[c].GSCOP.match(/27/)
					) {
						if (!this.data[c].GSCOP.match(/276|176/)) {
							tmp.push(this.data[c]);
						}
					}
				}
	
				/*
				if (type.indexOf("postproc:COP17") > -1) {
					if (  this.data[c].GSCOP == "176" ) {
						tmp.push(this.data[c]);
					}
				}
	
				if (type.indexOf("postproc:cutting") > -1) {
					if (  this.data[c].GSID.match(/ПЗРАВЫ|РУПОДП01|ДХПОДОВы/)  ) {
						tmp.push(this.data[c]);
					}
				}
	
				if (type.indexOf("postproc:COP27") > -1) {
					if (  this.data[c].GSCOP == "276" ) {
						tmp.push(this.data[c]);
					}
				}
	
				if (type.indexOf("COP07") > -1){
					if (  this.data[c].GSCOP == "07" ) {
						tmp.push(this.data[c]);
					}
				}
				*/
	
				for(v=0; v<cop.length; v++){
					if (  cop[v] instanceof RegExp  ){
						if (  this.data[c].GSCOP.match(cop[v])  ){
							tmp.push(this.data[c]);
						}
	
					} else if (  typeof cop[v].GSCOP == "string"  ) {
						if (  cop[v] == this.data[c]  ){
							tmp.push(this.data[c]);
						}
	
					}
				}
			}
	
			return tmp;
		},
	
		"getGSUnit": function(GSID){
			if (typeof GSID == "undefined") return;
	
			if (typeof this.GSUnits[GSID] == "undefined") return;
	
			return this.GSUnits[GSID];
		}
	
	};
	
	module.exports = GandsDataModel;

/***/ },
/* 7 */
/*!***************************************************!*\
  !*** ./sfom/data-models/calc/DefaultPrintCalc.js ***!
  \***************************************************/
/***/ function(module, exports, __webpack_require__) {

	var GandsDataModel = __webpack_require__(/*! ./../GandsDataModel */ 6);
	
	var DefaultPrintCalc = function(){
		this.instances.push(this);
	};
	
	
	DefaultPrintCalc.prototype.instances = [];
	
	
	DefaultPrintCalc.prototype.getInstance = function(){
		return this.instances.length ? this.instances[0] : new DefaultPrintCalc();
	};
	
	
	/**
	 * @param {Object} arg
	 * @param {Number, String} arg.amount - количество
	 * @param {String} arg.GSID - номер в номенклатуре
	 * */
	DefaultPrintCalc.prototype.calc = function(arg){
	
		if (typeof arg != "object") {
			throw new Error("1st argument suppose to be Object");
		}
	
		// ---------- Количество
		if (
			typeof arg.amount == "undefined"
			|| isNaN(arg.amount)
		) {
			throw new Error("arg.amount suppose to be Numeric");
		}
	
		var argAmount = +arg.amount;
	
		// ---------- Код в номенклатуре
		if (
			typeof arg.GSID != "string"
			|| !arg.GSID
		){
			throw new Error("arg.GSID suppose to be String");
		}
	
		var argGSID = arg.GSID;
	
		// ---------- Расход / Доход
		var salePrice = true;
		if (typeof arg.salePrice != "undefined") salePrice = Boolean(arg.salePrice);
	
		var gandsM = GandsDataModel.prototype.getInstance();
	
		if (  !gandsM.dataReferences.has(argGSID)  ){
			return 0;
		}
	
		var gandsRow = gandsM.dataReferences.get(argGSID);
	
		var prices = {
			"price": salePrice ? gandsRow.GSCostSale : gandsRow.GSCost,
			"gsCost": gandsRow.GSCost,
			"gsCostSale": gandsRow.GSCostSale
		};
	
		prices.sum = prices.price * argAmount;
	
		var loopPrice, loopAmount, cost = 0, kol = 0;
	
		gandsRow.gandsExtRef.sort(function(a, b){
			return a.GSExSort - b.GSExSort;
		});
	
		for(var c=0; c<gandsRow.gandsExtRef.length; c++) {
			loopPrice = +gandsRow.gandsExtRef[c].GSExNum;
			loopAmount = +gandsRow.gandsExtRef[c].GSExSort;
	
			// Цена покупки
			if (
				!salePrice
				&& gandsRow.gandsExtRef[c].GSExType.toLowerCase().trim() == "цена продажи"
			) {
				continue;
			}
	
			// Цена продажи
			if (
				salePrice
				&& gandsRow.gandsExtRef[c].GSExType.toLowerCase().trim() != "цена продажи"
			) {
				continue;
			}
	
			// ------------------------------------------------------------
			// Автор блока: Миланин Альберт
			{
	
				if (argAmount >= loopAmount) {
					cost = loopPrice;
					kol = loopAmount;
	
				} else if (argAmount <= loopAmount) {
					try {
						if (cost == 0) {
							cost = loopPrice / ( loopAmount || 1 ) * argAmount;
	
						} else {
							cost = cost + ( loopPrice - cost ) * ( argAmount - kol ) / ( loopAmount - kol );
	
						}
	
						kol = argAmount;
					}
					catch (ex) {
						console.error(ex);
					}
					break;
				}
	
			}
	
		} // close.loop
	
		var ret = {
			"price": prices.price,
			"sum": prices.sum
		};
	
		if (  cost  ) {
			ret.sum = cost;
			ret.price = cost / (( argAmount > kol ) ? kol : argAmount) || 1;
		}
	
		return ret;
	
	};
	
	module.exports = DefaultPrintCalc;


/***/ },
/* 8 */
/*!***********************!*\
  !*** ./sfom/utils.js ***!
  \***********************/
/***/ function(module, exports) {

	var _utils = Object.create(null);
	
	_utils.DBSecureStr = function(str){
		if (!arguments.length) return;
		if (typeof str != "string") return str;
		var a = [
			[new RegExp(/["']/g),""],
			["№","N"]
		];
		for(var c=0; c< a.length; c++){
			str = str.replace(
				a[c][0],
				a[c][1]
			);
		}
		return str;
	};
	
	/**
	 * @param {Array} d Delimiters"
	 * @param {String} s - String
	 * @return Array
	 * */
	_utils.msplit = function(d,s){
		if (  typeof d == "string"  ){
			d = [d];
		} else if (  Array.isArray(d)  ) {} else {
			throw new Error("First argument suppose to be \"Array\" or \"String\"");
		}
		if (  typeof s != "string"  ){
			throw new Error("Second argument suppose to be \"String\"");
		}
		var regx = new RegExp('[' + d.join('') + ']','g');
		s = s.replace(regx,d[0]);
		return s.split(d[0]);
	};
	
	
	/**
	 * @param {Array} d Delimiters
	 * @param {String} s - String
	 * @return Array
	 * */
	_utils.split = function(d,s){
		this.msplit.apply(this, arguments);
	};
	
	/**
	 * @param {String} str - String
	 * @param {String, Array} _chars - Characters
	 * @param {Number} direction - 0 - left, 1 = right, -1 = both
	 * */
	_utils.trim = function(str,_chars, direction){
		if (typeof str != "string") {
			throw new Error("1st argument suppose to be String");
		}
	
		if ( typeof _chars == "string" ){
			_chars = _chars.split('');
	
		} else if (  Array.isArray(_chars)  ){
	
		} else {
			throw new Error("1st argument suppose to be String or Array");
	
		}
	
		if (typeof direction != "number") direction = -1;
	
		str = str.split('');
	
		for(;;){
			if (!str.length) {
				break;
	
			} else if (
				(
					direction === -1
					|| direction === 0
				)
				&& _chars.indexOf(str[0]) > -1
			){
				str.shift();
	
			} else if (
				(
					direction === -1
					|| direction === 1
				)
				&& _chars.indexOf(str[str.length-1]) > -1
			){
				str.pop();
	
			} else {
				break;
	
			}
	
		}
	
		return str.join('');
	};
	
	
	/**
	 * @param {String} str - String
	 * @param {String, Array} _chars - Characters
	 * */
	_utils.ltrim = function(str,_chars){
		var arg = Array.prototype.slice.call(arguments,0);
		arg[2] = 0;
		return this.trim.apply(this, arg);
	};
	
	
	/**
	 * @param {String} str - String
	 * @param {String, Array} _chars - Characters
	 * */
	_utils.rtrim = function(str,_chars){
		var arg = Array.prototype.slice.call(arguments,0);
		arg[2] = 1;
		return this.trim.apply(this, arg);
	};
	
	
	_utils.arrayRemove = function(arr, from, to) {
		var rest = arr.slice((to || from) + 1 || arr.length);
		arr.length = from < 0 ? arr.length + from : from;
		return arr.push.apply(arr, rest);
	};
	
	
	/**
	 * @param {Array} arr - Массив
	 * @param {Number} n
	 * */
	_utils.arrayRest = function(arr, n){
		if (typeof arr != "object"){
			throw new Error("1st argument suppose to be Array");
		}
		if (typeof n != "number") {
			throw new Error("2nd argument suppose to be Number");
		}
		return Array.prototype.slice.call(arr, Math.abs(n));
	};
	
	
	_utils.objectHasOwnProperty = function(obj, key){
		if (arguments.length < 2) return false;
		if (typeof obj != "object") return false;
		var keys = Object.getOwnPropertyNames(obj);
		for(var c=0; c<keys.length; c++){
			if (  keys[c] == key  ){
				return true;
			}
		}
		return false;
	};
	
	_utils.objectKeysToLowerCase = function(obj){
		if (typeof obj != "object") return null;
		var keys = Object.getOwnPropertyNames(obj);
		var res = {};
		for(var c=0; c<keys.length; c++){
			res[keys[c].toLowerCase()] = obj[keys[c]];
		}
		return res;
	};
	
	_utils.objectKeysToUpperCase = function(obj){
		if (typeof obj != "object") return null;
		var keys = Object.getOwnPropertyNames(obj);
		var res = {};
		for(var c=0; c<keys.length; c++){
			res[keys[c].toUpperCase()] = obj[keys[c]];
		}
		return res;
	};
	
	_utils.URLHashParse = function (){
		var vars = {};
		if ( !!location.hash ){
			var hash = location.hash.replace('#','');
			hash = hash.split('&');
	
			for (var c = 0; c < hash.length; c++) {
				var match = hash[c].match(/=/g);
				if ( !!match && match.length == 1){
					var tmp = hash[c].split('=');
					vars[tmp[0]] = tmp[1];
				}
			}
		}
		return vars;
	};
	
	_utils.URLHashSet = function (IN){
		var this_ = this;
		var newHash= (typeof IN.newHash == "undefined" ? false : IN.newHash );
		var vars = ( newHash ? Object.create(null) : this_.URLHashParse() );
	
		var prop;
	
		for (prop in IN.vars) {
			if ( !IN.vars.hasOwnProperty(prop) ) continue;
			if ( IN.vars[prop] === null ){
				delete vars[prop];
			} else {
				vars[prop] = IN.vars[prop];
			}
		}
	
		var hash = [];
		for (prop in vars) {
			if ( !vars.hasOwnProperty(prop) ) continue;
			hash.push(prop + '=' + vars[prop]);
		}
		hash = '#' + hash.join('&');
		location.hash = hash;
	};
	
	
	_utils.URLQueryParse = function (){
		var vars = {};
		if ( !!location.search ){
			var query = location.search.replace(/^[?]/,"");
			query = query.split('&');
	
			for (var c = 0; c < query.length; c++) {
				var match = query[c].match(/=/g);
				if ( match && match.length == 1){
					var tmp = query[c].split('=');
					vars[tmp[0]] = tmp[1];
				}
			}
		}
		return vars;
	};
	
	_utils.URLQuerySet = function (IN){
		var newQuery= (typeof IN.newQuery == "undefined" ? false : IN.newQuery );
		var vars = ( newQuery ? Object.create(null) : this.URLQueryParse() );
	
		var prop;
	
		for (prop in IN.vars) {
			if ( !IN.vars.hasOwnProperty(prop) ) continue;
	
			if ( IN.vars[prop] === null ){
				delete vars[prop];
			} else {
				vars[prop] = IN.vars[prop];
			}
		}
	
		var query = [];
		for (prop in vars) {
			if ( !vars.hasOwnProperty(prop) ) continue;
			query.push(prop + '=' + vars[prop]);
		}
		query = '?' + query.join('&');
		location.search = query;
	};
	
	/**
	 * @description Компонент Фабулы. Работа с Base64.
	 * @author Миланин Альберт [milanin@mail.ru]
	 * */
	_utils.awwsBase64 = {
		_keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
		encode: function (input) {
			if (!input)return "";
			var output = "";
			var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
			var i = 0;
			input = this._utf8_encode(input);
			while (i < input.length) {
				chr1 = input.charCodeAt(i++);
				chr2 = input.charCodeAt(i++);
				chr3 = input.charCodeAt(i++);
				enc1 = chr1 >> 2;
				enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
				enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
				enc4 = chr3 & 63;
				if (isNaN(chr2)) {
					enc3 = enc4 = 64;
				} else if (isNaN(chr3)) {
					enc4 = 64;
				}
				output = output + this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) + this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
			}
			output = ((output.length > 5) ? output.substr(5, 1) : "x") + output;
			return output;
		},
		decode: function (input) {
			var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
			if (!input)return "";
			input = input.substr(1);
			var output = "";
			var chr1, chr2, chr3;
			var enc1, enc2, enc3, enc4;
			var i = 0;
			input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
			while (i < input.length) {
				enc1 = _keyStr.indexOf(input.charAt(i++));
				enc2 = _keyStr.indexOf(input.charAt(i++));
				enc3 = _keyStr.indexOf(input.charAt(i++));
				enc4 = _keyStr.indexOf(input.charAt(i++));
				chr1 = (enc1 << 2) | (enc2 >> 4);
				chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
				chr3 = ((enc3 & 3) << 6) | enc4;
				output = output + String.fromCharCode(chr1);
				if (enc3 != 64) {
					output = output + String.fromCharCode(chr2);
				}
				if (enc4 != 64) {
					output = output + String.fromCharCode(chr3);
				}
			}
			output = this._utf8_decode(output);
			return output;
		},
		_utf8_encode: function (string) {
			string = string.replace(/\r\n/g, "\n");
			var utftext = "";
			for (var n = 0; n < string.length; n++) {
				var c = string.charCodeAt(n);
				if (c < 128) {
					utftext += String.fromCharCode(c);
				} else if ((c > 127) && (c < 2048)) {
					utftext += String.fromCharCode((c >> 6) | 192);
					utftext += String.fromCharCode((c & 63) | 128);
				} else {
					utftext += String.fromCharCode((c >> 12) | 224);
					utftext += String.fromCharCode(((c >> 6) & 63) | 128);
					utftext += String.fromCharCode((c & 63) | 128);
				}
			}
			return utftext;
		},
		_utf8_decode: function (utftext) {
			var string = "";
			var i = 0;
			var c = 0, c2 = 0, c3 = 0;
			while (i < utftext.length) {
				c = utftext.charCodeAt(i);
				if (c < 128) {
					string += String.fromCharCode(c);
					i++;
				} else if ((c > 191) && (c < 224)) {
					c2 = utftext.charCodeAt(i + 1);
					string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
					i += 2;
				} else {
					c2 = utftext.charCodeAt(i + 1);
					c3 = utftext.charCodeAt(i + 2);
					string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
					i += 3;
				}
			}
			return string;
		}
	};
	
	
	/**
	 * @param {*} value
	 * @return {String}
	 * */
	_utils.getType = function(value){
		if (  toString.call(value) == "[object Array]"  ){
			return "array";
	
		} else if (  toString.call(value) == "[object Object]"  )  {
			return "object";
	
		} else if (  value === null  ) {
			return "null";
	
		} else if (  value == "[object Date]"  ) {
			return "date";
	
		} else {
			return typeof value;
	
		}
	};
	
	
	/**
	 * Парсинг строчных аргументов, в массив
	 * Проверка типа, преобразование типов
	 * Например: "100,200;;300;400,abc" => ['100','200','300','400'];
	 * @param {Object} arg
	 * @param {*} arg.value - входящие данные
	 * @param {String} arg.into - тип преобразования
	 * @param {Boolean} arg.kickEmpty - отбросить пустые значения
	 * @param {Boolean} arg.toLowerCase - понизить регистр
	 * @param {Boolean} arg.toUpperCase - повысить регистр
	 * @param {Boolean} arg.toInt - привести к целым числам
	 * @param {Boolean} arg.toFloat - привести с числамс плавающей точкой
	 * @param {Array} arg.delimiters - массив разделителей для входящей строки
	 * @param {Array, String} arg.trim - срезать символы в уже разделенной строке
	 * */
	_utils.parseArg = function(arg){
	
		var into = ( typeof arg.into == "string" ? arg.into.toLowerCase() : "array" );
	
		var value = ( typeof arg.value != "undefined" ? arg.value : null );
	
		var kickEmpty = ( typeof arg.kickEmpty == "boolean" ? arg.kickEmpty : true );
	
		var toLowerCase = ( typeof arg.toLowerCase == "boolean" ? arg.toLowerCase : false );
	
		var toUpperCase = ( typeof arg.toUpperCase == "boolean" ? arg.toUpperCase : false );
	
		var toInt = ( typeof arg.toInt == "boolean" ? arg.toInt : false );
	
		var toFloat = ( typeof arg.toFloat == "boolean" ? arg.toFloat : false );
	
		var isInt = ( typeof arg.isInt == "boolean" ? arg.isInt : false );
	
		var isFloat = ( typeof arg.isFloat == "boolean" ? arg.isFloat : false );
	
		var delimiters = ( Array.isArray(arg.delimiters) && arg.delimiters.length ? arg.delimiters : [";",","] );
	
		var trim = typeof arg.trim == "undefined"
			? [" "]
			: (
			Array.isArray(arg.trim)
				? arg.trim
				: (
				typeof arg.trim == "string"
					? arg.split("")
					: null
			)
		);
	
		// --------------------------------------------------------------------------------
	
		if (value === null) {
			return null;
		}
	
		if(into == "array"){
	
			if ( Array.isArray(value) ){
	
			} else if ( typeof value == "string" ){
	
				value = this.msplit(delimiters,value);
	
			} else if ( !isNaN(value) ) {
	
				value = [value];
	
			} else {
				return null;
			}
	
			var tmp = [];
	
			for(var c=0; c<value.length; c++){
				var val = value[c];
	
				// trim
				if (
					trim !== null
					&& typeof val == "string"
				){
					val = this.trim(val, trim);
				}
	
				// Если пустая ячейка
				if(
					kickEmpty
					&& (
						val === ""
						|| val === null
					)
				){ continue; }
	
				// Привести в нижний регистр
				if (toLowerCase && typeof val == "string") val = val.toLowerCase();
	
				// Перевести в верхний регистр
				if (toUpperCase && typeof val == "string") val = val.toUpperCase();
	
				// Откинуть все НЕ цифры
				if (isInt || isFloat){
					if ( typeof val == "string" && !isNaN(val)){
						val = val.trim();
						if( isFloat ){
							val = val.replace(",",".");
							if (  !val.match('/[.]/')  ) continue;
						} else if ( isInt ){
							val = val.replace(",",".");
							if (  val.match('/[.]/')  ) continue;
						}
					} else if (  isInt && (val - Math.floor(val)) > 0  ) {
						continue;
					} else if  (  isFloat && (val - Math.floor(val)) == 0  ){
						continue;
					}
				}
	
				// Привести к целому
				if (toInt) {
					val = parseInt(val);
				}
	
				// Привести к десятичной
				if (toFloat) {
					val = parseFloat(val);
				}
	
				tmp.push(val);
	
			}
	
			return tmp;
	
		}
	
	}; // parseArg
	
	
	module.exports =_utils;

/***/ },
/* 9 */
/*!*************************************!*\
  !*** ./sfom/data-models/ObjectA.js ***!
  \*************************************/
/***/ function(module, exports) {

	/**
	 * @Constructor
	 * @param {Object} obj
	 * */
	var ObjectA = function(obj){
	
		if (this instanceof ObjectA === false){
			throw new Error("Wrong context");
		}
	
		this._props = Object.create(null);
	
		if (!arguments.length) return;
	
		if (typeof obj != "object") {
			throw new Error("Argument suppose to be type \"Object\"");
		}
	
		var keys = Object.getOwnPropertyNames(obj);
	
		for(var c=0; c<keys.length; c++){
			this.set(keys[c], obj[keys[c]]);
		}
	
	};
	
	/**
	 * @param {Object} obj
	 * */
	ObjectA.create = function(obj){
	
		return new ObjectA(obj);
	
	};
	
	ObjectA.prototype = {
	
		/**
		 * Возвращает все присвоенные ключи в объекте
		 * */
		"getKeys": function(){
			return Object.getOwnPropertyNames(this._props);
		},
	
		/**
		 * Возвращает количество ключей
		 * */
		"getLength": function(){
			return this.getKeys().length;
		},
	
		/**
		 * Возвращает значение по ключу
		 * @param {String} key
		 * */
		"get": function(key){
	
			if (typeof key != "string"){
				throw new Error("Argument suppose to be type \"String\"");
			}
	
			key = key.toLowerCase();
	
			return this.has(key) ? this._props[key] : void 0;
	
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
	
			if (typeof key != "string"){
				throw new Error("Argument suppose to be type \"String\"");
			}
	
			this._props[key.toLowerCase()] = value;
	
		},
	
		/**
		 * Проверяет наличие ключа
		 * @param {String} key
		 * */
		"has": function(key){
			if (typeof key != "string"){
				throw new Error("Argument suppose to be type \"String\"");
			}
			return Boolean(Object.getOwnPropertyDescriptor(this._props, key.toLowerCase()));
		},
	
		/**
		 * Удаляет ключ
		 * @param {String} key
		 * */
		"remove": function(key){
			if (typeof key != "string"){
				throw new Error("Argument suppose to be type \"String\"");
			}
			delete this._props[key.toLowerCase()];
		}
	
	};
	
	module.exports = ObjectA;

/***/ },
/* 10 */
/*!******************************!*\
  !*** ./sfom/browser/Ajax.js ***!
  \******************************/
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [
			__webpack_require__(/*! ./../utils */ 8)
		], __WEBPACK_AMD_DEFINE_RESULT__ = function(
			_utils
		){
			var Ajax = Object.create(null);
	
	
			/**
			 * @ignore
			 * */
			Ajax._xFormKeys = function(keys){
	
				if (typeof keys == "string") return keys;
				if (keys.length < 2) return keys[0];
	
				var s = "", key;
	
				for(var c=0; c<keys.length; c++){
	
					key = keys[c];
	
					if (key === null) key = "";
	
					if (  !c  ){
						s += key;
						continue;
					}
	
					s += "[" + key + "]";
	
				}
	
				return s;
	
			};
	
	
			/**
			 * @ignore
			 * */
			Ajax._xFormParam = function(value, parent){
	
				var
					ret = [],
					keys,
					type = _utils.getType(value),
					propType;
	
				// Если тип не массив или обьект возвращать как есть, это глухая ветка дерева
				// if (  ["object", "array"].indexOf(type) == -1  ) return value;
	
				if (typeof parent != "object") parent = [];
	
				for (var prop in value) {
					if (value.hasOwnProperty) {
						if (!value.hasOwnProperty(prop)) {
							continue;
						}
					}
	
					propType = _utils.getType(value[prop]);
	
					keys = parent.concat(type == "array" ? null : prop);
	
					if (  propType == "object" || propType == "array"  ){
						ret = ret.concat(  this._xFormParam(value[prop], keys)  );
	
					} else {
						ret = ret.concat(  encodeURIComponent(this._xFormKeys(keys)) + "=" + encodeURIComponent(value[prop]) );
	
					}
	
				}
	
				return ret.join("&");
	
			};
	
	
			/**
			 * @param {Object} arg
			 * @param {String} arg.url
			 * @param {String} arg.method
			 * @param {Function} arg.callback
			 * @param {Function} arg.onerror
			 * */
			Ajax.req = function(arg){
	
				if (typeof arg != "object") return;
	
				var callback		= typeof arg.callback == "function" ? arg.callback : new Function();
				var errCallback = typeof arg.onerror == "function" ? arg.onerror : new Function();
	
				var method		= typeof arg.method == "string" ? arg.method.toUpperCase() : "GET";
	
				if (typeof arg.url != "string" || !arg.url){
					throw new Error("!arg.url");
				}
	
				var data, url = arg.url;
	
				if (typeof arg.data == "string"){
					data = arg.data;
	
				} else if (  typeof arg.data == "object" ){
					data = this._xFormParam(arg.data);
	
				}
	
				var http;
	
				if (  window.XMLHttpRequest  ){
					http = new XMLHttpRequest();
					if (  http.overrideMimeType  ) {
						http.overrideMimeType('text/xml'); // фикс для FireFox
					}
				} else if (  window.ActiveXObject  ) {
					try {
						http = new ActiveXObject("Msxml2.XMLHTTP");
					} catch (e) {
						try {
							http = new ActiveXObject("Microsoft.XMLHTTP");
						} catch (e) {
	
						}
					}
				}
	
				if (  method == "GET"  ){
					url += (!data ? "" : "?" + data);
					data = null;
				}
	
				http.onerror = function(){
					errCallback.call(http, http);
				};
	
				http.onreadystatechange = function(){
					if (  http.readyState === 4  ){
						if (  http.status == 200  ){
							callback.call(http, http);
						}
					}
				};
	
				http.open(method, url, true);
	
				http.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	
				http.send(data);
	
			};
	
			return Ajax;
		}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }
/******/ ]);
//# sourceMappingURL=fabula-object-model.s-bundle.js.map