describe("InterfaceEvents", function() {
	var fom, st, InterfaceEvents, ie;

	before(function() {
		fom = globTestUtils.getFabulaObjectModel();
		st = false;
		InterfaceEvents = fom._getModule("InterfaceEvents");
		ie = new InterfaceEvents();
	});

	describe(".on(), .trigger()", function() {
		before(function() {
			ie.on("ev", function() {
				st = true;
			});

			ie.trigger("ev");
		});

		it(".on(ev), .trigger(ev)", function() {
			assert.ok(st);
		});
	});
});