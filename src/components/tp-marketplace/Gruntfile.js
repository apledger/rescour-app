/**
 * Created with JetBrains WebStorm.
 * User: apledger
 * Date: 4/24/13
 * Time: 2:03 PM
 * File: Gruntfile.js
 */

'use strict';
var path = require('path');
var templateEnv = '';

module.exports = function (grunt) {
    // load all grunt tasks
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    // configurable paths
    var yeomanConfig = {
        app: 'src',
        dist: 'build',
        stage: '.tmp'
    };

    try {
        yeomanConfig.app = require('./bower.json').appPath || yeomanConfig.app;
    } catch (e) {}

    grunt.initConfig({
        yeoman: yeomanConfig,
        watch: {
            options: {
                livereload: true
            },
            compass: {
                files: ['<%= yeoman.app %>/styles/{,**/}*.{scss,sass}'],
                tasks: ['compass:dev']
            },
            app: {
                files: [
                    '<%= yeoman.app %>/app/**/*'
                ],
                tasks: ['copy:app']
            },
            core: {
                files: [
                    '<%= yeoman.app %>/core/**/*'
                ],
                tasks: ['copy:core']
            },
            img: {
                files: [
                    '<%= yeoman.app %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
                ],
                tasks: ['copy:img']
            },
            appConfig: {
                files: [
                    '<%= yeoman.app %>/app-config/**/*'
                ],
                tasks: ['copy:appConfig']
            },
            server: {
                files: [
                    'server.js'
                ]
            },
            template: {
                files: [
                    '<%= yeoman.app %>/{,**/}*.template'
                ]
            }
        },
        open: {
            server: {
                url: 'http://localhost:<%= express.all.options.port %>'
            }
        },
        clean: {
            options: {
                dot: true
            },
            local: {
                files: [{
                    src: [
                        '<%= yeoman.stage %>'
                    ]
                }]
            },
            build: {
                files: [{
                    src: [
                        '<%= yeoman.stage %>',
                        '<%= yeoman.dist %>/*',
                        '!<%= yeoman.dist %>/.git*'
                    ]
                }]
            },
            template: {
                files: [{
                    src: [
                        '<%= yeoman.stage %>/*.template'
                    ]
                }]
            }
        },
        compass: {
            options: {
                sassDir: '<%= yeoman.app %>/styles',
                cssDir: '<%= yeoman.stage %>/styles',
                imagesDir: '<%= yeoman.app %>/img',
                javascriptsDir: '<%= yeoman.app %>/app',
                importPath: '<%= yeoman.app %>/styles',
                relativeAssets: true
            },
            prod: {
                options: {
                    debugInfo: false,
                    outputStyle: 'compressed'
                }
            },
            dev: {
                options: {
                    debugInfo: true,
                    outputStyle: 'expanded'
                }
            }
        },
        copy: {
            local: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= yeoman.app %>',
                    dest: '<%= yeoman.stage %>',
                    src: [
                        'src/**/*'
                    ]
                }]
            },
            build: {
                files: [
                    {
                        expand: true,
                        dot: true,
                        cwd: './',
                        dest: '<%= yeoman.dist %>',
                        src: [
                            '<%= yeoman.app %>/*.{ico,txt}',
                            '<%= yeoman.app %>/img/{,*/}*.{gif,webp}',
                            '<%= yeoman.app %>/styles/fonts/*',
                            '<%= yeoman.app %>/components/*'
                        ]
                    },
                    {
                        expand: true,
                        dot: true,
                        flatten: true,
                        cwd: './',
                        dest: '<%= yeoman.dist %>/scripts',
                        src: [
                            '<%= yeoman.stage %>/scripts/scripts.js'
                        ]
                    },
                    {
                        expand: true,
                        dot: true,
                        flatten: true,
                        cwd: './',
                        dest: '<%= yeoman.dist %>/styles',
                        src: [
                            '<%= yeoman.stage %>/styles/main.css'
                        ]
                    },
                    {
                        expand: true,
                        dot: false,
                        flatten: false,
                        cwd: '<%= yeoman.app %>',
                        dest: '<%= yeoman.dist %>',
                        src: [
                            'components/**/*',
                            'app-config/**/*'
                        ]
                    },
                    {
                        expand: true,
                        dot: false,
                        flatten: false,
                        cwd: '<%= yeoman.stage %>',
                        dest: '<%= yeoman.dist %>',
                        src: [
                            '**/*.html'
                        ]
                    }
                ]
            }
        },
        concat: {
            build: {
                'src': [
                    '<%= yeoman.stage %>/app/**/*.js',
                    '<%= yeoman.stage %>/core/**/*.js',
                    '<%= yeoman.stage %>/components/**/*.js',
                    '!<%= yeoman.stage %>/app/**/*.unit.js',
                    '!<%= yeoman.stage %>/app/**/*.e2e.js'
                ],
                dest: '<%= yeoman.dist %>/scripts/scripts.js'
            },
            mock: {
                src: [
                    '<%= yeoman.dist %>/scripts/scripts.js',
                    '<%= yeoman.app %>/components/angular-mocks/angular-mocks.js',
                    '<%= yeoman.app %>/app/mock.js'
                ],
                dest: '<%= yeoman.dist %>/scripts/scripts.js'
            }
        },
        template: {
            local: {
                files: {
                    '.tmp/index.html': './src/index.html.template'
                },
                environment: 'local'
            },
            localDev: {
                files: {
                    '.tmp/index.html': './src/index.html.template'
                },
                environment: 'localDev'
            },
            demo: {
                files: {
                    '.tmp/index.html': './src/index.html.template'
                },
                environment: 'demo'

            },
            dev: {
                files: {
                    '.tmp/index.html': './src/index.html.template'
                },
                environment: 'dev'
            },
            prod: {
                files: {
                    '.tmp/index.html': './src/index.html.template'
                },
                environment: 'prod'
            }
        },
        rev: {
            build: {
                files: {
                    src: [
                        '<%= yeoman.dist %>/{,*/}*.js'
                    ]
                }
            }
        },
        express: {
            all: {
                options: {
                    port: 9000,
                    hostname: '0.0.0.0',
                    bases: path.resolve('/.tmp'),
                    server: path.resolve('./server'),
                    livereload: true
                }
            }
        },
        jshint: {
            options: {
                jshintrc: 'config/.jshintrc'
            },
            all: [
                'Gruntfile.js',
                '<%= yeoman.app %>/app/{,*/}*.js'
            ]
        },
        karma: {
            unit: {
                configFile: 'config/karma-unit.conf.js',
                singleRun: true
            },
            e2e: {
                configFile: 'config/karma-e2e.conf.js',
                singleRun: true
            }
        },
        useminPrepare: {
            html: '<%= yeoman.stage %>/index.html',
            css: '<%= yeoman.stage %>/styles/main.css'
        },
        usemin: {
            html: [
                '<%= yeoman.dist %>/{,*/}*.html'
            ],
            css: [
                '<%= yeoman.dist %>/styles/{,*/}*.css'
            ],
            options: {
                dirs: [
                    '<%= yeoman.dist %>'
                ]
            }
        },
        imagemin: {
            build: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.app %>/img',
                    src: '{,*/}*.{png,jpg,jpeg}',
                    dest: '<%= yeoman.dist %>/img'
                }]
            }
        },
        cssmin: {
            build: {
                files: {
                    '<%= yeoman.dist %>/styles/main.css': [
                        '<%= yeoman.dist %>/styles/main.css'
                    ]
                }
            }
        },
        ngmin: {
            build: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.dist %>/scripts',
                    src: '*.js',
                    dest: '<%= yeoman.dist %>/scripts'
                }]
            }
        },
        uglify: {
            options: {
                mangle: false,
                banner: "/** Copyright (c) 2013 All Right Reserved, Nebuleaf Studios LLC, http://nebuleaf.com/. v1.0.0 **/\n"
            },
            build: {
                files: {
                    '<%= yeoman.dist %>/marketplace.js': [
                        '<%= yeoman.app %>/marketplace-src.js'
                    ]
                }
            }
        }
    });

    /* Watches for changed template files and reprocesses them accordingly */
    grunt.event.on('watch', function(action, filepath, target) {
        if (filepath.match(/html.template/)) {
            grunt.task.run('template:' + templateEnv);
        }
    });
    grunt.util.hooker.hook(grunt.task, function() {
        var task = grunt.task.current.nameArgs;
        if (task.split(':')[0] === 'template') {
            templateEnv = task.split(':')[1];
        }
    });

    grunt.registerTask('test', [
        'clean:local',
        'copy:local',
        'template:local',
        'clean:template',
        // 'karma:unit'
    ]);

    grunt.registerTask('server', [
        'express',
        'open',
        'watch'
    ]);

    grunt.registerTask('local', [
        'clean:local',
        'compass:dev',
        'copy:local',
        'template:local',
        'clean:template',
        'server'
    ]);

    grunt.registerTask('dev', [
        'clean:local',
        'compass:dev',
        'copy:local',
        'template:localDev',
        'clean:template',
        'server'
    ]);

    grunt.registerTask('build', [
        'clean:build',
        'uglify:build'
    ]);
};
