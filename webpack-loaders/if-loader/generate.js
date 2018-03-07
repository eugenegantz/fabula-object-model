var loaderUtils = require('loader-utils');

function isLineTerminator(ch) {
	return (ch === 0x0A) || (ch === 0x0D) || (ch === 0x2028) || (ch === 0x2029);
}

function process(source, collect) {
	var i,
		startLoc = collect.if.range[0],
		endLoc = collect.end.range[1],
		fill = '';

	for (i = startLoc; i < endLoc; i++) {
		if (isLineTerminator(source[i].charCodeAt(0))) fill += source[i];
		else fill += ' '
	}

	source = source.slice(0, startLoc) + fill + source.slice(endLoc);

	return source;
}
module.exports = function(source, collects) {
	var i,
		options = loaderUtils.getOptions(this),
		define = options['mode'];

	// console.log('if-loader-options', options);

	for (i = collects.length - 1; i >= 0; i--) {
		var collect = collects[i],
			defs = collect.if.value.replace(/#if/ig, '').trim();

		if (defs.indexOf(',') > -1) defs = defs.split(',');

		else defs = [defs];

		if (defs.indexOf(define) === -1)
			source = process(source, collect);
	}

	return source
};