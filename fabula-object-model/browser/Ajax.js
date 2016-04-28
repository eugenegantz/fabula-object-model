var _utils = require("./../utils");

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
 * */
Ajax.req = function(arg){

	if (typeof arg != "object") return;

	var callback		= typeof arg.callback == "function" ? arg.callback : new Function();

	var method		= typeof arg.method == "string" ? arg.method.toUpperCase() : "GET";

	if (typeof arg.url != "string" || !arg.url){
		throw new Error("!arg.url");
	}

	var data, url = arg.url;

	if (typeof arg.data == "string"){
		data = arg.data;

	} else if (  typeof arg.data == "object" ){
		data = this._xFormParam(arg.data);

	} else if (  typeof arg.vars == "object"  ){
		data =  this._xFormParam(arg.vars);
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

	/*
	// В Internet explorer не работает
	// По мнению MSDN: Raised when there is an error that prevents the completion of the cross-domain request.
	http.onerror = function(){
		http.error = "XMLHttpRequest error";
		http.errno = 1;
		callback.call(http, http.error, http);
	};
	*/

	http.onreadystatechange = function(){
		if (  http.readyState === 4  ){
			if (  http.status == 200  ){
				callback.call(http, null, http);

			} else if (
				// фикс для IE, где onerror имеет другое поведение
				http.status != 200
				&& typeof http.onerror != "function"
			) {
				callback.call(http, "XMLHttpRequest.status: " + http.status, http);
			}
		}
	};

	http.open(method, url, true);

	http.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

	http.send(data);

};

Ajax.request = Ajax.req;

module.exports = Ajax;