var _utils = Object.create(null);

_utils.DBSecureStr = function(str){
	"use strict";

	if (!arguments.length) return;
	if (typeof str != "string") return str;
	var a = [
		[new RegExp(/["']/g),""],
		// [new RegExp(/[№]/gi),"N"]
		// [new RegExp(/[\n\v\r]/gi),""]
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
 * Служебный метод. Используется в процессе записи даты в поля.
 * Необходим для безопасной записи полей DateTime
 * @param {Date, String} date - дата для записи
 * @param {*=false} strict - Выбрасывать ошибки?
 * @return String В формате YYYY.MM.DD HH:mm:ss
 * */
_utils.DBSecureDate = function(date, strict){
	"use strict";

	strict = Boolean(strict);

	if (typeof date == "string"){
		date = new Date(date.replace(/[-.]/gi, "/"));
	}

	if (  isNaN(date.getTime())  ){
		if (strict) throw new Error("Wrong date format");
		date = new Date();
	}

	if (date instanceof Date == false){
		if (strict) throw new Error("Only \"Date\" and \"String\" types");
		date = new Date();
	}

	return ""
		+ date.getFullYear()
		+ "." + (date.getMonth() + 1)
		+ "." + date.getDate()
		+ " " + date.getHours()
		+ ":" + date.getMinutes()
		+ ":" + date.getSeconds();
};

/**
 * @param {Array} d Delimiters"
 * @param {String} s - String
 * @return Array
 * */
_utils.msplit = function(d,s){
	"use strict";

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
 * @param {String, Array} ch - Characters
 * @param {Number} di - 0 - left, 1 = right, -1 = both
 * */
_utils.trim = function(str, ch, di){
	"use strict";

	var regEx = [];

	if (!di || di == -1)
		regEx.push("^[" + ch + "]+");

	if (di == 1 || di == -1)
		regEx.push("[" + ch + "]+$");

	return str.replace(new RegExp(regEx.join("|"), "g"), '');
};


/**
 * @param {String} str - String
 * @param {String, Array} _chars - Characters
 * */
_utils.ltrim = function(str,_chars){
	"use strict";
	var arg = Array.prototype.slice.call(arguments,0);
	arg[2] = 0;
	return this.trim.apply(this, arg);
};


/**
 * @param {String} str - String
 * @param {String, Array} _chars - Characters
 * */
_utils.rtrim = function(str,_chars){
	"use strict";
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
	"use strict";
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
	"use strict";
	if (typeof obj != "object") return null;
	var res = {};
	for(var prop in obj){
		if (  !Object.prototype.hasOwnProperty.call(obj, prop)  ){
			continue;
		}
		res[prop.toLowerCase()] = obj[prop];
	}
	return res;
};

_utils.objectKeysToUpperCase = function(obj){
	"use strict";
	if (typeof obj != "object") return null;
	var res = {};
	for(var prop in obj){
		if (  !Object.prototype.hasOwnProperty.call(obj, prop)  ){
			continue;
		}
		res[prop.toUpperCase()] = obj[prop];
	}
	return res;
};

_utils.URLHashParse = function (){
	"use strict";
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
	"use strict";
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
	"use strict";
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
	"use strict";
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


_utils.detectEnvironment = function(){
	// Странное поведение в nodejs 8.2.1
	// new Function(...) - возвращает undefined
	var ctx = (new Function("return this;") || function() { return this; })(),
		globClassName = Object.prototype.toString.call(ctx);

	if (globClassName == "[object Window]")
		return "browser";

	if (globClassName == "[object global]")
		return "node";
};


_utils.isBrowser = function(){
	return this.detectEnvironment() === "browser";
};


/**
 * @param {*} value
 * @return {String}
 * */
_utils.getType = function(value){
	if (  Object.prototype.toString.call(value) == "[object Array]"  ){
		return "array";

	} else if (  Object.prototype.toString.call(value) == "[object Object]"  )  {
		return "object";

	} else if (  value === null  ) {
		return "null";

	} else if (  Object.prototype.toString.call(value) == "[object Date]"  ) {
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
	"use strict";

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
				? arg.trim.split("")
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


/**
 * Удалить из строки теги-ссылки фабулы
 * @param {String} str
 * */
_utils.rmGsTags = function(str) {
	return str.replace(/\[\/?[a-zA-Zа-яА-Я\s=+\-_!@#$%^&*()|\\/]+]/ig, "");
};


_utils.isEmpty = function(val) {
	return ![].concat(val).join("");
};


_utils.toBool = function(val) {
	var s = (val + '').toLowerCase(),
		n = +val;

	if (s === 'да')
		return true;

	if (s === 'нет')
		return false;

	return Boolean(n);
};


_utils.createProtoChain = function() {
	var args = Array.prototype.slice.call(arguments, 0),
		proto,
		base = args.shift();

	if (!args.length)
		return;

	function protoReduce(obj, key) {
		obj[key] = {
			"writable": true,
			"configurable": true,
			"enumerable": true,
			"value": proto[key]
		};

		return obj;
	}

	function argsReduce(base, _proto) {
		proto = _proto;

		if (typeof proto != "object")
			return base;

		return Object.create(
			base,
			Object.keys(proto).reduce(protoReduce, {})
		);
	}

	return args.reduce(argsReduce, base);
};


/**
 * @param {String} str
 *
 * @return {Object}
 * */
_utils.parseMMFlagRule = function(str) {
	if (typeof str != "string")
		throw new Error("1st argument expected to be type String");

	var _patterns = _utils.parseMMFlagRule._patterns;

	var getFlagsInsideTagsRegEx = new RegExp(""
		+ _patterns.tag.open.source
		+ _patterns.body.source
		+ _patterns.tag.close.source,
		"ig"
	);

	var rmTagsRegEx = new RegExp(_patterns.tag.open.source + "|" + _patterns.tag.close.source, "ig");

	str = [].concat((str + "").match(getFlagsInsideTagsRegEx)).join("");

	return str
		.replace(rmTagsRegEx, "")
		.split(/;\s*/ig)
		.reduce(function(prev, curr) {
			var tmp1, left, label, flag, attr;

			curr = curr.trim();

			if (!curr)
				return prev;

			tmp1        = curr.split(/\s*-\s*/ig);
			left        = tmp1[0];
			label       = tmp1[1] || "";

			tmp1        = left.split(/[)(]/ig);
			flag        = tmp1[0];
			attr        = tmp1[1];

			if (!flag)
				return prev;

			attr = attr.split("").reduce((obj, a) => {
				obj[a] = true;

				return obj;
			}, {});

			prev[flag] = {
				  flag
				, label
				, attr
			};

			return prev;
		}, {});
};


_utils.parseMMFlagRule._patterns = {
	body: /.+/ig,
	tag: {
		open: /\[fl\s*[0-9a-zа-я="'\|\/]*\]/ig,
		close: /\[\/fl\]/ig,
	},
};


module.exports =_utils;