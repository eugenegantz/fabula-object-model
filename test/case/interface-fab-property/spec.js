describe("InterfaceFProperty", function() {
	var fom, fp;
	var lorem_ipsum = "" +
		"Lorem Ipsum is simply dummy text of the printing and typesetting industry. " +
		"Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, " +
		"when an unknown printer took a galley of type and scrambled it to make a type specimen book. " +
		"It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. " +
		"It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, " +
		"and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.";

	before(function() {
		fom = globTestUtils.getFabulaObjectModel();
		fp = fom.create("InterfaceFProperty"); // new InterfaceFProperty();
	});

	describe(".addProperty(), .getProperty(), .on(addProperty), .on(getProperty)", function() {

		before(function() {
			fp.on(
				"addProperty",
				function() {
					it(".on(addProperty)", function(done) {
						done();
					});
				}
			);

			fp.on(
				"getProperty",
				function() {
					it(".on(getProperty)", function(done) {
						done();
					});
				}
			);
		});

		it(".addProperty(...)", function() {
			fp.addProperty({ "property": "prop_integer", "value": "100" });
			fp.addProperty({ "property": "prop_string", "value": "abc" });
			fp.addProperty({ "property": "prop_string", "value": "abcd" });
			fp.addProperty({ "property": "prop_with_pid", "pid": "20511", "value": "abc" });
			fp.addProperty({ "property": "prop_without_value", "pid": "20511" });
			assert.equal(fp.getProperty().length, 5);
		});

		it(".getProperty(...)", function() {
			assert.equal(
				fp.getProperty({ "property": "prop_string" }).length,
				2,
				'Получение записей // fp.getProperty(...).length == 2'
			);
		});

		it("._property[4].value === null", function() {
			assert.ok(
				fp._property[4].value === void 0,
				"Значение поля по умолчанию === null (для неуказанных полей) // fp._property[3].value === null"
			);
		});

	});

	describe(".splitProperty()", function() {

		it(".splitProperty(lorem_ipsum)", function() {
			assert.ok(
				(function() {
					var tmp = fp.splitProperty({ "Property": "test", "value": lorem_ipsum });
					for (var c = 0; c < tmp.length; c++) {
						if (tmp[c].value.length > 120) {
							return false;
						}
					}
					return true;
				})(),
				"Разбиение свойства по длине записи (не более 120 символов на запись)"
			);
		});

		it(".splitProperty(lorem_ipsum) // long words", function() {
			assert.ok(
				(function() {
					var tmp = fp.splitProperty({ "Property": "test", "value": lorem_ipsum.replace(/[ ]/g, "") });
					for (var c = 0; c < tmp.length; c++) {
						if (tmp[c].value.length > 120) {
							return false;
						}
					}
					return true;
				})(),
				"Разбиение свойства по длине записи (не более 120 символов на запись). Длинные слова"
			);
		});

	});

	describe(".removeProperty(), .on(removeProperty)", function() {

		before(function() {
			fp.on(
				"removeProperty",
				function() {
					it(".on(removeProperty)", function(done) {
						done();
					});
				}
			);
		});

		it(".removeProperty(...)", function() {
			fp.removeProperty({ "property": "prop_integer" });
			fp.removeProperty({ "property": "prop_string", "value": "abcd" });
			assert.equal(fp.getProperty().length, 3);
		});

	});

	describe(".updateProperty()", function() {

		it(".updateProperty(...)", function() {
			fp.updateProperty({ "pid": "20511" }, { "value": "qwerty" });
			assert.equal(fp.getProperty({ "value": "qwerty" }).length, 2);
		});

	});

	describe(".upsertProperty()", function() {

		it(".upsertProperty(+3)", function() {
			fp.clearChangedProperty();
			fp.upsertProperty({ "pid": "20511" }, [{ "value": "zwerty" }, { "value": "zwerty" }, { "value": "zwerty" }]);
			assert.equal(fp.getProperty({ "value": "zwerty" }).length, 3);
		});

	});

	describe(".getChangedProperty()", function() {

		it(".getChangedProperty(...)", function() {
			assert.ok(
				Boolean(fp.getChangedProperty().length),
				"fp.getChangedProperty()"
			);
		});

	});
});