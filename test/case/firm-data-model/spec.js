"use strict";

describe("FirmDataModel", function() {
	var fab,
		db,
		dbUtils = require("./../../../fabula-object-model/utils/dbUtils.js"),

		// 2015/01/01 - 1 янв. 2015
		timestamp = 1420056000000,
		date = new Date(timestamp),

		sid = (Math.random() + '').slice(-10);

	function reset(cb) {

	}

	function mkFirm() {
		var firm = fab.create("FirmDataModel");

		firm.set({

		});
	}

	before(function(done) {
		this.timeout(5000);

		fab = globTestUtils.getFabulaObjectModel();
		db = fab.create("DBModel");

		done();
	});

	afterEach(function(done) {
		reset(done);
	});

	describe(".insert()", function() {

	});

	describe(".update()", function() {

	});

	describe(".save()", function() {

	});

	describe(".load()", function() {

	});

	describe(".exists()", function() {

	});

	describe(".rm()", function() {

	});

});