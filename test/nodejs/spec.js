var assert = require("assert");

assert.notOk = function(value){
	return assert.strictEqual(value, false);
};

// ------------------------------------------------------------------------------------

var modPath = require("path");
var __root = modPath.join(__dirname, "./../../fabula-object-model");

// ------------------------------------------------------------------------------------

var Ajax = require("eg-node-ajax");
var cUtils = require(modPath.join(__root, "./data-models/calc/CalcUtils.js"));

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

describe("fabula-object-model", function(){

	it(".prototype.getInstance()", function(){
		assert.ok(Boolean(fom));
	})

});

describe.skip("ObjectA", function(){

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

	});


// -----------------------------------------------------------------------------


describe.skip("InterfaceEvents", function(){
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

	});


// -----------------------------------------------------------------------------


describe.skip("InterfaceFProperty", function(){

	var fp = fom.create("InterfaceFProperty"); // new InterfaceFProperty();

	var lorem_ipsum = "" +
		"Lorem Ipsum is simply dummy text of the printing and typesetting industry. " +
		"Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, " +
		"when an unknown printer took a galley of type and scrambled it to make a type specimen book. " +
		"It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. " +
		"It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, " +
		"and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.";

	var eventTests = {
		"addProperty":false,
		"getProperty":false,
		"removeProperty":false,
		"changedProperty":false
	};

	describe(".addProperty(), .getProperty(), .on(addProperty), .on(getProperty)", function(){
		fp.on(
			"addProperty",
			function(){
				it(".on(addProperty)", function(done){
					done();
				});
			}
		);
		fp.on(
			"getProperty",
			function(){
				it(".on(getProperty)", function(done){
					done();
				});
			}
		);
		it(".addProperty(...)", function(){
			fp.addProperty({"property":"prop_integer","value":"100"});
			fp.addProperty({"property":"prop_string","value":"abc"});
			fp.addProperty({"property":"prop_string","value":"abcd"});
			fp.addProperty({"property":"prop_with_pid","pid":"20511","value":"abc"});
			fp.addProperty({"property":"prop_without_value","pid":"20511"});
			assert.equal(fp.getProperty().length, 5);
		});
		it(".getProperty(...)", function(){
			assert.equal(
				fp.getProperty({"property":"prop_string"}).length,
				2,
				'Получение записей // fp.getProperty(...).length == 2'
			);
		});
		it("._property[4].value === null", function(){
			assert.ok(
				fp._property[4].value === null,
				"Значение поля по умолчанию === null (для неуказанных полей) // fp._property[3].value === null"
			);
		});
	});

	describe(".splitProperty()", function(){
		it(".splitProperty(lorem_ipsum)", function(){
			assert.ok(
				(function(){
					var tmp = fp.splitProperty({"Property":"test","value":lorem_ipsum});
					for(var c=0; c<tmp.length; c++){
						if (tmp[c].value.length > 120){
							return false;
						}
					}
					return true;
				})(),
				"Разбиение свойства по длине записи (не более 120 символов на запись)"
			);
		});
		it(".splitProperty(lorem_ipsum) // long words", function(){
			assert.ok(
				(function(){
					var tmp = fp.splitProperty({"Property":"test","value":lorem_ipsum.replace(/[ ]/g,"")});
					for(var c=0; c<tmp.length; c++){
						if (tmp[c].value.length > 120){
							return false;
						}
					}
					return true;
				})(),
				"Разбиение свойства по длине записи (не более 120 символов на запись). Длинные слова"
			);
		});
	});

	describe(".removeProperty(), .on(removeProperty)", function(){
		fp.on(
			"removeProperty",
			function(){
				it(".on(removeProperty)", function(done){
					done();
				});
			}
		);
		it(".removeProperty(...)", function(){
			fp.removeProperty({"property":"prop_integer"});
			fp.removeProperty({"property":"prop_string","value":"abcd"});
			assert.equal(fp.getProperty().length, 3);
		});

	});

	describe(".updateProperty()", function(){
		it(".updateProperty(...)", function(){
			fp.updateProperty({"pid":"20511"},{"value":"qwerty"});
			assert.equal(fp.getProperty({"value":"qwerty"}).length, 2);
		});
	});

	describe(".upsertProperty()", function(){
		it(".upsertProperty(+3)", function(){
			fp.clearChangedProperty();
			fp.upsertProperty({"pid": "20511"},[{"value":"zwerty"},{"value":"zwerty"},{"value":"zwerty"}]);
			assert.equal(fp.getProperty({"value":"zwerty"}).length, 3);
		})
	});

	describe(".getChangedProperty()", function(){
		it(".getChangedProperty(...)", function(){
			assert.ok(
				Boolean(fp.getChangedProperty().length),
				"fp.getChangedProperty()"
			);
		});
	});

});


// -----------------------------------------------------------------------------


describe("DBModel", ()=>{

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


describe.skip("DefaultDataModel", function(){

	var defDm = fom.create("DefaultDataModel"); // new DefaultDataModel();

	var eventTests = {
		"get:test-key": false,
		"set:test-key": false,
		"afterset:test-key": false,
		"onceset:test-key": false
	};

	describe(".set() + events", function(){
		it(".set(test-key,test-value)", function(){
			defDm.on(
				"set:test-key",
				function(){
					var e = arguments[1];
					var value = this.get("test-key");
					eventTests["set:test-key"] = e.type == "set:test-key" && !value && e.value == "test-value";
				}
			);
			defDm.on(
				"afterset:test-key",
				function(){
					var e = arguments[1];
					var value = this.get("test-key");
					eventTests["afterset:test-key"] = e.type == "afterset:test-key" && value == "test-value";
				}
			);
			defDm.once("set:test-key", function(){
				eventTests["onceset:test-key"] = eventTests["onceset:test-key"] == false;
			});
			defDm.set("test-key","test-value");
			assert.ok(eventTests["set:test-key"]);
			assert.ok(eventTests["afterset:test-key"]);
			defDm.set("test-key","test-value");
			assert.ok(eventTests["onceset:test-key"]);
		});

	});

	describe(".get() + events", function(){
		defDm.on("get:test-key", function(){
			eventTests["get:test-key"] = true;
		});
		it(".get(test-key)", function(){
			assert.equal(defDm.get("test-key"), "test-value");
			assert.ok(eventTests["get:test-key"]);
		});
	});

});


// -----------------------------------------------------------------------------


describe.skip("MovDataModel", function(){

	var db = fom.create("DBModel");

	var stand = {
		MMID: null,
		mov: null
	};

	describe(".save() / .insert()", function(){
		var self = stand;

		this.timeout(3000);

		it(".save(...) / .insert()", function(done){
			stand.mov = fom.create("MovDataModel");
			stand.mov.set("Amount",999);
			stand.mov.set("MMFlag","9");

			stand.mov.addProperty([
				{"property":"Макет исходящий","value":"100"},
				{"property":"Макет исходящий","value":"200"}
			]);

			stand.mov.addChildMov({
				"GSID": "РУПОДП02",
				"Sum": 100,
				"Amount": 999,
				"MMFlag": "9"
			});

			stand.mov.addChildMov({
				"GSID": "РУПОДП02",
				"Sum": 200,
				"Amount": 999,
				"MMFlag": "9"
			});

			stand.mov.save({
				"callback": function(err){

					var MMID = stand.MMID = self.mov.get("MMID");

					if (err) {
						done(err);
						return;
					}

					(function(){
						for(var c=0; c<self.mov.childrenMovs.length; c++){
							if (  self.mov.childrenMovs[c].get("MMPID") != MMID  ){
								done(new Error("CMov.MMPID != this.MMID"));
								return false;
							}
						}
					})();

					db.dbquery({
						"query": [
							"SELECT MMID, MMFlag, Amount FROM Movement WHERE MMID = " + stand.mov.get("MMID"),
							"SELECT pid FROM Property WHERE pid = " + stand.mov.get("MMID"),
							"SELECT MMID FROM Movement WHERE MMPID = " + stand.mov.get("MMID")
						].join("; "),
						"callback": function(dbres){
							var mov = dbres[0].recs;
							var props = dbres[1].recs;
							var children = dbres[2].recs;

							if (props.length != 2){
								done(new Error("props.length != 2"));
								return;
							}

							if (children.length != 2){
								done(new Error("children.length != 2"));
								return;
							}

							if (mov[0].MMFlag != "9" || mov[0].Amount != 999){
								done(new Error("mov[0].MMFlag != '9' || mov[0].Amount != 999"));
								return;
							}

							done();
						}
					});

				}
			});
		});

	});


	describe(".load()", function(){

		it(".load() // prev mov", function(done){
			var MMID = stand.mov.get("MMID");
			stand.mov = fom.create("MovDataModel");
			stand.mov.set("MMID", MMID);
			stand.mov.load({
				"callback": function(err){
					if (err){
						done(err);
						return;
					}
					done();
				}
			});
		});

		it(".load() // concrete fields", function(done){
			// ------------------------------------------------------
			// Инициализация конкретных полей
			var mov2 = fom.create("MovDataModel");
			mov2.set("MMID", stand.mov.get("MMID"));
			mov2.load({
				"fields": "MMID,MMFlag",
				"callback": function(err,obj){
					if (  mov2.get("MMFlag") != "9" || obj.get("Sum")  ){
						done(new Error("MMFlag != 9 || obj.get(Sum)"));
						return;
					}
					done();
				}
			});
		});

	});


	describe(".update()", function(){

		it(".save(...) / .update() / prev loaded", function(done){
			stand.mov.set("MMFlag","8");
			stand.mov.set("Amount",888);
			stand.mov.set("Sum",1200);

			stand.mov.removeChilldMov({"Sum":200});
			stand.mov.addChildMov(fom.create("MovDataModel"));
			stand.mov.appendChildMov({
				"GSID": "РУПОДП02",
				"Sum": 300,
				"Amount": 999,
				"MMFlag": "7"
			});

			for(var c=0; c<stand.mov._property.length; c++){
				if (  stand.mov._property[c].value == "100"  ){
					stand.mov._property[c].value = 900;
				}
				if (  stand.mov._property[c].value == "200"  ){
					stand.mov._property[c] = null;
				}
			}

			stand.mov._property.push({"property":"Макет исходящий","value":"300"});

			stand.mov.save({
				"callback": function(err){

					if (err){
						done(err);
						return;
					}

					db.dbquery({
						"query": [
							"SELECT pid FROM Property WHERE value IN ('900','300') AND pid = " + stand.mov.get("MMID"),
							"SELECT MMID FROM Movement WHERE MMPID = " + stand.mov.get("MMID"),
							"SELECT MMID FROM Movement WHERE MMFlag = '8' AND [Amount] = 888 AND [Sum] = 1200 AND  MMID = " + stand.mov.get("MMID")
						].join("; "),
						"callback": function(dbres){

							var props = dbres[0].recs;
							var movsChildren = dbres[1].recs;
							var movs = dbres[2].recs;

							if (movsChildren.length != 3){
								done(new Error("movsChildren.length != 3"));
								return;
							}
							if (!movs.length){
								done("!movs.length");
								return;
							}
							if(props.length != 2){
								done(new Error("props.length != 2"));
								return;
							}

							done();
						}
					});


				}
			});
		});


	});


	after(function(done){
		if (stand.mov){
			var MMID = stand.mov.get("MMID");
			db.dbquery({
				"query": [
					"DELETE FROM Movement WHERE MMID = " + MMID,
					"DELETE FROM Property WHERE pid = " + MMID,
					"DELETE FROM Movement WHERE MMPID = " + MMID,
					"DELETE FROM Property WHERE pid IN (SELECT MMID FROM Movement WHERE MMPID = "+MMID+")"
				].join("; "),
				"callback": function(){
					done();
				}
			});
		}
	});

});


// -----------------------------------------------------------------------------


describe.skip("DocDataModel", function(){

	var db = fom.create("DBModel");

	var stand = {
		"doc": fom.create("DocDataModel")
	};

	describe(".getNewDocID()", function(){
		this.timeout(6000);

		it(".getNewDocID()", function(done){
			var doc = fom.create("DocDataModel");
			doc.getNewDocID({
				"companyID": "РА",
				"docType":"РеУС",
				"callback": function(err, DocID){
					if (err){
						done(new Error(err));
						return;
					}
					if (!DocID){
						done(new Error("!DocID"));
						return;
					}
					done();
				}
			});
		});
	});

	describe("childMovs", function(){
		this.timeout(6000);

		it("childMovs", function(){
			var doc= fom.create("DocDataModel");
			var mov;
			var count = 0;
			for(var c=6; c<19; c++){
				mov = fom.create("MovDataModel");
				mov.set("MMFlag", c);
				mov.set("Sum", c * 100);
				mov.set("Sum2", Math.round(Math.random() * 1000));
				doc.addMov(mov);
				count++;
			}

			assert.equal(doc.movs.length, count);

			doc.deleteMov({"Sum": 9 * 100, "MMFlag": 9});
			doc.deleteMov({"Sum": 8 * 100, "MMFlag": 8});
			doc.deleteMov({"Sum": 7 * 100, "MMFlag": 10});

			assert.equal(doc.movs.length, count - 2);
			assert.equal(doc.getMov({"Sum": 10 * 100, "MMFlag": 10}).length, 1);
		});
	});

	describe(".save() / .insert()", function(){
		this.timeout(6000);

		it(".save(...) / .insert()", function(done){
			stand.doc.set("Agent", 999);
			stand.doc.set("Manager", 999);
			stand.doc.set("Sum1", 0);
			stand.doc.set("Person","test_person");
			stand.doc.set("Company", "РА");
			stand.doc.set("DocType", "РеУС");

			var lorem_ipsum = "" +
				"Lorem Ipsum is simply dummy text of the printing and typesetting industry. " +
				"Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, " +
				"when an unknown printer took a galley of type and scrambled it to make a type specimen book. " +
				"It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. " +
				"It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, " +
				"and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.";

			stand.doc.addProperty(stand.doc.splitProperty({"uid":null,"extclass":null,"extid":null,"pid":null,"property":"Примечание","value":lorem_ipsum}));
			stand.doc.addProperty({"property":"test","value":"test"});

			stand.doc.addMov(fom.create("MovDataModel"));
			stand.doc.addMov(fom.create("MovDataModel"));
			stand.doc.addMov(fom.create("MovDataModel"));

			stand.doc.save({
				"callback": function(err){

					if (err){
						done(err);
						return;
					}

					db.dbquery({
						"query": [
							"SELECT pid FROM Property WHERE ExtID = '" + stand.doc.get("DocID") + "' ",
							"SELECT MMID FROM Movement WHERE Doc = '" + stand.doc.get("DocID") + "' ",
							"SELECT Agent, Manager FROM DOCS WHERE DocID = '" + stand.doc.get("DocID") + "' "
						].join("; "),
						"callback": function(dbres){
							if (  dbres[0].recs.length != 9  ){
								done(new Error("props.length != 9"));
								return;
							}
							if (  dbres[1].recs.length != 3  ){
								done("movs.length != 3");
								return;
							}
							if (  dbres[2].recs[0].Agent != 999 || dbres[2].recs[0].Manager != 999  ){
								done(new Error("doc.Agent != 999 || doc.Manager != 999"));
								return;
							}

							for(var c=0; c<dbres.length; c++){
								if (  dbres[c].info.errors.length  ){
									done(dbres[c].info.errors);
									return;
								}
							}

							done();
						}
					});

				}
			});
		});
	});


	describe(".load()", function(){
		this.timeout(6000);

		it(".load() // prev doc", function(done){
			var doc = stand.doc.get("DocID");

			stand.doc = fom.create("DocDataModel");
			stand.doc.set("DocID", doc);

			stand.doc.load({
				"taskModel": fom._getModule("MovDataModel"),
				"callback": function(err){
					// Fi6ру47661, 28505, Анатолий +73519036679

					// ---------------------------------------------------------------
					if (err){
						done(err);
						return;
					}
					if (  stand.doc.get("DocID") != doc  ){
						done(new Error("doc.DocID != expected.DocID"));
						return;
					}
					if (  stand.doc.get("Sum1")  ){
						done(new Error("doc.Sum1"));
						return;
					}
					if (  stand.doc.get("Person") != "test_person"  ){
						done(new Error("doc.person != test_person"));
						return;
					}
					if (  !stand.doc.movs.length  ){
						done(new Error("!doc.movs.length"));
						return;
					}

					done();
				}
			});
		});
	});


	describe("doc / events", function(){
		this.timeout(6000);

		it("doc / events", function(){
			var doc = fom.create("DocDataModel");

			doc.set("DocID","РА5по12345");
			assert.equal(doc.get("DocType"), "ПоЗа");
			assert.equal(doc.get("Company"), "РА");

			doc.set("DocType","ЗРГа");
			assert.ok(Boolean(doc.get("DocID").match(/зг/g)));

			doc.set("Company","Ел");
			assert.ok(Boolean(doc.get("DocID").match(/Ел/g)));
		});
	});


	describe(".save() / .update()", function(){
		this.timeout(6000);

		it(".save() / .update()", function(done){
			stand.doc.set("DocType", "ЗРГа");
			stand.doc.set("Company","Ел");
			stand.doc.set("Manage",888);

			stand.doc.save({
				"callback": function(err){

					if (err){
						done(err);
						return;
					}

					db.dbquery({
						"query": [
							"SELECT DocType, Company, DocID FROM DOCS WHERE DocID = '"+stand.doc.get("DocID")+"' ",

							"SELECT pid" +
							" FROM Property " +
							" WHERE " +
								" pid = 0 " +
								" AND ExtClass = 'DOCS' " +
								" AND property IN ('Примечание','test','test2') " +
								" AND ExtID = '" + stand.doc.get("DocID") + "' ",

							"SELECT MMID, MMFlag, Doc FROM Movement WHERE Doc = '"+stand.doc.get("DocID")+"' "
						].join(";"),
						"callback": function(dbres){

							var doc = dbres[0].recs[0];
							var props = dbres[1].recs;
							var movs = dbres[2].recs;

							if (  doc.DocType != stand.doc.get("DocType")  ){
								done(new Error("doc.DocType != expected.DocType"));
								return;
							}

							if (  doc.Company != stand.doc.get("Company")  ){
								done(new Error("doc.Company != expected.Company"));
								return;
							}

							if (  !Boolean(stand.doc.get("DocID").match(/Ел/g))  ){
								done(new Error("doc.DocID.match(/Ел/g)"));
								return;
							}

							if (  !Boolean(doc.DocID.match(/Ел/g))  ){
								done(new Error("doc.DocID.match(/Ел/g)"));
								return;
							}

							if (  props.length != 9  ){
								done(new Error("movs.length != 9"));
								return;
							}

							if (  !movs.length  ){
								done(new Error("!movs.length"));
								return;
							}

							if (  !movs[0].Doc.match(/Ел/g)  ){
								done(new Error("!mov.Doc.match(/Ел/g)"));
								return;
							}

							done();

						}
					});

				}
			});
		});
	});

	after(function(done){
		var doc = stand.doc.get("DocID");
		if (!doc) return;
		db.dbquery({
			"query": [
				"DELETE FROM DOCS WHERE DocID = '" + doc + "' ",
				"DELETE FROM Movement WHERE Doc = '" + doc + "' ",
				"DELETE FROM Property " +
				" WHERE " +
					" ExtClass = 'DOCS' " +
					" AND ExtID = '" + doc + "' " +
					" OR pid IN (" +
					"SELECT MMID FROM Movement WHERE Doc = '" + doc + "' " +
				")"
			].join("; "),
			"callback": function(){
				done();
			}
		});
	});

});


// -----------------------------------------------------------------------------


describe.skip("utils", function(){

	var _utils = fom.create("utils");

	describe(".isBrowser()", function(){
		it(".isBrowser() === false", function(){
			assert.ok(_utils.isBrowser() === false);
		});
	});

	describe(".getType", function(){
		it(".getType({}) == object", function(){
			assert.equal(_utils.getType({}), "object");
		});
		it(".getType([]) == array", function(){
			assert.equal(_utils.getType([]), "array");
		});
		it(".getType(null) == null", function(){
			assert.equal(_utils.getType(null), "null");
		});
		it(".getType(new Date()) == date", function(){
			assert.equal(_utils.getType(new Date()), "date");
		});
		it(".getType(\"asd\") == string", function(){
			assert.equal(_utils.getType("asd"), "string");
		});
	});

	// TODO parseArg, getType, DBSecureStr, split, trim

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
					throw new Error("expected: " + exp + "; recieved: " + res.responseText);
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

	var gm = fom.create("GandsDataModel");

	describe(".load()", function(){
		it("gands.data.length > 0", function(done){
			gm.load({
				callback: function(){
					if (!gm.data.length){
						throw new Error("!gands.data.length");
					}
					if (!Object.keys(gm._indexData).length){
						throw new Error("!gands._indexData.length");
					}
					done();
				}
			})
		});
	});

	describe(".getParent()", function(){

		beforeEach(function(done) {
			if (gm.state){
				done();
				return;
			}
			gm.load({
				callback: function() {
					done();
				}
			});
		});

		it(".getParent(ТЦДК0000) / String", function(){
			var parent = gm.getParent("ТЦДК0000");
			assert.equal(parent.GSID, "ТЦДК00");
		});

		it(".getParent(ТЦДК0000) / Object / gands-row", function(){
			var row = gm.dataReferences.get("ТЦДК0000");
			var parent = gm.getParent(row);
			assert.equal(parent.GSID, "ТЦДК00");
		});

	});

	describe(".getProperty()", function(){
		it(".getProperty(ГППО00ДИ, [материал]).length > 0", function(){
			assert.ok(gm.getProperty("ГППО00ДИ", ["материал"]).length > 0);
		});
		it(".getProperty(ГППО00ДИ).length > 0", function(){
			assert.ok(gm.getProperty("ГППО00ДИ").length > 0);
		});
		it(".getProperty(ГППО00ДИ, null, {onlyPriority: true}).length > 0", function(){
			assert.ok(gm.getProperty("ГППО00ДИ", null, {onlyPriority: true}).length > 0);
		});
	});

});


// -----------------------------------------------------------------------------


describe.skip("PrintUtils", function(){

	var PrintUtils = fom._getModule("PrintUtils");

	describe(".getFormats()", function () {
		it(".getFormats()", function () {
			assert.ok(
				Object.keys(PrintUtils.getFormats()).length > 0
			);
		});
	});

	describe(".getFormat", function () {
		it(".getFormat('ТСПоФмА3') == Object", function () {
			assert.equal(typeof PrintUtils.getFormat('ТСПоФмА3'), "object");
		});
	});

	describe(".formatFill", function(){
		it(".formatFill(A3, A4)", function(){
			assert.equal(PrintUtils.formatFill('ТСПоФмА3', 'ТСПоФмА4'), 2);
		});
		it(".formatFill(A3, A5)", function(){
			assert.equal(PrintUtils.formatFill('ТСПоФмА3', 'ТСПоФмА5'), 4);
		});
		it(".formatFill(A3, A6)", function(){
			assert.equal(PrintUtils.formatFill('ТСПоФмА3', 'ТСПоФмА6'), 8);
		});
	});

});


// -----------------------------------------------------------------------------


describe("Calc", function(){

	var gands = fom.create("GandsDataModel");

	describe("CalcPrintDefault", function(){
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
		var cpd = fom.create("CalcPrintDefault");

		it("amount: 1000, salePrice: 0, ПЗРАЛАЛ1 == 1440", function(){
			var sum = cpd.calc({
				"amount": 1000,
				"GSID": "ПЗРАЛАЛ1",
				"salePrice": false
			});
			assert.equal(sum.sum, 1440);
		});
		it("amount: 1000, salePrice: 0, ПЗРАЛАЛ1 == 765", function(){
			var sum = cpd.calc({
				"amount": 500,
				"GSID": "ПЗРАЛАЛ1",
				"salePrice": false
			});
			assert.equal(sum.sum, 765);
		});
	});

	describe("CalcPrintDigital", function(){

		var cpd = fom.create("CalcPrintDigital");
		it("A4 / 4+4 / ТЦБуОф9ж / sum == 45832.5", function(){
			var sum = cpd.calc({
				amount: 1000,
				material: "ТЦБуОф9ж",
				format: "ТСПоФмА4",
				colorCode: "4+4"
			});
			assert.equal(sum, 45832.5);
		});
		it("A4 / 4+0 / ТЦБуОф9ж / sum == 23332.5 ", function(){
			var sum = cpd.calc({
				amount: 1000,
				material: "ТЦБуОф9ж",
				format: "ТСПоФмА4",
				colorCode: "4+0"
			});
			assert.equal(sum, 23332.5);
		});
		it("A4 / 1+0 / ТЦБуОф9ж / sum == 17332.5 ", function(){
			var sum = cpd.calc({
				amount: 1000,
				material: "ТЦБуОф9ж",
				format: "ТСПоФмА4",
				colorCode: "1+0"
			});
			assert.equal(sum, 17332.5);
		});
		it("A4 / 1+0 / ТЦБуОф9ж / sum == 33832.5", function(){
			var sum = cpd.calc({
				amount: 1000,
				material: "ТЦБуОф9ж",
				format: "ТСПоФмА4",
				colorCode: "1+1"
			});
			assert.equal(sum, 33832.5);
		});
	});

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
		it("А4 / 4+0 / sum == 2968.67", function(){
			var sum = cpo.calc({
				"amount": 1000,
				"material": "ТЦБуМеТ0",
				"format": "ТСПоФмА4",
				"colorCode": "4+0"
			});
			assert.equal(sum, 2968.67);
		});
		it("А4 / 4+4 / sum == 3687.33", function(){
			var sum = cpo.calc({
				"amount": 1000,
				"material": "ТЦБуМеТ0",
				"format": "ТСПоФмА4",
				"colorCode": "4+4"
			});
			assert.equal(sum, 3687.33);
		});
		it("А5 / 4+4 / sum == 2558.67", function(){
			var sum = cpo.calc({
				"amount": 1000,
				"material": "ТЦБуМеТ0",
				"format": "ТСПоФмА5",
				"colorCode": "4+4"
			});
			assert.equal(sum, 2558.67);
		});
		it("А6 / 4+0 / sum == 1559.67", function(){
			var sum = cpo.calc({
				"amount": 1000,
				"material": "ТЦБуМеТ0",
				"format": "ТСПоФмА6",
				"colorCode": "4+0"
			});
			assert.equal(sum, 1559.67);
		});
	});

	describe("CalcPrintPostprocCreasing", function(){
		var cppc = fom.create("CalcPrintPostprocCreasing");
		it("amount = 1000 / value = 1", function(){
			var sum = cppc.calc({
				"amount": 1000,
				"value": 1,
				"salePrice": true
			});
			assert.equal(sum, 500);
		});
		it("amount = 1000 / value = 2", function(){
			var sum = cppc.calc({
				"amount": 1000,
				"value": 2,
				"salePrice": true
			});
			assert.equal(sum, 1000);
		});
		it("amount = 1000 / salePrice = 0 / value = 2", function(){
			var sum = cppc.calc({
				"amount": 1000,
				"value": 2,
				"salePrice": false
			});
			assert.equal(sum, 500);
		});
		it("amount = 1000 / value = 1 / discount = 25%", function(){
			var sum = cppc.calc({
				"amount": 1000,
				"value": 1,
				"discount": 25,
				"salePrice": true
			});
			assert.equal(sum, 375);
		});
	});

	describe("CalcPrintPostprocFolding", function(){
		var cFold = fom.create("CalcPrintPostprocFolding");
		it("Folding / amount = 1000 / value = 4", function(){
			var sum = cFold.calc({
				"amount": 1000,
				"paperDensity": 130,
				"value": 4,
				"salePrice": 1
			});
			assert.equal(sum, 340);
		});
		it("Folding / amount = 1000 / value = 4", function(){
			var sum = cFold.calc({
				"amount": 1000,
				"paperDensity": 200,
				"value": 4,
				"salePrice": 1
			});
			assert.equal(sum, 8000);
		});
	});

	describe("CalcPrintPostprocRounding", function(){
		var cppr = fom.create("CalcPrintPostprocRounding");
		it("amount = 1000", function(){
			var sum = cppr.calc({
				"amount": 1000,
				"salePrice": 1
			});
			assert.equal(sum, 350);
		});
		it("amount = 1000 / salePrice = 0", function(){
			var sum = cppr.calc({
				"amount": 1000,
				"salePrice": 0
			});
			assert.equal(sum, 200);
		});
	});

	describe("CalcPrintBrochure", function(){
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
		var cpb = fom.create("CalcPrintBrochure");
		var cpo = fom.create("CalcPrintOffset");
		var cpc = fom.create("CalcPrintCarton");
		var cppc = fom.create("CalcPrintPostprocCreasing");

		var brArg = {
			"format": "ТСПоФмА4", // GSID - формат продукции, например, для брошуры это может быть А4
			"amount": 300,
			"discount": 0,

			"inner": {
				"method": null, // opt
				"amount": 32,
				"colorCode": "4+4",
				"sum": 0, // +
				"material": "ТЦБуМеТ0",
				"postproc": []
			},

			"cover": {
				"method": null, // opt
				"colorCode": "4+4", // opt
				"amount": 1,
				"sum": 0,
				"material": "ТЦДК0000",
				"postproc": [
					{
						"type": "CREASING",
						"value": 2
					}
				]
			},

			"postproc": []
		};

		it("offset / А4 / 4+4 / ТЦБуМеТ0 / sum == 20238", function(){
			var sum = cpo.calc({
				"amount": brArg.amount * brArg.inner.amount,
				"material": brArg.inner.material,
				"format": brArg.format,
				"colorCode": brArg.cover.colorCode
			});
			assert.equal(sum, 20238);
		});
		it("carton / А4 / 4+4 / ТЦДК0000 / sum == 16907.2", function(){
			var sum = cpc.calc({
				"amount": brArg.amount,
				"material": brArg.cover.material,
				"format": brArg.format,
				"colorCode": brArg.cover.colorCode
			});
			assert.equal(sum, 16907.2);
		});
		it("creasing / amount = 1000 / value = 2 / sum = 300", function(){
			var sum = cppc.calc({
				"amount": brArg.amount,
				"value": 2,
				"salePrice": true
			});
			assert.equal(sum, 300);
		});


		it("offset / А4 / 4+4 / ТЦБуМеТ0 / discount = 25% / sum == 15178.5", function(){
			var sum = cpo.calc({
				"amount": brArg.amount * brArg.inner.amount,
				"material": brArg.inner.material,
				"format": brArg.format,
				"colorCode": brArg.cover.colorCode,
				"discount": 25
			});
			assert.equal(sum, 15178.5);
		});
		it("carton / А4 / 4+4 / ТЦДК0000 / discount = 25% / sum == 12680.4", function(){
			var sum = cpc.calc({
				"amount": brArg.amount,
				"material": brArg.cover.material,
				"format": brArg.format,
				"colorCode": brArg.cover.colorCode,
				"discount": 25
			});
			assert.equal(sum, 12680.4);
		});
		it("creasing / amount = 1000 / value = 2 / discount = 25%, sum = 225", function(){
			var sum = cppc.calc({
				"amount": brArg.amount,
				"value": 2,
				"salePrice": true,
				"discount": 25
			});
			assert.equal(sum, 225);
		});

		it("brochure / A4 / 4+4 / sum == " + (20238 + 16907.2 + 300), function(){
			assert.equal(
				cpb.calc(brArg),
				20238 + 16907.2 + 300
			);
		});
		it("brochure / A4 / 4+4 / discount = 25% / sum == " + (15178.5 + 12680.4 + 225), function(){
			brArg.discount = 25;
			assert.equal(
				cpb.calc(brArg),
				15178.5 + 12680.4 + 225
			);
		});
	});

	describe("CalcPrintPostprocLam", function(){
		var lam = fom.create("CalcPrintPostprocLaminating");

		it(".formatFill(A4) == 2", function(){
			var res = lam.formatFill("ТСПоФмА4");
			assert.equal(res, 2);
		});
		it(".formatFill(297,210) == 2", function(){
			var res = lam.formatFill({width:210, height:297});
			assert.equal(res, 2);
		});
		it(".formatFill(297,420) == 1", function(){
			var res = lam.formatFill({width:420, height:297});
			assert.equal(res, 1);
		});
		it(".formatFill(500,800) == 0", function(){
			var res = lam.formatFill({width:500, height:800});
			assert.equal(res, 0);
		});
		it(".calcAmount(1000, A4) == 500", function(){
			var res = lam.calcAmount({amount: 1000, format: "ТСПоФмА4"});
			assert.equal(res, 500);
		});
		it(".calcAmount(1000, [297,210]) == 500", function(){
			var res = lam.calcAmount({amount: 1000, format: {"width": 297, "height": 210}});
			assert.equal(res, 500);
		});

		it(".calc(amount=1000, side=1, salePrice=false) == 765", function(){
			var res = lam.calc({
				"amount": 1000,
				"side": 1,
				"format": "ТСПоФмА4",
				"salePrice": false
			});
			assert.equal(res, 765);
		});
		it(".calc(amount=1000, side=1, salePrice=true) == 2880", function(){
			var res = lam.calc({
				"amount": 1000,
				"side": 1,
				"format": "ТСПоФмА4",
				"salePrice": true
			});
			assert.equal(res, 1530);
		});
		it(".calc(amount=1000, side=2, salePrice=false) == 1790", function(){
			var res = lam.calc({
				"amount": 1000,
				"side": 2,
				"format": "ТСПоФмА4",
				"salePrice": false
			});
			assert.equal(res, 940);
		});
		it(".calc(amount=1000, side=1, salePrice=false, format=297x210) == 765", function(){
			var res = lam.calc({
				"amount": 1000,
				"side": 1,
				"format": {"width": 297, "height": 210},
				"salePrice": false
			});
			assert.equal(res, 765);
		});
		it(".calc(amount=1000, side=1, salePrice=false, format=800x800) == 0", function(){
			var res = lam.calc({
				"amount": 1000,
				"side": 1,
				"format": {"width": 800, "height": 800},
				"salePrice": false
			});
			assert.equal(res, 0);
		});

	});

});