describe("InterfaceEvents", function() {
	var FabulaObjectModel = require(__root);

	var fom = FabulaObjectModel
		.prototype
		.getInstance({
			"dburl": "http://127.0.0.1:9000/db?",
			"dbname": "well.demo",
			"dbsrc": "main"
		});

	var st = false,
		InterfaceEvents = fom._getModule("InterfaceEvents"),
		ie = new InterfaceEvents();

	ie.on("ev", function() {
		st = true;
	});

	ie.trigger("ev");

	describe(".on(), .trigger()", function() {
		it(".on(ev), .trigger(ev)", function() {
			assert.ok(st);
		});
	});
});