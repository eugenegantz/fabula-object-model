"use strict";

describe("FirmsDataModel", function() {
	var fab;

	before(function() {
		fab = globTestUtils.getFabulaObjectModel();
	});

	describe(".load()", function() {
		var fabFirms;

		before(function(d) {
			fabFirms = fab.create("FirmsDataModel");

			var isPromiseDone = false,
				isCallbackDone = false,

				done = function() {
					isCallbackDone && isPromiseDone && d();
				};

			fabFirms.load({
				callback: function(err, ctx) {
					if (err)
						throw new Error(err);

					if (ctx != fabFirms)
						throw new Error("ctx != fabFirms");

					isCallbackDone = true;

					done();
				}
			}).then(function() {
				isPromiseDone = true;

				done();
			});
		});

		it("Длина data не равно нулю, в строках присутствует свойство firmsPropertiesRef", function() {
			assert.ok(fabFirms.data.length);
			assert.ok(fabFirms.data[0].firmsPropertiesRef);
			assert.ok(Object.keys(fabFirms.dataRefByFirmId).length);
		});
	});

});