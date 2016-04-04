var assert = require("assert");

assert.notOk = function(value){
	return assert.strictEqual(value, false);
};

// ------------------------------------------------------------------------------------

var modPath = require("path");
var __root = modPath.join(__dirname, "./../../fabula-object-model");

// ------------------------------------------------------------------------------------

var Ajax = require(modPath.join(__root, "./nodejs/Ajax.js"));
var cUtils = require(modPath.join(__root, "./data-models/calc/CalcUtils.js"));
var _use = require(modPath.join(__root, "./nodejs/RequireCustom"));
_use.addPath(__root);

// ------------------------------------------------------------------------------------

var FabulaObjectModel = require(__root);
var fom = FabulaObjectModel
	.prototype
	.getInstance({
		"dburl": "http://127.0.0.1:9000/db?",
		"dbname": "well.demo",
		"dbsrc": "main"
	});

// ------------------------------------------------------------------------------------

describe.skip("fabula-object-model", function(){

	it(".prototype.getInstance()", function(){
		assert.ok(Boolean(fom));
	})

});

describe.skip(
	"ObjectA",
	function(){

		var ObjectA = fom._getModule("ObjectA");

		(function(){

			var obj = new ObjectA();

			describe(".set()", function(){
				it(".set(aBcD, 100)", function(){
					obj.set("aBcD",100);
					assert.ok(true);
				});
			});

			describe(".get()", function(){
				it(".get(abcd) == 100", function(){
					assert.equal(obj.get("abcd"), 100);
				});
			});

		})();

		(function(){

			var arg = {
				"a": 1,
				"b": "2",
				"c": {"c":3},
				"d": [4]
			};

			var obj = new ObjectA(arg);

			describe(".getLength()", function(){
				it(".getLength() == 4", function(){
					assert.equal(obj.getLength(), 4);
				});
			});

			describe("remove(), .getLength()", function(){
				it("remove(A), .getLength() == 3", function(){
					obj.remove("A");
					assert.equal(obj.getLength(), 3, "remove");
				});
			});

			describe(".has()", function(){
				it(".has(B) == true", function(){
					assert.ok(
						obj.has("B"),
						"has.true"
					);
				});
				it(".has(A) == false", function(){
					assert.notOk(
						obj.has("A"),
						"has.false"
					);
				});
			});

		})();

	}
);


// -----------------------------------------------------------------------------


describe.skip(
	"InterfaceEvents",
	function(){
		var st = false;

		var InterfaceEvents = fom._getModule("InterfaceEvents");
		var ie = new InterfaceEvents();

		ie.on(
			"ev",
			function(){
				st = true;
			}
		);

		ie.trigger("ev");

		describe(".on(), .trigger()", function(){
			it(".on(ev), .trigger(ev)", function(){
				assert.ok(st);
			});
		});

	}
);


// -----------------------------------------------------------------------------


describe.skip("requireCustom", ()=>{

	it("RequireCustom. DBModel", ()=>{
		assert.ok(
			Boolean(_use("DBAwwS"))
		);
	});

});


// -----------------------------------------------------------------------------


describe.skip("DBModel", ()=>{

	var db = require(modPath.join(__root, "./nodejs/DBModel"))
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


// -----------------------------------------------------------------------------


describe.skip("Ajax-module", ()=>{

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


// -----------------------------------------------------------------------------


describe.skip("FOM", ()=>{

	var db = fom.getDBInstance();

	it("FOM.create", ()=>{
		var mov = fom.create("MovDataModel");
		assert.ok(  mov instanceof fom.mod.MovDataModel  );
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


// -----------------------------------------------------------------------------


describe("GandsDataModel", function(){

	var gands = fom.create("GandsDataModel");

	describe("GandsDataModel.load()", function(){
		it("gands.data.length > 0", function(done){
			gands.load({
				callback: function(){
					if (!gands.data.length){
						throw new Error("!gands.data.length");
					}
					if (!Object.keys(gands._indexData).length){
						throw new Error("!gands._indexData.length");
					}
					done();
				}
			})
		})
	});

});


// -----------------------------------------------------------------------------


describe("PrintUtils", function(){

	var PrintUtils = fom._getModule("PrintUtils");

	describe("PrintUtils.getFormats()", function () {
		it("PrintUtils.getFormats()", function () {
			assert.ok(
				Object.keys(PrintUtils.getFormats()).length > 0
			);
		});
	});

	describe("PrintUtils.getFormat", function () {
		it("PrintUtils.getFormat('ТСПоФмА3') == Object", function () {
			assert.equal(typeof PrintUtils.getFormat('ТСПоФмА3'), "object");
		});
	});

});


// -----------------------------------------------------------------------------


describe("Calc", function(){

	var gands = fom.create("GandsDataModel");

	describe("CalcPrintOffset", function(){
		beforeEach(function(done) {
			if (gands.state){
				done();
				return;
			}
			gands.load({
				callback: function() {
					done();
				}
			});
		});
		var cpo = fom.create("CalcPrintOffset");
		it("А4 / 4+0 / sum == 8412.5", function(){
			var sum = cpo.calc({
				"amount": 1000,
				"material": "ТЦБуОф9ж",
				"format": "ТСПоФмА4",
				"colorCode": "4+0"
			});
			assert.equal(sum, 8412.5);
		});
		it("А4 / 4+4 / sum == 15912.5", function(){
			var sum = cpo.calc({
				"amount": 1000,
				"material": "ТЦБуОф9ж",
				"format": "ТСПоФмА4",
				"colorCode": "4+4"
			});
			assert.equal(sum, 15992.5);
		});
		it("А5 / 4+4 / sum == 10715", function(){
			var sum = cpo.calc({
				"amount": 1000,
				"material": "ТЦБуОф9ж",
				"format": "ТСПоФмА5",
				"colorCode": "4+4"
			});
			assert.equal(sum, 10715);
		});
		it("А6 / 4+0 / sum == 3968.5", function(){
			var sum = cpo.calc({
				"amount": 800,
				"material": "ТЦБуОф9ж",
				"format": "ТСПоФмА6",
				"colorCode": "4+0"
			});
			assert.equal(sum, 3968.5);
		});
	});

});