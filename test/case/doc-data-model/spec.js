describe.only("DocDataModel", function() {
	var fom;
	var stand;
	var db;
	var gands;
	var dbUtils = require("./../../../fabula-object-model/utils/dbUtils.js");

		// 2015/01/01 - 1 янв. 2015
	var timestamp = 1420056000000;
	var date = new Date(timestamp);

	var docIdRegExp = /^\D{2}\d{1}\D{2}\d{5}$/i;

	function mkSID() {
		return (Math.random() + '').slice(-10);
	}

	/**
	 * @arg.sid
	 * */
	function mkMov(arg) {
		var sid = arg.sid;
		var mov = fom.create("MovDataModel");

		if (!sid)
			throw new Error("!arg.sid");

		mov.set("mmFlag", "3");
		mov.set("amount", 999);
		mov.set("gsDate", date);
		mov.set("gs", "ГППО35");
		mov.set("gsSpec", sid);

		mov.addProperty({ value: 100, property: "mov" + sid });
		mov.addProperty({ value: 200, property: "mov" + sid });

		return mov;
	}


	/**
	 * @param {Object} arg
	 * @param {Number} arg.sid
	 * */
	function mkDoc(arg) {
		var sid = arg.sid;
		var doc = fom.create("DocDataModel");

		if (!sid)
			throw new Error("!arg.sid");

		doc.set("notice", sid);
		doc.set("agent", 999);
		doc.set("firmContract", 1);
		doc.set("regDate", date);
		doc.set("docType", "ПоУс");
		doc.set("company", "РА");

		doc.addProperty({ value: 100, property: "doc" + sid });
		doc.addProperty({ value: 200, property: "doc" + sid });

		var mov1        = mkMov({ "sid": sid });
		var mov11       = mkMov({ "sid": sid });
		var mov12       = mkMov({ "sid": sid });
		var mov2        = mkMov({ "sid": sid });
		var mov21       = mkMov({ "sid": sid });
		var mov22       = mkMov({ "sid": sid });

		mov1.addMov(mov11);
		mov1.addMov(mov12);
		mov2.addMov(mov21);
		mov2.addMov(mov22);

		doc.addMov(mov1);
		doc.addMov(mov2);

		mov21.setDocInstance(void 0);
		mov22.setDocInstance(void 0);
		mov21.setParentDocInstance(doc);
		mov22.setParentDocInstance(doc);

		return doc;
	}


	/**
	 * @param {Object} arg
	 * @param {Number} arg.sid
	 * */
	function clearDoc(arg) {
		var sid = arg.sid;

		if (!sid)
			throw new Error("!arg.sid");

		var query = ""
			+ "  DELETE FROM Talk WHERE mm IN (SELECT mmid FROM Movement WHERE gsSpec = '" + sid + "')"
			+ "; DELETE FROM Docs WHERE notice = '" + sid + "'"
			+ "; DELETE FROM Movement WHERE gsSpec = '" + sid + "'"
			+ "; DELETE FROM Property WHERE extClass = 'DOCS' AND pid = 0 AND property = 'doc" + sid + "'"
			+ "; DELETE FROM Property WHERE extClass = 'DOCS' AND property = 'mov" + sid + "'"
			+ "";

		return db.query({
			"query": query,
			"dbworker": " ",
			"dbcache": "test_clear_doc"
		});
	}


	before(function(done) {
		this.timeout(5000);

		fom = globTestUtils.getFabulaObjectModel();
		gands = fom.create("GandsDataModel");
		db = fom.create("DBModel");

		if (!gands.state) {
			gands.sql = 'SELECT * FROM gands';

			gands.load({
				callback: function() {
					done();
				}
			});

			return;
		}

		done();
	});


	describe(".getNewDocID()", function() {
		var doc,
			docId,
			checkDBRecs;

		var sid = mkSID();

		before(function() {
			doc = mkDoc({ "sid": sid });

			return doc.getNewDocID({
				"companyID": doc.get("company"),
				"docType": doc.get("docType")
			}).then(function(_docId) {
				docId = _docId;

			}).then(function() {
				return db.dbquery({
					"dbworker": " ",

					"dbcache": Math.random() + "",

					"query": "SELECT docId FROM DOCS WHERE docId = '" + docId + "'",
				});

			}).then(function(dbres) {
				checkDBRecs = dbres.recs;
			});
		});

		after(function() {
			this.timeout(6000);

			return clearDoc({ "sid": sid });
		});

		it("Длина кода == 10, соответствие паттерну", function() {
			assert.equal(checkDBRecs.length, 0);
			assert.equal(docId.length, 10);
			assert.ok(docIdRegExp.test(docId));
		});
	});


	describe(".insert()", function() {
		var doc;
		var dbRecsMovs;
		var dbRecsProps;
		var dbRecsDocs;
		var dbRecsTalks;

		var sid = mkSID();

		before(function() {
			this.timeout(6000);

			doc = mkDoc({ "sid": sid });

			return doc.getNewDocID({
				"companyID": doc.get("company"),
				"docType": doc.get("docType")
			}).then(function(docId) {
				doc.set("docId", docId);

				return doc.insert();

			}).then(function() {
				var _query = ""
					+ "SELECT docid"
					+ " FROM Docs"
					+ " WHERE"
					+   " notice = '" + sid + "'"
					+   " AND agent = '999'"
					+   " AND firmContract = 1";

				var query = ""
					+ _query

					+ "; SELECT [value], pid, extclass, extid"
					+ " FROM Property"
					+ " WHERE"
					+   " pid = 0"
					+   " AND property = 'doc" + sid + "'"
					+   " AND extClass = 'DOCS'"
					+   " AND extId IN (" + _query + ")"

					+ "; SELECT mmid, doc, doc1, parentdoc"
					+ " FROM Movement"
					+ " WHERE"
					+   " doc IN (" + _query + ")"

					+ "; SELECT mmid, doc, doc1, parentdoc"
					+ " FROM Movement"
					+ " WHERE"
					+   " parentDoc IN (" + _query + ")"

					+ "; SELECT"
					+ " talkId"
					+   ", dt"
					+   ", txt"
					+   ", agent"
					+   ", doc"
					+   ", part"
					+   ", key"
					+   ", mm"
					+ " FROM Talk"
					+ " WHERE"
					+   " doc IN (" + _query + ")";

				return db.dbquery({
					"dbworker": " ",

					"dbcache": Math.random() + "",

					"query": query
				});

			}).then(function(dbres) {
				dbRecsDocs      = dbres[0].recs;
				dbRecsProps     = dbres[1].recs;
				dbRecsMovs      = dbres[2].recs;
				dbRecsMovs2     = dbres[3].recs;
				dbRecsTalks     = dbres[4].recs;
			});
		});

		after(function() {
			this.timeout(6000);

			return clearDoc({ "sid": sid });
		});

		it("Заявка записана в БД", function() {
			assert.equal(dbRecsDocs.length, 1);
		});

		it("Записано 4 задачи, где doc = docid", function() {
			assert.equal(dbRecsMovs.length, 4);

			dbRecsMovs.forEach(function(row) {
				assert.equal(row.doc, doc.get("docId"));
				assert.equal(row.doc1, doc.get("docId"));
			});
		});

		it("Записано 2 задачи, где parentDoc = docid", function() {
			assert.equal(dbRecsMovs2.length, 2);

			dbRecsMovs2.forEach(function(row) {
				assert.equal(row.parentdoc, doc.get("docId"));
				assert.equal(row.doc1, doc.get("docId"));
			});
		});

		it("Записано два свойства заявки", function() {
			assert.equal(dbRecsProps.length, 2);
		});

		it("property.extid == docid", function() {
			dbRecsProps.forEach(function(row) {
				assert.equal(row.extclass, "DOCS");
				assert.equal(row.pid, 0);
				assert.equal(row.extid, doc.get("docId"));
			});
		});

		it("Записано 4-ре строки в talk", function() {
			assert.equal(dbRecsTalks.length, 6);
		});

		it("talk.doc == docId", function() {
			var mmTable = {};

			doc.getNestedMovs().forEach(function(mov) {
				mmTable[mov.get("mmid")] = true;
			});

			dbRecsTalks.forEach(function(tRow) {
				assert.equal(tRow.doc, doc.get("docId"));
				assert.ok(mmTable[tRow.mm]);
			});
		});
	});


	describe(".update()", function() {

		describe("Изменились только поля заявки", function() {
			this.timeout(6000);

			var doc,
				dbRecsMovs,
				dbRecsProps,
				dbRecsDocs,
				eventMovUpd = 0;

			var sid = mkSID();

			before(function() {
				this.timeout(6000);

				doc = mkDoc({ "sid": sid });

				return doc.getNewDocID({
					"companyID": doc.get("company"),
					"docType": doc.get("docType")
				}).then(function(docId) {
					doc.set("docId", docId);

					return doc.insert();

				}).then(function() {
					doc.set({
						"agent": 888
					});

					// Событие НЕ ДОЛЖНО выстрелить
					// Так проверяется незаписывание заявкой неизм. задач
					doc.getMov().forEach(function(mov) {
						mov.on("before-update", function() {
							eventMovUpd++;
						});
					});

					return doc.update();

				}).then(function() {
					return new Promise(function(resolve, reject) {
						var _query = ""
							+ "SELECT docId"
							+ " FROM Docs"
							+ " WHERE"
							+   "     notice = '" + sid + "'"
							+   " AND agent = '888'"
							+   " AND docId = '" + doc.get("docId") + "'"
							+   " AND company = '" + doc.get("company") + "'"
							+   " AND firmContract = 1";

						db.dbquery({
							"dbcache": Math.random() + "",

							"dbworker": " ",

							"query": ""
							+ _query

							+ "; SELECT [value]"
							+ " FROM Property"
							+ " WHERE"
							+   " pid = 0"
							+   " AND property = 'doc" + sid + "'"
							+   " AND extClass = 'DOCS'"
							+   " AND extId IN (" + _query + ")"

							+ "; SELECT mmId"
							+ " FROM Movement"
							+ " WHERE"
							+   " doc IN (" + _query + ")",

							"callback": function(dbres, err) {
								if (err = dbUtils.fetchErrStrFromRes(dbres))
									return reject(err);

								dbRecsDocs = dbres[0].recs;
								dbRecsProps = dbres[1].recs;
								dbRecsMovs = dbres[2].recs;

								resolve();
							}
						});
					});
				});
			});

			after(function() {
				this.timeout(6000);

				return clearDoc({ "sid": sid });
			});

			it("Записи обновились", function() {
				assert.equal(eventMovUpd, 0);
				assert.ok(!doc.getChanged().length);
				assert.ok(!doc.hasChangedFProperty());
				assert.equal(dbRecsDocs.length, 1);
				assert.equal(dbRecsProps.length, 2);
				assert.equal(dbRecsMovs.length, 2);
			});
		});

		describe("Изменились поля заявки и подч. задачи (поле doc)", function() {
			this.timeout(6000);

			var doc;
			var dbRecsMovs;
			var dbRecsProps;
			var dbRecsDocs;
			var eventMovUpd = 0;
			var movChangedFields = [];
			var sid = mkSID();

			before(function() {
				this.timeout(6000);

				doc = mkDoc({ "sid": sid });

				return doc.getNewDocID({
					"companyID": doc.get("company"),
					"docType": doc.get("docType")
				}).then(function(docId) {
					doc.set("docId", docId);

					return doc.insert();

				}).then(function() {
					return doc.load({ "dbworker": " " });

				}).then(function() {
					doc.set({
						"agent": 888,
						"company": "Fi"
					});

					// Событие ОБЯЗАНО выстрелить
					// - значит заявка записала изм. задачи (изменилось поле doc)
					doc.getMov().forEach(function(mov) {
						mov.on("before-update", function() {
							movChangedFields = mov.getChanged();
							eventMovUpd++;
						});
					});

					debugger;

					return doc.update();

				}).then(function() {
					var _query = ""
						+ " SELECT docId"
						+ " FROM Docs"
						+ " WHERE"
						+       "     notice = '" + sid + "'"
						+       " AND agent = '888'"
						+       " AND docId = '" + doc.get("docId") + "'"
						+       " AND company = '" + doc.get("company") + "'"
						+       " AND firmContract = 1";

					var query = ""
						+ _query

						+ "; SELECT [value]"
						+ " FROM Property"
						+ " WHERE"
						+   "     pid = 0"
						+   " AND property = 'doc" + sid + "'"
						+   " AND extClass = 'DOCS'"
						+   " AND extId IN (" + _query + ")"

						+ "; SELECT mmId"
						+ " FROM Movement"
						+ " WHERE"
						+   " doc IN (" + _query + ")";

					return db.query({
						"dbworker": " ",

						"dbcache": Math.random() + "",

						"query": query
					});

				}).then(function(dbres) {
					dbRecsDocs = dbres[0].recs;
					dbRecsProps = dbres[1].recs;
					dbRecsMovs = dbres[2].recs;
				});
			});

			after(function() {
				this.timeout(6000);

				return clearDoc({ "sid": sid });
			});

			it("" +
				"before-update для mov выстрелило 2 раза; " +
				"в задачах изм. поля doc, doc1; " +
				"в заявках после записи нет изм. полей; " +
				"после сохр. изм. отразились в БД",
				function() {
					assert.equal(eventMovUpd, 2);
					assert.deepEqual(movChangedFields.sort(), ["doc", "doc1"].sort());
					assert.ok(!doc.getChanged().length);
					assert.ok(!doc.hasChangedFProperty());
					assert.equal(dbRecsDocs.length, 1);
					assert.equal(dbRecsProps.length, 2);
					assert.equal(dbRecsMovs.length, 2);
				}
			);
		});

		describe("Изменились только подч. задачи", function() {
			var doc,
				eventMovUpd = 0,
				movChangedFields = [];

			var sid = mkSID();

			before(function() {
				this.timeout(6000);

				doc = mkDoc({ "sid": sid });

				return doc.getNewDocID({
					"companyID": doc.get("company"),
					"docType": doc.get("docType")
				}).then(function(docId) {
					doc.set("docId", docId);

					return doc.insert();

				}).then(function() {
					// Событие ОБЯЗАНО выстрелить
					// - значит заявка записала изм. задачи
					doc.getMov().forEach(function(mov, idx) {
						if (!idx)
							mov.set("mmFlag");

						mov.on("before-update", function() {
							movChangedFields = mov.getChanged();
							eventMovUpd++;
						});
					});

					return doc.update();
				});
			});

			after(function() {
				this.timeout(6000);

				return clearDoc({ "sid": sid });
			});

			it("" +
				"before-update для mov выстрелило 1 раз; " +
				"в задачах изм. поля mmflag; " +
				"в заявках после записи нет изм. полей",
				function() {
					assert.equal(eventMovUpd, 1);
					assert.deepEqual(movChangedFields, ["mmflag"]);
					assert.ok(!doc.getChanged().length);
					assert.ok(!doc.hasChangedFProperty());
				}
			);
		});

		describe("Удаление задачи", function() {
			var doc;
			var dbRecsMovs;
			var sid = mkSID();

			before(function() {
				this.timeout(6000);

				doc = mkDoc({ "sid": sid });

				return doc.save().then(function() {
					doc.delMov(doc.getMov()[0]);

					return doc.save();

				}).then(function() {
					var query = ""
						+ "SELECT mmId FROM Movement"
						+ " WHERE"
						+   " doc1 = '" + doc.get("docId") + "'";

					return db.query({
						"dbworker": " ",

						"dbcache": Math.random() + "",

						"query": query
					});

				}).then(function(dbres) {
					dbRecsMovs = dbres.recs;
				});
			});

			after(function() {
				this.timeout(6000);

				return clearDoc({ "sid": sid });
			});

			it("", function() {
				assert.equal(dbRecsMovs.length, 1);
			});
		});

	});


	describe(".save()", function() {

		describe("запись - insert", function() {
			var doc;
			var nextDocId;
			var eventDocBeforeInsert = false;
			var sid = mkSID();

			before(function() {
				this.timeout(6000);

				doc = mkDoc({ "sid": sid });

				doc.on("before-insert", function() {
					eventDocBeforeInsert = true;

					nextDocId = doc.get("docId");
				});

				return doc.save();
			});

			after(function() {
				this.timeout(6000);

				return clearDoc({ "sid": sid });
			});

			it(
				"заявка обрела новый docId; " +
				"docId появился до записи заявки; " +
				"выполнено событие before-insert",
				function() {
					assert.ok(!doc.getChanged().length);
					assert.ok(!doc.hasChangedFProperty());
					assert.ok(docIdRegExp.test(nextDocId));
					assert.ok(eventDocBeforeInsert);
				}
			);
		});

		describe("перезапись - update", function() {
			var doc;
			var eventDocBeforeUpdate = false;
			var sid = mkSID();

			before(function() {
				this.timeout(6000);

				doc = mkDoc({ "sid": sid });

				doc.on("before-update", function() {
					eventDocBeforeUpdate = true;
				});

				return doc.save().then(function() {
					return doc.save();
				});
			});

			after(function() {
				this.timeout(6000);

				return clearDoc({ "sid": sid });
			});

			it(
				"заявка обрела новый docId; " +
				"docId появился до записи заявки; " +
				"выполнено событие before-update",
				function() {
					assert.ok(!doc.getChanged().length);
					assert.ok(!doc.hasChangedFProperty());
					assert.ok(eventDocBeforeUpdate);
				}
			)
		});

	});


	describe(".load()", function() {
		var doc;
		var doc2;
		var fields;
		var sid = mkSID();

		before(function() {
			this.timeout(6000);

			doc = mkDoc({ "sid": sid });

			return doc.save().then(function() {
				doc2 = fom.create("DocDataModel");

				doc2.set("docId", doc.get("docId"));

				fields = doc.getKeys().filter(function(key) {
					if ("_" == key[0] || doc.get(key) instanceof Date)
						return false;

					return doc.get(key);
				});

				return doc2.load({
					"fields": fields,
					"dbworker": " "
				});
			});
		});

		after(function() {
			this.timeout(6000);

			return clearDoc({ "sid": sid });
		});

		it(
			"заявка содержит две задачи; " +
			"в заявке нет изм. полей или свойств; " +
			"в заявке все поля совпадают с оригинальным экземпляром",
			function() {
				assert.equal(doc2.getMov().length, 2);

				assert.ok(!doc2.getChanged().length);
				assert.ok(!doc2.hasChangedFProperty());

				fields.forEach(function(key) {
					assert.equal(doc2.get(key), doc.get(key), key);
				});
			}
		);
	});


	describe.skip(".save() / .insert()", function() {
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
						"dbworker": " ",

						"dbcache": Math.random() + "",

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


	describe.skip(".load()", function() {
		this.timeout(6000);

		it(".load() // prev doc", function(done) {
			var doc = stand.doc.get("DocID");

			stand.doc = fom.create("DocDataModel");
			stand.doc.set("DocID", doc);

			stand.doc.load({
				"dbworker": " ",

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


	describe.skip("doc / events", function() {
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


	describe.skip(".save() / .update()", function() {
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
						"dbworker": " ",

						"dbcache": Math.random() + "",

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

});