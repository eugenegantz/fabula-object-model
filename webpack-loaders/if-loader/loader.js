var collect = require('./collect'),
	generate = require('./generate');

module.exports = function(source) {
	this.cacheable();

	var coll = collect(source);

	if (coll.length)
		source = generate.call(this, source, coll);

	return source
};