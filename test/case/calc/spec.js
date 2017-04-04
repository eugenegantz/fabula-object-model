describe("Calc", function() {
	var fom, gands;

	var priceMethod = {
		"pid": "",
		"extID": "_1_2_3_4",
		"property": "способ наценки",
		"value": "Фиксированная цена; Таблица"
	};

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
		"GSCostSale": 1.5,
		"GSCost": 1,
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
				"GSExNum": 5000,
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
				"GSExNum": 50000,
				"GSExFlag": "",
				"GSExAttr1": "",
				"GSExAttr2": "",
				"Tick": ""
			},
			{
				"GEIDC": 0,
				"GSExType": "Цена покупки",
				"GSExID": "_1_2_3_4",
				"GSExSort": "1000",
				"GSExExtID": "",
				"GSExName": "",
				"GSExNum": 4000,
				"GSExFlag": "",
				"GSExAttr1": "",
				"GSExAttr2": "",
				"Tick": ""
			},
			{
				"GEIDC": 0,
				"GSExType": "Цена покупки",
				"GSExID": "_1_2_3_4",
				"GSExSort": 10000,
				"GSExExtID": "",
				"GSExName": "",
				"GSExNum": "40000",
				"GSExFlag": "",
				"GSExAttr1": "",
				"GSExAttr2": "",
				"Tick": ""
			}
		],
		"gandsPropertiesRef": []
	}];

	before(function(done) {
		fom = globTestUtils.getFabulaObjectModel();
		gands = fom.create("GandsDataModel");

		if (gands.state) {
			done();

		} else {
			gands.load({
				callback: function() {
					done();
				}
			});
		}

		testGSRows.forEach((gsRow) => {
			gands.dataRefByGSID.set(gsRow.GSID, gsRow);
			gands.dataReferences.set(gsRow.GSID, gsRow);
		});
	});


	describe("CalcPrintDefault", function() {
		var cpd;

		before(function() {
			cpd = fom.create("CalcPrintDefault");
		});

		describe(".calcByPriceFields()", function() {

			describe("salePrice = false", function() {

				describe("amount: 1000", function() {
					it("Цена должна быть 1000", function() {
						var sum = cpd.calcByPriceFields({
							"amount": 1000,
							"GSID": "_1_2_3_4",
							"salePrice": false
						});

						assert.equal(sum.sum, 1000);
					});
				});

				describe("amount: 1500", function() {
					it("Цена должна быть 1500", function() {
						var sum = cpd.calcByPriceFields({
							"amount": 1500,
							"GSID": "_1_2_3_4",
							"salePrice": false
						});

						assert.equal(sum.sum, 1500);
					});
				});

			});

			describe("salePrice = true", function() {

				describe("amount: 1000", function() {
					it("Цена должна быть 1500", function() {
						var sum = cpd.calcByPriceFields({
							"amount": 1000,
							"GSID": "_1_2_3_4",
							"salePrice": true
						});

						assert.equal(sum.sum, 1500);
					});
				});

				describe("amount: 1500", function() {
					it("Цена должна быть 2250", function() {
						var sum = cpd.calcByPriceFields({
							"amount": 1500,
							"GSID": "_1_2_3_4",
							"salePrice": true
						});

						assert.equal(sum.sum, 2250);
					});
				});

			});

		});

		describe(".calcByApprox()", function() {

			describe("salePrice = false", function() {

				describe("amount: 1000", function() {
					it("Цена должна быть 4000", function() {
						var sum = cpd.calcByApprox({
							"amount": 1000,
							"GSID": "_1_2_3_4",
							"salePrice": false
						});

						assert.equal(sum.sum, 4000);
					});
				});

				describe("amount: 1500", function() {
					it("Цена должна быть 6000", function() {
						var sum = cpd.calcByApprox({
							"amount": 1500,
							"GSID": "_1_2_3_4",
							"salePrice": false
						});

						assert.equal(sum.sum, 6000);
					});
				});

				describe("amount: 2000", function() {
					it("Цена должна быть 8000", function() {
						var sum = cpd.calcByApprox({
							"amount": 2000,
							"GSID": "_1_2_3_4",
							"salePrice": false
						});

						assert.equal(sum.sum, 8000);
					});
				});

				describe("amount: 500", function() {
					it("Цена должна быть 2000", function() {
						var sum = cpd.calcByApprox({
							"amount": 500,
							"GSID": "_1_2_3_4",
							"salePrice": false
						});

						assert.equal(sum.sum, 2000);
					});
				});

			});

			describe("salePrice = true", function() {
				describe("amount: 1000", function() {
					it("Цена должна быть 5000", function() {
						var sum = cpd.calcByApprox({
							"amount": 1000,
							"GSID": "_1_2_3_4",
							"salePrice": true
						});

						assert.equal(sum.sum, 5000);
					});
				});

				describe("amount: 1500", function() {
					it("Цена должна быть 7500", function() {
						var sum = cpd.calcByApprox({
							"amount": 1500,
							"GSID": "_1_2_3_4",
							"salePrice": true
						});

						assert.equal(sum.sum, 7500);
					});
				});

				describe("amount: 2000", function() {
					it("Цена должна быть 10 000", function() {
						var sum = cpd.calcByApprox({
							"amount": 2000,
							"GSID": "_1_2_3_4",
							"salePrice": true
						});

						assert.equal(sum.sum, 10000);
					});
				});

				describe("amount: 500", function() {
					it("Цена должна быть 250", function() {
						var sum = cpd.calcByApprox({
							"amount": 500,
							"GSID": "_1_2_3_4",
							"salePrice": true
						});

						assert.equal(sum.sum, 2500);
					});
				});
			});
		});


		describe(".calc", function() {

			describe("amount: 1000, default strategy", function() {
				var sumApprox;

				before(function() {
					sumApprox = cpd.calcByApprox({
						"amount": 1000,
						"GSID": "_1_2_3_4",
						"salePrice": false
					});
				});

				it("По умолчанию, цена через аппроксимацию в приоритете", function() {
					var sum = cpd.calc({
						"amount": 1000,
						"GSID": "_1_2_3_4",
						"salePrice": false
					});

					assert.equal(sumApprox.sum, sum.sum);
					assert.equal(sumApprox.price, sum.price);
				});
			});

			describe("amount: 1000, Свойство: \"Способ наценки\", приоритет таблица", function() {
				var sumPriceFields;

				before(function() {
					gands.dataRefByGSID.get("_1_2_3_4").gandsPropertiesRef.push(priceMethod);

					sumPriceFields = cpd.calcByPriceFields({
						"amount": 1000,
						"GSID": "_1_2_3_4",
						"salePrice": false
					});
				});

				it("Сумма == 1000. Рассчитанная цена должна быть взята из поля \"Цена покупки\"", function() {
					var sum = cpd.calc({
						"amount": 1000,
						"GSID": "_1_2_3_4",
						"salePrice": false
					});

					assert.equal(sumPriceFields.sum, sum.sum);
					assert.equal(sumPriceFields.price, sum.price);
				});

			});

		});

	});

});