'use strict';


module.exports = function (grunt) {
	require('time-grunt')(grunt);

	grunt.loadNpmTasks('grunt-exec');
	grunt.loadNpmTasks('grunt-git');
	grunt.loadNpmTasks('grunt-bumpup');


	grunt.config.init({
		exec: {
			npm_publish: {
				cmd: function () {
					return 'npm publish';
				}
			}
		},
		bumpup: {
			options: {
				updateProps: {
					pkg: 'package.json'
				}
			},
			file: 'package.json'
		},

		gitpull: {
			task: {
				options: {
					'verbose': true,
					'remote': 'origin'
				}
			}
		},
		gitpush: {
			task: {
				options: {
					'verbose': true,
					'remote': 'origin'
				}
			}
		},
		gitadd: {
			increase_package_version: {
				options: {
					'verbose': true
				},
				files: {
					src: ['package.json']
				}
			}
		},
		gitcommit: {
			increase_package_version: {
				options: {
					'verbose': true,
					'message': 'Increase package version.'
				}
			}
		}

	});


	// Project configuration.
	grunt.initConfig({
		jshint: {
			options: {
				jshintrc: '.jshintrc'
			},
			gruntfile: {
				src: 'Gruntfile.js'
			},
			lib: {
				src: ['lib/**/*.js']
			},
			test: {
				src: ['test/**/*.js']
			}
		}
	});

	// These plugins provide necessary tasks.
	grunt.loadNpmTasks('grunt-contrib-jshint');


	// Default task.
	grunt.registerTask('default', ['jshint']);
	grunt.registerTask('default:publish', [
		'bumpup:patch',
		'gitadd:increase_package_version',
		'gitcommit:increase_package_version',
		'gitpush',
		'exec:npm_publish'
	]);

};
