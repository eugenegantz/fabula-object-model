var fom = FabulaObjectModel.prototype.getInstance({
	"url": "http://localhost:8100/fom-api/"
});


// -----------------------------------------------------------------------------


describe(
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


describe(
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

	describe("CalcPrintDigital", function(){
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
		it("А4 / 4+0 / sum == 8412.5", function(){
			var sum = cpo.calc({
				"amount": 1000,
				"material": "ТЦБуМеТ0",
				"format": "ТСПоФмА4",
				"colorCode": "4+0"
			});
			assert.equal(sum, 8412.5);
		});
		it("А4 / 4+4 / sum == 15912.5", function(){
			var sum = cpo.calc({
				"amount": 1000,
				"material": "ТЦБуМеТ0",
				"format": "ТСПоФмА4",
				"colorCode": "4+4"
			});
			assert.equal(sum, 15992.5);
		});
		it("А5 / 4+4 / sum == 10715", function(){
			var sum = cpo.calc({
				"amount": 1000,
				"material": "ТЦБуМеТ0",
				"format": "ТСПоФмА5",
				"colorCode": "4+4"
			});
			assert.equal(sum, 10715);
		});
		it("А6 / 4+0 / sum == 3968.5", function(){
			var sum = cpo.calc({
				"amount": 800,
				"material": "ТЦБуМеТ0",
				"format": "ТСПоФмА6",
				"colorCode": "4+0"
			});
			assert.equal(sum, 3968.5);
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

	describe.skip("CalcPrintPostprocFolding", function(){

	});

	describe("CalcPrintPostprocRounding", function(){
		var cppr = fom.create("CalcPrintPostprocRounding");
		it("amount = 1000", function(){
			var sum = cppr.calc({
				"amount": 1000,
				"salePrice": 1
			});
			assert.equal(sum, 250);
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

		var brArg = {
			"format": "ТСПоФмА4", // GSID - формат продукции, например, для брошуры это может быть А4
			"amount": 300,
			"discount": 0,

			"inner": {
				"method": null, // opt
				"amount": 32,
				"colorCode": "4+4",
				"sum": 0, // +
				"material": "ТЦБуОф9ж",
				"postproc": []
			},

			"cover": {
				"method": null, // opt
				"colorCode": "4+4", // opt
				"amount": 1,
				"sum": 0,
				"material": "ТЦБуД3Бж",
				"postproc": []
			},

			"postproc": []
		};

		it("offset / А4 / 4+4 / ТЦБуОф9ж / sum == 106765.5", function(){
			var sum = cpo.calc({
				"amount": brArg.amount * brArg.inner.amount,
				"material": brArg.inner.material,
				"format": brArg.format,
				"colorCode": brArg.cover.colorCode
			});
			assert.equal(sum, 106765.5);
		});
		it("carton / А4 / 4+4 / ТЦБуД3Бж / sum == 18160", function(){
			var sum = cpc.calc({
				"amount": brArg.amount,
				"material": brArg.cover.material,
				"format": brArg.format,
				"colorCode": brArg.cover.colorCode
			});
			assert.equal(sum, 18160);
		});


		it("offset / А4 / 4+4 / ТЦБуОф9ж / discount = 25% / sum == 80074.125", function(){
			var sum = cpo.calc({
				"amount": brArg.amount * brArg.inner.amount,
				"material": brArg.inner.material,
				"format": brArg.format,
				"colorCode": brArg.cover.colorCode,
				"discount": 25
			});
			assert.equal(sum, 80074.125);
		});
		it("carton / А4 / 4+4 / ТЦБуД3Бж / discount = 25% / sum == 13620", function(){
			var sum = cpc.calc({
				"amount": brArg.amount,
				"material": brArg.cover.material,
				"format": brArg.format,
				"colorCode": brArg.cover.colorCode,
				"discount": 25
			});
			assert.equal(sum, 13620);
		});


		it("brochure / A4 / 4+4 / sum == " + (106765.5 + 18160), function(){
			assert.equal(
				cpb.calc(brArg),
				106765.5 + 18160
			);
		});
		it("brochure / A4 / 4+4 / discount = 25% / sum == " + (80074.125 + 13620), function(){
			brArg.discount = 25;
			assert.equal(
				cpb.calc(brArg),
				80074.125 + 13620
			);
		});
	});

});