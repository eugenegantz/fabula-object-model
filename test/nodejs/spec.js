"use strict";

process.on('uncaughtException', function(err) {
	console.log(err);

}).on('unhandledRejection', function(err) {
	console.log(err);
});

require('./../test-utils.js');

global.assert = require("assert");
global.modPath = require("path");
global.__root = modPath.join(__dirname, "./../../fabula-object-model");

assert.notOk = function(val) {
	assert.strictEqual(val, false);
};

global.globFabulaObjectModelConfig = {
	"dburl": "http://127.0.0.1:9000/db?",
	"dbname": "well.demo",
	"dbsrc": "main"
};

require('./../case/fabula-object-model/spec.js');
require('./../case/object-a/spec.js');
require('./../case/object-b/spec.js');
require('./../case/utils/spec.js');
require('./../case/ajax-module/spec.js');
require('./../case/default-data-model/spec.js');
require("./../case/firms-data-model/spec.js");
require('./../case/gands-data-model/spec.js');
require('./../case/interface-events/spec.js');
require('./../case/interface-fab-property/spec.js');
require('./../case/mov-data-model/spec.js');
require('./../case/doc-data-model/spec.js');
require('./../case/print-utils/spec.js');
require('./../case/calc/spec.js');