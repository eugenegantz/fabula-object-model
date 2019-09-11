describe("DocDataModel", function() {
	var fom;
	var stand;
	var db;
	var gands;

		// 2015/01/01 - 1 янв. 2015
	var timestamp = 1420056000000;
	var date = new Date(timestamp);

	var docIdRegExp = /^\D{2}\d{1}\D{2}\d{5}$/i;

	debugger;

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
			+ "; DELETE FROM Talk WHERE doc IN (SELECT docid FROM Docs WHERE notice = '" + sid + "')"
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
			this.timeout(6000);

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
		var mmTable = {};
		var eventMovBeforeInsert = [];
		var eventMovAfterInsert = [];

		var sid = mkSID();

		before(function() {
			this.timeout(6000);

			doc = mkDoc({ "sid": sid });

			return doc.getNewDocID({
				"companyID": doc.get("company"),
				"docType": doc.get("docType")
			}).then(function(docId) {
				doc.set("docId", docId);

				doc.getNestedMovs().forEach(function(mov) {
					mov.on("before-insert", function() {
						eventMovBeforeInsert.push(mov.serializeFieldsObject());
					});
					mov.on("after-insert", function() {
						eventMovAfterInsert.push(mov.serializeFieldsObject())
					});
				});

				return doc.insert();

			}).then(function() {
				var _query = ""
					+ "SELECT [fields]"
					+ " FROM Docs"
					+ " WHERE"
					+   " notice = '" + sid + "'"
					+   " AND agent = '999'"
					+   " AND firmContract = 1";

				var docQuery = _query.replace("[fields]", "docid");

				var subQuery = _query.replace("[fields]", "docid");

				var query = ""
					+ docQuery

					+ "; SELECT [value], pid, extclass, extid"
					+ " FROM Property"
					+ " WHERE"
					+   "     extClass = 'DOCS'"
					+   " AND extId IN (" + subQuery + ")"

					+ "; SELECT mmid, mmpid, doc, doc1, parentdoc"
					+ " FROM Movement"
					+ " WHERE"
					+   " doc1 IN (" + subQuery + ")"

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
					+   " doc IN (" + subQuery + ")";

				return db.dbquery({
					"dbworker": " ",

					"dbcache": Math.random() + "",

					"query": query
				});

			}).then(function(dbres) {
				dbRecsDocs      = dbres[0].recs;
				dbRecsProps     = dbres[1].recs;
				dbRecsMovs      = dbres[2].recs;
				dbRecsTalks     = dbres[3].recs;

				doc.getNestedMovs().forEach(function(mov) {
					mmTable[mov.get("mmid")] = mov;
				});
			});
		});

		after(function() {
			this.timeout(6000);

			return clearDoc({ "sid": sid });
		});

		it("Заявка. 1 запись в БД", function() {
			assert.equal(dbRecsDocs.length, 1);
		});

		it("Заявка. Свойства. 2 записи", function() {
			var rows = [];

			dbRecsProps.forEach(function(row) {
				if (!+row.pid)
					rows.push(row);
			});

			assert.equal(rows.length, 2);
		});

		it("Задачи. 6 записей", function() {
			assert.equal(dbRecsMovs.length, 6);
		});

		it("Задачи. 2 записи, где parentDoc = docid", function() {
			var rows = [];

			dbRecsMovs.forEach(function(row) {
				if (row.parentdoc == doc.get("docId")) {
					rows.push(row);

					var mov = mmTable[row.mmid];

					assert.equal(row.parentdoc, doc.get("docId"));
					assert.equal(row.doc1, doc.get("docId"));
					assert.equal(row.doc || "", "");
					assert.equal(row.mmpid || "", mov.get("mmpid") || "");
				}
			});

			assert.equal(rows.length, 2);
		});

		it("Задачи. 4 записи, где doc = docid", function() {
			var rows = [];

			dbRecsMovs.forEach(function(row) {
				if (row.doc == doc.get("docId")) {
					rows.push(row);

					var mov = mmTable[row.mmid];

					assert.equal(row.parentdoc || "", "");
					assert.equal(row.doc1, doc.get("docId"));
					assert.equal(row.doc, doc.get("docId"));
					assert.equal(row.mmpid || "", mov.get("mmpid") || "");
				}
			});

			assert.equal(rows.length, 4);
		});

		it("Задачи. getParentMovInstance()", function() {
			dbRecsMovs.forEach(function(row) {
				var mov = mmTable[row.mmid];
				var pMov = mmTable[row.mmpid];

				if (row.mmpid)
					assert.equal(mov.getParentMovInstance(), pMov);
			});
		});

		it("Задачи. Свойства. 12 записей", function() {
			var rows = [];

			dbRecsProps.forEach(function(row) {
				if (+row.pid)
					rows.push(row);
			});

			assert.equal(rows.length, 12);
		});

		it('Задачи. Событие "before-insert" выполнилось 6 раз', function() {
			assert.equal(eventMovBeforeInsert.length, 6);
		});

		it('Задачи. Событие "before-insert". Не задано значение для поля "mmid"', function() {
			eventMovBeforeInsert.forEach(function(movFields) {
				assert.equal(!!movFields.mmid, false);
			});
		});

		it('Задачи. Событие "after-insert" выполнилось 6 раз', function() {
			assert.equal(eventMovAfterInsert.length, 6);
		});

		it('Задачи. Событие "after-insert". Установлено значение для поля "mmid"', function() {
			eventMovAfterInsert.forEach(function(movFields) {
				assert.equal(!!movFields.mmid, true);
			});
		});

		it("Свойства. property.extid == docid", function() {
			dbRecsProps.forEach(function(row) {
				assert.equal(row.extclass, "DOCS");
				assert.equal(row.extid, doc.get("docId"));
			});
		});

		it("Обсуждение. 6 записей", function() {
			assert.equal(dbRecsTalks.length, 6);
		});

		it("Обсуждение. talk.doc == docId", function() {
			dbRecsTalks.forEach(function(tRow) {
				assert.equal(tRow.doc, doc.get("docId"));
				assert.ok(mmTable[tRow.mm]);
			});
		});
	});


	describe(".update()", function() {

		describe("Изменились только поля заявки", function() {
			this.timeout(10000);

			var doc;
			var dbRecsMovs;
			var dbRecsProps;
			var dbRecsDocs;
			var eventMovBeforeUpdate    = 0;
			var eventMovBeforeInsert    = 0;
			var movsTable               = {};
			var sid                     = mkSID();

			before(function() {
				this.timeout(10000);

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
							eventMovBeforeUpdate++;
						});
					});

					doc.getMov().forEach(function(mov) {
						mov.on("before-insert", function() {
							eventMovBeforeInsert++;
						});
					});

					return doc.update();

				}).then(function() {
					var _query = ""
						+ "SELECT docId"
						+ " FROM Docs"
						+ " WHERE"
						+   "     notice = '" + sid + "'"
						+   " AND agent = '888'"
						+   " AND docId = '" + doc.get("docId") + "'"
						+   " AND company = '" + doc.get("company") + "'"
						+   " AND firmContract = 1";

					return db.dbquery({
						"dbcache": Math.random() + "",

						"dbworker": " ",

						"query": ""
						+ _query

						+ "; SELECT [value], extid, value, extclass, pid"
						+ " FROM Property"
						+ " WHERE"
						+   " extId IN (" + _query + ")"

						+ "; SELECT doc, doc1, parentdoc, mmpid, mmid, gsSpec"
						+ " FROM Movement"
						+ " WHERE"
						+   " doc IN (" + _query + ")"
						+   " OR parentDoc IN (" + _query + ")"

						+ "",
					});

				}).then(function(dbres) {
					dbRecsDocs = dbres[0].recs;
					dbRecsProps = dbres[1].recs;
					dbRecsMovs = dbres[2].recs;

					doc.getNestedMovs().forEach(function(mov) {
						movsTable[mov.get("mmid")] = mov;
					});
				});
			});

			after(function() {
				this.timeout(6000);

				return clearDoc({ "sid": sid });
			});

			it("Заявка. Поле agent обновилось в БД", function() {
				assert.equal(dbRecsDocs.length, 1);
			});

			it("Заявка. !doc.getChanged().length", function() {
				assert.ok(!doc.getChanged().length);
			});

			it("Заявка. !doc.hasChangedFProperty()", function() {
				assert.ok(!doc.hasChangedFProperty());
			});

			it("Заявка. 2 свойста", function() {
				var rows = [];

				dbRecsProps.forEach(function(row) {
					if (row.pid == 0)
						rows.push(row);
				});

				assert.equal(rows.length, 2);
			});

			it('Задачи. Событие "before-update" не выполнилось', function() {
				assert.equal(eventMovBeforeUpdate, 0);
			});

			it('Задачи. Событие "before-insert" не выполнилось', function() {
				assert.equal(eventMovBeforeInsert, 0);
			});

			it("Задачи. 6 записей", function() {
				assert.equal(dbRecsMovs.length, 6);
			});

			it("Задачи. 4 записи, где doc = docId", function() {
				var rows = [];

				dbRecsMovs.forEach(function(row) {
					if (
						   row.doc == doc.get("docId")
						&& row.doc1 == doc.get("docId")
					) {
						rows.push(row);
					}
				});

				assert.equal(rows.length, 4);
			});

			it("Задачи. 2 записи, где parentDoc = docId", function() {
				var rows = [];

				dbRecsMovs.forEach(function(row) {
					if (
						   row.parentdoc == doc.get("docId")
						&& row.doc1 == doc.get("docId")
					) {
						rows.push(row);
					}
				});

				assert.equal(rows.length, 2);
			});

			it("Задачи. mmpid в БД совпадает с mmpid внутри модели", function() {
				dbRecsMovs.forEach(function(row) {
					var mov = movsTable[row.mmid];

					assert.equal(mov.get("mmpid") || "", row.mmpid || "");
				});
			});

			it("Свойства. 14 записей", function() {
				assert.equal(dbRecsProps.length, 14);

				dbRecsProps.forEach(function(row) {
					assert.equal(row.extid, doc.get("docId"));
					assert.equal(row.extclass, "DOCS");
				});
			});
		});

		describe("Изменились поля заявки и подч. задачи (поле doc)", function() {
			this.timeout(6000);

			var doc;
			var dbRecsMovs;
			var dbRecsProps;
			var dbRecsDocs;
			var eventMovBeforeUpdate = 0;
			var eventMovAfterUpdate = 0;
			var movChangedFields = [];
			var sid = mkSID();
			var movsTable = {};

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
					doc.getNestedMovs().forEach(function(mov) {
						mov.on("before-update", function() {
							movChangedFields.push(mov.getChanged());
							eventMovBeforeUpdate++;
						});
						mov.on("after-update", function() {
							eventMovAfterUpdate++;
						});
					});

					return doc.update();

				}).then(function() {
					var _query = ""
						+ " SELECT [fields]"
						+ " FROM Docs"
						+ " WHERE"
						+       "     notice            = '" + sid + "'"
						+       " AND agent             = '888'"
						+       " AND docId             = '" + doc.get("docId") + "'"
						+       " AND company           = '" + doc.get("company") + "'"
						+       " AND firmContract      = 1";

					var query = ""
						+ _query.replace('[fields]', 'docid, company, agent')

						+ "; SELECT [value], pid, property, extid, extclass"
						+ " FROM Property"
						+ " WHERE"
						+   "     extClass = 'DOCS'"
						+   " AND extId IN (" + _query.replace('[fields]', 'docid') + ")"

						+ "; SELECT mmid, mmpid, doc, doc1, parentdoc"
						+ " FROM Movement"
						+ " WHERE"
						+   " doc1 IN (" + _query.replace('[fields]', 'docid') + ")";

					return db.query({
						"dbworker": " ",

						"dbcache": Math.random() + "",

						"query": query
					});

				}).then(function(dbres) {
					dbRecsDocs      = dbres[0].recs;
					dbRecsProps     = dbres[1].recs;
					dbRecsMovs      = dbres[2].recs;

					doc.getNestedMovs().forEach(function(mov) {
						movsTable[mov.get("mmId")] = mov;
					})
				});
			});

			after(function() {
				this.timeout(6000);

				return clearDoc({ "sid": sid });
			});

			it("Заявка. Поля docid и company обновилось в БД", function() {
				assert.equal(dbRecsDocs.length, 1);
				assert.equal(dbRecsDocs[0].company, "Fi");

				assert.ok(/Fi/ig.test(dbRecsDocs[0].docid));
			});

			it("Заявка. 2 свойства", function() {
				var rows = [];

				dbRecsProps.forEach(function(row) {
					if (row.pid == 0)
						rows.push(row);
				});

				assert.equal(rows.length, 2);
			});

			it("Заявка. !doc.getChanged().length", function() {
				assert.ok(!doc.getChanged().length);
			});

			it("Заявка. !doc.hasChangedFProperty()", function() {
				assert.ok(!doc.hasChangedFProperty());
			});

			it("Задачи. 6 записей", function() {
				assert.equal(dbRecsMovs.length, 6);
			});

			it("Задачи. Событие before-update выполнилось 6-ть раз", function() {
				assert.equal(eventMovBeforeUpdate, 6);
			});

			it("Задачи. Событие after-update выполнилось 6-ть раз", function() {
				assert.equal(eventMovAfterUpdate, 6);
			});

			it("Задачи. 12 свойств", function() {
				var rows = [];

				dbRecsProps.forEach(function(row) {
					if (row.pid)
						rows.push(row);
				});

				assert.equal(rows.length, 12);
			});

			it("Задачи. Изменились только необходимые поля", function() {
				var table = {
					"doc + doc1": 0,
					"doc1 + parentdoc": 0
				};

				movChangedFields.forEach(function(changed) {
					var key = changed.sort().join(" + ");

					if (!(key in table))
						table[key] = 0;

					table[key]++;
				});

				assert.equal(table["doc + doc1"], 4);
				assert.equal(table["doc1 + parentdoc"], 2);
			});

			it("Задачи. mov.get(mmpid) == dbMovRow.mmpid", function() {
				dbRecsMovs.forEach(function(row) {
					var mov = movsTable[row.mmid];

					assert.equal(mov.get("mmpid"), row.mmpid);
				});
			});

			it("Свойства. 14 записей", function() {
				assert.equal(dbRecsProps.length, 14);
			});

			it("Свойства. property.extid == doc.docid", function() {
				dbRecsProps.forEach(function(row) {
					assert.equal(row.extclass, "DOCS");
					assert.equal(row.extid, doc.get("docId"));
				});
			});
		});

		describe("Изменились только подч. задачи", function() {
			var doc;
			var dbRecsDocs;
			var dbRecsProps;
			var dbRecsMovs;
			var dbRecsTalks;
			var eventMovUpd         = 0;
			var movChangedFields    = [];
			var movsTable           = {};
			var sid                 = mkSID();

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
							movChangedFields.push(mov.getChanged());
							eventMovUpd++;
						});
					});

					return doc.update();

				}).then(function() {
					var _query = ""
						+ " SELECT [fields]"
						+ " FROM Docs"
						+ " WHERE"
						+   " notice = '" + sid + "'";

					var docQuery = _query.replace('[fields]', 'docid, company, agent');
					var subQuery = _query.replace('[fields]', 'docid');

					var query = ""
						+ docQuery

						+ "; SELECT [value], pid, property, extid, extclass"
						+ " FROM Property"
						+ " WHERE"
						+   "     extClass = 'DOCS'"
						+   " AND extId IN (" + subQuery + ")"

						+ "; SELECT mmid, mmpid, doc, doc1, parentdoc"
						+ " FROM Movement"
						+ " WHERE"
						+   " doc1 IN (" + subQuery + ")"

						+ "; SELECT talkid, mm, doc, txt FROM Talk WHERE doc IN (" + subQuery + ")"

						+ "";

					return db.query({
						"dbworker": " ",

						"dbcache": Math.random() + "",

						"query": query
					});

				}).then(function(dbres) {
					dbRecsDocs      = dbres[0].recs;
					dbRecsProps     = dbres[1].recs;
					dbRecsMovs      = dbres[2].recs;
					dbRecsTalks     = dbres[3].recs;

					doc.getNestedMovs().forEach(function(mov) {
						movsTable[mov.get("mmId")] = mov;
					});
				});
			});

			after(function() {
				this.timeout(6000);

				return clearDoc({ "sid": sid });
			});

			it("Заявка. 2 свойства", function() {
				var rows = [];

				dbRecsProps.forEach(function(row) {
					if (row.pid == 0)
						rows.push(row);
				});

				assert.equal(rows.length, 2);
			});

			it("Заявка. !doc.getChanged().length", function() {
				assert.ok(!doc.getChanged().length);
			});

			it("Заявка. !doc.hasChangedFProperty()", function() {
				assert.ok(!doc.hasChangedFProperty());
			});

			it("Задачи. 6 записей", function() {
				assert.equal(dbRecsMovs.length, 6);
			});

			it("Задачи. Событие before-update выполнилось 6-ть раз", function() {
				assert.equal(eventMovUpd, 1);
			});

			it("Задачи. 12 свойств", function() {
				var rows = [];

				dbRecsProps.forEach(function(row) {
					if (row.pid)
						rows.push(row);
				});

				assert.equal(rows.length, 12);
			});

			it("Задачи. Изменились только необходимые поля", function() {
				var table = {
					"mmflag": 0,
					"doc + doc1": 0,
					"doc1 + parentdoc": 0
				};

				movChangedFields.forEach(function(changed) {
					var key = changed.sort().join(" + ");

					table[key]++;
				});

				assert.equal(table["mmflag"], 1);
				assert.equal(table["doc + doc1"], 0);
				assert.equal(table["doc1 + parentdoc"], 0);
			});

			it("Задачи. mov.get(mmpid) == dbMovRow.mmpid", function() {
				dbRecsMovs.forEach(function(row) {
					var mov         = movsTable[row.mmid];
					var mmpid0      = mov.get("mmpid") || "";
					var mmpid1      = row.mmpid || "";

					assert.equal(mmpid0, mmpid1);
				});
			});

			it("Свойства. 14 записей", function() {
				assert.equal(dbRecsProps.length, 14);
			});

			it("Свойства. property.extid == doc.docid", function() {
				dbRecsProps.forEach(function(row) {
					assert.equal(row.extclass, "DOCS");
					assert.equal(row.extid, doc.get("docId"));
				});
			});

			it("Обсуждение. Дважды Отражено движение фазы", function() {
				var table = {};
				var mov = doc.getMov()[0];

				dbRecsTalks.forEach(function(row) {
					if (!(row.mm in table))
						table[row.mm] = 0;

					if (/фаза/ig.test(row.txt))
						table[row.mm]++;
				});

				assert.equal(table[mov.get("mmid")], 2);
			});
		});

		describe("Удаление задачи", function() {
			var doc;
			var dbRecsMovs;
			var dbRecsTalks;
			var deletedMov;
			var sid = mkSID();

			before(function() {
				this.timeout(6000);

				doc = mkDoc({ "sid": sid });

				return doc.save().then(function() {
					deletedMov = doc.getMov()[0];

					doc.delMov(deletedMov);

					return doc.save();

				}).then(function() {
					var query = ""
						+ "  SELECT mmId FROM Movement WHERE doc1 = '" + doc.get("docId") + "'"
						+ "; SELECT talkid, mm, doc, txt FROM Talk WHERE doc = '" + doc.get("docId") + "'"
						+ "";

					return db.query({
						"dbworker": " ",

						"dbcache": Math.random() + "",

						"query": query
					});

				}).then(function(dbres) {
					dbRecsMovs = dbres[0].recs;
					dbRecsTalks = dbres[1].recs;
				});
			});

			after(function() {
				this.timeout(6000);

				return clearDoc({ "sid": sid });
			});

			it("Задачи. Осталось 3 записи", function() {
				assert.equal(dbRecsMovs.length, 3);
			});

			it("Обсуждение. 3 записи (6 задач, 3 удалено)", function() {
				assert.equal(dbRecsTalks.length, 3);
			});

			it("Обсуждение. Обсуждение удалено вместе с задачей", function() {
				var found = dbRecsTalks.some(function(row) {
					return row.mmid == deletedMov.get("mmid");
				});

				assert.ok(!found);
			});
		});

		describe("Перемещение задачи в другую ветку", function() {
			var doc;
			var dbRecsMovs;
			var dbRecsTalks;
			var movTable = {};
			var sid = mkSID();

			before(function() {
				this.timeout(6000);

				doc = mkDoc({ "sid": sid });

				return doc.save().then(function() {
					var mov1        = doc.getMov()[0];
					var mov11       = mov1.getMov()[0];
					var mov12       = mov1.getMov()[1];

					mov1.delMov(mov11);
					mov1.delMov(mov12);

					mov11.addMov(mov12);

					doc.addMov(mov11);

					mov11.setDocInstance(null);
					mov12.setDocInstance(null);
					mov11.setParentDocInstance(doc);
					mov12.setParentDocInstance(doc);

					/*
					-------------- Было --------------
						doc_root
						|
						+-- mov_1 (доход)
						|	|
						|	+-- mov_1_1 (доход)
						|	+-- mov_1_2 (доход)
						|
						+-- mov_2 (доход)
							|
							+-- mov_2_1 (расход)
							+-- mov_2_2 (расход)

					-------------- Стало --------------
						doc_root
						|
						+-- mov_1 (доход)
						|
						+-- mov_2 (доход)
						|	|
						|	+-- mov_2_1 (расход)
						|	+-- mov_2_2 (расход)
						|
						|
						+-- mov_1_1* (расход)
							|
							+-- *mov_1_2* (расход)
					*/

					return doc.save();

				}).then(function() {
					var query = ""
						+ "  SELECT mmid, mmpid, doc, doc1, parentdoc FROM Movement WHERE doc1 = '" + doc.get("docId") + "'"
						+ "; SELECT talkid, mm, doc, txt FROM Talk WHERE doc = '" + doc.get("docId") + "'"
						+ "";

					return db.query({
						"dbworker": " ",

						"dbcache": Math.random() + "",

						"query": query
					});

				}).then(function(dbres) {
					dbRecsMovs      = dbres[0].recs;
					dbRecsTalks     = dbres[1].recs;

					doc.getNestedMovs().forEach(function(mov) {
						movTable[mov.get("mmId")] = mov;
					});
				});
			});

			after(function() {
				this.timeout(6000);

				return clearDoc({ "sid": sid });
			});

			it("Задачи. 6 записей", function() {
				assert.equal(dbRecsMovs.length, 6);
			});

			it("Задачи. mov.get(mmpid) == dbRow.mmpid", function() {
				dbRecsMovs.forEach(function(row) {
					var mov = movTable[row.mmid];

					assert.equal(mov.get("mmpid") || "", row.mmpid || "");
				});
			});

			it("Задачи. 2 записи, где doc = docId", function() {
				var rows = [];

				dbRecsMovs.forEach(function(row) {
					if (row.doc == doc.get("docId")) {
						rows.push(row);

						assert.equal(row.doc, row.doc1);
						assert.equal(row.parentdoc || "", "");
					}
				});

				assert.equal(rows.length, 2);
			});

			it("Задачи. 4 записи, где parentDoc = docId", function() {
				var rows = [];

				dbRecsMovs.forEach(function(row) {
					if (row.parentdoc == doc.get("docId")) {
						rows.push(row);

						assert.equal(row.parentdoc, row.doc1);
						assert.equal(row.doc || "", "");
					}
				});

				assert.equal(rows.length, 4);
			});

			it("Обсуждение. Количество записей == количестов задач", function() {
				assert.equal(dbRecsTalks.length, dbRecsMovs.length);
			});
		});

	});


	describe(".load()", function() {
		var docInsert;
		var docLoad;
		var sid = mkSID();

		before(function() {
			this.timeout(6000);

			docInsert = mkDoc({ "sid": sid });

			return docInsert.save().then(function() {
				docLoad = fom.create("DocDataModel");

				docLoad.set("docId", docInsert.get("docId"));

				return docLoad.load({
					"dbworker": " "
				});
			});
		});

		after(function() {
			this.timeout(6000);

			return clearDoc({ "sid": sid });
		});

		it("Заявка. !docLoad.getChanged().length", function() {
			assert.ok(!docLoad.getChanged().length);
		});

		it("Заявка. !docLoad.hasChangedFProperty()", function() {
			assert.ok(!docLoad.hasChangedFProperty());
		});

		it("Заявка. свойства", function() {
			var props = docLoad.getFPropertyA();

			assert.equal(props.length, 2);

			props.forEach(function(prop) {
				assert.equal(prop.get("pid"), 0);
				assert.equal(prop.get("extid"), docLoad.get("docId"));
				assert.equal(prop.get("extClass"), "DOCS");
			});
		});

		it("Заявка. Поля совпадают с оригиналом", function() {
			docLoad.getKeys().forEach(function(key) {
				var value1 = docLoad.get(key) || "";
				var value2 = docInsert.get(key) || "";

				// после сохранения модель заявки не запрашивает новый id из базы
				// экономит 1 запрос
				if ("id" == key)
					return;

				assert.equal(value1, value2);
			})
		});

		it("Задачи. doc.getNestedMovs().length == 6", function() {
			assert.equal(docLoad.getNestedMovs().length, 6);
		});

		it("Задачи. doc.getMov().length == 2", function() {
			assert.equal(docLoad.getMov().length, 2);
		});

		it("Задачи. Свойства", function() {
			var movs = docLoad.getNestedMovs();

			movs.forEach(function(mov) {
				var props = mov.getFPropertyA();

				assert.equal(props.length, 2);

				props.forEach(function(prop) {
					assert.equal(prop.get("pid"), mov.get("mmId"));
					assert.equal(prop.get("extId"), docLoad.get("docId"));
					assert.equal(prop.get("extClass"), "DOCS");
				});
			});
		});

		it("Задачи. getParentMovInstance()", function () {
			var movs = docLoad.getNestedMovs();

			movs.forEach(function(mov) {
				var pid = mov.get("mmpid");

				if (pid)
					assert.equal(mov.getParentMovInstance().get("mmid"), pid);
			});
		});

	});


	describe(".rm()", function() {

		describe("Удаление через docId", function() {

			var docInsert;
			var docRemove;
			var dbRecsDocs;
			var dbRecsMovs;
			var dbRecsProps;
			var dbRecsTalks;
			var sid = mkSID();

			before(function() {
				this.timeout(6000);

				docInsert = mkDoc({ "sid": sid });

				return docInsert.save().then(function() {
					docRemove = fom.create("DocDataModel");

					docRemove.set("docId", docInsert.get("docId"));

					return docRemove.rm();

				}).then(function() {
					var docId = docInsert.get("docId");

					var query = ""
						+ "   SELECT mmId   FROM Movement WHERE doc1    = '" + docId + "'"
						+ " ; SELECT docId  FROM Docs     WHERE docId   = '" + docId + "'"
						+ " ; SELECT talkId FROM Talk     WHERE doc     = '" + docId + "'"
						+ " ; SELECT value  FROM Property WHERE extid   = '" + docId + "'"
						+ "";

					return db.query({
						"dbworker": " ",

						"dbcache": Math.random() + "",

						"query": query
					});

				}).then(function(dbRes) {
					dbRecsMovs      = dbRes[0].recs;
					dbRecsDocs      = dbRes[1].recs;
					dbRecsTalks     = dbRes[2].recs;
					dbRecsProps     = dbRes[3].recs;
				});
			});

			after(function() {
				this.timeout(6000);

				return clearDoc({ "sid": sid });
			});

			it("Задачи. Нет записей", function() {
				assert.equal(dbRecsMovs.length, 0);
			});

			it("Заявка. Нет записей", function() {
				assert.equal(dbRecsDocs.length, 0);
			});

			it("Обсуждение. Нет записей", function() {
				assert.equal(dbRecsTalks.length, 0);
			});

			it("Свойства. Нет записей", function() {
				assert.equal(dbRecsProps.length, 0);
			});

		})

	});


	describe("Проверка уникальности", function() {
		var c;
		var dbRecsDocs;
		var docs = new Array(10).fill(1);
		var sid = mkSID();

		before(function() {
			this.timeout(36000);

			return Promise.all(
				docs.map(function(a, c) {
					docs[c] = mkDoc({ "sid": sid });
					docs[c]._testUniqueId = Math.random().toString().replace("0.", "");

					return docs[c].save().catch(function(err) {
						console.log("test_case:", docs[c]._testUniqueId, err);

						return Promise.reject(err);
					});
				})
			).then(function() {
				var docIds = docs.map(function(doc) {
					return "'" + doc.get("docId") + "'";
				});

				var query = "SELECT docId FROM Docs WHERE docId IN (" + docIds + ")";

				return db.query({
					"dbworker": " ",

					"dbcache": Math.random() + "",

					"query": query
				});

			}).then(function(dbRes) {
				dbRecsDocs = dbRes.recs;
			});
		});

		after(function() {
			this.timeout(6000);

			return clearDoc({ "sid": sid });
		});

		it("10 уникальных записей без ошибок", function() {
			assert.equal(dbRecsDocs.length, 10);
		});

	});


	describe.skip("DocDataModel. Модель поля docId", function() {
		this.timeout(6000);

		// TODO
	});


	describe.skip("MovDataModel. Модель поля doc", function() {
		this.timeout(6000);

		// TODO
	});


	describe.skip("MovDataModel. Модель поля parentDoc", function() {
		this.timeout(6000);

		// TODO
	});


	describe.skip("MovDataModel. Модель поля doc1", function() {
		this.timeout(6000);

		// TODO
	});

});