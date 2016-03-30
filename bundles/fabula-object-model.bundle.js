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
/*!**********************************************************!*\
  !*** ./fabula-object-model/browser/FabulaObjectModel.js ***!
  \**********************************************************/
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
		var dbModel = __webpack_require__(/*! ./DBModel */ 2);
		var F = __webpack_require__(/*! ./../_FabulaObjectModel */ 3);
	
		// Установка модуля БД для браузера
		F.prototype._setModule("DBModel", dbModel);
	
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
/*!************************************************!*\
  !*** ./fabula-object-model/browser/cascade.js ***!
  \************************************************/
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
/*!************************************************!*\
  !*** ./fabula-object-model/browser/DBModel.js ***!
  \************************************************/
/***/ function(module, exports) {

	var WsObserver = function(arg, dbContext){
		// this.uid = Math.random() * Math.pow(10,18);
		this.callback = typeof arg.callback == "function" ? arg.callback : new Function();
		this.t0 = new Date();
	
		var dbreq = JSON.stringify({
			"query":		arg.query,
			"format":	"awws",
			"dbname":	arg.dbname,
			"dbsrc":		arg.dbsrc,
			"uid":			arg.uid
		});
	
		if (  !dbContext.wsClient.readyState  ){
			dbContext.wsOnOpenArray.push(function(){
				dbContext.wsClient.send(dbreq);
			});
			return;
		}
	
		dbContext.wsClient.send(dbreq);
	};
	
	var DBModel = function(A){
		this.init(A);
	};
	
	DBModel.prototype = {
	
		"instances" : [],
	
	
		"init" : function(arg){
			if (typeof arg != "object") {
				throw new Error("1st argument suppose to be Object");
			}
	
			// var self = this;
	
			this.wsObservers = Object.create(null);
			this.wsClient	= null;
			this.wsOnOpenArray = [];
	
			this.dburl 		= typeof arg.dburl == "string" ? arg.dburl : location.origin + "/db/";	// http://fabula.net.ru/db?
			this.dbname 	= typeof arg.dbname == "string" ? arg.dbname : null;				// well.2015
			this.dbsrc 		= typeof arg.dbsrc == "string" ? arg.dbsrc : null;						// main, common, stat
			this.lastError 	= "";
			this.errors 		= [];
			this.logs		= [];
	
			// var parsedURL = new URL(this.dburl);
	
			this._config = {
				"ws:console:writeResponseMessage": 0
			};
	
			if (  this.dburl.match(/^ws:\/\//g)  ){
				if (typeof WebSocket != "function"){
					throw new Error("!WebSocket");
				}
				this.wsClient = new WebSocket(this.dburl);
				this.wsClient.onmessage = this._wsOnMessage.bind(this);
				this.wsClient.onerror = this._wsOnError;
				this.wsClient.onopen = this._wsOnOpen.bind(this);
			}
	
			this.instances.push(this);
		},
	
	
		"_wsOnOpen": function(){
			for(var c=0; c<this.wsOnOpenArray.length; c++){
				this.wsOnOpenArray[c]();
			}
		},
	
	
		"_wsOnMessage": function(msg){
			var msgData = JSON.parse(msg.data);
	
			if (  typeof this.wsObservers[msgData.uid] == "undefined"  ) {
				throw new Error("!wsObserver");
			}
	
			if (typeof this.wsObservers[msgData.uid].callback != "function"){
				throw new Error("!wsObserver.callback");
			}
	
			this.wsObservers[msgData.uid].callback(msgData.dbres);
	
			console.log(
				(new Date() - this.wsObservers[msgData.uid].t0) / 1000,
				(this._config["ws:console:writeResponseMessage"] ? msg : void 0)
			);
	
			delete this.wsObservers[msgData.uid];
		},
	
	
		"_wsOnError": function(err){
			throw err;
		},
	
	
		"getInstance" : function(arg){
			if (typeof arg != "object"){
				return this.instances.length ? this.instances[0] : new DBModel(void 0);
			}
			for(var c=0; c<this.instances.length; c++){
				if (
					typeof arg.dburl == "string"
					&& this.instances[c].dburl != arg.dburl
				){
					continue;
				}
				if (
					typeof arg.dbname == "string"
					&& this.instances[c].dbname != arg.dbname
				){
					continue;
				}
				if (
					typeof arg.dbsrc == "string"
					&& this.instances[c].dbsrc != arg.dbsrc
				){
					continue;
				}
				return this.instances[c];
			}
			return new DBModel(arg);
		},
	
	
		"_convert": function(dbres){
			var responses = [];
			var c, v, b, row, col, colname;
	
			if (  !Array.isArray(dbres)  ){
				dbres = [dbres];
			}
	
			for (c=0; c<dbres.length; c++) {
				var response = {
					"info" : {
						"t" : -1,
						"t_fx" : -1,
						"t_fabula" : dbres[c]['t'],
						"t_jsDecode" : -1,
						"num_rows" : dbres[c]['res'].length,
						"errors" : dbres[c]['err']
					},
					"recs" : []
				};
	
				for (v=0; v<dbres[c]['res'].length; v++){
					row = dbres[c]['res'][v];
	
					var row_ = {};
	
					for (b=0; b<row.length; b++){
						col = row[b];
						colname = dbres[c]['fld'][b]['Name'];
						row_[colname] = col;
					}
	
					response.recs.push(row_);
				}
	
				responses.push(response);
			}
	
			return responses.length == 1 ? responses[0] : responses;
		},
	
	
		"_dbquery_ws": function(arg){
	
			if (typeof arg != "object"){
				throw new Error("1st argument suppose to be Object");
			}
	
			if (typeof arg.query != "string"){
				throw new Error("arg.query suppose to be String");
			}
	
			var self = this;
	
			arg.uid = Math.random() * Math.pow(10, 18);
	
			if ( typeof arg.callback == "function"  ){
				var callback = arg.callback;
				arg.callback = function(dbres){
					callback(self._convert(dbres));
				};
			}
	
			this.wsObservers[arg.uid] = new WsObserver(arg, this);
		},
	
	
		"_dbquery_http": function(arg){
			var self				= this;
			var dbquery		= typeof arg.query == "string" ? arg.query : null;
			var dburl			= typeof arg.dburl == "string" ? arg.dburl : this.dburl;
			var dbname		= typeof arg.dbname == "string" ? arg.dbname : this.dbname;
			var dbsrc			= typeof arg.dbsrc == "string" ? arg.dbsrc : this.dbsrc;
			var callback		= typeof arg.callback == "function" ? arg.callback : new Function();
	
			var http = new XMLHttpRequest();
			http.open("POST",dburl, true);
			http.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	
			// --------------------------------------------------------
	
			http.onreadystatechange = function(){
				if (  this.readyState == 4  ){
					var dbres = {
						"err": "",
						"t": 0,
						"recs": 0,
						"fld": [],
						"res": []
					};
	
					if (  this.status != 200  ){
						dbres.err = "status != 200"
	
					} else {
						dbres = JSON.parse(this.responseText);
	
					}
	
					callback(self._convert(dbres));
	
				}
			};
	
			// --------------------------------------------------------
	
			var form = [
				"query=" + encodeURIComponent(dbquery),
				"dbsrc=" + encodeURIComponent(!dbsrc ? "" : dbsrc),
				"dbname=" + encodeURIComponent(!dbname ? "" : dbname),
				"format=" + encodeURIComponent("awws")
			];
	
			form = form.join("&");
	
			http.send(form);
		},
	
	
		"dbquery" : function(arg){
			if (typeof arg == "undefined") arg = Object.create(null);
			var dbquery		= typeof arg.query == "string" ? arg.query : null;
			var callback		= typeof arg.callback == "function" ? arg.callback : new Function();
	
			if (  !dbquery  ){
				callback({
					"info":{
						"errors": ["!dbquery"],
						"num_rows": 0
					},
					"recs": []
				});
				throw new Error("!dbquery");
			}
	
			// --------------------------------------------------------
			// История запросов
			if (this.logs.length > 50) this.logs = [];
			this.logs.push(dbquery);
	
			// --------------------------------------------------------
			// http или webSocket
			if (  this.wsClient  ){
				this._dbquery_ws.apply(this, arguments);
	
			} else {
				this._dbquery_http.apply(this, arguments);
	
			}
	
		}
	
	};
	
	module.exports = DBModel;

/***/ },
/* 3 */
/*!***************************************************!*\
  !*** ./fabula-object-model/_FabulaObjectModel.js ***!
  \***************************************************/
/***/ function(module, exports, __webpack_require__) {

	
	var FabulaObjModel = function(arg){
		this._dbInstance = this.mod.DBModel.prototype.getInstance(arg);
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
	
	FabulaObjModel.prototype._setModule("AgentsDataModel", __webpack_require__(/*! ./data-models/AgentsDataModel */ 4));
	
	FabulaObjModel.prototype._setModule("DataModelAdapters", __webpack_require__(/*! ./data-models/DataModelAdapters */ 5));
	
	FabulaObjModel.prototype._setModule("DefaultDataModel", __webpack_require__(/*! ./data-models/DefaultDataModel */ 8));
	
	FabulaObjModel.prototype._setModule("DocDataModel", __webpack_require__(/*! ./data-models/DocDataModel */ 14));
	
	FabulaObjModel.prototype._setModule("FirmsDataModel", __webpack_require__(/*! ./data-models/FirmsDataModel */ 16));
	
	FabulaObjModel.prototype._setModule("GandsDataModel", __webpack_require__(/*! ./data-models/GandsDataModel */ 15));
	
	FabulaObjModel.prototype._setModule("InterfaceEvents", __webpack_require__(/*! ./data-models/InterfaceEvents */ 9));
	
	FabulaObjModel.prototype._setModule("InterfaceFProperty", __webpack_require__(/*! ./data-models/InterfaceFProperty */ 11));
	
	FabulaObjModel.prototype._setModule("MovDataModel	", __webpack_require__(/*! ./data-models/MovDataModel */ 7));
	
	FabulaObjModel.prototype._setModule("PathsDataModel", __webpack_require__(/*! ./data-models/PathsDataModel */ 17));
	
	FabulaObjModel.prototype._setModule("TalksDataModel",  __webpack_require__(/*! ./data-models/TalksDataModel */ 13));
	
	FabulaObjModel.prototype._setModule("CalcDefaultPrint",  __webpack_require__(/*! ./data-models/calc/DefaultPrintCalc */ 18));
	
	FabulaObjModel.prototype._setModule("utils", __webpack_require__(/*! ./utils */ 6));
	
	FabulaObjModel.prototype._setModule("ObjectA", __webpack_require__(/*! ./data-models/ObjectA */ 12));
	
	FabulaObjModel.prototype._setModule("DBModel", null);
	
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
/* 4 */
/*!************************************************************!*\
  !*** ./fabula-object-model/data-models/AgentsDataModel.js ***!
  \************************************************************/
/***/ function(module, exports, __webpack_require__) {

	// ------------------------------------------------------
	// Данные из базы об агентах
	
	// Для совместимости
	var getContextDB = function(){
		var FabulaObjectModel = __webpack_require__(/*! ./../_FabulaObjectModel.js */ 3);
		var DBModel = FabulaObjectModel.prototype.DBModel;
	
		if (  this._fabulaInstance ){
			return this._fabulaInstance.getDBInstance();
		}
		return DBModel.prototype.getInstance();
	};
	
	var AgentsDataModel = function(){
		this.init();
	};
	
	AgentsDataModel.prototype = {
		"init" : function(){
	
			this.dbModel = null;
	
			this.data = [];
	
			this.instances.push(this);
	
			this.state = 0;
	
		},
	
		"instances" : [],
	
		"getInstance" : function(){
			if (this.instances.length){
				return this.instances[0];
			}
			return new AgentsDataModel();
		},
	
		"load" : function(A){
			if (typeof A == "undefined") A = Object.create(null);
			var callback = (typeof A.callback == "function" ? A.callback : function(){} );
			var db = getContextDB.call(this);
			var self = this;
			if (db){
				db.dbquery({
					"query" : "SELECT AgentID, FIO, NameShort, NameFull, User FROM Agents",
					"callback" : function(res){
						self.data = res.recs;
						self.state = 1;
						callback(self.data);
					}
				});
			}
		},
	
		"get" : function(){
			return this.data;
		}
	};
	
	module.exports = AgentsDataModel;

/***/ },
/* 5 */
/*!**************************************************************!*\
  !*** ./fabula-object-model/data-models/DataModelAdapters.js ***!
  \**************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var _utils = __webpack_require__(/*! ./../utils */ 6);
	var MovDataModel = __webpack_require__(/*! ./MovDataModel */ 7);
	var DocDataModel = __webpack_require__ (/*! ./DocDataModel */ 14);
	var GandsDataModel = __webpack_require__(/*! ./GandsDataModel */ 15);
	
	var gandsInstance = GandsDataModel.prototype.getInstance();
	
	/**
	 * Это настолько Адаптеры что, кто-то назовет их Декораторы
	 * От декораторов:
	 * - расширяют фунционал объектов наследующих методы интерфейса "InterfaceFProperty"
	 *   - возможность выбирать, удалять, обновлять свойства собственных, родительской и подчиненных задач.
	 *
	 * От адаптеров:
	 * - удобный интерфейс для работы с рядом свойств обьектов
	 *     - Свойство заявки "Примечание"
	 *         - adapter.getNote()
	 *         - adapter.setNote({string} note)
	 *
	 *     - Свойство задачи "Комментарий"
	 *         - adapter.getComment();
	 *         - adapter.setComment({String} comment)
	 *
	 *  - Получение валовой суммы по задачам в заявке // adapter.getGrossSum()
	 */
	var Adapters = Object.create(null);
	
	// -----------------------------------------------------------------------------
	
	Adapters._getProperty = function(ownKeyValue, parentKeyValue, childrenKeyValue){
		var props = [], obj;
	
		for(var c=0; c<arguments.length; c++){
			if (typeof arguments[c] != "object" || !arguments[c]) continue;
	
			if (!c){
				obj = this._getSelfObj();
	
			} else if (c==1) {
				obj = this._getParentObj();
	
			} else if (c==2) {
				obj = this._getChildrenObj();
	
			} else {
				continue;
			}
	
			if (!obj) continue;
	
			if (!Array.isArray(obj)) obj = [obj];
	
			for(var v=0; v<obj.length; v++){
				props = props.concat(obj[v].getProperty(arguments[c]));
			}
	
			if (c==2) break;
		}
	
		return props;
	};
	
	Adapters._updateProperty = function(
		ownGetKeyValue,
		ownSetKeyValue,
		parentGetKeyValue,
		parentSetKeyValue,
		childrenGetKeyValue,
		childrenSetKeyValue
	){
		var obj, isUpdated = 0;
	
		for(var c=0; c<arguments.length; c++){
			if (typeof arguments[c] != "object" || !arguments[c]) continue;
	
			if (!c){
				obj = this._getSelfObj();
	
			} else if (c==2) {
				obj = this._getParentObj();
	
			} else if (c==4) {
				obj = this._getChildrenObj();
	
			} else {
				continue;
			}
	
			if (!obj) continue;
	
			if (!Array.isArray(obj)) obj = [obj];
	
			for(var v=0; v<obj.length; v++){
				isUpdated += obj[v].updateProperty(arguments[c], arguments[c+1]);
			}
	
			if (c==5) break;
		}
	
		return isUpdated > 0;
	
	};
	
	Adapters._upsertProperty = function(
		ownGetKeyValue,
		ownSetKeyValue,
		parentGetKeyValue,
		parentSetKeyValue,
		childrenGetKeyValue,
		childrenSetKeyValue
	){
		var obj, insProperty, isUpdated = 0;
	
		for(var c=0; c<arguments.length; c++){
			if (typeof arguments[c] != "object" || !arguments[c]) continue;
	
			if (!c){
				obj = this._getSelfObj();
	
			} else if (c==2) {
				obj = this._getParentObj();
	
			} else if (c==4) {
				obj = this._getChildrenObj();
	
			} else {
				continue;
			}
	
			if (!obj) continue;
	
			if (!Array.isArray(obj)) obj = [obj];
	
			for(var v=0; v<obj.length; v++){
	
				insProperty = _utils.objectKeysToLowerCase(arguments[c+1]);
	
				if (
					!insProperty.hasOwnProperty("pid")
					|| typeof insProperty.pid == "undefined"
					|| insProperty.pid === null
					|| insProperty.pid === ""
				){
					if (  obj[v] instanceof MovDataModel  ){
						insProperty.pid = obj[v].get("MMID");
	
					} else if (  obj[v] instanceof DocDataModel  ) {
						insProperty.pid = 0;
	
					}
				}
	
				isUpdated += obj[v].upsertProperty(arguments[c], insProperty);
			}
	
			if (c==5) break;
		}
	
		return isUpdated > 0;
	
	};
	
	Adapters._deleteProperty = function(ownKeyValue, parentKeyValue, childrenKeyValue){
		var obj, isDeleted = 0;
	
		for(var c=0; c<arguments.length; c++){
			if (typeof arguments[c] != "object" || !arguments[c]) continue;
	
			if (!c){
				obj = this._getSelfObj();
	
			} else if (c==1) {
				obj = this._getParentObj();
	
			} else if (c==2) {
				obj = this._getChildrenObj();
	
			} else {
				continue;
			}
	
			if (!obj) continue;
	
			if (!Array.isArray(obj)) obj = [obj];
	
			for(var v=0; v<obj.length; v++){
				isDeleted += obj[v].deleteProperty(arguments[c]);
			}
	
			if (c==2) break;
		}
	
		return isDeleted > 0;
	};
	
	Adapters._addProperty = function(ownProperty, parentProperty, childrenProperty){
		var obj, c, v, insProperty;
	
		for(c=0; c<arguments.length; c++){
			if (typeof arguments[c] != "object" || !arguments[c]) continue;
	
			if (!c){
				obj = this._getSelfObj();
	
			} else if (c==1) {
				obj = this._getParentObj();
	
			} else if (c==2) {
				obj = this._getChildrenObj();
	
			} else {
				continue;
			}
	
			if (!obj) continue;
	
			if (!Array.isArray(obj)) obj = [obj];
	
			for(v=0; v<obj.length; v++){
	
				insProperty = _utils.objectKeysToLowerCase(arguments[c]);
	
				if (
					!insProperty.hasOwnProperty("pid")
					|| typeof insProperty.pid == "undefined"
					|| insProperty.pid === null
					|| insProperty.pid === ""
				){
					if (  obj[v] instanceof MovDataModel  ){
						insProperty.pid = obj[v].get("MMID");
	
					} else if (  obj[v] instanceof DocDataModel  ) {
						insProperty.pid = 0;
	
					}
				}
	
				obj[v].addProperty(insProperty);
	
			}
	
			if (c==2) break;
		}
	
	};
	
	/**
	 * @return {Array}
	 * // @param {Object} ownKeyValue
	 * // @param {Object} parentKeyValue
	 * // @param {Object} childrenKeyValue
	 * */
	Adapters._getPropertyValue = function(){
		var tmp = this.getProperty.apply(this, arguments);
		for(var c=0; c<tmp.length; c++){
			tmp[c] = tmp[c].value;
		}
		return tmp;
	};
	
	// -----------------------------------------------------------------------------
	// -----------------------------------------------------------------------------
	
	Adapters.MovTaskAdapter = function(mov){
		if (!arguments.length){
			throw new Error("arguments.length == 0");
		}
	
		if (mov instanceof MovDataModel === false){
			throw new Error("1st argument suppose to be \"MovDataModel\"");
		}
	
		this.mov = mov;
	
	};
	
	Adapters.MovTaskAdapter.prototype = {
	
		"getProperty": Adapters._getProperty,
	
		"updateProperty": Adapters._updateProperty,
	
		"upsertProperty": Adapters._upsertProperty,
	
		"getPropertyValue": Adapters._getPropertyValue,
	
		"addProperty": Adapters._addProperty,
	
		"deleteProperty": Adapters._deleteProperty,
	
		"_getSelfObj": function(){
			return this.mov;
		},
	
		"_getParentObj": function(){
			return this.mov.parentMov;
		},
	
		"_getChildrenObj": function(){
			return this.mov.childrenMovs;
		},
	
		"getCuttingTemplates": function(){
			var props = [], c;
			var gandsPostprocCutting = gandsInstance.get({"type":["postproc:cutting"]});
			for(c=0; c<gandsPostprocCutting.length; c++){
				gandsPostprocCutting[c] = gandsPostprocCutting[c].GSID.toLowerCase();
			}
			var children = this.mov.childrenMovs;
			for(c=0; c<children.length; c++){
				if (!children[c]) continue;
				if (typeof children[c] != "object") continue;
				if (  gandsPostprocCutting.indexOf(children[c].get("GS").toLowerCase()) == -1  ) continue;
				props = props.concat(children[c].getProperty({"Property": "Макет исходящий"}));
				break;
			}
			return props;
		},
	
		"setCuttingTemplates": function(templates){
			var c, template_, templates_ = [];
	
			if (typeof templates == "string"){
				templates = [templates];
			}
	
			if (   Array.isArray(templates)  ){
				for(c=0; c<templates.length; c++){
					if (  typeof templates[c] == "string"  ){
						templates_.push({
							"value": templates[c],
							"property":"Макет исходящий"
						});
	
					} else if (  typeof templates[c] == "object"  ) {
						template_ = _utils.objectKeysToLowerCase(templates[c]);
						if (  !template_.hasOwnProperty("value") || !template_.value  ) continue;
						template_.property = "Макет исходящий";
						templates_.push(template_);
	
					}
				}
	
			} else {
				throw new Error("argument suppose to be String or Array type");
			}
	
			// .......................................................
	
			var gandsPostprocCutting = gandsInstance.get({"type":["postproc:cutting"]});
			for(c=0; c<gandsPostprocCutting.length; c++){
				gandsPostprocCutting[c] = gandsPostprocCutting[c].GSID.toLowerCase();
			}
	
			// .......................................................
	
			var children = this.mov.childrenMovs;
	
			var isChanged = false;
	
			for(c=0; c<children.length; c++){
				if (!children[c]) continue;
				if (typeof children[c] != "object" || !children[c]) continue;
				if (  gandsPostprocCutting.indexOf(children[c].get("GS").toLowerCase()) == -1  ) continue;
				children[c].deleteProperty({"Property":"Макет исходящий"});
				children[c].addProperty(templates_);
				isChanged = true;
				break;
			}
			return isChanged;
		},
	
		"getComments": function(){
			return this.getPropertyValue({"Property":"Комментарий"});
		},
	
		"setComment": function(comment){
			if (typeof comment != "string"){
				throw new Error("type != \"String\"");
			}
	
			this.mov.removeProperty({"Property": "Комментарий"});
	
			if (  comment.trim()  ){
				this.mov.addProperty(
					this.mov.splitProperty({"Property":"Комментарий","value":comment})
				);
			}
		},
	
		"setPostproc": function(postproc){
	
			var mov = this._getSelfObj();
			var child, c;
			var postproc_ = [];
	
			for(c=0; c<postproc.length; c++){
				if (typeof postproc[c] != "object" || !postproc[c]) continue;
	
				child = mov.getCMov({"mmid":postproc[c].mmid});
	
				if (!child.length || !postproc[c].mmid){
					child = new MovDataModel();
					mov.addChildMov(child);
				} else {
					child = child[0];
				}
	
				child.set(postproc[c]);
	
				postproc_.push(child.get("MMID"));
	
			}
	
			var movs = mov.getCMov();
	
			for(c=0; c<movs.length; c++){
				if (  !movs[c].get("MMID")  ) continue;
				if (  postproc_.indexOf(movs[c].get("MMID")) == -1  ){
					mov.removeCMov(movs[c]);
				}
			}
	
		},
	
		"getPostprocMov": function(){
			// COP07 - КОП "работы"
			var gandsPostproc = gandsInstance.get({
				"cop": [
					new RegExp("07","gi")
				]
			});
	
			var c, tmp, postproc = [], gandsPostproc_ = [];
			for(c=0; c<gandsPostproc.length; c++){
				gandsPostproc_[c] = gandsPostproc[c].GSID.toLowerCase();
			}
			var movs = this.mov.childrenMovs;
			for(c=0; c<movs.length; c++){
				tmp = movs[c].get("GS");
				if (typeof tmp != "string") continue;
				tmp = tmp.toLowerCase();
				if (  gandsPostproc_.indexOf(tmp) == -1  ) continue;
				postproc.push(movs[c]);
			}
			return postproc;
		},
	
		"getPostprocObject": function(){
			var pp = this.getPostprocMov();
			for(var c=0; c<pp.length; c++){
				pp[c] = pp[c].getJSON();
			}
			return pp;
		}
	};
	
	// -----------------------------------------------------------------------------
	// -----------------------------------------------------------------------------
	
	Adapters.DocAdapter = function(doc){
		if (!arguments.length){
			throw new Error("!arguments.length");
		}
		if (  doc instanceof DocDataModel === false ){
			throw new Error("1st argument suppose to be \"DocDataModel\"");
		}
		this.doc = doc;
	};
	
	Adapters.DocAdapter.prototype = {
	
		"getPropertyValue": Adapters._getPropertyValue,
	
		"_getSelfObj": function(){
			return this.doc;
		},
	
		"_getParentObj": function(){
			return null;
		},
	
		"_getChildrenObj": function(){
			return null;
		},
	
		"getProperty": Adapters._getProperty,
	
		"addProperty": Adapters._addProperty,
	
		"deleteProperty": Adapters._deleteProperty,
	
		"getGrossSum": function(){
			var movs = this.doc.movs;
			var sum = 0;
			for(var c=0; c<movs.length; c++){
				sum += movs[c].get("Sum");
			}
			return sum;
		},
	
		"getNote": function(){
			return this.getPropertyValue({"Property":"Примечание"});
		},
	
		"setNote": function(note){
			if (typeof note != "string"){
				throw new Error("type != \"String\"");
			}
	
			this.doc.removeProperty({"Property": "Примечание"});
	
			if (note.trim()){
				this.doc.addProperty(
					this.doc.splitProperty({"Property":"Примечание","value":note})
				);
			}
		}
	};
	
	module.exports = Adapters;

/***/ },
/* 6 */
/*!**************************************!*\
  !*** ./fabula-object-model/utils.js ***!
  \**************************************/
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
/* 7 */
/*!*********************************************************!*\
  !*** ./fabula-object-model/data-models/MovDataModel.js ***!
  \*********************************************************/
/***/ function(module, exports, __webpack_require__) {

	var DefaultDataModel = __webpack_require__(/*! ./DefaultDataModel */ 8);
	var InterfaceFProperty = __webpack_require__(/*! ./InterfaceFProperty */ 11);
	var TalksDataModel = __webpack_require__(/*! ./TalksDataModel */ 13);
	
	var _utils = __webpack_require__(/*! ./../utils */ 6);
	
	// Для совместимости
	var getContextDB = function(){
		var FabulaObjectModel = __webpack_require__(/*! ./../_FabulaObjectModel.js */ 3);
		var DBModel = FabulaObjectModel.prototype.DBModel;
	
		if (  this._fabulaInstance ){
			return this._fabulaInstance.getDBInstance();
		}
		return DBModel.prototype.getInstance();
	};
	
	// TODO пересмотреть алиасы
	/*
	* @Constructor
	* */
	var MovDataModel = function(){
	
		// this.instances.push(this);
	
		DefaultDataModel.call(this);
	
		InterfaceFProperty.call(this);
	
		var self = this;
	
		this.set({
			"GSDate":		new Date(),	// ALIASES: creatingDate
			"MMID":			null, 				// Integer
			"MMPID":		null,				// Integer
			"Doc":			null,				// string
			"Doc1":			null,				// String
			"IsDraft":		null,				// Integer (as Boolean)
			"GS":				null, 				// string
			"GSSpec":		null,				// string
			"Amount":		null,				// Integer
			"Sum":			null,				// Float, Array(object,object,object), // ALIASES: mov_sum
			"Sum2":			null,				// Float
			"Price":			null,				// Float
			"InOut":			null,				// Integer
			"CodeOp":		null,				// string
			"MMFlag":		"1",				// String
			"Performer":	null,				// Integer
			"Manager2":	null,				// Integer
			"Agent2":		null				// Integer
		});
	
		this._property = [];
	
		this.childrenMovs = [];
	
		this.parentMov = null;
	
		this.propsChanged = Object.create(null);
	
		// ------------------------------------------------------------------------
	
		for(var prop in self.propertyKeys){
			if (  !self.propertyKeys.hasOwnProperty(prop)  ) continue;
			(function(){
				var prop_ = prop;
				self.setAlias(
					"getMethod",
					prop,
					function(arg){
						return self.getFabPropertyAliasMethod(prop_, arg);
					}
				);
				self.setAlias(
					"setMethod",
					prop,
					function(value,arg){
						return self.setFabPropertyAliasMethod(prop_, value, arg);
					}
				)
			})();
		}
	
		// ------------------------------------------------------------------------
	
		this.setAlias(
			"setMethod",
			"amount",
			function(value){
				if (isNaN(value)) return false;
				value = parseFloat(value);
				if (value <= 0) value = 1;
				self.props.amount = value;
				self.propsChanged.amount = true;
				return true;
			}
		);
	
		this.on("set:mmid", this._eventSetMMID);
		this.on("set:doc", this._eventSetDoc);
		this.on("afterset:parentdoc", this._eventSetParentDoc);
		// this.on("set:gs", this._eventSetGS);
	
		// this.setAlias("set","creatingDate","GSDate");
		// this.setAlias("set","mov_sum","Sum");
		// this.setAlias("set","GSID","GS");
	
		// this.setAlias("get","creatingDate","GSDate");
		// this.setAlias("get","mov_sum","Sum");
		// this.setAlias("get","GSID","GS");
	
		this.set("_unique_sid", Math.random() * Math.pow(10,17));
	
		this.clearChanged();
	
	};
	
	MovDataModel.prototype = DefaultDataModel.prototype._objectsPrototyping(
		DefaultDataModel.prototype,
		InterfaceFProperty.prototype,
		{
	
			"_eventSetGS": function(){
				/*
				* Планировалось привязать к событию "set:gs"
				* Для автоматического присваивания кода операции
				* (Поле CodeOp в Movement, поле GSCOP в GANDS)
				* Это требует асинх загрузки GandsDataModel.
				* Нет гарантии успешной выборки GSCOP из GANDS при отсутствии
				* задержек между инициализацией экземпляра и присваиванием.
				* => Было решено переложить данный функционал на внешние контроллеры
				* */
			},
	
	
			"_eventSetMMID": function(){
				var e = arguments[1];
				for(var c=0; c<this.childrenMovs.length; c++){
					this.childrenMovs[c].set("MMPID", e.value);
				}
			},
	
	
			"_eventSetDoc": function(){
				var e = arguments[1];
				var c, v, keys, keys_, lowKey;
	
				var doc = e.value || this.get("Doc1") || this.get("ParentDoc") || null;
	
				for(c=0; c<this.childrenMovs.length; c++){
					if (  !this.childrenMovs[c].get("parentDoc")  ){
						this.childrenMovs[c].set("Doc", doc);
					}
				}
	
				for(c=0; c<this._property.length; c++){
					if (!this._property[c]) continue;
					keys = Object.getOwnPropertyNames(this._property[c]);
					keys_ = [];
					for(v=0; v<keys.length; v++){
						lowKey = keys[v].toLowerCase();
						keys_.push(lowKey);
						if (lowKey == "extid"){
							this._property[c][keys[v]] = doc;
						}
					}
					if (keys_.indexOf("extid") == -1) this._property[c].extid = e.value;
				}
			},
	
	
			"_eventSetParentDoc": function(){
				// Экспериментальное событие
				// Чтобы в интерфейсе фабулы задачи были видны как подчиненные
				// Необходимо чтобы они имели записи ParentDoc и равный ему Doc1
				var e = arguments[1];
				if (typeof e.value != "string") return;
				this.set("Doc1",e.value);
				this.set("Doc", null);
			},
	
	
			"addCMov": function(){
				return this.addChildMov.apply(this, arguments);
			},
	
	
			"addChildMov": function(child){
				var mov, c, prop;
	
				if (  Array.isArray(child)  ){
	
				} else if (typeof child == "object") {
					child = [child];
	
				} else {
					return false;
	
				}
	
				for(  c=0; c<child.length; c++  ){
					if (typeof child[c] != "object") continue;
	
					if (  child[c] instanceof  MovDataModel){
	
						mov = child[c];
	
					} else {
	
						mov = new MovDataModel();
	
						for (prop in child[c]) {
							if (typeof child[c].hasOwnProperty == "function") {
								if (!child[c].hasOwnProperty(prop)) continue;
							}
							if (typeof child[c][prop] == "undefined") continue;
							mov.set(prop, child[c][prop]);
						}
	
					}
	
					mov.set("MMPID", this.get("MMID"));
	
					this.childrenMovs.push(mov);
				}
	
				return true;
			},
	
	
			"appendChildMov": function(){
				return this.addChildMov.apply(this, arguments);
			},
	
	
			"deleteChildMov": function(){
				return this.removeChilldMov.apply(this, arguments);
			},
	
	
			"deleteCMov": function(){
				return this.removeChilldMov.apply(this, arguments);
			},
	
			"removeCMov": function(){
				return this.removeChilldMov.apply(this, arguments);
			},
	
			"removeChilldMov": function(keyValue){
	
				if (typeof keyValue != "object") return false;
	
				if (  keyValue instanceof MovDataModel ){
	
					this.childrenMovs = this.childrenMovs.filter(
						function(mov){
							if (  !mov  ) return false;
							if (  typeof mov != "object"  ) return false;
							return mov.get("_unique_sid") != keyValue.get("_unique_sid");
						}
					);
					return true;
	
				} else {
	
					this.childrenMovs = this.childrenMovs.filter(
						function(mov){
							if (  !mov  ) return false;
							if (  typeof mov != "object"  ) return false;
							var keys = Object.getOwnPropertyNames(keyValue);
							for(var c=0; c<keys.length; c++){
								if (  mov.get(keys[c]) != keyValue[keys[c]]  ) return true;
							}
							return false;
						}
					);
	
				}
	
				return true;
	
			},
	
	
			/**
			 * @param {Object, MovDataModel=} keyValue - условия поиска по полям или обьект поиска
			 * @param {Object=} propKeyValue - условия поиска по свойствам
			 * @returns Array
			 * */
			"getCMov": function(keyValue, propKeyValue){
				return this.getChildrenMov.apply(this, arguments);
			},
	
	
			/**
			 * @param {Object, MovDataModel=} fieldsArg - условия поиска по полям или обьект поиска
			 * @param {Object=} propertyArg - условия поиска по свойствам
			 * @returns Array
			 * */
			"getChildrenMov": function(fieldsArg, propertyArg){
	
				if (!arguments.length) return this.childrenMovs;
	
				if (typeof fieldsArg != "object" || !fieldsArg) fieldsArg = {};
	
				if (typeof propertyArg != "object" || !propertyArg) propertyArg = {};
	
				var c;
	
				if (  fieldsArg instanceof MovDataModel ){
	
					for(c=0; c<this.childrenMovs.length; c++){
						if (  this.childrenMovs[c].get("_unique_sid") == fieldsArg.get("_unique_sid")  ){
							return [this.childrenMovs[c]];
						}
					}
	
				} else {
	
					return this.childrenMovs.filter(
						function(mov){
							if (!mov) return false;
							if (typeof mov != "object") return false;
	
							var c, keys, ret = true;
	
							keys = Object.getOwnPropertyNames(fieldsArg);
							for(c=0; c<keys.length; c++){
								if (  mov.get(keys[c]) != fieldsArg[keys[c]]  ) ret = false;
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
	
	
			"getJSON": function(){
				var keys = Object.getOwnPropertyNames(this.props);
				var defaultFields = _utils.objectKeysToLowerCase(this.__movDataModelDefaultFields);
				var lowKey, json = {};
				for(var c=0; c<keys.length; c++){
					lowKey = keys[c].toLowerCase();
					if (  !defaultFields.hasOwnProperty(lowKey)  ) continue;
					json[lowKey] = this.props[keys[c]];
				}
				return json;
			},
	
	
			"load": function(arg){
	
				if (typeof arg != "object") arg = Object.create(null);
	
				var c;
	
				var callback = typeof arg.callback == "function" ? arg.callback : new Function();
	
				var dbawws = getContextDB.call(this); // DBModel.prototype.getInstance();
	
				var fields = _utils.parseArg({
					"value": arg.fields ? arg.fields : null,
					"into": "array",
					"kickEmpty": true,
					"toLowerCase": true,
					"delimiters": [";",","]
				});
	
				if (  !fields || !fields.length  ){
					fields = [
						"MMID",
						"MMPID",
						"ParentDoc",
						"Doc",
						"Doc1",
						"GS",
						"GSSpec",
						"MMFlag",
						"Amount",
						"Sum",
						"Sum2",
						"Price",
						"CodeOp",
						"Performer",
						"Manager2",
						"Agent2",
						"Format(GSDate,'yyyy-mm-dd Hh:Nn:Ss') as GSDate"
					];
				}
	
				for(c=0; c<fields.length; c++){
					if (  ["sum","sum2","price"].indexOf(fields[c].toLowerCase()) >-1  ){
						fields[c] = "["+fields[c]+"]";
					}
				}
	
				var self = this;
	
				// -----------------------------------------------------------------------------------------------
	
				var MMID = this.get("MMID");
	
				if (!MMID || isNaN(MMID)) return;
	
				MMID = parseInt(MMID);
	
				// -----------------------------------------------------------------------------------------------
	
				// 38005
				// 37723 - РА5по31846
	
				var DBq = [
					// Получение записи движения ТиУ
					"SELECT " +
					fields.join(",") +
					" FROM Movement " +
					" WHERE MMID = " + MMID,
	
					// Получение свойств записи
					" SELECT uid, pid, ExtClass, ExtID, property, value FROM Property WHERE pid = " + MMID + " ",
	
					// Получение подчиненных записей
					"SELECT " +
					fields.join(",") +
					" FROM Movement " +
					" WHERE MMPID = " + MMID,
	
					// Получение свойств подчиненных записей
					" SELECT uid, pid, ExtClass, ExtID, property, value " +
					" FROM Property WHERE pid IN (" +
						" SELECT MMID FROM Movement WHERE MMPID = " + MMID + " " +
					" ) "
				];
	
				dbawws.dbquery({
					"query": DBq.join("; "),
					"callback": function(dbres){
						var c, prop, tmp;
	
						for(c=0; c<dbres.length; c++){
							if (dbres[c].info.errors) console.error("DBDataModel." + dbres[c].info.errors);
						}
	
						if (  !dbres[0].recs.length  ){
							callback(["!mov.length"]);
							return;
						}
	
						// Запись полей ТиУ (Поля задачи)
						var mov = dbres[0].recs[0];
	
						for(prop in mov){
							if (  !mov.hasOwnProperty(prop)  ) continue;
							self.set(prop, mov[prop]);
						}
	
						// Запись свойств задачи
						self.addProperty(dbres[1].recs.length ? dbres[1].recs : []);
	
						// ----------------------------------------------------
						// Формируем подчиненные задачи
						var childrenMovs = dbres[2].recs;
						var childrenMovs_ = {};
						var childMov, row;
	
						for(c=0; c<childrenMovs.length; c++){
							row = childrenMovs[c];
	
							childMov = new MovDataModel();
							childMov.set("MMID", row.MMID);
							childMov.parentMov = self;
	
							for(prop in row){
								if (  !row.hasOwnProperty(prop)  ) continue;
								childMov.set(prop,row[prop])
							}
	
							childrenMovs_[childMov.get("MMID")] = childMov;
						}
	
						var childrenProps = dbres[3].recs;
	
						for(c=0; c<childrenProps.length; c++){
							if (  childrenMovs_.hasOwnProperty(childrenProps[c].pid)  ){
								childrenMovs_[childrenProps[c].pid].addProperty(childrenProps[c]);
							}
						}
	
						tmp = [];
	
						for(prop in childrenMovs_){
							if (  typeof childrenMovs_.hasOwnProperty == "function"  ){
								if (  !childrenMovs_.hasOwnProperty(prop)  ) continue;
							}
							tmp.push(childrenMovs_[prop]);
						}
	
						self.addChildMov(tmp);
	
						// ----------------------------------------------------
						// Обнуляем информацию о проделанных изм.
						self.clearChanged();
						self.clearChangedProperty();
	
						callback(null, self);
	
					} // close.callback
				}); // close.dbquery
	
			},
	
	
			"remove": function(arg){
				if (typeof arg != "object") arg = Object.create(null);
	
				var callback = typeof arg.callback == "function" ? arg.callback : new Function();
	
				if (!this.get("MMID")){
					callback("!MMID");
					return;
				}
	
				var dbawws = getContextDB.call(this);
	
				dbawws.dbquery({
					"query": "DELETE FROM Movement WHERE MMID='" + this.get("MMID") + "'",
					"callback": function(dbres){
						if (dbres.info.errors.length){
							callback(dbres.info.errors);
							return;
						}
						callback(null);
					}
				});
			},
	
	
			"insert": function(A){
	
				if (typeof A != "object") A = {};
	
				var dbawws = getContextDB.call(this); // DBModel.prototype.getInstance();
	
				var self = this;
	
				var callback = typeof A.callback == "function" ? A.callback : new Function();
	
				var MMID = this.get("MMID");
	
				var defaultFields = _utils.objectKeysToLowerCase(self.__movDataModelDefaultFields);
				defaultFields.gsdate.value = "NOW()";
	
				var values = [], fields = [];
				var value, c, prop, type, lowName;
	
				// -----------------------------------------------------------------
	
				self.trigger("beforeInsert");
	
				// -----------------------------------------------------------------
	
				for(prop in defaultFields){
					if (  !defaultFields.hasOwnProperty(prop)  ) continue;
					lowName = prop.toLowerCase();
	
					value = defaultFields[prop].value || this.get(prop);
	
					if (!value) continue;
	
					if (value instanceof Date){
						value = ""
							+ [value.getDate(), value.getMonth()-1, value.getFullYear()].join(".")
							+ " "
							+ [value.getHours(),value.getMinutes(),value.getSeconds()].join(";");
					}
	
					if (  defaultFields[prop].type == "S"  ) {
						values.push(!value ? "NULL" : "\""+_utils.DBSecureStr(value)+"\"");
	
					} else {
						values.push(!value ? "NULL" : value);
	
					}
	
					fields.push("["+prop+"]");
				}
	
				var dbq = [
					"INSERT INTO Movement ("+fields.join(",")+") VALUES ("+values.join(",")+")"
				];
	
				// -----------------------------------------------------------------
	
				dbq.push("DELETE FROM Property WHERE ExtClass = 'DOCS' AND pid = " + MMID);
	
				var property;
	
				var _interfaceFPropertyFields = InterfaceFProperty.prototype._interfaceFPropertyFields;
	
				for(c=0; c<this._property.length; c++){
	
					if (  typeof this._property[c] != "object"  ) continue;
	
					property = _utils.objectKeysToLowerCase(this._property[c]);
					values = [];
					fields = [];
	
					property.pid = self.get("MMID");
	
					if (  !property.hasOwnProperty("property")  ) continue;
	
					if (  !property.hasOwnProperty("value")  ) continue;
	
					property.extclass = "DOCS";
	
					property.extid = self.get("Doc");
	
					for(prop in property){
						if (  !property.hasOwnProperty(prop)  ) continue;
	
						type = null;
						value = property[prop];
						lowName = prop.toLowerCase();
	
						if (  value === null || typeof value == "undefined"  ) continue;
	
						fields.push("["+prop+"]");
	
						if (  !_interfaceFPropertyFields.hasOwnProperty(prop)  ) continue;
						type = _interfaceFPropertyFields[lowName].type;
						type = type.toLowerCase();
	
	
						if (type == "string") value = "\""+_utils.DBSecureStr(value)+"\"";
	
						values.push(value);
					}
					dbq.push(
						"INSERT INTO Property ("+fields.join(",")+") VALUES ("+values.join(",")+")"
					);
				}
	
				// -----------------------------------------------------------------
	
				var promises = [
					function(resolve, reject){
						dbawws.dbquery({
							"query": dbq.join("; "),
							"callback": function(dbres){
								var err = [];
								for(var c=0; c<dbres.length; c++){
									if (  dbres[c].info.errors  ){
										err.push(dbres[c].info.errors);
									}
								}
								if (err.length){
									reject(err);
									return;
								}
								resolve();
							}
						});
	
					}
				];
	
				for(c=0; c<this.childrenMovs.length; c++){
					(function(){
						var cc = c;
						promises.push(
							function(resolve, reject){
								self.childrenMovs[cc].set("MMPID", self.get("MMID"));
								self.childrenMovs[cc].save({
									"callback": function(err){
										if (err){
											reject(err);
											return;
										}
										resolve();
									}
								})
							}
						);
					})()
				}
	
				if (
					self.get("MMFlag")
					&& self.get("MMID")
				){
	
					promises.push(
						function(resolve, reject){
	
							var docDataObj = self.get("DocDataObject");
							var talksInstance = TalksDataModel.prototype.getInstance();
	
							talksInstance.postTalk({
								"MMID": self.get("MMID"),
								"MMFlag": self.get("MMFlag"),
								"agent": !docDataObj ? "999" : (docDataObj.get("agent") || 999),
								"callback": function(err){
									if (err){
										reject();
										return;
									}
									resolve();
								}
							});
						}
					);
	
				}
	
				if (  !promises.length  ){
					callback(null);
					return;
				}
	
				Promise.cascade(promises)
					.then(function(){
						callback(null);
						self.trigger("afterInsert");
					})
					.catch(function(err){
						callback(err);
					});
	
			},
	
	
			/**
			 * @param {Boolean}		arg.useNotification			// Включатель уведомление о смене фазы
			 * @param {Boolean}		arg.saveChildren				// Применить изменения в подчиненных задачах
			 * @param {Boolean}		arg.saveParent				// Применить изменения в родительской задаче // НЕ РАБОТАЕТ
			 * @param {Array}			arg.excludeMovs				// Игнорировать изменения в перечисленных задачах. Массив из MMID (целые числа)
			 * @param {Array}			arg.excludeMovs				// Применить изменения только в перечисленных задачах // НЕ РАБОТАЕТ
			 * @param {Function}		arg.callback(err)				// callback
			 * */
			 "update": function(arg){
				if (typeof arg != "object") arg = {};
	
				var dbawws = getContextDB.call(this); // DBModel.prototype.getInstance();
	
				var self = this;
	
				var callback = typeof arg.callback == "function" ? arg.callback : new Function();
	
				var useNotification = typeof arg.useNotification == "undefined" ? true : Boolean(arg.useNotification);
	
				var saveChildren = typeof arg.saveChildren == "undefined" ? true : Boolean(arg.saveChildren);
	
				// var saveParent = typeof arg.saveParent == "undefined" ? true : Boolean(arg.saveParent);
	
				var excludeMovs = _utils.parseArg({
					"value":			typeof arg.excludeMovs == "undefined"? null : arg.excludeMovs,
					"into":			"array",
					"isInt":			true,
					"toInt":			true,
					"kickEmpty":	true,
					"delimiters":	[",",";"]
				}) || [];
	
				/*
				var includeMovs = _utils.parseArg({
					"value": typeof arg.includeMovs == "undefined"? null : arg.includeMovs,
					"into":			"array",
					"isInt":			true,
					"toInt":			true,
					"kickEmpty":	true,
					"delimiters":	[",",";"]
				}) || [];
				*/
	
				var MMID = this.get("MMID");
	
				var dbq = [
					// Получение записи движения ТиУ
					"SELECT MMID FROM Movement WHERE MMID = " + MMID,
	
					// Получение свойств записи
					" SELECT uid, pid, ExtClass, ExtID, property, [value] FROM Property WHERE pid = " + MMID + " ",
	
					" SELECT MMID FROM Movement WHERE MMPID = " + MMID
				];
	
	
				// ------------------------------------------------------------------------------
	
				self.trigger("beforeUpdate");
	
				// ------------------------------------------------------------------------------
	
				dbawws.dbquery({
					"query": dbq.join("; "),
					"callback": function(dbres) {
	
						var c, prop, tmp, fields, values, value, type, lowName;
						var dbq = [];
	
						var changedFields = self.getChanged();
						var disabledFields = ["gsdate","mmid"];
	
						if (  !dbres[0].recs.length  ){
							callback(["!movs.length"]);
							return;
						}
	
						var defaultFields = _utils.objectKeysToLowerCase(self.__movDataModelDefaultFields);
	
						// -----------------------------------------------------------------
	
						var dbProps = dbres[1].recs;
						// var dbMov = dbres[0].recs[0];
						var dbChildrenMovs = dbres[2].recs;
	
						// снижение регистра для полей записи из базы
						// dbMov = _utils.objectKeysToLowerCase(dbMov);
	
						// -----------------------------------------------------------------
	
						{
							var promises = [];
	
							var insertedProps = [];
							var deletedProps = [];
							var updatedProps = [];
	
							var deletedChildren = [];
	
							var objPropRef = {}; // Ссылки на свойства в обьекте
							var dbPropRef2 = {}; // Ссылки на свойства в БД
							var childrenMovsRef = {};
						}
	
						// -----------------------------------------------------------------
						// Ссылки на подчиненные задачи
						for(c=0; c<self.childrenMovs.length; c++){
							tmp = self.childrenMovs[c].get("MMID");
							childrenMovsRef[tmp] = self.childrenMovs[c];
						}
	
						// -----------------------------------------------------------------
						// Список удаленных подчиненных задач
						for(c=0; c<dbChildrenMovs.length; c++){
							if (  !childrenMovsRef.hasOwnProperty(dbChildrenMovs[c].MMID)  ){
								deletedChildren.push(dbChildrenMovs[c].MMID);
							}
						}
	
						var property;
						tmp = [];
	
						// ------------------------------------------------------------------
						// Ссылки на свойства задачи
						{
							for(c=0; c<self._property.length; c++){
								if (  typeof self._property[c] != "object" || !self._property[c]  ) continue;
	
								property = _utils.objectKeysToLowerCase(self._property[c]);
	
								if (
									!property.hasOwnProperty("property")
									|| !property.hasOwnProperty("value")
								){
									continue;
								}
	
								self._property[c].pid = self.get("MMID");
	
								self._property[c].extclass = "DOCS";
	
								self._property[c].extid = self.get("Doc");
	
								tmp.push(self._property[c]);
	
								if (  !property.hasOwnProperty("uid")  ) continue;
	
								objPropRef[property.uid] = self._property[c];
	
							}
	
							self._property = tmp;
						}
	
						// ------------------------------------------------------------------
						// Создание ссылок на свойства в базе.
						// Создание списка удаленных, добавленных и обновленных свойств
						{
							for(c=0; c<dbProps.length; c++){
	
								dbPropRef2[dbProps[c].uid] = dbProps[c];
	
								if (  !objPropRef.hasOwnProperty(dbProps[c].uid)  ){
									deletedProps.push(dbProps[c].uid);
									continue;
								}
	
								if (  objPropRef[dbProps[c].uid].value != dbProps[c].value  ){
									updatedProps.push(dbProps[c]);
									dbq.push(
										"UPDATE Property " +
										" SET " +
											[
												"[value]=\""+_utils.DBSecureStr(objPropRef[dbProps[c].uid].value)+"\"",
												"[ExtClass]='DOCS'",
												"[ExtID]="+(!self.get("Doc") ? "NULL" : "\""+self.get("Doc")+"\"")
											].join(", ") +
										" WHERE " +
											" property = '"+dbProps[c].property+"' " +
											" AND uid = " + dbProps[c].uid
									);
								}
	
							}
	
							var _interfaceFPropertyFields = InterfaceFProperty.prototype._interfaceFPropertyFields;
	
							for(c=0; c<self._property.length; c++){
								if (  !dbPropRef2.hasOwnProperty(self._property[c].uid)  ){
									insertedProps.push(self._property[c]);
	
									fields = [];
									values = [];
	
									for(prop in self._property[c]){
										if (  !self._property[c].hasOwnProperty(prop)  ) continue;
	
										type = null;
										value = self._property[c][prop];
										lowName = prop.toLowerCase();
	
										if (value === null) continue;
	
										fields.push("["+prop+"]");
	
										if (  !_interfaceFPropertyFields.hasOwnProperty(lowName)  ) continue;
										type = _interfaceFPropertyFields[lowName].type;
										type = type.toLowerCase();
	
										if (type == "string"){
											value = (  value === null || value === "" ? "NULL" : "\""+_utils.DBSecureStr(value)+"\""  );
										}
	
										values.push(value);
									}
	
									if (fields.length != values.length || !fields.length) continue;
	
									dbq.push( "INSERT INTO Property ("+fields.join(",")+") VALUES ("+values.join(",")+")" );
	
								}
							}
	
							// ------------------------------------------------------------------
	
							if (  deletedProps.length  ){
								dbq.push("DELETE FROM Property WHERE uid IN ("+deletedProps.join(",")+")");
							}
	
							if (  deletedChildren.length  ){
								dbq.push("DELETE FROM Movement WHERE MMID IN ("+deletedChildren.join(",")+")");
								dbq.push("DELETE FROM Property WHERE pid IN ("+deletedChildren.join(",")+")")
							}
						}
	
	
						// -----------------------------------------------------------------
						// Обновление полей в строке
						{
							values = [];
	
							for(c=0; c<changedFields.length; c++){
								lowName = changedFields[c].toLowerCase();
	
								if (  !defaultFields.hasOwnProperty(lowName)  ) continue;
								if (  disabledFields.indexOf(lowName) > -1  ) continue;
	
								value = self.get(lowName);
								type = defaultFields[lowName].type;
	
								if (value instanceof Date){
									value = ""
										+ [value.getDate(), value.getMonth()-1, value.getFullYear()].join(".")
										+ " "
										+ [value.getHours(),value.getMinutes(),value.getSeconds()].join(";");
								}
	
								if (  type == "S"  ) {
									values.push(("["+lowName+"]=") + (!value ? "NULL" : '\''+_utils.DBSecureStr(value)+'\''));
	
								} else {
									values.push(("["+lowName+"]=") + (!value ? "NULL" : value));
	
								}
	
							}
	
							if (  values.length  ){
								dbq.push("UPDATE Movement SET "+ values.join(", ") +" WHERE MMID = " + MMID);
							}
						}
	
	
						// -----------------------------------------------------------------
						// Если ничего не изменилось
	
						if (  !dbq.length && !promises.length  ){
							callback(null);
							return;
						}
	
						// -----------------------------------------------------------------
						// Прим. изменений
						{
							promises.push(
								function(resolve, reject){
									dbawws.dbquery({
										"query": dbq.join("; "),
										"callback": function(dbres){
											var err = [];
											for(var c=0; c<dbres.length; c++){
												if (  dbres[c].info.errors  ){
													err.push(dbres[c].info.errors);
												}
											}
											if (err.length){
												reject(err);
												return;
											}
											resolve();
										}
									});
								}
							);
	
							if (  saveChildren  ){
	
								for(c=0; c<self.childrenMovs.length; c++){
									(function(){
										var cc=c;
										// Если в списке исключений, игнорировать любые изменения
										if (  excludeMovs.indexOf(self.childrenMovs[cc].get("MMID")) > -1  ){
											return;
										}
										// Если ничего не менялось, то и выполнять сохранения нет смысла
										if (
											!self.childrenMovs[cc].getChanged().length
											&& !self.childrenMovs[cc].getChangedProperty().length
										){
											return;
										}
										// Если запись уже удалена, update не произойдет. Наоборот insert
										if (  deletedChildren.indexOf(self.childrenMovs[cc].get("MMID")) > -1  ){
											return;
										}
										promises.push(
											function(resolve, reject){
												if (  self.childrenMovs[cc].get("MMPID") != self.get("MMID")  ){
													self.childrenMovs[cc].set("MMPID", self.get("MMID"));
												}
												self.childrenMovs[cc].save({
													"useNotification": false,
													"callback": function(err){
														if (err){
															reject(err);
															return;
														}
														resolve();
													}
												});
											}
										);
									})();
								}
	
							} // close.save.children
	
							if (
								useNotification
								&& self.get("MMFlag")
								&& self.get("MMID")
								&& changedFields.indexOf("mmflag") > -1
							){
	
								promises.push(
									function(resolve, reject){
										var docDataObj = self.get("DocDataObject");
	
										var talksInstance = TalksDataModel.prototype.getInstance();
	
										talksInstance.postTalk({
											"MMID": self.get("MMID"),
											"MMFlag": self.get("MMFlag"),
											"agent": !docDataObj ? "999" : (docDataObj.get("agent") || 999),
											"callback": function(err){
												if (err){
													reject();
													return;
												}
												resolve();
											}
										});
									}
								);
	
							}
	
						} // close.блок.прим.изм
	
	
						// -----------------------------------------------------------------
	
						if (  !promises.length  ){
							callback(null);
							self.trigger("afterUpdate");
							return;
						}
	
						Promise.cascade(promises)
							.then(function(){
								callback(null);
								self.trigger("afterUpdate");
							})
							.catch(function(err){
								callback(err);
							});
	
					}
				});
	
			},
	
	
			"__movDataModelDefaultFields": {
				"MMID":			{"type": "N"},
				"MMPID":		{"type": "N"},
				"IsDraft":		{"type": "N"},
				"Tick":			{"type": "N"},
				"Doc":			{"type": "S"},
				"Doc1":			{"type": "S"},
				"ParentDoc":	{"type": "S"},
				"MMFlag":		{"type": "S"},
				"InOut":			{"type": "N"},
				"GSDate":		{"type": "D"},
				"GSDate2":		{"type": "D"},
				"Mark":			{"type": "B"},
				"CodeOp":		{"type": "S"},
				"CodeDc":		{"type": "S"},
				"ExtCode":		{"type": "S"},
				"Storage":		{"type": "S"},
				"GS":				{"type": "S"},
				"GSSpec":		{"type": "S"},
				"GSExt":			{"type": "N"},
				"Consigment":{"type": "N"},
				"Amount":		{"type": "N"},
				"Rest":			{"type": "N"},
				"RestSum":		{"type": "N"},
				"Price":			{"type": "N"},
				"PrimeCost":	{"type": "N"},
				"Sum":			{"type": "N"},
				"Sum2":			{"type": "N"},
				"FirmProduct":{"type": "N"},
				"Remark":		{"type": "S"},
				"NameAVR":	{"type": "S"},
				"Agent2":		{"type": "N"},
				"Manager2":	{"type": "N"},
				"Performer":	{"type": "N"}
			},
	
	
			"save": function(A){
				var self = this;
	
				if (typeof A != "object") A = Object.create(null);
	
				// Ответ
				// var callback = (typeof A.callback == "function" ? A.callback : function(){});
	
				// Подключение к БД
				var dbawws = getContextDB.call(this); // DBModel.prototype.getInstance();
	
				var DBq = [
					"SELECT MMID, GSDate FROM Movement WHERE MMID = " + ( isNaN(this.get("MMID")) ? '-1' : this.get("MMID") ) ,
					"SELECT MAX(MMID)+1 as NEW_MMID FROM Movement"
					// "SELECT ExtClass FROM Ps_property WHERE ExtClass IS NOT NULL AND pid = " + this.get("MMID")
				];
	
				/**
				 * Проверка: есть ли записи с указанным MMID, если уже есть, выполнить обновление
				 * При отсутствии выполняется новая запись.
				 */
				dbawws.dbquery({
					"query" : DBq.join(";"),
					"callback" : function(dbres){
	
						if (!dbres[0].recs.length){
							// Новая запись
							console.log("INSERT");
	
							self.set("MMID",dbres[1].recs[0].NEW_MMID);
	
							self.insert(A);
	
						} else {
							// Обновление
							console.log("UPDATE");
							self.update(A);
	
						} // close.if.update
	
					} // close.callback
	
				}); // close.dbquery
			}
	
	
		}
	);
	
	module.exports = MovDataModel;

/***/ },
/* 8 */
/*!*************************************************************!*\
  !*** ./fabula-object-model/data-models/DefaultDataModel.js ***!
  \*************************************************************/
/***/ function(module, exports, __webpack_require__) {

	// ------------------------------------------------------
	// Прототип модели данных
	
	var InterfaceEvents = __webpack_require__(/*! ./InterfaceEvents */ 9);
	
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
/* 9 */
/*!************************************************************!*\
  !*** ./fabula-object-model/data-models/InterfaceEvents.js ***!
  \************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var IEvent = __webpack_require__(/*! ./IEvent */ 10);
	
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
/* 10 */
/*!***************************************************!*\
  !*** ./fabula-object-model/data-models/IEvent.js ***!
  \***************************************************/
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
/* 11 */
/*!***************************************************************!*\
  !*** ./fabula-object-model/data-models/InterfaceFProperty.js ***!
  \***************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var InterfaceEvents = __webpack_require__(/*! ./InterfaceEvents */ 9);
	var DefaultDataModel = __webpack_require__(/*! ./DefaultDataModel */ 8);
	var ObjectA = __webpack_require__(/*! ./ObjectA */ 12);
	
	var propUtils = {
		"duplicateProperty": function(property){
			var keys = Object.getOwnPropertyNames(property);
			var duplicate = {};
			for(var c=0; c<keys.length; c++){
				duplicate[keys[c]] = property[keys[c]];
			}
		},
	
		"toLowerCaseKeys": function(property){
			var keys = Object.getOwnPropertyNames(property);
			var lowerProperty = {};
			for(var c=0; c<keys.length; c++){
				lowerProperty[keys[c].toLowerCase()] = property[keys[c]];
			}
			return lowerProperty;
		},
	
		// Запускается через изм. контекст call, apply
		"setChanged": function(property){
			var propName;
	
			if (  typeof property == "string"  ) {
				propName = property;
	
			} else if (  typeof property == "object"  ){
				property = propUtils.toLowerCaseKeys(property);
	
				if (  typeof property.property == "string"  ){
					propName = property.property;
	
				} else {
					return;
				}
	
			} else {
				return;
			}
	
			propName = propName.toLowerCase();
	
			if (  this._changedFProperty.indexOf(propName) == -1  ){
				this._changedFProperty.push(propName);
			}
		}
	};
	
	var InterfaceFProperty = function(){
		this._property = [];
		this._changedFProperty = [];
	
		InterfaceEvents.call(this);
	};
	
	InterfaceFProperty.prototype = DefaultDataModel.prototype._objectsPrototyping(
		InterfaceEvents.prototype,
		{
	
			"_interfaceFPropertyFields": {
				"uid"			:{"type":"integer"},
				"pid"			:{"type":"integer"},
				"sort"			:{"type":"integer"},
				"value"		:{"type":"string"},
				"valuetype":{"type":"string"},
				"extclass"	:{"type":"string"},
				"extid"		:{"type":"string"},
				"property"	:{"type":"string"},
				"tick"			:{"type":"integer"}
			},
	
	
			"splitProperty": function(property){
				if (  typeof property != "object"  ) return null;
	
				/*
				var dFn = function(str, d){
					str = str+"";
					var
						tmp = [],
						str_ = "",
						b = Math.floor(str.length / d);
					for(var c=0; c<str.length; c++){
						str_ += str[c];
						if (str_.length >= b || c == str.length - 1){
							tmp.push(str_);
							str_ = "";
						}
					}
					return tmp;
				};
				*/
	
				var dFn = function(str, L){
					str = str+"";
					var
						tmp = [],
						str_ = "";
					for(var c=0; c<str.length; c++){
						str_ += str[c];
						if (str_.length >= L || c == str.length - 1){
							tmp.push(str_);
							str_ = "";
						}
					}
					return tmp;
				};
	
				var c, value, tmp;
				var limit = 120;
	
				var lowProperty = propUtils.toLowerCaseKeys(property);
	
				if (  !lowProperty.hasOwnProperty("value")  ) {
					lowProperty.value = "";
					value = "";
				} else {
					value = lowProperty.value;
				}
	
				var words = [];
				var props = [];
				var count = 0;
				var dProperty;
	
				value = value.split(" ");
	
				tmp = [];
	
				for(c=0; c<value.length; c++){
					if (  value[c].length > limit  ){
						tmp = tmp.concat(dFn(value[c], limit));
						continue;
					}
					tmp.push(value[c]);
				}
	
				value = tmp;
	
				for(c=0; c<value.length; c++){
					words.push(value[c]);
					count+=value[c].length;
					if (
						count + (value.hasOwnProperty(c+1) ? value[c+1].length : 0) > limit
						|| c == value.length - 1
					){
						dProperty = propUtils.toLowerCaseKeys(lowProperty);
						dProperty.value = words.join(" ");
						props.push(dProperty);
						words = [];
						count = 0;
					}
					count+=value[c].length;
				}
	
				return props;
			},
	
	
			"addProperty": function(property){
	
				var existsFields = [], prop, type, value, lowName;
	
				var tmp = {};
	
				this.trigger("addProperty");
	
				if (!property || typeof property != "object") return false;
	
				if (  Array.isArray(property)  ){
					for(var c=0; c<property.length; c++){
						this.addProperty(property[c]);
					}
					return true;
				}
	
				for(prop in property){
					if (typeof property.hasOwnProperty == "function"){
						if (  !property.hasOwnProperty(prop)  ) continue;
					}
					if (typeof property[prop] == "undefined") continue;
	
					lowName = prop.toLowerCase();
					existsFields.push(lowName);
	
					if (  !this._interfaceFPropertyFields.hasOwnProperty(lowName)  ) continue;
	
					type = this._interfaceFPropertyFields[lowName].type;
					value = property[prop];
	
					if (type == "integer" && typeof value == "string"){
						if (  value.match(/\D/g)  ) continue;
						if ((value+"").trim() === "") continue;
					}
	
					tmp[lowName] = value;
				}
	
				for(prop in this._interfaceFPropertyFields){
					if (!this._interfaceFPropertyFields.hasOwnProperty(prop)) continue;
					lowName = prop.toLowerCase();
					if (  !tmp.hasOwnProperty(lowName)  ) tmp[lowName] = null;
				}
	
				property = tmp;
	
				if (  !property.hasOwnProperty("valuetype") || !property.valuetype  ){
					if (  isNaN(property.value)  ){
						property.valuetype = "C";
					} else {
						property.valuetype = "N";
					}
				}
	
				// Изменен
				propUtils.setChanged.call(this, property);
	
				this._property.push(property);
			},
	
	
			"appendProperty": function(){
				this.addProperty.apply(this, arguments);
			},
	
	
			"updateProperty": function(getKeyValue, setKeyValue){
				if (typeof getKeyValue != "object" || !getKeyValue) return;
				if (typeof setKeyValue != "object" || !setKeyValue) return;
				var setKeyValue_ = {};
				var c, v, keys, lowKey;
	
				keys = Object.getOwnPropertyNames(setKeyValue);
				for(c=0; c<keys.length; c++){
					lowKey = keys[c].toLowerCase();
					setKeyValue_[lowKey] = setKeyValue[keys[c]];
				}
	
				var props = this.getProperty(getKeyValue);
				var isUpdated = false;
	
				for(c=0; c<props.length; c++){
					keys = Object.getOwnPropertyNames(props[c]);
					for(v=0; v<keys.length; v++){
						lowKey = keys[v].toLowerCase();
						if (  !setKeyValue_.hasOwnProperty(lowKey)  ) continue;
						isUpdated = true;
						props[c][keys[v]] = setKeyValue_[lowKey];
					}
					// Изменен
					propUtils.setChanged.call(this, props[c]);
				}
	
				return isUpdated;
			},
	
	
			"upsertProperty": function(getKeyValue, insProperty){
				var filterProps = function(pr){
					var tmp = [];
					for(var c=0; c<pr.length; c++){
						if (typeof pr[c] != "object" || !pr[c]) continue;
						tmp.push(pr[c]);
					}
					return tmp;
				};
	
				var ownProperty, keys, c, v, lowKey, insProperty_;
	
				if (  arguments.length < 2  ) return false;
	
				// ------------------------------------------------------------------------------------
	
				if (  !Array.isArray(insProperty) && typeof insProperty == "object"  ){
					insProperty = [insProperty];
	
				} else if (  Array.isArray(insProperty)  ) {
	
				} else {
					return false;
	
				}
	
				// ------------------------------------------------------------------------------------
	
				ownProperty = this.getProperty(getKeyValue);
	
				insProperty = filterProps(insProperty);
	
				for(  c=0; ; c++  ){
	
					// Условие выхода из цикла
					if (
						typeof insProperty[c] == "undefined"
						&& typeof ownProperty[c] == "undefined"
					){
						break;
					}
	
					if (
						typeof insProperty[c] == "object"
						&& typeof ownProperty[c] == "object"
					){
	
						insProperty_ = propUtils.toLowerCaseKeys(insProperty[c]);
	
						keys = Object.getOwnPropertyNames(ownProperty[c]);
	
						for(v=0; v<keys.length; v++){
							lowKey= keys[v].toLocaleLowerCase();
							if (  !insProperty_.hasOwnProperty(lowKey)  ) continue;
							ownProperty[c][keys[v]] = insProperty_[lowKey];
						}
	
						// Изменен
						propUtils.setChanged.call(this, ownProperty[c]);
	
					} else if (  typeof insProperty[c] == "object"  ) {
	
						this.addProperty(insProperty[c]);
	
					}
	
				}
	
				return true;
	
			},
	
	
			/**
			 * @return {Array}
			 * @param {Object} keyValue
			 * */
			"getProperty": function(keyValue){
				var props = [];
	
				var caseSens = false;
	
				var skip, value1, value2, c, v, key, keys;
	
				this.trigger("getProperty");
	
				if (
					!arguments.length
					|| !keyValue
					|| !Object.getOwnPropertyNames(keyValue).length
				){
					return this._property;
				}
	
				if (typeof keyValue != "object") {
					throw new Error("1st argument suppose to be type \"Object\"");
				}
	
				for(c=0; c<this._property.length; c++){
					skip = 0;
	
					if (
						typeof this._property[c] != "object"
						|| !this._property[c]
					){
						continue;
					}
	
					var propObjA = new ObjectA(this._property[c]);
	
					keys = Object.getOwnPropertyNames(keyValue);
	
					for(v=0; v<keys.length; v++){
						key = keys[v].toLowerCase();
	
						if (  !propObjA.has(key)  ) skip = 1;
	
						value1 = propObjA.get(key);
						value2 = keyValue[keys[v]];
	
						if (!caseSens){
							value1 = typeof value1 == "string" ? value1.toLowerCase() : value1;
							value2 = typeof value2 == "string" ? value2.toLowerCase() : value2;
						}
	
						if (  value1 != value2  ) skip = 1;
					}
	
					if (skip) continue;
	
					props.push(this._property[c]);
	
				}
	
				return props;
			},
	
	
			"getChangedProperty": function(){
				return this._changedFProperty;
			},
	
	
			"clearChangedProperty": function(){
				this._changedFProperty = [];
			},
	
	
			"removeProperty": function(keyValue){
				var props = [];
	
				if (typeof keyValue != "object") return false;
	
				var skip, existsFields, prop, value1, value2;
	
				var caseSens = false;
	
				this.trigger("removeProperty");
	
				if (
					!arguments.length
					|| !keyValue
					|| !Object.getOwnPropertyNames(keyValue).length
				){
					this._property = [];
					return true;
				}
	
				for(var c=0; c<this._property.length; c++){
					skip = 1;
	
					existsFields = {};
	
					for(prop in this._property[c]){
						if (  typeof this._property[c].hasOwnProperty == "function"  ){
							if (  !this._property[c].hasOwnProperty(prop)  ) continue;
						}
						if (typeof this._property[c][prop] == "undefined") continue;
						existsFields[prop.toLowerCase()] = this._property[c][prop];
					}
	
					for(prop in keyValue){
						if (  typeof keyValue.hasOwnProperty == "function"  ){
							if (  !keyValue.hasOwnProperty(prop)  ) continue;
						}
						if (typeof keyValue[prop] == "undefined") continue;
	
						if (  !existsFields.hasOwnProperty(prop.toLowerCase())  ) continue;
	
						value1 = existsFields[prop.toLowerCase()];
						value2 = keyValue[prop];
	
						if (!caseSens){
							value1 = typeof value1 == "string" ? value1.toLowerCase() : value1;
							value2 = typeof value2 == "string" ? value2.toLowerCase() : value2;
						}
	
						if (  value1 != value2  ) skip = 0;
					}
	
					// Изменен
					propUtils.setChanged.call(this, this._property[c]);
	
					if (skip) continue;
	
					props.push(this._property[c]);
	
				}
	
				var isDeleted = this._property.length != props.length;
	
				this._property = props;
	
				return isDeleted;
			},
	
			"deleteProperty": function(){
				return this.removeProperty.apply(this, arguments);
			}
	
		}
	);
	
	module.exports = InterfaceFProperty;

/***/ },
/* 12 */
/*!****************************************************!*\
  !*** ./fabula-object-model/data-models/ObjectA.js ***!
  \****************************************************/
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
/* 13 */
/*!***********************************************************!*\
  !*** ./fabula-object-model/data-models/TalksDataModel.js ***!
  \***********************************************************/
/***/ function(module, exports, __webpack_require__) {

	var _utils = __webpack_require__(/*! ./../utils */ 6);
	
	// Для совместимости
	var getContextDB = function(){
		var FabulaObjectModel = __webpack_require__(/*! ./../_FabulaObjectModel.js */ 3);
		var DBModel = FabulaObjectModel.prototype.DBModel;
	
		if (  this._fabulaInstance ){
			return this._fabulaInstance.getDBInstance();
		}
		return DBModel.prototype.getInstance();
	};
	
	var TalksDataModel = function(){
	
		this.instances.push(this);
		// this.db = DBModel.prototype.getInstance();
	
	};
	
	TalksDataModel.prototype = {
	
		"instances": [],
	
		"postTalk": function(A){
	
			if (typeof A != "object") A = Object.create(null);
			// var self				= this;
			var MMID			= typeof A.MMID == "undefined" || isNaN(A.agent) ? null : parseInt(A.MMID);
			var message		= typeof A.message == "string" ? A.message : "" ;
			var newMMFlag	= typeof A.MMFlag == "string" ? A.MMFlag : "";
			var agent			= typeof A.agent == "undefiend" || isNaN(A.agent) ? 999 : A.agent ;
			var callback			= typeof A.callback == "function" ? A.callback : function(){};
	
			var db = getContextDB.call(this);
	
			if (!db) {
				callback("!db");
				console.error("!db");
				return;
			}
	
			if (typeof db.dbquery != "function") {
				callback("!db");
				console.error("!db");
				return;
			}
	
			if (!MMID) return;
	
			db.dbquery({
				"query": "SELECT Txt FROM Talk WHERE Txt LIKE '%&rArr;%' AND MM = " + MMID + " ORDER BY TalkID DESC",
				"callback": function(dbres){
	
					var err = [];
	
					if (dbres.info.errors){
	
						if (
							Array.isArray(dbres.info.errors)
							&& dbres.info.errors.length
						){
							err = err.concat(dbres.info.errors);
	
						} else if (  typeof dbres.info.errors == "string"  ) {
							err.push(dbres.info.errors);
	
						}
						callback(err);
						return;
	
					}
	
					var prevMMFlag = "";
	
					if (!dbres.recs.length){
						if (newMMFlag) prevMMFlag = newMMFlag;
	
					} else {
						prevMMFlag = dbres.recs[0].Txt.match(/(&rArr;).[0-9]/g);
						if (prevMMFlag){
							prevMMFlag = prevMMFlag[0];
							prevMMFlag = prevMMFlag[prevMMFlag.length - 1];
						}
						if (!newMMFlag) newMMFlag = prevMMFlag;
					}
	
					db.dbquery({
						"query": "" +
						"INSERT INTO Talk (Dt, Txt, Agent, [MM], [Tm], [Key]) " +
						"VALUES (DATE(), '"+(!newMMFlag ? "" : "Фаза: " + prevMMFlag + ' &rArr; ' + newMMFlag )+'<br>'+_utils.DBSecureStr(message)+"', "+agent+", "+MMID+",  FORMAT(TIME(),'HH:MM'), NOW())",
	
						"callback": function(dbres){
							if (dbres.info.errors){
								if (Array.isArray(dbres.info.errors) && dbres.info.errors.length){
									err = err.concat(dbres.info.errors);
	
								} else if (typeof dbres.info.errors == "string") {
									err.push(dbres.info.errors);
	
								}
							}
							callback(err.length ? err : null);
						}
					});
	
				} // close.db.callback
			});
		},
	
	
		"getTalks": function(){},
	
	
		"getInstance": function(){
			return this.instances.length ? this.instances[0] : new TalksDataModel();
		}
	};
	
	module.exports = TalksDataModel;

/***/ },
/* 14 */
/*!*********************************************************!*\
  !*** ./fabula-object-model/data-models/DocDataModel.js ***!
  \*********************************************************/
/***/ function(module, exports, __webpack_require__) {

	var _utils = __webpack_require__(/*! ./../utils */ 6);
	var DefaultDataModel = __webpack_require__(/*! ./DefaultDataModel */ 8);
	var InterfaceFProperty = __webpack_require__(/*! ./InterfaceFProperty */ 11);
	var MovDataModel = __webpack_require__(/*! ./MovDataModel */ 7);
	
	// Для совместимости
	var getContextDB = function(){
		var FabulaObjectModel = __webpack_require__(/*! ./../_FabulaObjectModel.js */ 3);
		var DBModel = FabulaObjectModel.prototype.DBModel;
	
		if (  this._fabulaInstance ){
			return this._fabulaInstance.getDBInstance();
		}
		return DBModel.prototype.getInstance();
	};
	
	// TODO пересмотреть алиасы
	var DocDataModel = function(){
		DefaultDataModel.call(this);
		InterfaceFProperty.call(this);
	
		// var self = this;
	
		this.set({
			"Agent":			null, // Integer
			"Manager":			null, // Integer
			"Person":			null, // String
			"FirmContract":	null, // Integer
			"Sum1":				null, // Float
			"Debt":				null, // Float
			"DocID":			null, // String
			"DocType":			null, // String
			"Comment":		null, // String
			"Note":				null // String
		});
	
		// this.setAlias("get","Doc","DocID");
		// this.setAlias("set","Doc","DocID");
	
		this.on("set:docid", this._eventSetDocID);
		this.on("set:company", this._eventSetCompany);
		this.on("set:doctype", this._eventSetDocType);
	
		this.movs = [];
	
		this.set("_unique_sid", Math.random() * Math.pow(10,17));
	
		this.clearChanged();
	
		if (  !this._RB_DOC_CACHE.length  ){
			this._initRB_DOC_CACHE();
		}
	
	};
	
	DocDataModel.prototype = DefaultDataModel.prototype._objectsPrototyping(
		DefaultDataModel.prototype,
		InterfaceFProperty.prototype,
		{
	
			"_docIDApply": function(){
				for(var c=0; c<this.movs.length; c++){
					if (!this.movs[c]) continue;
					if (  this.movs[c].get("Doc1") != this.get("DocID")  ) {
						this.movs[c].set("Doc", this.get("DocID"));
					}
				}
			},
	
	
			"_eventSetDocID": function(self, e){
				if (
					!e.value
					|| typeof e.value != "string"
					|| e.value.length != 10
				){
					return;
				}
				self = this;
				this.parseDocID(
					e.value,
					function(parsed){
						self.props.doctype = parsed.docType;
						self.props.company = parsed.company;
						self.propsChanged.doctype = true;
						self.propsChanged.company = true;
						self.movSet("Doc", e.value);
					}
				);
			},
	
	
			"_eventSetCompany": function(self, e){
				self = this;
				this.parseDocID(
					this.get("DocID"),
					function(p){
						self.set("DocID", e.value + p.year + p.prefix + p.code);
						self.movSet("Doc", self.get("DocID"));
					}
				)
			},
	
	
			"_eventSetDocType": function(self, e){
				self = this;
				this.parseDocID(
					this.get("DocID"),
					function(p){
						var docType = e.value;
						var prefix = null;
						var RBDOC = self._RB_DOC_CACHE;
						for(var c=0; c<RBDOC.length; c++) {
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
	
	
			"_eventSetID": function(){
	
			},
	
	
			"movSet": function(){
				for(var c=0; c<this.movs.length; c++){
					if (typeof this.movs[c] != "object") continue;
					this.movs[c].set.apply(this.movs[c], arguments);
				}
			},
	
	
			/**
			 * @return {Array}
			 * @param {Object=} fieldsArg
			 * @param {Object=} propertyArg
			 * */
			"getMov": function (fieldsArg, propertyArg) {
	
				if (!arguments.length) return this.movs;
	
				if (typeof fieldsArg != "object" || !fieldsArg) fieldsArg = {};
				if (typeof propertyArg != "object" || !propertyArg) propertyArg = {};
	
				var c;
	
				if (  fieldsArg instanceof  MovDataModel  ){
	
					for(c=0; c<this.movs.length; c++){
						if (  this.movs[c].get("_unique_sid") == fieldsArg.get("_unique_sid")  ){
							return [this.movs[c]];
						}
					}
	
				} else {
	
					return this.movs.filter(
						function(mov){
							if (!mov) return false;
							if (typeof mov != "object") return false;
	
							var keys, c, ret = true;
	
							keys = Object.getOwnPropertyNames(fieldsArg);
							for(c=0; c<keys.length; c++){
								if (  mov.get(keys[c]) != fieldsArg[keys[c]]  ) ret = false;
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
	
	
			"addMov": function (mov) {
				// TODO необходимо проверять тип
				mov.set("DocDataObject", this);
				if (  mov.get("Doc1") != this.get("DocID")  ){
					mov.set("Doc", this.get("DocID"));
				}
				this.movs.push(mov);
			},
	
	
			"deleteMov": function (keyValue) {
				if (typeof keyValue != "object") return null;
	
				if (  keyValue instanceof MovDataModel ){
					this.movs = this.movs.filter(
						function(mov){
							if (  !mov  ) return false;
							if (  typeof mov != "object"  ) return false;
							return mov.get("_unique_sid") != keyValue.get("_unique_sid");
						}
					);
					return true;
	
				} else {
					this.movs = this.movs.filter(
						function(mov){
							if (  !mov  ) return false;
							if (  typeof mov != "object"  ) return false;
							var keys = Object.getOwnPropertyNames(keyValue);
							for(var c=0; c<keys.length; c++){
								if (  mov.get(keys[c]) != keyValue[keys[c]]  ) return true;
							}
							return false;
						}
					);
	
				}
	
				return true;
			},
	
	
			"deleteAllMovs": function () {
				this.movs = []
			},
	
	
			"removeMov": function () {
				return this.deleteMov.apply(this, arguments);
			},
	
	
			"removeAllMovs": function () {
				return this.deleteAllMovs();
			},
	
	
			"save": function(arg){
				var saveMethod = null, self = this, selfArguments = arguments;
	
				if (typeof arg != "object") arg = Object.create(null);
	
				var dbawws = getContextDB.call(this); // DBModel.prototype.getInstance();
	
				var callback = (typeof arg.callback == "function" ? arg.callback : new Function() );
	
				new Promise(
					function(resolve, reject){
	
						var
							GSID = null,
							docType = null,
							companyID = null,
							c;
	
						if (typeof arg.GSID == "string"){
							GSID = arg.GSID;
	
						} else {
							for (c = 0; c < self.movs.length; c++) {
								GSID = self.movs[c].get("GSID");
								if (!GSID) {
									GSID = null;
								} else {
									break;
								}
							}
	
						}
	
						docType = self.get("DocType");
	
						companyID = self.get("Company");
	
						if ( !self.get("DocID") ){
							self.getNewDocID({
								"GSID": GSID,
								"docType": docType,
								"companyID": companyID,
								"callback": function(err,Doc){
									if (err){
										reject(err);
										return;
									}
									self.set("DocID",Doc);
									saveMethod = self.insert;
									resolve();
								}
							});
						} else {
							dbawws.dbquery({
								"query": "SELECT ID, DocID FROM DOCS WHERE DocID = '" + self.get("DocID") + "' OR id = " + self.get("ID"),
								"callback": function(dbres){
									if (!dbres.recs.length){
										self.getNewDocID({
											"GSID": GSID,
											"docType": docType,
											"companyID": companyID,
											"callback": function(err,Doc){
												if (err){
													reject(err);
													return;
												}
												self.set("ID", null);
												self.set("DocID",Doc);
												saveMethod = self.insert;
												resolve();
											}
										});
										return;
									}
									self.set("ID", dbres.recs[0].ID);
									saveMethod = self.update;
									resolve();
								}
							});
						}
	
					}
				)
				.then(
					function(){
						saveMethod.apply(self, selfArguments);
					}
				).catch(
					function(reason){
						callback(reason);
					}
				);
			},
	
	
			"insert": function(arg){
				var self = this, c, prop;
	
				if (typeof arg != "object") arg = Object.create(null);
	
				var callback = (typeof arg.callback == "function" ? arg.callback : function(){} );
	
				var dbawws = getContextDB.call(this); // DBModel.prototype.getInstance();
	
				var err = [];
	
				var ownProps = this.getProperty(null);
	
				var dbq = [];
	
				// -------------------------------------------------------------------------------------------
				// Поля по-умолчанию
	
				var defaultFelds = _utils.objectKeysToLowerCase(this.__docDataModelsDefaultFields);
				var disabledFields = ["id"];
	
				var values = [], fields = [], value;
	
				for(prop in defaultFelds){
					if (  !defaultFelds.hasOwnProperty(prop)  ) continue;
					if (  disabledFields.indexOf(prop) > -1 ) continue;
	
					value = defaultFelds[prop].value || this.get(prop);
	
					if (!value) continue;
	
					if (value instanceof Date){
						value = ""
							+ [value.getDate(), value.getMonth()-1, value.getFullYear()].join(".")
							+ " "
							+ [value.getHours(),value.getMinutes(),value.getSeconds()].join(";");
					}
	
					if (  defaultFelds[prop].type == "S"  ) {
						values.push(!value ? "NULL" : "\""+_utils.DBSecureStr(value)+"\"");
	
					} else {
						values.push(!value ? "NULL" : value);
	
					}
	
					fields.push("["+prop+"]");
				}
	
				dbq.push("INSERT INTO DOCS ("+fields.join(",")+") VALUES ("+values.join(",")+")");
	
				// -------------------------------------------------------------------------------------------
				// Запись свойств
	
				dbq.push("DELETE FROM Property WHERE ExtClass = 'DOCS' AND ExtID = '"+this.get("DocID")+"' ");
	
				var property, type;
	
				for(c=0; c<ownProps.length; c++){
					property = ownProps[c];
	
					values = [];
					fields = [];
	
					if (  typeof property != "object"  ) continue;
	
					// ........... снижение регистра существующих полей
					property = _utils.objectKeysToLowerCase(property);
	
					// .......................................................................
	
					property.pid = 0;
	
					if (  !property.hasOwnProperty("property") || !property.property ){
						continue;
					}
	
					if (  !property.hasOwnProperty("value")  ){
						continue;
					}
	
					if (  !property.hasOwnProperty("extclass") || !property.extclass  ){
						property.extclass = "DOCS";
					}
	
					if (
						(
							!property.hasOwnProperty("extid")
							|| !property.extid
						)
						&& self.get("DocID")
					){
						property.extid = self.get("DocID");
					}
	
					for(prop in property){
						if (  !property.hasOwnProperty(prop)  ) continue;
	
						type = null;
						value = property[prop];
	
						if (  value === null || typeof value == "undefined"  ) continue;
	
						fields.push("["+prop+"]");
	
						if (  InterfaceFProperty.prototype._interfaceFPropertyFields.hasOwnProperty(prop.toLowerCase())  ){
							type = InterfaceFProperty
								.prototype
								._interfaceFPropertyFields[prop.toLowerCase()]
								.type;
							type = type.toLowerCase();
						}
	
						if (type == "string"){
							value = "\""+_utils.DBSecureStr(value)+"\"";
						}
	
						values.push(value);
	
					}
					dbq.push(
						"INSERT INTO Property ("+fields.join(",")+") VALUES ("+values.join(",")+")"
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
						function (resolve, reject) {
							dbawws.dbquery({
								"query": dbq.join("; "),
								"callback": function (dbres) {
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
	
				for(c=0; c<self.movs.length; c++){
					(function(){
						var cc = c;
						promises.push(
							function(resolve, reject){
								if (  self.movs[cc].get("Doc1") != self.get("DocID")  ){
									self.movs[cc].set("Doc", self.get("DocID"));
								}
								self.movs[cc].save({
									"callback": function(err_b){
										if (err_b){
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
	
				if (  !promises.length  ){
					callback(null);
					return;
				}
	
				Promise.cascade(promises, {"stackSize":1,"interval":1000})
					.then(function(){
						callback(null);
					})
					.catch(function(err){
						callback(err);
					});
	
	
			},
	
			/**
			 * @param {Object} ownArg						// Аргументы для сохр. заявки
			 * @param {Function} ownArg.callback
			 * @param {Array} ownArg.excludeMovs		// Игнорировать изменения в перечисленных подчиненных задачах. Массив из MMID (integer)
			 * @param {Object} parentArg					// Аргументы сохранения родительской заявки, если такая есть
			 * @param {Object} childrenArg					// Аргумент сохр. подчиненной заявки, если такие есть
			 * @param {Object} movArg						// Аргументы сохранения подчиненных задач // см. MovDataModel
			* */
			"update": function(ownArg, parentArg, childrenArg, movArg){
				var self = this;
	
				if (typeof ownArg != "object") ownArg = Object.create(null);
	
				if (typeof movArg != "object") movArg = Object.create(null);
	
				if (  !_utils.objectHasOwnProperty(movArg, "callback")  ) movArg.callback = new Function();
	
				var callback = typeof ownArg.callback == "function" ? ownArg.callback : new Function();
	
				// var useNotification = typeof ownArg.useNotification == "undefined" ? true : Boolean(ownArg.useNotification);
	
				// var saveChildren = typeof ownArg.saveChildren == "undefined" ? true : Boolean(ownArg.saveChildren);
	
				// var saveParent = typeof ownArg.saveParent == "undefined" ? true : Boolean(ownArg.saveParent);
	
				var excludeMovs = _utils.parseArg({
						"value":			typeof ownArg.excludeMovs == "undefined"? null : ownArg.excludeMovs,
						"into":			"array",
						"isInt":			true,
						"toInt":			true,
						"kickEmpty":	true,
						"delimiters":	[",",";"]
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
				// Запись полей
	
				dbawws.dbquery({
					"query": [
						"SELECT uid, property, [value], ExtID  " +
						" FROM Property " +
						" WHERE " +
							" pid = 0" +
							" AND ExtClass = 'DOCS' " +
							" AND ExtID IN (SELECT DocID FROM DOCS WHERE ID = "+self.get("ID")+")",
	
						"SELECT MMID FROM Movement WHERE Doc IN (SELECT DocID FROM DOCS WHERE ID = "+self.get("ID")+") "
					].join("; "),
					"callback": function(dbres){
	
						var changedFields = self.getChanged();
						var defaultFields = _utils.objectKeysToLowerCase(self.__docDataModelsDefaultFields);
						var disabledFields = ["id","regdate","datenew","useredit","dateedit"];
	
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
							for(c=0; c<changedFields.length; c++){
								lowName = changedFields[c].toLowerCase();
	
								if (  !defaultFields.hasOwnProperty(lowName)  ) continue;
								if (  disabledFields.indexOf(lowName) > -1  ) continue;
	
								value = self.get(lowName);
								type = defaultFields[lowName].type;
	
								if (value instanceof Date){
									value = ""
										+ [value.getDate(), value.getMonth()-1, value.getFullYear()].join(".")
										+ " "
										+ [value.getHours(),value.getMinutes(),value.getSeconds()].join(";");
								}
	
								if (  type == "S"  ) {
									values.push(("["+lowName+"]=") + (!value ? "NULL" : "\""+_utils.DBSecureStr(value)+"\""));
	
								} else {
									values.push(("["+lowName+"]=") + (!value ? "NULL" : value));
	
								}
	
							}
	
							if (  values.length  ){
								dbq.push("UPDATE DOCS SET "+ values.join(", ") +" WHERE ID = " + self.get("ID"));
							}
						}
	
						// -----------------------------------------------------------------
						// Обработка свойств
						// Ссылки на собственные свойства
	
						var dbPropRef = {};
						var selfPropRef = {};
						var property;
						tmp = [];
	
						for(c=0; c<self._property.length; c++){
							if (typeof self._property[c] != "object" || !self._property[0]) continue;
	
							property = _utils.objectKeysToLowerCase(self._property[c]);
	
							if (  !property.hasOwnProperty("value") || property.value === null  ) continue;
	
							tmp.push(property);
	
							property.pid = 0;
							property.extid = self.get("DocID");
							property.extclass = "DOCS";
	
							if (  !property.hasOwnProperty("uid") || !property.uid  ) continue;
	
							selfPropRef[property.uid] = property;
	
						}
	
						self._property = tmp;
	
						// ........................................................
						// Ссылки на свойства в БД
						for(c=0; c<dbProps.length; c++){
							property = _utils.objectKeysToLowerCase(dbProps[c]);
	
							if (  !property.hasOwnProperty("uid") || !property.uid  ) continue;
	
							dbPropRef[property.uid] = property;
						}
	
						// ........................................................
						// INSERT
	
						var _interfaceFPropertyFields = InterfaceFProperty.prototype._interfaceFPropertyFields;
	
						for(c=0; c< self._property.length; c++){
	
							if (
								!self._property[c].uid
								|| !dbPropRef.hasOwnProperty(self._property[c].uid)
							){
								fields = [];
								values = [];
	
								for(prop in self._property[c]){
									if (  !self._property[c].hasOwnProperty(prop)  ) continue;
	
									value = self._property[c][prop];
									lowerName = prop.toLowerCase();
									type = null;
	
	
									if (value === null) continue;
	
									if (  !_interfaceFPropertyFields.hasOwnProperty(lowerName)  ) continue;
									type = _interfaceFPropertyFields[lowerName].type;
									type = type.toLowerCase();
	
									if (type == "string"){
										value = (  value === null || value === "" ? "NULL" : "\""+_utils.DBSecureStr(value)+"\""  );
									}
	
									values.push(value);
									fields.push("["+lowerName+"]");
								}
	
								if (fields.length != values.length || !fields.length) continue;
	
								dbq.push( "INSERT INTO Property ("+fields.join(",")+") VALUES ("+values.join(",")+")" );
							}
	
						}
	
						// ........................................................
						// UPDATE & DELETE
						var deletedProps = [];
	
						for(c=0; c<dbProps.length; c++){
							if (  !selfPropRef.hasOwnProperty(dbProps[c].uid)  ){
								deletedProps.push(dbProps[c].uid);
								continue;
							}
	
							if (
								selfPropRef[dbProps[c].uid].value != dbProps[c].value
								|| dbProps[c].ExtID != self.get("DocID")
							){
								dbq.push(
									"UPDATE Property " +
									" SET " +
										[
											"[value]=\""+_utils.DBSecureStr(selfPropRef[dbProps[c].uid].value)+"\"",
											"[ExtID]='"+self.get("DocID")+"'",
											"[ExtClass]='DOCS'"
										].join(", ")+
									" WHERE " +
										" property = '"+dbProps[c].property+"' " +
										" AND uid = "+ dbProps[c].uid
								);
							}
						}
	
						// ------------------------------------------------------------------
	
						var deletedChildren = [];
						var selfMovsRef = {};
	
						for(var v=0; v<self.movs.length; v++){
							if (typeof self.movs[v] != "object") continue;
							selfMovsRef[self.movs[v].get("MMID")] = self.movs[v];
						}
	
						for(c=0; c<dbMovs.length; c++){
							if (  !selfMovsRef.hasOwnProperty(dbMovs[c].MMID)  ){
								deletedChildren.push(dbMovs[c].MMID);
							}
						}
	
						// ------------------------------------------------------------------
	
						if (  deletedProps.length  ){
							dbq.push("DELETE FROM Property WHERE uid IN ("+deletedProps.join(",")+")");
						}
	
						if (  deletedChildren.length  ){
							dbq.push("DELETE FROM Movement WHERE MMID IN ("+deletedChildren.join(",")+")");
							dbq.push("DELETE FROM Property WHERE pid IN ("+deletedChildren.join(",")+")")
						}
	
						// ----------------------------------------------------------------------------
	
						var promises = [];
	
						if (dbq.length) {
							promises.push(
								function (resolve, reject) {
									dbawws.dbquery({
										"query": dbq.join("; "),
										"callback": function (dbres) {
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
	
	
						for(c=0; c<self.movs.length; c++) {
							(function () {
	
								var cc = c;
	
								if (
									!self.movs[cc].getChanged().length
									&& !self.movs[cc].getChangedProperty().length
								){
									return;
								}
								if (  deletedChildren.indexOf(self.movs[cc].get("MMID")) > -1  ){
									return;
								}
								if (  excludeMovs.indexOf(self.movs[cc].get("MMID")) > -1  ){
									return;
								}
								if (  self.movs[cc].get("Doc1") != self.get("DocID")  ){
									self.movs[cc].set("Doc", self.get("DocID"));
								}
	
								promises.push(
									function (resolve, reject) {
	
										var movCallback = movArg.callback;
	
										movArg.callback = function(err){
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
	
						if (  !promises.length  ){
							callback(null);
							return;
						}
	
						Promise.cascade(promises, {"stackSize":1,"interval":1000})
							.then(
							function(){
								callback(null);
							}
						)
							.catch(
							function(err){
								callback(err);
							}
						);
	
					}
				});
	
			},
	
	
			"getJSON": function(){
				var keys = Object.getOwnPropertyNames(this.props);
				var defaultFields = _utils.objectKeysToLowerCase(this.__docDataModelsDefaultFields);
				var lowKey, json = {};
				for(var c=0; c<keys.length; c++){
					lowKey = keys[c].toLowerCase();
					if (  !defaultFields.hasOwnProperty(lowKey)  ) continue;
					json[lowKey] = this.props[keys[c]];
				}
				return json;
			},
	
	
			"load": function (arg) {
	
				if (typeof arg != "object") arg = Object.create(null);
	
				var self = this, err = [];
	
				var callback = typeof arg.callback == "function" ? arg.callback : new Function();
	
				// var MMID = (typeof arg.MMID != "undefined" && !isNaN(arg.MMID) ? parseInt(arg.MMID) : null );
	
				var DocID = typeof arg.DocID == "string" && arg.DocID.length == 10 ? arg.DocID : self.get("DocID");
	
				var taskModel = typeof arg.taskModel == "function" ? arg.taskModel : null ;
	
				if (typeof arg.movModel == "function") taskModel = arg.movModel;
	
				var excludeGSID = typeof arg.excludeGSID == "object" ? arg.excludeGSID : [];
	
				var includeGSID = typeof arg.includeGSID == "object" ? arg.includeGSID : [];
	
				var useSubMovs = typeof arg.useSubMovs == "undefined" ? false : Boolean(arg.useSubMovs);
	
				// TODO var fields = typeof arg.fields == "undefined"
	
				var fields = _utils.parseArg({
					"value": arg.fields ? A.fields : null,
					"into": "array",
					"kickEmpty": true,
					"toLowerCase": true,
					"delimiters": [";",","]
				});
	
				if (  !fields || !fields.length  ){
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
					"SELECT "+fields.join(",")+" FROM DOCS WHERE DocID = '" + DocID + "' ",
	
					"SELECT MMID, GS FROM Movement WHERE Doc = '"+DocID+"' "+(useSubMovs ? " OR ParentDoc = '"+DocID+"' " : ""),
	
					"SELECT uid, extClass, extID, property, value FROM Property WHERE pid = 0 AND ExtClass = 'DOCS' AND ExtID = '"+DocID+"' "
				];
	
				var dbawws = getContextDB.call(this); // DBModel.prototype.getInstance();
	
				dbawws.dbquery({
					"query": DBq.join("; "),
					"callback": function (dbres) {
						var task, c, prop, tmp;
	
						if (  !dbres[0].recs.length  ){
							callback(["!doc.length"]);
							return;
						}
	
						var doc = dbres[0].recs[0];
						var movs = dbres[1].recs;
						var props  = dbres[2].recs;
	
						// ------------------------------------------------------------------------------------------
	
						for(prop in doc){
							if (  !doc.hasOwnProperty(prop)  ) continue;
							self.set(prop, doc[prop]);
						}
	
						tmp = [];
	
						for(c=0; c<props.length; c++){
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
								if (  !parseInt(movs[c].MMID)  ) continue;
								if (  movIDs.indexOf(movs[c].MMID) > -1  ) continue;
								if (  includeGSID.length && includeGSID.indexOf(movs[c].GS) == -1  ) continue;
								if (  excludeGSID.length && excludeGSID.indexOf(movs[c].GS) > -1  ) continue;
	
								movIDs.push(movs[c].MMID);
							}
	
							var promises = [];
	
							for (c = 0; c < movIDs.length; c++) {
	
								(function () {
	
									var movID = movIDs[c];
	
									promises.push(
										new Promise(
											function (resolve) {
												task = new taskModel();
												task.set("MMID", movID);
												self.addMov(task);
												task.load({
													"callback": function (err) {
														// TODO Решить: пропускать данную ошибку, или сообщать и блокировать выполнение.
														if (err) {
															console.error(new Error(err.join(";\n")));
															self.removeMov({"MMID": task.get("MMID")});
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
								function () {
									/*
									 * Одни и те же записи инициализированные в разном контексте (DocDM или MovDM),
									 * имеют разные уникальные номера, и потому не определяются как одинаковые
									 * => изменения не сквозные и происходят в разных объектах
									 * */
									var movs = self.getMov();
									var cMovs, mov;
	
									// Взаимозамена одинаковых записей
									for(var c=0; c<movs.length; c++){
										cMovs = movs[c].childrenMovs;
										for(var v=0; v<cMovs.length; v++){
											mov = self.getMov({"MMID": cMovs[v].get("MMID")});
											if (  mov.length  ){
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
								function (reason) {
									console.log(reason);
								}
							);
	
						}
					}
				});
	
			},
	
	
			"remove": function(arg){
				if (typeof arg != "object") arg = Object.create(null);
	
				var callback = typeof arg.callback == "function" ? arg.callback : new Function();
	
				if (!this.get("DocID")){
					callback("!DocID");
					return;
				}
	
				var dbawws = getContextDB.call(this);
	
				dbawws.dbquery({
					"query": "DELETE FROM DOCS WHERE DocID='" + this.get("DocID") + "'",
					"callback": function(dbres){
						if (dbres.info.errors.length){
							callback(dbres.info.errors);
							return;
						}
						callback(null);
					}
				});
			},
	
	
			"_RB_DOC_CACHE": [],
	
	
			"_initRB_DOC_CACHE": function(callback){
				var dbawws = getContextDB.call(this); // DBModel.prototype.getInstance();
				var self = this;
				dbawws.dbquery({
					"query":"SELECT ID4, DocName, Prefix, GSFilter, Sort FROM RB_DOC ORDER BY Sort ASC",
					"callback": function(dbres){
						Object.getPrototypeOf(self)._RB_DOC_CACHE = dbres.recs;
						if (typeof callback == "function"){
							callback(self._RB_DOC_CACHE);
						}
					}
				});
			},
	
	
			"parseDocID": function(DocID, callback){
				if (typeof DocID != "string") return;
	
				var arg = arguments;
	
				var self = this;
	
				var res = {
					"code":			DocID.slice(5),
					"prefix":			DocID.slice(3,5),
					"company":		DocID.slice(0,2),
					"year":			DocID[2],
					"docType":		null
				};
	
				if (  !this._RB_DOC_CACHE.length  ){
					Object.getPrototypeOf(this)._initRB_DOC_CACHE(function(){
						if (  !self._RB_DOC_CACHE.length  ) return;
						self.parseDocID.apply(self, arg);
					})
				}
	
				var RBDOC = this._RB_DOC_CACHE;
	
				for(var c=0; c<RBDOC.length; c++){
					if (  RBDOC[c].Prefix.toLowerCase() == res.prefix.toLowerCase()  ){
						res.docType = RBDOC[c].ID4;
					}
				}
	
				if (typeof callback != "function") return;
	
				callback(res);
			},
	
	
			"getNewDocID": function (arg) {
	
				if (typeof arg != "object") return;
	
				if (typeof arg.callback != "function") return;
	
				var self = this;
	
				var callback = arg.callback;
	
				var dbawws = getContextDB.call(this); // DBModel.prototype.getInstance();
	
				var GSID = typeof arg.GSID == "string" ? arg.GSID : null;
	
				var docType = typeof arg.docType == "string" ? arg.docType : null;
	
				var companyID = typeof arg.companyID == "string" ? arg.companyID : null;
	
				if (!companyID){
					callback(["!arg.companyID"], null);
					return;
				}
	
				var DBq = [
					"SELECT TOP 10 mid(DocID,6,5) as nDocID FROM DOCS WHERE right(Year(Date()),1) = mid(DocID,3,1) AND LEN(DocID) = 10 ORDER BY mid(DocID,6,5) DESC",
					"SELECT right(Year(Date()),1) as _year",
					"SELECT ID4, DocName, Prefix, GSFilter, Sort FROM RB_DOC ORDER BY Sort ASC"
				];
	
				dbawws.dbquery({
					"query": DBq.join("; "),
					"callback": function (dbres) {
						var newDocID, c, v, tmp;
						var docTypePrefix = null;
	
						if (  !dbres[2].recs.length  ){
	
							// Выборка из таблицы RB_DOC пуста
							callback(["!RB_DOC.length"]);
							return;
	
						} else {
	
							var RBDOC = dbres[2].recs;
	
							self._RB_DOC_CACHE = RBDOC;
	
							if (  docType  ){
	
								for(c=0; c<RBDOC.length; c++) {
									if (RBDOC[c].ID4.toLowerCase() == docType.toLowerCase()) {
										docTypePrefix = RBDOC[c].Prefix;
									}
								}
	
							} else if (  GSID  ) {
	
								for(c=0; c<dbres[2].recs.length; c++){
									tmp = dbres[2].recs[c].GSFilter.split(";");
									for(v=0; v<tmp.length; v++){
										tmp[v] = tmp[v].trim().toLowerCase();
										if (!tmp[v]) continue;
										if (  GSID.toLowerCase().match(new RegExp(tmp[v]))  ){
											docTypePrefix = dbres[2].recs[c].Prefix;
										}
									}
	
								}
	
							} else {
	
								callback(["!docType && !GSID"]);
								return;
	
							}
	
						}
	
						if (!docTypePrefix){
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
	
						var year = dbres[1].recs[0]._year;
	
						var numericRest = 5 - newDocID.toString().length;
	
						for (c = 0; c < numericRest; c++) {
							newDocID = "0" + newDocID.toString();
						}
	
						callback(null, companyID + year + docTypePrefix + newDocID);
	
					}
				});
	
			},
	
	
			"__docDataModelsDefaultFields": {
				"id":						{"type":"N"},
				"DocID":					{"type":"S"},
				"ParentDoc":			{"type":"S"},
				"ParentDoc2":			{"type":"S"},
				"Tick":					{"type":"N"},
				"OriginalDoc":			{"type":"S"},
				"Company":			{"type":"S"},
				"Status":				{"type":"S"},
				"DocType":				{"type":"S"},
				"User":					{"type":"S"},
				"RegDate":				{"type":"D","value": "NOW()"},
				"DateAVR":				{"type":"D"},
				"DateAcc":				{"type":"D"},
				"TxtAcc":				{"type":"S"},
				"WorkName":			{"type":"S"},
				"Agent":				{"type":"S"},
				"Manager":				{"type":"S"},
				"FirmContract":		{"type":"N"},
				"Person":				{"type":"S"},
				"FirmCustomer":		{"type":"N"},
				"PayType":				{"type":"S"},
				"Discount":				{"type":"N"},
				"Disc_Text":			{"type":"S"},
				"Margin":				{"type":"N"},
				"Marg_Text":			{"type":"S"},
				"CurRate":				{"type":"N"},
				"Currency":				{"type":"S"},
				"Sum1":					{"type":"N"},
				"Sum2":					{"type":"N"},
				"Debt":					{"type":"N"},
				"SumExt":				{"type":"N"},
				"SumExt2":				{"type":"N"},
				"SumExt3":				{"type":"N"},
				"SumExtNDS":			{"type":"N"},
				"RateNDS":				{"type":"N"},
				"RateSpecTax":		{"type":"N"},
				"SumNDS":				{"type":"N"},
				"SumSpecTax":		{"type":"N"},
				"Notice":				{"type":"S"},
				"DocFlag":				{"type":"S"},
				"FilterGS":				{"type":"S"},
				"IsDeleted":			{"type":"N"},
				"DateNew":			{"type":"D"},
				"UserNew":				{"type":"S"},
				"DateEdit":				{"type":"D", "value": "NOW()"},
				"UserEdit":				{"type":"S"},
				"TextAVR":				{"type":"S"},
				"Addr":					{"type":"S"},
				"Debt2":				{"type":"N"},
				"SumExt4":				{"type":"N"}
			}
	
	
		}
	);
	
	module.exports = DocDataModel;

/***/ },
/* 15 */
/*!***********************************************************!*\
  !*** ./fabula-object-model/data-models/GandsDataModel.js ***!
  \***********************************************************/
/***/ function(module, exports, __webpack_require__) {

	// ------------------------------------------------------
	// Номенклатура
	
	// Для совместимости
	var getContextDB = function(){
		var FabulaObjectModel = __webpack_require__(/*! ./../_FabulaObjectModel.js */ 3);
		var DBModel = FabulaObjectModel.prototype.DBModel;
	
		if (  this._fabulaInstance ){
			return this._fabulaInstance.getDBInstance();
		}
		return DBModel.prototype.getInstance();
	};
	
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
			var db = getContextDB.call(this);
			var self = this;
	
			var dbq = [
				"SELECT * FROM Gands " 			+
				"WHERE " 								+
					"GSCOP LIKE '87%' "			+
					"OR GSCOP LIKE '17%' "		+
					"OR GSCOP LIKE '27%' "		+
					"OR GSCOP LIKE '07%' ",
	
				"SELECT * FROM GandsExt "						+
				"WHERE "												+
				"GSExID IN ("											+
					"SELECT GSID FROM Gands WHERE "		+
					"GSCOP LIKE '87%' "							+
					"OR GSCOP LIKE '17%' "						+
					"OR GSCOP LIKE '27%' "						+
					"OR GSCOP LIKE '07%'"						+
				")"
			];
	
			if (db){
				db.dbquery({
					"query" : dbq.join("; "),
					"callback" : function(res){
						self.data = res[0].recs;
						self.state = 1;
	
						var c, L, gandsRef = Object.create(null);
	
						for(c=0; c<self.data.length; c++){
							gandsRef[self.data[c].GSID] = self.data[c];
							self.data[c].gandsExtRef = [];
						}
	
						self.dataReferences = gandsRef;
	
						var gandsExt = res[1].recs;
	
						for(c=0; c<gandsExt.length; c++){
							if (  typeof gandsRef[gandsExt[c].GSExID] == "undefined"  ) continue;
							gandsRef[gandsExt[c].GSExID].gandsExtRef.push(gandsExt[c]);
						}
	
						for(c= 0, L=self.data.length; c<L; c++){
							if (typeof self.GSUnits[self.data[c].GSID] == "undefined") {
								self.GSUnits[self.data[c].GSID] = self.data[c].GSUnit
							}
						}
	
						callback(self.data);
					}
				});
			}
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
/* 16 */
/*!***********************************************************!*\
  !*** ./fabula-object-model/data-models/FirmsDataModel.js ***!
  \***********************************************************/
/***/ function(module, exports, __webpack_require__) {

	// ------------------------------------------------------
	// Данные из базы о предприятиях
	
	// Для совместимости
	var getContextDB = function(){
		var FabulaObjectModel = __webpack_require__(/*! ./../_FabulaObjectModel.js */ 3);
		var DBModel = FabulaObjectModel.prototype.DBModel;
	
		if (  this._fabulaInstance ){
			return this._fabulaInstance.getDBInstance();
		}
		return DBModel.prototype.getInstance();
	};
	
	var FirmsDataModel = function(){
		this.init();
	};
	
	FirmsDataModel.prototype = {
		"init" : function(){
	
			this.dbModel = null;
	
			this.data = [];
	
			this.instances.push(this);
	
			this.state = 0;
	
		},
	
		"instances" : [],
	
		"getInstance" : function(){
			if (this.instances.length){
				return this.instances[0];
			}
			return new FirmsDataModel();
		},
	
		"load" : function(A){
			if (typeof A == "undefined") A = Object.create(null);
			var callback = (typeof A.callback == "function" ? A.callback : function(){} );
			var db = getContextDB.call(this);
			var self = this;
			if (db){
				db.dbquery({
					"query" : "SELECT FirmID, Name FROM Firms",
					"dbsrc" : "common",
					"callback" : function(res){
						self.data = res.recs;
						self.state = 1;
						callback(self.data);
					}
				});
			}
		},
	
		"get" : function(){
			return this.data;
		}
	};
	
	module.exports = FirmsDataModel;

/***/ },
/* 17 */
/*!***********************************************************!*\
  !*** ./fabula-object-model/data-models/PathsDataModel.js ***!
  \***********************************************************/
/***/ function(module, exports, __webpack_require__) {

	// ------------------------------------------------------
	// Список путей
	
	// Для совместимости
	var getContextDB = function(){
		var FabulaObjectModel = __webpack_require__(/*! ./../_FabulaObjectModel.js */ 3);
		var DBModel = FabulaObjectModel.prototype.DBModel;
	
		if (  this._fabulaInstance ){
			return this._fabulaInstance.getDBInstance();
		}
		return DBModel.prototype.getInstance();
	};
	
	var PathsDataModel = function(){
		this.init();
	};
	
	PathsDataModel.prototype = {
		"init" : function(){
	
			this.dbModel = null;
	
			this.data = [];
	
			this.instances.push(this);
	
			this.state = 0;
	
		},
	
		"instances" : [],
	
		"getInstance" : function(){
			if (this.instances.length){
				return this.instances[0];
			}
			return new PathsDataModel();
		},
	
		"load" : function(A){
			if (typeof A == "undefined") A = Object.create(null);
			var callback = (typeof A.callback == "function" ? A.callback : function(){} );
			var db = getContextDB.call(this);
			var self = this;
			if (db){
				db.dbquery({
					"query" : "SELECT Value, Property FROM Property WHERE ExtClass = 'path' ",
					"callback" : function(res){
						self.data = res.recs;
						self.state = 1;
						callback(self.data);
					}
				});
			}
		},
	
		"get" : function(){
			return this.data;
		}
	};
	
	module.exports = PathsDataModel;

/***/ },
/* 18 */
/*!******************************************************************!*\
  !*** ./fabula-object-model/data-models/calc/DefaultPrintCalc.js ***!
  \******************************************************************/
/***/ function(module, exports, __webpack_require__) {

	var GandsDataModel = __webpack_require__(/*! ./../GandsDataModel */ 15);
	
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


/***/ }
/******/ ]);
//# sourceMappingURL=fabula-object-model.bundle.js.map