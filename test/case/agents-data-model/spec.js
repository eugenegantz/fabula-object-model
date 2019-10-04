"use strict";

describe("AgentsDataModel", function() {
	var fab;

	before(function() {
		fab = globTestUtils.getFabulaObjectModel();
	});

	describe(".load()", function() {
		var fabAgents;

		before(function() {
			fabAgents = fab.create("AgentsDataModel");

			return fabAgents.load()
		});

		it("Длина data не равно нулю", function() {
			assert.ok(fabAgents.data.length);
		});
	});

});