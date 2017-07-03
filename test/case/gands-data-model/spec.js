describe("GandsDataModel", function() {
	var fom,
		gm;

	before(function() {
		fom = globTestUtils.getFabulaObjectModel();
		gm = fom.create("GandsDataModel");
		gm.sql = "SELECT * FROM Gands";
	});

	describe(".load()", function() {
		this.timeout(5000);

		it("gands.data.length > 0", function(done) {
			gm.load({
				callback: function() {
					if (!gm.data.length) {
						throw new Error("!gands.data.length");
					}
					if (!Object.keys(gm._indexData).length) {
						throw new Error("!gands._indexData.length");
					}
					done();
				}
			})
		});
	});

	describe(".get()", function() {
		it(".get(materials:carton)", function() {
			var d = gm.get({ group: ["materials:carton"] });
			assert.ok(d.length > 0, ".length > 0");
		});
		it(".get(materials:carton:design)", function() {
			var d = gm.get({ group: ["materials:carton:design"] });
			assert.ok(d.length > 0, ".length > 0");
		});
		it(".get(products:print)", function() {
			var d = gm.get({ group: ["products:print"] });
			assert.ok(d.length > 0, ".length > 0");
		});
		it(".get(fom-config)", function() {
			var d = gm.get({ group: ["fom-config"] });
			assert.ok(d.length > 0, ".length > 0");
		});
	});

	describe("configRow Properties", function() {
		it(".length > 0", function() {
			var d = gm.get({ group: ["fom-config"] });
			assert.ok(d.length > 0, ".length > 0");
			assert.ok(Object.keys(d[0]).length > 0, "config.row.keys.length == 20");
		});
	});

	describe(".getParent()", function() {

		beforeEach(function(done) {
			if (gm.state) {
				done();
				return;
			}
			gm.load({
				callback: function() {
					done();
				}
			});
		});

		it(".getParent(ТСFM) / String", function() {
			var parent = gm.getParent("ТСFM");
			assert.equal(parent.GSID, "ТС");
		});

		it(".getParent(ТСFM) / Object / gands-row", function() {
			var row = gm.dataReferences.get("ТСFM");
			var parent = gm.getParent(row);
			assert.equal(parent.GSID, "ТС");
		});

	});

	describe(".getProperty()", function() {
		// TODO неправильный проверяются приоритетные свойства
		it(".getProperty(ГППО00ДИ, [материал]).length > 0", function() {
			assert.ok(gm.getProperty("ГППО35В1", ["материал"]).length > 0);
		});
		it(".getProperty(ГППО00ДИ).length > 0", function() {
			assert.ok(gm.getProperty("ГППО35В1").length > 0);
		});
		it(".getProperty(ГППО00ДИ, null, {onlyPriority: true}).length > 0", function() {
			assert.ok(gm.getProperty("ГППО35В1", null, { onlyPriority: true }).length > 0);
		});
	});

	describe.skip(".getExt", function() {
		describe('onlyPriority==false', function() {
			it(".getExt(ГППО35В1, {GSExType:Анкета, GSExName:Материал})", function() {
				var res = gm.getExt("ГППО35В1", { "GSExType": "Анкета", "GSExName": "Комментарий" });
				assert.equal(res.length, 1);
			});
		});

		describe('onlyPriority==true', function() {
			it(".getExt(ГППО35В1, {GSExType:Анкета, GSExName:Комментарий})", function() {
				var res = gm.getExt("ГППО35В1", {
					"GSExType": "Анкета",
					"GSExName": "Комментарий"
				}, { onlyPriority: true });
				assert.equal(res.length, 1);
			});
		});

		describe('onlyPriority==true', function() {
			it(".getExt(ГППО35В1, {GSExType:Прайс, GSExName:Агентство, GSExSort:1000})", function() {
				var res = gm.getExt(
					"ГППО35В1",
					{ "GSExType": "Прайс", "GSExName": "Агентство", "GSExSort": "1000" },
					{ onlyPriority: true }
				);
				assert.equal(res.length, 1);
			});
		});

		describe('onlyPriority==true', function() {
			it(".getExt(ГППО35В1, { GSExType: Прайс, GSExName: Агентство, GSExSort:10002})", function() {
				var res = gm.getExt(
					"ГППО35В1",
					{ "GSExType": "Прайс", "GSExName": "Агентство", "GSExSort": "10002" },
					{ onlyPriority: true }
				);
				assert.equal(res.length, 0);
			});
		});
	});
});