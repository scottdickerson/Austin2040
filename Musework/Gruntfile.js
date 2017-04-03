module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		jshint: {
			all: ['src/game/**/*.js']
		},
		// build game file
		concat: {
			game:{
				src:['src/game/mixins/*.js', 'src/game/model/*.js', 'src/game/views/*.js', 'src/game/app/*.js'],
				dest:'src/game.js',
				options: {
					separator: '\n})();\n(function() {\n',
					banner:'/*! this is a compiled file do not change ' + '<%= pkg.name %>.core - v<%= pkg.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %> */\n(function() {\n',
					footer:'\n})();'
				},
			}
		},
		watch:{
			game:{
				files:['src/game/**/*.js'],
				tasks:['build']
			}
		}
	});

	require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

	// default task runs build and
	grunt.registerTask('default', ['build', 'watch']);
	grunt.registerTask('build', ['jshint', 'concat']);

};

