"use strict";

describe("MovDataModel", function() {
	var fom,
		db,
		mov,

		dbUtils = require("./../../../fabula-object-model/utils/dbUtils.js"),

		// 2015/01/01 - 1 янв. 2015
		timestamp = 1420056000000,
		date = new Date(timestamp),

		sid = (Math.random() + '').slice(-10);


	function clearDB(mov, cb) {
		db.dbquery({
			"query": ""
				+ "DELETE FROM talk WHERE mm IN (SELECT mmid FROM Movement WHERE gsSpec = '" + sid +  "')"
				+ ";"

				+ "DELETE FROM Property WHERE property = '" + sid + "'"
				+ ";"

				+ "DELETE FROM Movement WHERE gsSpec = '" + sid + "'",
			callback: function() {
				cb();
			}
		});
	}


	function mkMov() {
		var mov = fom.create("MovDataModel");

		mov.set("mmFlag", "3");
		mov.set("amount", 999);
		mov.set("gsDate", date);
		mov.set("gs", "ГППО35");
		mov.set("gsSpec", sid);

		mov.addProperty({ value: 100, property: sid });
		mov.addProperty({ value: 200, property: sid });

		return mov;
	}


	before(function() {
		fom = globTestUtils.getFabulaObjectModel();
		db = fom.create("DBModel");
	});


	describe(".addMov()", function() {
		var fields = {
			mmflag: "3",
			sum: 100
		};

		describe("instance of MovDataModel", function() {
			it("", function() {
				var mov = fom.create("MovDataModel"),
					cMov = fom.create("MovDataModel");

				cMov.set(fields);

				mov.addMov(cMov);

				cMov = mov._iMovCollectionMovs[0];

				assert.equal(mov._iMovCollectionMovs.length, 1);

				Object.keys(fields).forEach(function(key) {
					assert.equal(cMov.get(key, null, !1), fields[key]);
				});
			});
		});

		describe("instance of Object", function() {
			it("", function() {
				var mov = fom.create("MovDataModel");

				mov.addMov(fields);

				var cMov = mov._iMovCollectionMovs[0];

				assert.equal(mov._iMovCollectionMovs.length, 1);

				Object.keys(fields).forEach(function(key) {
					assert.equal(cMov.get(key, null, !1), fields[key]);
				});
			});
		});

		describe("instance of Array of Object", function() {
			it("", function() {
				var mov = fom.create("MovDataModel");

				mov.addMov([fields]);

				var cMov = mov._iMovCollectionMovs[0];

				assert.equal(mov._iMovCollectionMovs.length, 1);

				Object.keys(fields).forEach(function(key) {
					assert.equal(cMov.get(key, null, !1), fields[key]);
				});
			});
		});

		describe("instance of Array of MovDataModel", function() {
			it("", function() {
				var mov = fom.create("MovDataModel"),
					cMov = fom.create("MovDataModel");

				cMov.set(fields);

				mov.addMov([cMov]);

				cMov = mov._iMovCollectionMovs[0];

				assert.equal(mov._iMovCollectionMovs.length, 1);

				Object.keys(fields).forEach(function(key) {
					assert.equal(cMov.get(key, null, !1), fields[key]);
				});
			});
		})

	});


	describe(".getMov()", function() {

		describe("Без аргументов - все записи", function() {
			it("Длина массива подч. задач == 2", function() {
				var mov = mkMov();

				mov.addMov(mkMov());
				mov.addMov(mkMov());

				assert.equal(mov.getMov().length, 2);
			})
		});


		describe("Поля как аргумент", function() {
			it("Длина массива подч. задач == 1", function() {
				var mov = mkMov();

				mov.addMov(mkMov());
				mov.addMov(mkMov());

				mov._iMovCollectionMovs[0].set("mmflag", "4", null, !1);

				assert.equal(mov.getMov({ mmflag: "4" }).length, 1);
			});
		});


		describe("Экземпляр как аргумент", function() {
			it("Длина массива подч. задач == 1", function() {
				var mov = mkMov();

				mov.addMov(mkMov());
				mov.addMov(mkMov());

				assert.equal(mov.getMov(mov._iMovCollectionMovs[0]).length, 1);
			})
		});

	});


	describe(".delMov()", function() {

		describe("Без аргументов", function() {
			it("Из двух осталось две записи", function() {
				var mov = mkMov();

				mov.addMov(mkMov());
				mov.addMov(mkMov());

				assert.equal(mov.getMov().length, 2);

				mov.delMov();

				assert.equal(mov.getMov().length, 2);
			});
		});

		describe("Экземпляр как аргумент", function() {
			it("Из двух осталось одна запись", function() {
				var mov = mkMov();

				mov.addMov(mkMov());
				mov.addMov(mkMov());

				assert.equal(mov.getMov().length, 2);

				mov.delMov(mov.getMov()[0]);

				assert.equal(mov.getMov().length, 1);
			});
		});

		describe("Поля как аргумент", function() {
			it("Из двух осталась одна запись", function() {
				var mov = mkMov();

				mov.addMov(mkMov());
				mov.addMov(mkMov());

				mov.getMov()[0].set("mmflag", "4", null, !1);

				assert.equal(mov.getMov().length, 2);

				mov.delMov({ mmflag: "4" });

				assert.equal(mov.getMov().length, 1);
			});
		});

	});


	describe(".getNestedMovs()", function() {

		it("Получено 4 задачи", function() {
			var mov = mkMov();

			mov.addMov(mkMov());
			mov.addMov(mkMov());

			var cMov = mov.getMov()[0];

			cMov.addMov(mkMov());
			cMov.addMov(mkMov());

			assert.equal(mov.getNestedMovs().length, 4)
		});

	});


	describe(".getJSON()", function() {

		it("", function() {
			var mov = mkMov();

			mov.addMov(mkMov());
			mov.addMov(mkMov());

			var plainObj = mov.getJSON();

			assert.equal(plainObj.className, "MovDataModel");
			assert.equal(plainObj.movs.length, 2);
			assert.equal(plainObj.props.length, 2);
			assert.ok(!!plainObj.fields);

			Object.keys(plainObj.fields).forEach(function(key) {
				assert.ok(key.toLowerCase() in plainObj.fields);
			});
		})

	});


	describe("events", function() {

		describe("set:mmid", function() {
			it("Установит mmpid для всех подчиненных", function() {
				var mov = fom.create("MovDataModel");

				mov.addMov(mkMov());

				mov.set("mmid", sid);

				assert.equal(mov.getMov()[0].get("mmpid"), sid);
			})
		});

		describe.skip("set:doc", function() {
			// TODO
		});

		describe.skip("set:parentDoc", function() {
			// TODO
		});

		describe.skip("set:mmid", function() {
			// TODO
		});

	});


	describe("Методы работающие с БД", function() {

		afterEach(function(done) {
			this.timeout(5000);

			clearDB(mov, done);
		});

		describe(".insert()", function() {

			describe("single", function() {
				var dbMovs;

				before(function(done) {
					mov = mkMov();

					mov.insert().then(function() {
						db.dbquery({
							"query": [
								// гл. задача
								"SELECT mmid" +
								" FROM Movement" +
								" WHERE" +
								"   mmid = " + mov.get("mmId", null, false) +
								"   AND mmflag = '" + mov.get("mmFlag", null, false) + "'" +
								"   AND gs = '" + mov.get("gs", null, false) + "'" +
								"   AND gsSpec = '" + mov.get("gsSpec") + "'"
							].join("; "),
							"callback": function(dbres, err) {
								if (err = dbUtils.fetchErrStrFromRes(dbres))
									throw new Error(err);

								dbMovs = dbres.recs;

								done();
							}
						});
					}).catch(done);
				});

				it("Все записи успешно записались в БД", function() {
					assert.equal(dbMovs.length, 1);
				});
			});

			describe("+cMovs, +props", function() {
				var dbMovs,
					dbProps,
					dbCMovs,
					dbAllProps,
					dbTalk;

				before(function(done) {
					mov = mkMov();
					mov.addMov(mkMov());
					mov.addMov(mkMov());

					mov.addProperty(null);
					mov.addProperty({ value: "" });

					mov.insert().then(function() {
						db.dbquery({
							"query": ""
							// гл. задача
							+ "SELECT mmid"
							+ " FROM Movement"
							+ " WHERE"
							+ "     mmid = " + mov.get("mmId", null, false)
							+ "     AND mmflag = '" + mov.get("mmFlag", null, false) + "'"
							+ "     AND gs = '" + mov.get("gs", null, false) + "'"
							+ "     AND gsSpec = '" + mov.get("gsSpec") + "'"
							+ ";"

							// свойства гл. задачи
							+ "SELECT pid"
							+ " FROM Property "
							+ " WHERE"
							+ "     extClass = 'DOCS'"
							+ "     AND pid = " + mov.get("mmid")
							+ ";"

							// подч. задачи
							+ "SELECT mmid"
							+ " FROM Movement"
							+ " WHERE"
							+ "     mmpid = " + mov.get("mmid")
							+ ";"

							// все свойства
							+ "SELECT pid"
							+ " FROM Property"
							+ " WHERE"
							+ "     property = '" + sid + "'"
							+ ";"

							+ "SELECT mm"
							+ " FROM talk"
							+ " WHERE"
							+ "     txt LIKE '%" + mov.get("mmflag", null, false) + "%'"
							+ "     AND mm = " + mov.get("mmid", null, false),
							"callback": function(dbres, err) {
								if (err = dbUtils.fetchErrStrFromRes(dbres))
									throw new Error(err);

								dbMovs = dbres[0].recs;
								dbProps = dbres[1].recs;
								dbCMovs = dbres[2].recs;
								dbAllProps = dbres[3].recs;
								dbTalk = dbres[4].recs;

								done();
							}
						});
					}).catch(done);
				});

				it("Все записи успешно записались в БД", function() {
					assert.equal(dbMovs.length, 1);
					assert.equal(dbProps.length, 2);
					assert.equal(dbAllProps.length, 6);
					assert.equal(dbCMovs.length, 2);
					assert.equal(dbTalk.length, 1)
				});
			});

		});


		describe(".update()", function() {

			describe("upd: fields; upd: props; upd: cMovs", function() {

				this.timeout(5000);

				var cMov,
					prop,
					pMovRecs,
					pMovPropsRecs,
					cMovsRecs,
					pTalkRecs,
					eventBeforeUpd = 0;

				before(function(done) {
					mov = mkMov();
					mov.addMov(mkMov());
					mov.addMov(mkMov());

					mov.addProperty(null);
					mov.addProperty({ value: "" });

					mov.save().then(function() {
						mov.set("mmflag", "4");
						mov.set("sum", "100");

						prop = mov.getProperty()[0];

						cMov = mov.getMov()[0];
						cMov.set("mmflag", "4");
						cMov.set("sum", "100");

						prop.value = 1000;

						mov.getMov().forEach(function(mov) {
							mov.on("before-update", function() {
								eventBeforeUpd++;
							})
						});

						return mov.save();

					}).then(function() {
						db.dbquery({
							"query": ""
							// гл. задача
							+ "SELECT mmid"
							+ " FROM Movement"
							+ " WHERE"
							+ "     mmid = " + mov.get("mmId", null, false)
							+ "     AND mmflag = '" + mov.get("mmFlag", null, false) + "'"
							+ "     AND gs = '" + mov.get("gs", null, false) + "'"
							+ "     AND gsSpec = '" + mov.get("gsSpec") + "'"
							+ "     AND sum = " + mov.get("sum")
							+ ";"

							// свойства гл. задачи
							+ "SELECT pid"
							+ " FROM Property "
							+ " WHERE"
							+ "     extClass = 'DOCS'"
							+ "     AND pid = " + mov.get("mmid", null, false)
							+ "     AND property = '" + sid + "'"
							+ "     AND [value] = '" + prop.value + "'"
							+ ";"

							// подч. задачи
							+ "SELECT mmid"
							+ " FROM Movement"
							+ " WHERE"
							+ "     mmpid = " + mov.get("mmid", null, false)
							+ "     AND mmflag = '" + cMov.get("mmflag", null, false) + "'"
							+ "     AND sum = " + cMov.get("sum", null, false)

							+ ";"
							+ "SELECT mm"
							+ " FROM talk"
							+ " WHERE"
							+ "     txt LIKE '%" + mov.get("mmflag", null, false) + "%'"
							+ "     AND mm = " + mov.get("mmid", null, false),
							callback: function(dbres, err) {
								if (err = dbUtils.fetchErrStrFromRes(dbres))
									throw new Error(err);

								pMovRecs        = dbres[0].recs;
								pMovPropsRecs   = dbres[1].recs;
								cMovsRecs       = dbres[2].recs;
								pTalkRecs       = dbres[3].recs;

								done();
							}
						})
					}).catch(done)
				});

				it("Записи должны обновиться", function() {
					// обновилоась одно свойство, одна подчин. задача

					assert.equal(eventBeforeUpd, 1);
					assert.equal(pMovRecs.length, 1);
					assert.equal(cMovsRecs.length, 1);
					assert.equal(pMovPropsRecs.length, 1);
					assert.equal(pTalkRecs.length, 1);
				});

			});


			describe.skip("arg: { saveChildren: false }", function() {
				// TODO
			});

			describe.skip("arg: { updTalk: false }", function() {
				// TODO
			})

		});


		describe(".save()", function() {
			var beforeUpdate,
				beforeInsert;

			before(function(done) {
				mov = mkMov();

				mov.on("before-insert", function() {
					beforeInsert = true;
				});

				mov.on("before-update", function() {
					beforeUpdate = true;
				});

				mov
					.save()
					.then(mov.save.bind(mov))
					.then(function() {
						done();
					})
					.catch(done);
			});

			it("события before-insert, before-update отработали", function() {
				assert.ok(beforeUpdate);
				assert.ok(beforeInsert);
			})

		});


		describe(".rm()", function() {
			var pMovRecs,
				pMovTalkRecs;

			before(function(done) {
				mov = mkMov();
				mov.addMov(mkMov());
				mov.addMov(mkMov());

				mov.save().then(
					mov.rm.bind(mov)
				).then(function() {
					db.dbquery({
						"query": ""
						+ "SELECT mmid FROM Movement WHERE gsSpec = '" + sid + "'"
						+ ";"

						+ "SELECT mm FROM talk WHERE mm = " + mov.get("mmid", null, false),
						"callback": function(dbres, err) {
							if (err = dbUtils.fetchErrStrFromRes(dbres))
								throw new Error(err);

							pMovRecs = dbres[0].recs;
							pMovTalkRecs = dbres[1].recs;

							done();
						}
					})
				}).catch(done);
			});

			it("Все гл. и подч. задачи, записи в табл. talk должны быть удалены", function() {
				assert.equal(pMovRecs.length, 0);
				assert.equal(pMovTalkRecs.length, 0);
			});

		});


		describe(".load()", function() {
			var mmid, awaitedFld;

			before(function(done) {
				this.timeout(5000);

				var mov = mkMov();

				awaitedFld = mov.getJSON().fields;

				mov.addMov(mkMov());
				mov.save().then(function() {
					mmid = mov.get("mmid", null, false);

					done();
				}).catch(done);
			});

			after(function(done) {
				clearDB(null, done);
			});

			describe.skip("arg = { fields: ... }", function() {
				// TODO
			});

			describe("+cMov, +props", function() {
				var mov;

				before(function(done) {
					mov = fom.create("MovDataModel");
					mov.set("mmid", mmid);
					mov.load().then(function() {
						done();
					}).catch(done)
				});

				it("Успешная инициализация с аргументами по умолчанию", function() {
					var props = mov.getProperty(),
						cMovs = mov.getMov(),
						cMov = cMovs[0];

					assert.equal(cMovs.length, 1);
					assert.equal(props.length, 2);
					assert.equal(props[0].property, sid);

					Object.keys(awaitedFld).forEach(function(fld) {
						if (!awaitedFld[fld] || fld == "gsdate") return;

						assert.equal(mov.get(fld, null, !1), awaitedFld[fld]);
					});

					Object.keys(awaitedFld).forEach(function(fld) {
						if (!awaitedFld[fld] || fld == "gsdate") return;

						assert.equal(cMov.get(fld, null, !1), awaitedFld[fld]);
					});
				});
			});

		});

	});

});