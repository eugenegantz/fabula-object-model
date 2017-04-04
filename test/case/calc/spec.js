describe.only("Calc", function() {
	var testGSRows = [{
		"ID": "",
		"Sort": 0,
		"Sort4": 0,
		"GSID": "_1_2_3_4",
		"GSID4": "",
		"Tick": 0,
		"GSCOP": "",
		"GSKindName": "TEST_KIND_NAME",
		"GSName": "TEST_GS_NAME",
		"GSCodeNumber": "",
		"GSUnit": "шт.",
		"GSCostSale": 150,
		"GSCost": 100,
		"GSStock": 0,
		"CheckStock": 0,
		"ExtID": "",
		"ImportName": "",
		"FirmDefault": "",
		"GSGraf": 0,
		"DateNew": "",
		"UserNew": "",
		"DateEdit": "",
		"UserEdit": "",
		"gandsExtRef": [
			{
				"GEIDC": 0,
				"GSExType": "Цена продажи",
				"GSExID": "_1_2_3_4",
				"GSExSort": "1000",
				"GSExExtID": "",
				"GSExName": "",
				"GSExNum": "5000",
				"GSExFlag": "",
				"GSExAttr1": "",
				"GSExAttr2": "",
				"Tick": ""
			},
			{
				"GEIDC": 0,
				"GSExType": "Цена продажи",
				"GSExID": "_1_2_3_4",
				"GSExSort": "10000",
				"GSExExtID": "",
				"GSExName": "",
				"GSExNum": "50000",
				"GSExFlag": "",
				"GSExAttr1": "",
				"GSExAttr2": "",
				"Tick": ""
			},
			{
				"GEIDC": 0,
				"GSExType": "Цена покупки",
				"GSExID": "_1_2_3_4",
				"GSExSort": "800",
				"GSExExtID": "",
				"GSExName": "",
				"GSExNum": "4000",
				"GSExFlag": "",
				"GSExAttr1": "",
				"GSExAttr2": "",
				"Tick": ""
			},
			{
				"GEIDC": 0,
				"GSExType": "Цена продажи",
				"GSExID": "_1_2_3_4",
				"GSExSort": "8000",
				"GSExExtID": "",
				"GSExName": "",
				"GSExNum": "40000",
				"GSExFlag": "",
				"GSExAttr1": "",
				"GSExAttr2": "",
				"Tick": ""
			}
		],
		"gandsPropertiesRef": [
			{ "pid": "", "extID": "", "property": "", "value": "" }
		]
	}];

	var FabulaObjectModel = require(__root);

	var fom = FabulaObjectModel
		.prototype
		.getInstance({
			"dburl": "http://127.0.0.1:9000/db?",
			"dbname": "well.demo",
			"dbsrc": "main"
		});

	var gands = fom.create("GandsDataModel");

	describe("CalcPrintDefault", function() {
		beforeEach(function(done) {
			if (gands.state) {
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

		describe(".calcByApprox()", function() {
			it("amount: 1000, salePrice: 0, ПЗРАЛАЛ1 == 1440", function() {
				var sum = cpd.calc({
					"amount": 1000,
					"GSID": "ПЗРАЛАЛ1",
					"salePrice": false
				});
				assert.equal(sum.sum, 1440);
			});

			it("amount: 1000, salePrice: 0, ПЗРАЛАЛ1 == 765", function() {
				var sum = cpd.calc({
					"amount": 500,
					"GSID": "ПЗРАЛАЛ1",
					"salePrice": false
				});
				assert.equal(sum.sum, 765);
			});
		});
	});

	describe.skip("CalcPrintDigital", function() {
		// TODO "CalcPrintDigital"
		var cpd = fom.create("CalcPrintDigital");
		it("A4 / 4+4 / ТЦБуОф9ж / sum == 45832.5", function() {
			var sum = cpd.calc({
				amount: 1000,
				material: "ТЦБуОф9ж",
				format: "ТСПоФмА4",
				colorCode: "4+4"
			});
			assert.equal(sum, 45832.5);
		});
		it("A4 / 4+0 / ТЦБуОф9ж / sum == 23332.5 ", function() {
			var sum = cpd.calc({
				amount: 1000,
				material: "ТЦБуОф9ж",
				format: "ТСПоФмА4",
				colorCode: "4+0"
			});
			assert.equal(sum, 23332.5);
		});
		it("A4 / 1+0 / ТЦБуОф9ж / sum == 17332.5 ", function() {
			var sum = cpd.calc({
				amount: 1000,
				material: "ТЦБуОф9ж",
				format: "ТСПоФмА4",
				colorCode: "1+0"
			});
			assert.equal(sum, 17332.5);
		});
		it("A4 / 1+0 / ТЦБуОф9ж / sum == 33832.5", function() {
			var sum = cpd.calc({
				amount: 1000,
				material: "ТЦБуОф9ж",
				format: "ТСПоФмА4",
				colorCode: "1+1"
			});
			assert.equal(sum, 33832.5);
		});
	});

	describe.skip("CalcPrintOffset", function() {
		// TODO "CalcPrintOffset"
		beforeEach(function(done) {
			if (gands.state) {
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
		it("А4 / 4+0 / sum == 2968.67", function() {
			var sum = cpo.calc({
				"amount": 1000,
				"material": "ТЦБуМеТ0",
				"format": "ТСПоФмА4",
				"colorCode": "4+0"
			});
			assert.equal(sum, 2968.67);
		});
		it("А4 / 4+4 / sum == 3687.33", function() {
			var sum = cpo.calc({
				"amount": 1000,
				"material": "ТЦБуМеТ0",
				"format": "ТСПоФмА4",
				"colorCode": "4+4"
			});
			assert.equal(sum, 3687.33);
		});
		it("А5 / 4+4 / sum == 2558.67", function() {
			var sum = cpo.calc({
				"amount": 1000,
				"material": "ТЦБуМеТ0",
				"format": "ТСПоФмА5",
				"colorCode": "4+4"
			});
			assert.equal(sum, 2558.67);
		});
		it("А6 / 4+0 / sum == 1559.67", function() {
			var sum = cpo.calc({
				"amount": 1000,
				"material": "ТЦБуМеТ0",
				"format": "ТСПоФмА6",
				"colorCode": "4+0"
			});
			assert.equal(sum, 1559.67);
		});
	});

	describe.skip("CalcPrintPostprocCreasing", function() {
		// TODO CalcPrintPostprocCreasing
		var cppc = fom.create("CalcPrintPostprocCreasing");
		it("amount = 1000 / value = 1", function() {
			var sum = cppc.calc({
				"amount": 1000,
				"value": 1,
				"salePrice": true
			});
			assert.equal(sum, 500);
		});
		it("amount = 1000 / value = 2", function() {
			var sum = cppc.calc({
				"amount": 1000,
				"value": 2,
				"salePrice": true
			});
			assert.equal(sum, 1000);
		});
		it("amount = 1000 / salePrice = 0 / value = 2", function() {
			var sum = cppc.calc({
				"amount": 1000,
				"value": 2,
				"salePrice": false
			});
			assert.equal(sum, 500);
		});
		it("amount = 1000 / value = 1 / discount = 25%", function() {
			var sum = cppc.calc({
				"amount": 1000,
				"value": 1,
				"discount": 25,
				"salePrice": true
			});
			assert.equal(sum, 375);
		});
	});

	describe("CalcPrintPostprocFolding", function() {
		// TODO CalcPrintPostprocFolding
		var cFold = fom.create("CalcPrintPostprocFolding");
		it("Folding / amount = 1000 / value = 4", function() {
			var sum = cFold.calc({
				"amount": 1000,
				"paperDensity": 130,
				"value": 4,
				"salePrice": 1
			});
			assert.equal(sum, 1000);
		});
		it("Folding / amount = 1000 / value = 4", function() {
			var sum = cFold.calc({
				"amount": 1000,
				"paperDensity": 200,
				"value": 4,
				"salePrice": 1
			});
			assert.equal(sum, 8000);
		});
	});

	describe("CalcPrintPostprocRounding", function() {
		// TODO CalcPrintPostprocRounding
		var cppr = fom.create("CalcPrintPostprocRounding");
		it("amount = 1000", function() {
			var sum = cppr.calc({
				"amount": 1000,
				"salePrice": 1
			});
			assert.equal(sum, 350);
		});
		it("amount = 1000 / salePrice = 0", function() {
			var sum = cppr.calc({
				"amount": 1000,
				"salePrice": 0
			});
			assert.equal(sum, 200);
		});
	});

	describe.skip("CalcPrintBrochure", function() {
		// TODO CalcPrintBrochure
		beforeEach(function(done) {
			if (gands.state) {
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

		it("offset / А4 / 4+4 / ТЦБуМеТ0 / sum == 20238", function() {
			var sum = cpo.calc({
				"amount": brArg.amount * brArg.inner.amount,
				"material": brArg.inner.material,
				"format": brArg.format,
				"colorCode": brArg.cover.colorCode
			});
			assert.equal(sum, 20238);
		});
		it("carton / А4 / 4+4 / ТЦДК0000 / sum == 16907.2", function() {
			var sum = cpc.calc({
				"amount": brArg.amount,
				"material": brArg.cover.material,
				"format": brArg.format,
				"colorCode": brArg.cover.colorCode
			});
			assert.equal(sum, 16907.2);
		});
		it("creasing / amount = 1000 / value = 2 / sum = 300", function() {
			var sum = cppc.calc({
				"amount": brArg.amount,
				"value": 2,
				"salePrice": true
			});
			assert.equal(sum, 300);
		});


		it("offset / А4 / 4+4 / ТЦБуМеТ0 / discount = 25% / sum == 15178.5", function() {
			var sum = cpo.calc({
				"amount": brArg.amount * brArg.inner.amount,
				"material": brArg.inner.material,
				"format": brArg.format,
				"colorCode": brArg.cover.colorCode,
				"discount": 25
			});
			assert.equal(sum, 15178.5);
		});
		it("carton / А4 / 4+4 / ТЦДК0000 / discount = 25% / sum == 12680.4", function() {
			var sum = cpc.calc({
				"amount": brArg.amount,
				"material": brArg.cover.material,
				"format": brArg.format,
				"colorCode": brArg.cover.colorCode,
				"discount": 25
			});
			assert.equal(sum, 12680.4);
		});
		it("creasing / amount = 1000 / value = 2 / discount = 25%, sum = 225", function() {
			var sum = cppc.calc({
				"amount": brArg.amount,
				"value": 2,
				"salePrice": true,
				"discount": 25
			});
			assert.equal(sum, 225);
		});

		it("brochure / A4 / 4+4 / sum == " + (20238 + 16907.2 + 300), function() {
			assert.equal(
				cpb.calc(brArg),
				20238 + 16907.2 + 300
			);
		});
		it("brochure / A4 / 4+4 / discount = 25% / sum == " + (15178.5 + 12680.4 + 225), function() {
			brArg.discount = 25;
			assert.equal(
				cpb.calc(brArg),
				15178.5 + 12680.4 + 225
			);
		});
	});

	describe.skip("CalcPrintPostprocLam", function() {
		// TODO "CalcPrintPostprocLam"
		var lam = fom.create("CalcPrintPostprocLaminating");

		it(".formatFill(A4) == 2", function() {
			var res = lam.formatFill("ТСПоФмА4");
			assert.equal(res, 2);
		});
		it(".formatFill(297,210) == 2", function() {
			var res = lam.formatFill({ width: 210, height: 297 });
			assert.equal(res, 2);
		});
		it(".formatFill(297,420) == 1", function() {
			var res = lam.formatFill({ width: 420, height: 297 });
			assert.equal(res, 1);
		});
		it(".formatFill(500,800) == 0", function() {
			var res = lam.formatFill({ width: 500, height: 800 });
			assert.equal(res, 0);
		});
		it(".formatFill(90,50) == 24", function() {
			var res = lam.formatFill({ width: 90, height: 50 });
			assert.equal(res, 24);
		});
		it(".calcAmount(1000, A4) == 500", function() {
			var res = lam.calcAmount({ amount: 1000, format: "ТСПоФмА4" });
			assert.equal(res, 500);
		});
		it(".calcAmount(1000, [297,210]) == 500", function() {
			var res = lam.calcAmount({ amount: 1000, format: { "width": 297, "height": 210 } });
			assert.equal(res, 500);
		});
		it(".calcAmount(1000, [90,50]) == 42", function() {
			var res = lam.calcAmount({ amount: 1000, format: { "width": 90, "height": 50 } });
			assert.equal(res, 42);
		});

		it(".calc(amount=1000, side=1, salePrice=false) == 765", function() {
			var res = lam.calc({
				"amount": 1000,
				"side": 1,
				"format": "ТСПоФмА4",
				"salePrice": false
			});
			assert.equal(res, 765);
		});
		it(".calc(amount=1000, side=1, salePrice=true) == 1530", function() {
			var res = lam.calc({
				"amount": 1000,
				"side": 1,
				"format": "ТСПоФмА4",
				"salePrice": true
			});
			assert.equal(res, 1530);
		});
		it(".calc(amount=1000, side=2, salePrice=false) == 940", function() {
			var res = lam.calc({
				"amount": 1000,
				"side": 2,
				"format": "ТСПоФмА4",
				"salePrice": false
			});
			assert.equal(res, 940);
		});
		it(".calc(amount=1000, side=1, salePrice=false, format=297x210) == 765", function() {
			var res = lam.calc({
				"amount": 1000,
				"side": 1,
				"format": { "width": 297, "height": 210 },
				"salePrice": false
			});
			assert.equal(res, 765);
		});
		it(".calc(amount=1000, side=1, salePrice=false, format=800x800) == 0", function() {
			var res = lam.calc({
				"amount": 1000,
				"side": 1,
				"format": { "width": 800, "height": 800 },
				"salePrice": false
			});
			assert.equal(res, 0);
		});

	});

});