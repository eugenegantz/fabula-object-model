describe("ObjectA", function() {

	var FabulaObjectModel = require(__root);

	var fom = FabulaObjectModel
		.prototype
		.getInstance({
			"dburl": "http://127.0.0.1:9000/db?",
			"dbname": "well.demo",
			"dbsrc": "main"
		});

	var ObjectA = fom._getModule("ObjectA");

	(function() {

		var obj = new ObjectA();

		describe(".set()", function() {
			it(".set(aBcD, 100)", function() {
				obj.set("aBcD", 100);
				assert.ok(true);
			});
		});

		describe(".get()", function() {
			it(".get(abcd) == 100", function() {
				assert.equal(obj.get("abcd"), 100);
			});
		});

	})();

	(function() {
		var arg = {
			"a": 1,
			"b": "2",
			"c": { "c": 3 },
			"d": [4]
		};

		var obj = new ObjectA(arg);

		describe(".getLength()", function() {
			it(".getLength() == 4", function() {
				assert.equal(obj.getLength(), 4);
			});
		});

		describe("remove(), .getLength()", function() {
			it("remove(A), .getLength() == 3", function() {
				obj.remove("A");
				assert.equal(obj.getLength(), 3, "remove");
			});
		});

		describe(".has()", function() {
			it(".has(B) == true", function() {
				assert.ok(
					obj.has("B"),
					"has.true"
				);
			});

			it(".has(A) == false", function() {
				assert.notOk(
					obj.has("A"),
					"has.false"
				);
			});
		});
	})();

});