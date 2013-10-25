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
                files: ['<%= yeoman.app %>/**/*.{scss,sass}'],
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
            components: {
                files: [
                    '<%= yeoman.app %>/components/angular-ui-handsontable/**'
                ],
                tasks: ['copy:components']
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
            template: {
                files: [
                    '<%= yeoman.app %>/{,**/}*.template'
                ],
                tasks: ['']
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
            demo: {
                files: [{
                    src: [
                        '<%= yeoman.stage %>',
                        '<%= yeoman.dist %>/demo/*',
                        '<%= yeoman.dist %>/dev/*',
                        '<%= yeoman.dist %>/prod/*',
                        '!<%= yeoman.dist %>/.git*'
                    ]
                }]
            },
            prod: {
                files: [{
                    src: [
                        '<%= yeoman.stage %>',
                        '<%= yeoman.dist %>/demo/*',
                        '<%= yeoman.dist %>/dev/*',
                        '<%= yeoman.dist %>/prod/*',
                        '!<%= yeoman.dist %>/.git*'
                    ]
                }]
            },
            dev: {
                files: [{
                    src: [
                        '<%= yeoman.stage %>',
                        '<%= yeoman.dist %>/demo/*',
                        '<%= yeoman.dist %>/dev/*',
                        '<%= yeoman.dist %>/prod/*',
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
                        'app/**/*',
                        'components/**/*',
                        'app-config/**/*',
                        'core/**/*',
                        'template/**/*',
                        'img/**/*',
                        '*.html*'
                    ]
                }]
            },
            app: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= yeoman.app %>',
                    dest: '<%= yeoman.stage %>',
                    src: [
                        'app/**/*'
                    ]
                }]
            },
            core: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= yeoman.app %>',
                    dest: '<%= yeoman.stage %>',
                    src: [
                        'core/**/*'
                    ]
                }]
            },
            components: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= yeoman.app %>',
                    dest: '<%= yeoman.stage %>',
                    src: [
                        'components/angular-ui-handsontable/**'
                    ]
                }]
            },
            img: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= yeoman.app %>',
                    dest: '<%= yeoman.stage %>',
                    src: [
                        'img/**/*'
                    ]
                }]
            },
            appConfig: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= yeoman.app %>',
                    dest: '<%= yeoman.stage %>',
                    src: [
                        'app-config/**/*'
                    ]
                }]
            },
            dev: {
                files: [
                    {
                        expand: true,
                        dot: true,
                        cwd: './',
                        dest: '<%= yeoman.dist %>/dev',
                        src: [
                            '<%= yeoman.app %>/*.{ico,txt}',
                            '<%= yeoman.app %>/img/{,*/}*.{gif,webp}',
                            '<%= yeoman.app %>/styles/fonts/*'
                        ]
                    },
                    {
                        expand: true,
                        dot: true,
                        flatten: true,
                        cwd: './',
                        dest: '<%= yeoman.dist %>/dev/scripts',
                        src: [
                            '<%= yeoman.stage %>/scripts/scripts.js'
                        ]
                    },
                    {
                        expand: true,
                        dot: true,
                        flatten: true,
                        cwd: './',
                        dest: '<%= yeoman.dist %>/dev/styles',
                        src: [
                            '<%= yeoman.stage %>/styles/main.css'
                        ]
                    },
                    {
                        expand: true,
                        dot: false,
                        flatten: false,
                        cwd: '<%= yeoman.app %>',
                        dest: '<%= yeoman.dist %>/dev',
                        src: [
                            'components/**/*'
                        ]
                    },
                    {
                        expand: true,
                        dot: false,
                        flatten: false,
                        cwd: '<%= yeoman.stage %>',
                        dest: '<%= yeoman.dist %>/dev',
                        src: [
                            '**/*.html'
                        ]
                    }
                ]
            },
            demo: {
                files: [
                    {
                        expand: true,
                        dot: true,
                        cwd: './',
                        dest: '<%= yeoman.dist %>/demo',
                        src: [
                            '<%= yeoman.app %>/*.{ico,txt}',
                            '<%= yeoman.app %>/img/{,*/}*.{gif,webp}',
                            '<%= yeoman.app %>/styles/fonts/*'
                        ]
                    },
                    {
                        expand: true,
                        dot: true,
                        flatten: true,
                        cwd: './',
                        dest: '<%= yeoman.dist %>/demo/scripts',
                        src: [
                            '<%= yeoman.stage %>/scripts/scripts.js'
                        ]
                    },
                    {
                        expand: true,
                        dot: true,
                        flatten: true,
                        cwd: './',
                        dest: '<%= yeoman.dist %>/demo/styles',
                        src: [
                            '<%= yeoman.stage %>/styles/main.css'
                        ]
                    },
                    {
                        expand: true,
                        dot: false,
                        flatten: false,
                        cwd: '<%= yeoman.app %>',
                        dest: '<%= yeoman.dist %>/demo',
                        src: [
                            'components/**/*'
                        ]
                    },
                    {
                        expand: true,
                        dot: false,
                        flatten: false,
                        cwd: '<%= yeoman.stage %>',
                        dest: '<%= yeoman.dist %>/demo',
                        src: [
                            '**/*.html'
                        ]
                    }
                ]
            },
            prod: {
                files: [
                    {
                        expand: true,
                        dot: true,
                        cwd: './',
                        dest: '<%= yeoman.dist %>/prod',
                        src: [
                            '<%= yeoman.app %>/*.{ico,txt}',
                            '<%= yeoman.app %>/img/{,*/}*.{gif,webp}',
                            '<%= yeoman.app %>/styles/fonts/*'
                        ]
                    },
                    {
                        expand: true,
                        dot: true,
                        flatten: true,
                        cwd: './',
                        dest: '<%= yeoman.dist %>/prod/scripts',
                        src: [
                            '<%= yeoman.stage %>/scripts/scripts.js'
                        ]
                    },
                    {
                        expand: true,
                        dot: true,
                        flatten: true,
                        cwd: './',
                        dest: '<%= yeoman.dist %>/prod/styles',
                        src: [
                            '<%= yeoman.stage %>/styles/main.css'
                        ]
                    },
                    {
                        expand: true,
                        dot: false,
                        flatten: false,
                        cwd: '<%= yeoman.app %>',
                        dest: '<%= yeoman.dist %>/prod',
                        src: [
                            'components/**/*'
                        ]
                    },
                    {
                        expand: true,
                        dot: false,
                        flatten: false,
                        cwd: '<%= yeoman.stage %>',
                        dest: '<%= yeoman.dist %>/prod',
                        src: [
                            '**/*.html'
                        ]
                    }
                ]
            }
        },
        concat: {
            demo: {
                'src': [
                    '<%= yeoman.stage %>/app/**/*.js',
                    '<%= yeoman.stage %>/core/**/*.js',
                    '<%= yeoman.stage %>/components/**/*.js',
                    '!<%= yeoman.stage %>/app/**/*.unit.js',
                    '!<%= yeoman.stage %>/app/**/*.e2e.js'
                ],
                dest: '<%= yeoman.dist %>/demo/scripts/scripts.js'
            },
            mock: {
                src: [
                    '<%= yeoman.dist %>/demo/scripts/scripts.js',
                    '<%= yeoman.app %>/components/angular-mocks/angular-mocks.js',
                    '<%= yeoman.app %>/app/mock.js'
                ],
                dest: '<%= yeoman.dist %>/demo/scripts/scripts.js'
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
            },
            reload: {
                files: {
                    '.tmp/index.html': './src/index.html.template'
                },
                environment: 'prod'
            }
        },
        rev: {
            demo: {
                files: {
                    src: [
                        '<%= yeoman.dist %>/demo/scripts/{,*/}*.js',
                        '<%= yeoman.dist %>/demo/styles/{,*/}*.css',
                        '<%= yeoman.dist %>/demo/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
                        '<%= yeoman.dist %>/demo/styles/fonts/*'
                    ]
                }
            },
            dev: {
                files: {
                    src: [
                        '<%= yeoman.dist %>/dev/scripts/{,*/}*.js',
                        '<%= yeoman.dist %>/dev/styles/{,*/}*.css',
                        '<%= yeoman.dist %>/dev/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
                        '<%= yeoman.dist %>/dev/styles/fonts/*'
                    ]
                }
            },
            prod: {
                files: {
                    src: [
                        '<%= yeoman.dist %>/prod/scripts/{,*/}*.js',
                        '<%= yeoman.dist %>/prod/styles/{,*/}*.css',
                        '<%= yeoman.dist %>/prod/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
                        '<%= yeoman.dist %>/prod/styles/fonts/*'
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
                '<%= yeoman.dist %>/demo/{,*/}*.html',
                '<%= yeoman.dist %>/dev/{,*/}*.html',
                '<%= yeoman.dist %>/prod/{,*/}*.html'
            ],
            css: [
                '<%= yeoman.dist %>/demo/styles/{,*/}*.css',
                '<%= yeoman.dist %>/dev/styles/{,*/}*.css',
                '<%= yeoman.dist %>/prod/styles/{,*/}*.css'
            ],
            options: {
                dirs: [
                    '<%= yeoman.dist %>/demo',
                    '<%= yeoman.dist %>/dev',
                    '<%= yeoman.dist %>/prod'
                ]
            }
        },
        imagemin: {
            demo: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.app %>/img',
                    src: '{,*/}*.{png,jpg,jpeg}',
                    dest: '<%= yeoman.dist %>/demo/img'
                }]
            },
            dev: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.app %>/img',
                    src: '{,*/}*.{png,jpg,jpeg}',
                    dest: '<%= yeoman.dist %>/dev/img'
                }]
            },
            prod: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.app %>/img',
                    src: '{,*/}*.{png,jpg,jpeg}',
                    dest: '<%= yeoman.dist %>/prod/img'
                }]
            }
        },
        cssmin: {
            demo: {
                files: {
                    '<%= yeoman.dist %>/demo/styles/main.css': [
                        '<%= yeoman.dist %>/demo/styles/main.css'
                    ]
                }
            },
            dev: {
                files: {
                    '<%= yeoman.dist %>/dev/styles/main.css': [
                        '<%= yeoman.dist %>/dev/styles/main.css'
                    ]
                }
            },
            prod: {
                files: {
                    '<%= yeoman.dist %>/prod/styles/main.css': [
                        '<%= yeoman.dist %>/prod/styles/main.css'
                    ]
                }
            }
        },
        ngmin: {
            demo: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.dist %>/demo/scripts',
                    src: '*.js',
                    dest: '<%= yeoman.dist %>/demo/scripts'
                }]
            },
            dev: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.dist %>/dev/scripts',
                    src: '*.js',
                    dest: '<%= yeoman.dist %>/dev/scripts'
                }]
            },
            prod: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.dist %>/prod/scripts',
                    src: '*.js',
                    dest: '<%= yeoman.dist %>/prod/scripts'
                }]
            }
        },
        uglify: {
            options: {
                mangle: false
            },
            demo: {
                files: {
                    '<%= yeoman.dist %>/demo/scripts/scripts.js': [
                        '<%= yeoman.dist %>/demo/scripts/scripts.js'
                    ]
                }
            },
            dev: {
                files: {
                    '<%= yeoman.dist %>/dev/scripts/scripts.js': [
                        '<%= yeoman.dist %>/dev/scripts/scripts.js'
                    ]
                }
            },
            prod: {
                files: {
                    '<%= yeoman.dist %>/prod/scripts/scripts.js': [
                        '<%= yeoman.dist %>/prod/scripts/scripts.js'
                    ]
                }
            }
        }
    });

    // When template task is run, sets watch task of template to environment
    grunt.util.hooker.hook(grunt.task, function() {
        var task = grunt.task.current.nameArgs;
        if (task.split(':')[0] === 'template') {
            grunt.config(['watch', 'template', 'tasks'], [task]);
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

    grunt.registerTask('buildDemo', [
        'clean:demo',
        'copy:local',
        'compass:prod',
        'template:demo',
        'clean:template',
        // 'karma:unit',
        'useminPrepare',
        'concat:.tmp/scripts/scripts.js',
        'concat:.tmp/styles/main.css',
        'imagemin:demo',
        'copy:demo',
        'cssmin:demo',
        'ngmin:demo',
        'uglify:demo',
        'concat:mock',
        'rev:demo',
        'usemin'
    ]);

    grunt.registerTask('buildDev', [
        'clean:dev',
        'copy:local',
        'compass:prod',
        'template:dev',
        'clean:template',
        // 'karma:unit',
        'useminPrepare',
        'concat:.tmp/scripts/scripts.js',
        'concat:.tmp/styles/main.css',
        'imagemin:dev',
        'copy:dev',
        'cssmin:dev',
        'ngmin:dev',
        'uglify:dev',
        'rev:dev',
        'usemin'
    ]);

    grunt.registerTask('buildProd', [
        'clean:prod',
        'copy:local',
        'compass:prod',
        'template:prod',
        'clean:template',
        // 'karma:unit',
        'useminPrepare',
        'concat:.tmp/scripts/scripts.js',
        'concat:.tmp/styles/main.css',
        'imagemin:prod',
        'copy:prod',
        'cssmin:prod',
        'ngmin:prod',
        'uglify:prod',
        'rev:prod',
        'usemin'
    ]);
};
