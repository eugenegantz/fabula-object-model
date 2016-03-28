var Ajax = Object.create(null);
var _utils = require("./../utils");


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
 * @callback AjaxReqCallback
 * @param {String, null} err
 * @param {Object} context
 * */
/**
 * @param {Object} arg
 * @param {String} arg.url,
 * @param {AjaxReqCallback} arg.callback
 * @param {String} arg.method
 * @param {Object} arg.vars
 * @param {String} arg.data
 * */
Ajax.request = function(arg){
	var modIconvLite		= require("iconv-lite");
	var modURL			= require('url');
	var modHttp			= require('http');
	var lodash				= require('lodash');

	// ---------------------------------------------------------------
	// Аргументы

	if (
		typeof arg.url != "string"
		|| !arg.url
	){
		throw new Error("!arg.url");
	}

	var URLParsed			= modURL.parse(arg.url);
	var method				= typeof arg.method != "string" ? "GET" : arg.method.toUpperCase();
	var callback				= typeof arg.callback != "function" ? new Function() : arg.callback;
	var decodeFrom		= typeof arg.decodeFrom != "string" ? null : arg.decodeFrom;
	var argVars				= !arg.vars ? {} : arg.vars ;
	var argData				= !arg.data ? null : arg.data;

	var reqData;

	if (  !argData  ){
		reqData = typeof argVars == "object" ? this._xFormParam(argVars) : "";

	} else {
		reqData = typeof argData == "string" ? argData : "";

	}

	if (!URLParsed.port) URLParsed.port = 80;

	// ---------------------------------------------------------------
	// Параметры запроса

	var httpReqOpt = {
		"hostname": URLParsed.hostname,
		"port": URLParsed.port,
		"path": method == "GET"
			? lodash.trim(URLParsed.path,"?") + "?" + reqData
			: URLParsed.path,
		"method": method,
		"headers": {
			"Content-length"		: reqData.length,
			"Content-type"		: "application/x-www-form-urlencoded",
			"Connection"			: "keep-alive",
			"Accept-Encoding"	: "gzip, deflate",
			"User-Agent"			: "Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.89 Safari/537.36"
		}
	};

	// ---------------------------------------------------------------

	var req = modHttp.request(httpReqOpt, function(res){
		var httpReqParts = [];

		res.on('data', function (chunk) {
			httpReqParts.push(chunk);
		});

		res.on('end', function () {
			// httpReqParts.push(chunk);
			callback(
				null,
				{
					error : null,
					responseText: (
						!decodeFrom
							? httpReqParts.join('')
							: modIconvLite.decode(Buffer.concat(httpReqParts), decodeFrom)
					),
					status: res.statusCode,
					headers: res.headers
				}
			);
		});
	});

	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
		callback(
			e.message,
			{
				error: e.message,
				errno: e.errno,
				responseText: null,
				status: null,
				headers: null
			}
		);
	});

	req.write(reqData);
	req.end();
};


Ajax.req = Ajax.request;


module.exports = Ajax;