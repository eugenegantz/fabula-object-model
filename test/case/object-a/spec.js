describe("ObjectA", function() {
	var fom, ObjectA;

	before(function() {
		fom = globTestUtils.getFabulaObjectModel();
		ObjectA = fom._getModule("ObjectA");
	});

	describe(".set(ABCD), .get(abcd)", function() {
		var obj;

		before(function() {
			obj = new ObjectA();
			obj.set("aBcD", 100);
		});

		it(".set(aBcD, 100)", function() {
			assert.equal(obj._props.abcd, 100);
		});

		it(".get(abcd) == 100", function() {
			assert.equal(obj.get("abcd"), 100);
		});
	});

	describe("", function() {
		var obj;

		before(function() {
			obj = new ObjectA({
				"a": 1,
				"b": "2",
				"c": { "c": 3 },
				"d": [4]
			});
		});

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
	});
});