module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		jshint: {
			all: ['src/**/*.js']
		},

		todo: {
			options: {},
			src: ['src/**/*.js', '~tests/specs/*.js', 'debug/*.js', 'debug/panels/*.js']
		},

		uglify: {
			min: {
				files: {
					'build/blaze.core.min.js': ['build/blaze.core.js'],
					'build/blaze.data.min.js': ['build/blaze.data.js'],
					'build/blaze.mixins.min.js': ['build/blaze.mixins.js'],
					'build/blaze.activity.min.js': ['build/blaze.activity.js'],
					'build/blaze.storage.min.js': ['build/blaze.storage.js'],
					'build/blaze.media.min.js': ['build/blaze.media.js']
				}
			}
		},
		concat: {
			// had to move store up it throws an error when it is at the end of the file
			options: {
				separator: '\n\n'
			},
			vendor:{
				src:['vendor/modernizr-2.7.1.js', 'vendor/underscore-1.6.0.min.js',  'vendor/store.min.js', 'vendor/jquery-1.11.0.min.js', 'vendor/*.js'],
				dest:'build/blaze.dependencies.js',
				options: {
					separator: '\n;\n'
				}
			},
			core:{
				options:{
					banner:'/*! this is a compiled file do not change ' + '<%= pkg.name %>.core - v<%= pkg.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %> */\n(function() {\n',
					footer:'\n})();'
				},
				src:['src/core/blaze.js', 'src/core/mixer.js', 'src/core/model.js', 'src/core/view.js', 'src/core/*.js'],
				dest:'build/blaze.core.js'
			},
			mixins:{
				options:{
					banner:'/*! this is a compiled file do not change ' + '<%= pkg.name %>.mixin - v<%= pkg.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %> */\n(function() {\n',
					footer:'\n})();'
				},
				src:['src/mixins/*.js'],
				dest:'build/blaze.mixins.js'
			},
			data:{
				options:{
					banner:'/*! this is a compiled file do not change ' + '<%= pkg.name %>.data - v<%= pkg.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %> */\n(function() {\n',
					footer:'\n})();'
				},
				src:['src/data/data.js', 'src/data/*.js'],
				dest:'build/blaze.data.js'
			},
			storage:{
				options:{
					banner:'/*! this is a compiled file do not change ' + '<%= pkg.name %>.data - v<%= pkg.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %> */\n(function() {\n',
					footer:'\n})();'
				},
				src:['src/storage/storage.js', 'src/storage/*.js'],
				dest:'build/blaze.storage.js'
			},
			activity_js:{
				options:{
					banner:'/*! this is a compiled file do not change ' + '<%= pkg.name %> - v<%= pkg.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %> */\n(function() {\n',
					footer:'\n})();'
				},
				src:['src/activity/mixins/*.js', 'src/activity/**/*.js'],
				dest:'build/blaze.activity.js'
			},
			media:{
				options:{
					banner:'/*! this is a compiled file do not change ' + '<%= pkg.name %> - v<%= pkg.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %> */\n(function() {\n',
					footer:'\n})();'
				},
				src:['src/media/*.js'],
				dest:'build/blaze.media.js'
			}
		},

		// DOCUMENTATION
		docco: {
			docs: {
				src: ['build/*.js', '!build/blaze.dependencies.js', '!build/*.min.js'],
				options: {
					output: '~docs/'
				}
			}
		},
		assemble: {
			docs: {
				options: {
					flatten: true,
					assets: '~docs/assets',
					layout: '~docsource/templates/layout/default.hbs',
					data: '~docsource/data/*.{json,yml}',
					partials: '~docsource/templates/partials/*.hbs'
				},
				files: {
					'~docs': ['~docsource/templates/pages/*.hbs']
				}
			}
		},

		// TESTING
		jasmine: {
			test_full: {
				src: ['build/blaze.dependencies.js', 'build/blaze.core.js', 'build/blaze.mixins.js', 'build/*.js', '!build/*.min.js'],
				options: {
					specs: '~tests/specs/*js'
				}
			},
			test_min:{
				src: ['build/blaze.dependencies.js', 'build/blaze.core.min.js', 'build/blaze.mixins.min.js', 'build/*.min.js'],
				options: {
					specs: '~tests/specs/*js'
				}
			}
		},

		// watch so you do not have to manually reload
		watch:{
			blaze:{
				files:['src/**/*.js'],
				tasks:['build']
			},
			docs:{
				files:['~docsource/content/*md', '~docsource/content/**/*md', '~docsource/templates/layout/*hbs', '~docsource/templates/pages/*hbs'],
				tasks:['assemble']
			},
			specs:{
				files:['~tests/specs/*js'],
				tasks:['jasmine']
			}
		}
	});

	require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);
	grunt.loadNpmTasks('assemble');

	// default task runs build and
	grunt.registerTask('default', ['build', 'watch']);


	grunt.registerTask('build', ['jshint', 'concat', 'docco', 'uglify:min', 'jasmine']);

	//grunt.registerTask('docs', ['markdown', 'concat:activity_doc', 'docco']);

	// copy build files into tools like lms test suite
	grunt.registerTask('tools:update', ['copy:tester_scorm_1_2', 'zip:lms_tester_scorm_1_2']);
};