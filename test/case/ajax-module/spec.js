describe("Ajax-module", function() {
	var Ajax = require("eg-node-ajax");

	it("Ajax._xFormParam", function() {
		var a = Ajax._xFormParam({
			a: {
				aa: 110,
				ab: 120,
				ac: 130
			},
			b: [210, 220, 230],
			c: 300
		});
		assert.equal(decodeURIComponent(a), "a[aa]=110&a[ab]=120&a[ac]=130&b[]=210&b[]=220&b[]=230&c=300");
	});

	it("Ajax.req", function(done) {
		Ajax.request({
			"url": "http://localhost:8100",
			"method": "GET",
			"vars": {
				"a": 100,
				"b": {
					"ba": 210,
					"bb": 220
				},
				"c": [1, 2, 3]
			},
			"callback": function(err, res) {
				if (err) throw new Error(err);
				done();
			}
		});
	});

	it("Ajax.req / vars / POST", function(done) {
		Ajax.request({
			"url": "http://localhost:8100/api",
			"method": "POST",
			"vars": {
				"method": "test:async",
				argument: [100, 200, "abc"]
			},
			"callback": function(err, res) {
				var exp = '{"err":null,"arg":["100","200","abc"]}';
				if (err) throw new Error(err);
				if (res.responseText != exp) {
					throw new Error("expected: " + exp);
				}
				done();
			}
		});
	});

	it("Ajax.req / vars / GET", function(done) {
		Ajax.request({
			"url": "http://localhost:8100/api",
			"method": "GET",
			"vars": {
				"method": "test:async",
				argument: [100, 200, "abc"]
			},
			"callback": function(err, res) {
				var exp = '{"err":null,"arg":["100","200","abc"]}';
				if (err) throw new Error(err);
				if (res.responseText != exp) {
					throw new Error("expected: " + exp + "; recieved: " + res.responseText);
				}
				done();
			}
		});
	});

});