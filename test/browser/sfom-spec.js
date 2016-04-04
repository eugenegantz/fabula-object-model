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