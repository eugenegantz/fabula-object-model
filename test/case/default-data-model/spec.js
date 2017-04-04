describe("DefaultDataModel", function() {
	var FabulaObjectModel = require(__root),

		fom = FabulaObjectModel
			.prototype
			.getInstance({
				"dburl": "http://127.0.0.1:9000/db?",
				"dbname": "well.demo",
				"dbsrc": "main"
			});

	var defDm = fom.create("DefaultDataModel");

	var eventTests = {
		"get:test-key": false,
		"set:test-key": false,
		"afterset:test-key": false,
		"onceset:test-key": false
	};

	describe(".set() + events", function() {
		it(".set(test-key,test-value)", function() {
			defDm.on(
				"set:test-key",
				function() {
					var e = arguments[1];
					var value = this.get("test-key");
					eventTests["set:test-key"] = e.type == "set:test-key" && !value && e.value == "test-value";
				}
			);

			defDm.on(
				"afterset:test-key",
				function() {
					var e = arguments[1];
					var value = this.get("test-key");
					eventTests["afterset:test-key"] = e.type == "afterset:test-key" && value == "test-value";
				}
			);

			defDm.once("set:test-key", function() {
				eventTests["onceset:test-key"] = eventTests["onceset:test-key"] == false;
			});

			defDm.set("test-key", "test-value");
			assert.ok(eventTests["set:test-key"]);
			assert.ok(eventTests["afterset:test-key"]);
			defDm.set("test-key", "test-value");
			assert.ok(eventTests["onceset:test-key"]);
		});
	});

	describe(".get() + events", function() {
		defDm.on("get:test-key", function() {
			eventTests["get:test-key"] = true;
		});

		it(".get(test-key)", function() {
			assert.equal(defDm.get("test-key"), "test-value");
			assert.ok(eventTests["get:test-key"]);
		});
	});

});