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
	return Object.prototype.hasOwnProperty.call(obj, key);
};

_utils.objectKeysToLowerCase = function(obj){
	if (typeof obj != "object") return null;
	var res = {};
	for(var prop in obj){
		if (  !Object.prototype.hasOwnProperty.call(obj, key)  ){
			continue;
		}
		res[prop.toLowerCase()] = obj[prop];
	}
	return res;
};

_utils.objectKeysToUpperCase = function(obj){
	if (typeof obj != "object") return null;
	var res = {};
	for(var prop in obj){
		if (  !Object.prototype.hasOwnProperty.call(obj, key)  ){
			continue;
		}
		res[prop.toUpperCase()] = obj[prop];
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