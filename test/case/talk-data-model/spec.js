"use strict";

// TODO
describe("AgentsDataModel", function() {
	var fab;
	var db;
	var knex;

	before(function() {
		fab     = globTestUtils.getFabulaObjectModel();
		db      = fab.getDBInstance();

		return db.auth().then(function() {
			knex = db.getKnexInstance();
		});
	});

	describe(".load()", function() {
		var fabTalks;

		before(function() {
			fabTalks = fab.create("AgentsDataModel");

			fabTalks.postTalk({
				MMID: 1002,
			});

			return fabAgents.load()
		});

		it("Длина data не равно нулю", function() {
			// TODO
		});
	});

});