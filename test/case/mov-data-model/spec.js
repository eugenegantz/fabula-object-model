describe("MovDataModel", function() {
	var fom, db;
	var stand = {
		MMID: null,
		mov: null
	};

	before(function() {
		fom = globTestUtils.getFabulaObjectModel();
		db = fom.create("DBModel");
	});

	describe(".save() / .insert()", function() {
		var self = stand;

		this.timeout(3000);

		it(".save(...) / .insert()", function(done) {
			stand.mov = fom.create("MovDataModel");
			stand.mov.set("Amount", 999);
			stand.mov.set("MMFlag", "9");

			stand.mov.addProperty([
				{ "property": "Макет исходящий", "value": "100" },
				{ "property": "Макет исходящий", "value": "200" }
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
				"callback": function(err) {

					var MMID = stand.MMID = self.mov.get("MMID");

					if (err) {
						done(err);
						return;
					}

					(function() {
						for (var c = 0; c < self.mov.childrenMovs.length; c++) {
							if (self.mov.childrenMovs[c].get("MMPID") != MMID) {
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
						"callback": function(dbres) {
							var mov = dbres[0].recs;
							var props = dbres[1].recs;
							var children = dbres[2].recs;

							if (props.length != 2) {
								done(new Error("props.length != 2"));
								return;
							}

							if (children.length != 2) {
								done(new Error("children.length != 2"));
								return;
							}

							if (mov[0].MMFlag != "9" || mov[0].Amount != 999) {
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


	describe(".load()", function() {

		it(".load() // prev mov", function(done) {
			var MMID = stand.mov.get("MMID");
			stand.mov = fom.create("MovDataModel");
			stand.mov.set("MMID", MMID);
			stand.mov.load({
				"callback": function(err) {
					if (err) {
						done(err);
						return;
					}
					done();
				}
			});
		});

		it(".load() // concrete fields", function(done) {
			// ------------------------------------------------------
			// Инициализация конкретных полей
			var mov2 = fom.create("MovDataModel");
			mov2.set("MMID", stand.mov.get("MMID"));
			mov2.load({
				"fields": "MMID,MMFlag",
				"callback": function(err, obj) {
					if (mov2.get("MMFlag") != "9" || obj.get("Sum")) {
						done(new Error("MMFlag != 9 || obj.get(Sum)"));
						return;
					}
					done();
				}
			});
		});

	});


	describe(".update()", function() {

		it(".save(...) / .update() / prev loaded", function(done) {
			stand.mov.set("MMFlag", "8");
			stand.mov.set("Amount", 888);
			stand.mov.set("Sum", 1200);

			stand.mov.removeChilldMov({ "Sum": 200 });
			stand.mov.addChildMov(fom.create("MovDataModel"));
			stand.mov.appendChildMov({
				"GSID": "РУПОДП02",
				"Sum": 300,
				"Amount": 999,
				"MMFlag": "7"
			});

			for (var c = 0; c < stand.mov._property.length; c++) {
				if (stand.mov._property[c].value == "100") {
					stand.mov._property[c].value = 900;
				}
				if (stand.mov._property[c].value == "200") {
					stand.mov._property[c] = null;
				}
			}

			stand.mov._property.push({ "property": "Макет исходящий", "value": "300" });

			stand.mov.save({
				"callback": function(err) {

					if (err) {
						done(err);
						return;
					}

					db.dbquery({
						"query": [
							"SELECT pid FROM Property WHERE value IN ('900','300') AND pid = " + stand.mov.get("MMID"),
							"SELECT MMID FROM Movement WHERE MMPID = " + stand.mov.get("MMID"),
							"SELECT MMID FROM Movement WHERE MMFlag = '8' AND [Amount] = 888 AND [Sum] = 1200 AND  MMID = " + stand.mov.get("MMID")
						].join("; "),
						"callback": function(dbres) {

							var props = dbres[0].recs;
							var movsChildren = dbres[1].recs;
							var movs = dbres[2].recs;

							if (movsChildren.length != 3) {
								done(new Error("movsChildren.length != 3"));
								return;
							}
							if (!movs.length) {
								done("!movs.length");
								return;
							}
							if (props.length != 2) {
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


	after(function(done) {
		if (stand.mov) {
			var MMID = stand.mov.get("MMID");
			db.dbquery({
				"query": [
					"DELETE FROM Movement WHERE MMID = " + MMID,
					"DELETE FROM Property WHERE pid = " + MMID,
					"DELETE FROM Movement WHERE MMPID = " + MMID,
					"DELETE FROM Property WHERE pid IN (SELECT MMID FROM Movement WHERE MMPID = " + MMID + ")"
				].join("; "),
				"callback": function() {
					done();
				}
			});
		}
	});

});