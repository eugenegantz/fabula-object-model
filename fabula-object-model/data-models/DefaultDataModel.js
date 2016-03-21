// ------------------------------------------------------
// Прототип модели данных

var InterfaceEvents = require("./InterfaceEvents");

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

			var EventConstructor = Event || CustomEvent;

			var createEvent = function(name){
				var event = new EventConstructor(name);
				event.value = value;
				event.argument = arg || null;
				return event;
			};

			if (useEvent) {
				var eventBefore = createEvent("set:" + key);
				var eventAfter = createEvent("afterset:" + key);
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