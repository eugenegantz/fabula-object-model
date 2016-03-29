var assert = require("assert");
var modPath = require("path");

var __root = modPath.join(__dirname, "./../../fabula-object-model");
console.log(__root);

var Ajax = require(modPath.join(__root, "./nodejs/Ajax.js"));
var _use = require(modPath.join(__root, "./nodejs/RequireCustom"));
_use.addPath(modPath.join(__dirname, "./../../fabula-object-model"));

// ------------------------------------------------------------------------------------

describe("requireCustom", ()=>{

	it("RequireCustom. DBModel", ()=>{
		assert.ok(
			Boolean(_use("DBModel"))
		);
	});

});

describe("DBModel", ()=>{

	var db = new _use("DBModel")
		.prototype
		.getInstance({
			"dburl": "http://127.0.0.1:9000/db?",
			"dbname": "well.demo",
			"dbsrc": "main"
		});

	it("DBModel.dbquery / SELECT NOW();", (done)=>{
		db.dbquery({
			"query": "SELECT NOW();",
			"callback": (dbres)=>{
				if (  dbres.recs.length != 1 ){
					throw new Error("dbres.recs.length != 1");
				}
				done();
			}
		});
	});

});

describe("Ajax-module", ()=>{

	it("Ajax._xFormParam", ()=>{
		var a = Ajax._xFormParam({
			a: {
				aa: 110,
				ab: 120,
				ac: 130
			},
			b: [210, 220, 230],
			c: 300
		});
		assert.equal(decodeURIComponent(a), "a[aa]=110&a[ab]=120&a[ac]=130&b[]=210&b[]=220&b[]=230&c=300");
	});

	it("Ajax.req", (done)=>{
		Ajax.request({
			"url": "http://localhost:8100",
			"method": "GET",
			"vars": {
				"a": 100,
				"b": {
					"ba": 210,
					"bb": 220
				},
				"c": [1, 2, 3]
			},
			"callback": function(err, res){
				if (err) throw new Error(err);
				done();
			}
		});
	});

	it ("Ajax.req / vars / POST", (done)=>{
		Ajax.request({
			"url": "http://localhost:8100/api",
			"method": "POST",
			"vars": {
				"method": "test:async",
				argument: [100, 200, "abc"]
			},
			"callback": function(err, res){
				var exp = '{"err":null,"arg":["100","200","abc"]}';
				if (err) throw new Error(err);
				if (res.responseText != exp){
					throw new Error("expected: " + exp);
				}
				done();
			}
		});
	});

	it ("Ajax.req / vars / GET", (done)=>{
		Ajax.request({
			"url": "http://localhost:8100/api",
			"method": "GET",
			"vars": {
				"method": "test:async",
				argument: [100, 200, "abc"]
			},
			"callback": function(err, res){
				var exp = '{"err":null,"arg":["100","200","abc"]}';
				if (err) throw new Error(err);
				if (res.responseText != exp){
					throw new Error("expected: " + exp);
				}
				done();
			}
		});
	});

});

describe("FOM", ()=>{

	var fom = new _use("FabulaObjectModel")
		.prototype
		.getInstance({
			"dburl": "http://127.0.0.1:9000/db?",
			"dbname": "well.demo",
			"dbsrc": "main"
		});

	var db = fom.getDBInstance();

	it("FOM.create", ()=>{
		var mov = fom.create("MovDataModel");
		assert.ok(  mov instanceof fom.MovDataModel  );
	});

	it("MovDataModel", (done)=>{
		db.dbquery({
			"query": "SELECT TOP 5 MMID FROM Movement ORDER BY GSDate DESC",
			"callback": (dbres)=>{
				var mov = fom.create("MovDataModel");
				mov.set("MMID", dbres.recs[0].MMID);
				mov.load({
					callback: ()=>{
						if (!mov.get("GS")){
							throw new Error('!mov.get("GS")');
						}
						done();
					}
				});
			}
		})
	});

});