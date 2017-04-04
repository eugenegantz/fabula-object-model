describe("DocDataModel", function() {
	var FabulaObjectModel = require(__root);

	var fom = FabulaObjectModel
			.prototype
			.getInstance({
				"dburl": "http://127.0.0.1:9000/db?",
				"dbname": "well.demo",
				"dbsrc": "main"
			});

	var db = fom.create("DBModel");

	var stand = {
		"doc": fom.create("DocDataModel")
	};

	describe(".getNewDocID()", function() {
		this.timeout(6000);

		it(".getNewDocID()", function(done) {
			var doc = fom.create("DocDataModel");
			doc.getNewDocID({
				"companyID": "РА",
				"docType": "ПоУс",
				"callback": function(err, DocID) {
					if (err) {
						done(new Error(err));
						return;
					}
					if (!DocID) {
						done(new Error("!DocID"));
						return;
					}
					done();
				}
			});
		});
	});

	describe("childMovs", function() {
		this.timeout(6000);

		it("childMovs", function() {
			var doc = fom.create("DocDataModel");
			var mov;
			var count = 0;
			for (var c = 6; c < 19; c++) {
				mov = fom.create("MovDataModel");
				mov.set("MMFlag", c);
				mov.set("Sum", c * 100);
				mov.set("Sum2", Math.round(Math.random() * 1000));
				doc.addMov(mov);
				count++;
			}

			assert.equal(doc.movs.length, count);

			doc.deleteMov({ "Sum": 9 * 100, "MMFlag": 9 });
			doc.deleteMov({ "Sum": 8 * 100, "MMFlag": 8 });
			doc.deleteMov({ "Sum": 7 * 100, "MMFlag": 10 });

			assert.equal(doc.movs.length, count - 2);
			assert.equal(doc.getMov({ "Sum": 10 * 100, "MMFlag": 10 }).length, 1);
		});
	});

	describe(".save() / .insert()", function() {
		this.timeout(6000);

		it(".save(...) / .insert()", function(done) {
			stand.doc.set("Agent", 999);
			stand.doc.set("Manager", 999);
			stand.doc.set("Sum1", 0);
			stand.doc.set("Person", "test_person");
			stand.doc.set("Company", "РА");
			stand.doc.set("DocType", "ПоУС");

			var lorem_ipsum = "" +
				"Lorem Ipsum is simply dummy text of the printing and typesetting industry. " +
				"Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, " +
				"when an unknown printer took a galley of type and scrambled it to make a type specimen book. " +
				"It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. " +
				"It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, " +
				"and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.";

			stand.doc.addProperty(stand.doc.splitProperty({
				"uid": null,
				"extclass": null,
				"extid": null,
				"pid": null,
				"property": "Примечание",
				"value": lorem_ipsum
			}));
			stand.doc.addProperty({ "property": "test", "value": "test" });

			stand.doc.addMov(fom.create("MovDataModel"));
			stand.doc.addMov(fom.create("MovDataModel"));
			stand.doc.addMov(fom.create("MovDataModel"));

			stand.doc.save({
				"callback": function(err) {

					if (err) {
						done(err);
						return;
					}

					db.dbquery({
						"query": [
							"SELECT pid FROM Property WHERE ExtID = '" + stand.doc.get("DocID") + "' ",
							"SELECT MMID FROM Movement WHERE Doc = '" + stand.doc.get("DocID") + "' ",
							"SELECT Agent, Manager FROM DOCS WHERE DocID = '" + stand.doc.get("DocID") + "' "
						].join("; "),
						"callback": function(dbres) {
							if (dbres[0].recs.length != 9) {
								done(new Error("props.length != 9"));
								return;
							}
							if (dbres[1].recs.length != 3) {
								done("movs.length != 3");
								return;
							}
							if (dbres[2].recs[0].Agent != 999 || dbres[2].recs[0].Manager != 999) {
								done(new Error("doc.Agent != 999 || doc.Manager != 999"));
								return;
							}

							for (var c = 0; c < dbres.length; c++) {
								if (dbres[c].info.errors.length) {
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


	describe(".load()", function() {
		this.timeout(6000);

		it(".load() // prev doc", function(done) {
			var doc = stand.doc.get("DocID");

			stand.doc = fom.create("DocDataModel");
			stand.doc.set("DocID", doc);

			stand.doc.load({
				"taskModel": fom._getModule("MovDataModel"),
				"callback": function(err) {
					// Fi6ру47661, 28505, Анатолий +73519036679

					// ---------------------------------------------------------------
					if (err) {
						done(err);
						return;
					}
					if (stand.doc.get("DocID") != doc) {
						done(new Error("doc.DocID != expected.DocID"));
						return;
					}
					if (stand.doc.get("Sum1")) {
						done(new Error("doc.Sum1"));
						return;
					}
					if (stand.doc.get("Person") != "test_person") {
						done(new Error("doc.person != test_person"));
						return;
					}
					if (!stand.doc.movs.length) {
						done(new Error("!doc.movs.length"));
						return;
					}

					done();
				}
			});
		});
	});


	describe("doc / events", function() {
		this.timeout(6000);

		it("doc / events", function() {
			var doc = fom.create("DocDataModel");

			doc.set("DocID", "РА5по12345");
			assert.equal(doc.get("DocType"), "ОтПо");
			assert.equal(doc.get("Company"), "РА");

			doc.set("DocType", "ПоГа");
			assert.ok(Boolean(doc.get("DocID").match(/зг/g)));

			doc.set("Company", "Ел");
			assert.ok(Boolean(doc.get("DocID").match(/Ел/g)));
		});
	});


	describe(".save() / .update()", function() {
		this.timeout(6000);

		it(".save() / .update()", function(done) {
			stand.doc.set("DocType", "ПоГа");
			stand.doc.set("Company", "Ел");
			stand.doc.set("Manage", 888);

			stand.doc.save({
				"callback": function(err) {

					if (err) {
						done(err);
						return;
					}

					db.dbquery({
						"query": [
							"SELECT DocType, Company, DocID FROM DOCS WHERE DocID = '" + stand.doc.get("DocID") + "' ",

							"SELECT pid" +
							" FROM Property " +
							" WHERE " +
							" pid = 0 " +
							" AND ExtClass = 'DOCS' " +
							" AND property IN ('Примечание','test','test2') " +
							" AND ExtID = '" + stand.doc.get("DocID") + "' ",

							"SELECT MMID, MMFlag, Doc FROM Movement WHERE Doc = '" + stand.doc.get("DocID") + "' "
						].join(";"),
						"callback": function(dbres) {

							var doc = dbres[0].recs[0];
							var props = dbres[1].recs;
							var movs = dbres[2].recs;

							if (doc.DocType != stand.doc.get("DocType")) {
								done(new Error("doc.DocType != expected.DocType"));
								return;
							}

							if (doc.Company != stand.doc.get("Company")) {
								done(new Error("doc.Company != expected.Company"));
								return;
							}

							if (!Boolean(stand.doc.get("DocID").match(/Ел/g))) {
								done(new Error("doc.DocID.match(/Ел/g)"));
								return;
							}

							if (!Boolean(doc.DocID.match(/Ел/g))) {
								done(new Error("doc.DocID.match(/Ел/g)"));
								return;
							}

							if (props.length != 9) {
								done(new Error("movs.length != 9"));
								return;
							}

							if (!movs.length) {
								done(new Error("!movs.length"));
								return;
							}

							if (!movs[0].Doc.match(/Ел/g)) {
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

	after(function(done) {
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
			"callback": function() {
				done();
			}
		});
	});

});