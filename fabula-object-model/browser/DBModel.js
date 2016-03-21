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

		var parsedURL = new URL(this.dburl);

		if (parsedURL.protocol == "ws:"){
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
			msg
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