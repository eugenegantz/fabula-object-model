var modAjax = require("./Ajax");

/**
 * @constructor
 * @param {Object} arg
 * @param {String} arg.dburl
 * @param {String} arg.dbname
 * @param {String} arg.dbsrc
 * */
var DBModel = function(arg){
	if (typeof arg != "object") {
		throw new Error("1st argument suppose to be Object");
	}

	this.wsObservers = Object.create(null);
	this.wsClient	= null;
	this.wsOnOpenArray = [];

	var tmp = ["dburl", "dbname", "dbname"];

	for(let c=0; c<tmp.length; c++){
		if (!arg[tmp[c]]){
			throw new Error("!arg." + tmp[c]);
		}
	}

	this.dburl 		= arg.dburl;
	this.dbname 	= arg.dbname; // well.2015
	this.dbsrc 		= arg.dbsrc; // main, common, stat
	this.errors 		= [];
	this.logs			= [];

	// var parsedURL = new URL(this.dburl);

	if (  this.dburl.match(/ws:\/\//g)  ){
		if (typeof WebSocket != "function"){
			throw new Error("!WebSocket");
		}
		this.wsClient = new WebSocket(this.dburl);
		this.wsClient.onmessage = this._wsOnMessage.bind(this);
		this.wsClient.onerror = this._wsOnError;
		this.wsClient.onopen = this._wsOnOpen.bind(this);
	}

	this.instances.push(this);
};

DBModel.prototype.instances = [];


/**
 * @callback DBModel~dbqueryCallback
 * @param {Object} dbres
 * @param {Object} dbres.info.errors - Ошибки
 * @param {Array} dbres.recs - Таблица БД
 * */
/**
 * @param {Object} arg
 * @param {String} arg.query
 * @param {DBModel~dbqueryCallback} arg.callback
 * */
DBModel.prototype.dbquery = function(arg){

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
		return;
	}

	// --------------------------------------------------------
	// История запросов
	if (this.logs.length > 50) this.logs = [];
	this.logs.push(dbquery);

	var arguments_ = Array.prototype.slice.call(arguments, 0);

	// --------------------------------------------------------
	// http или webSocket
	if (  this.wsClient  ){
		this._dbquery_ws.apply(this, arguments_);

	} else {
		this._dbquery_http.apply(this, arguments_);

	}

};


DBModel.prototype._dbquery_http = function(arg){
	modAjax.request({
		"url": this.dburl,
		"method": "POST",
		"vars": {}
	});
};


DBModel.prototype.getInstance = function(arg){
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
};


DBModel.prototype._convert = function(dbres){
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
};

module.exports = DBModel;