const
	webpack = require('webpack'),
	modPath = require('path');

module.exports = {
	// devtool: 'cheap-module-source-map',
	devtool: false,

	entry: {
		'fabula-object-model': modPath.resolve(__dirname, './fabula-object-model/browser/FabulaObjectModel.js')
	},

	output: {
		path: modPath.resolve(__dirname, './bundles/'),
		pathinfo: true,
		filename: '[name].bundle.js',
		chunkFilename: '[id].js'
	},

	module: {

		rules: [
			{
				// the "loader"
				test: /\.js$/,
				options: {
					mode: 'browser',
				},
				loader: modPath.resolve(__dirname, './webpack-loaders/if-loader/loader.js')
			}
		]

	},

	optimization: {
		minimize: false
	},

	performance: {
		hints: "warning", // enum
		maxAssetSize: 1000000, // int (in bytes),
		maxEntrypointSize: 1000000, // int (in bytes)
		assetFilter: function(assetFilename) {
			// Function predicate that provides asset filenames
			return assetFilename.endsWith('.css') || assetFilename.endsWith('.js');
		}
	},

	externals: {
		'./../_FabulaObjectModel.js': 'FabulaObjectModel'
	}
};
