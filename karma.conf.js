/* jshint node: true */
module.exports = function(config) {
	'use strict';
	var babelOptions = require(__dirname + '/babel-options.js');

	config.set({
		port: 9870,
		browsers: ['PhantomJS'],
		frameworks: ['jasmine'],
		files: [
			'es5-shim.js',
      'node_modules/babel-polyfill/dist/polyfill.js',
			'vendor/es6-collections/es6-collections.js',
			'src/*.js',
			'test/*.spec.js'
		],
		preprocessors: {
			'src/*.js': ['babel'],
			// uncomment to enable ES6 on tests too
			'test/*.js': ['babel']
		},
		babelPreprocessor: {
			options: babelOptions
		}
	});
};
