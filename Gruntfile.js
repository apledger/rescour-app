/**
 * Created with JetBrains WebStorm.
 * User: apledger
 * Date: 4/24/13
 * Time: 2:03 PM
 * File: Gruntfile.js
 */

'use strict';
var lrSnippet = require('grunt-contrib-livereload/lib/utils').livereloadSnippet;
var path = require('path');

var mountFolder = function (connect, dir) {
    return connect.static(require('path').resolve(dir));
};

var yeomanConfig = {
    app: 'src',
    dist: 'dist'
};

module.exports = function (grunt) {
    var path;
    var crypto;
    path = require('path');
    crypto = require('crypto');
    // load all grunt tasks
    require('matchdep').filterDev('grunt-*').concat(['gruntacular']).forEach(grunt.loadNpmTasks);

    var normalizeFiles = function (config) {
        var data, dest, destExt, dirs, files, groups, inDest, inFileDest, inFileSrc, inFiles, inSrc, isDestADirectory, isIndexed, src;

        config = grunt.util.recurse(config, function (prop) {
            if (typeof prop !== 'string') {
                return prop;
            }
            return grunt.template.process(prop);
        }, function () {
            return false;
        });
        data = config.data;
        inDest = data.dest;
        inSrc = data.src;
        inFiles = data.files;
        files = {};
        dirs = {};
        groups = {};
        isIndexed = false;
        if (inFiles) {
            if (Array.isArray(inFiles)) {
                isIndexed = true;
                inFiles.forEach(function (inFileSrc, index) {
                    if (!Array.isArray(inFileSrc)) {
                        inFileSrc = [inFileSrc];
                    }
                    return files[index] = inFileSrc;
                });
            } else {
                for (inFileDest in inFiles) {
                    inFileSrc = inFiles[inFileDest];
                    inFileDest = path.relative('./', inFileDest);
                    if (!Array.isArray(inFileSrc)) {
                        inFileSrc = [inFileSrc];
                    }
                    files[inFileDest] = inFileSrc;
                }
            }
        }
        if (inSrc) {
            if (!Array.isArray(inSrc)) {
                inSrc = [inSrc];
            }
        }
        if (inDest && inSrc) {
            inDest = path.relative('./', inDest);
            files[inDest] = inSrc;
        }
        if (inSrc && !(inDest != null)) {
            isIndexed = true;
            files[0] = inSrc;
        }
        if (files) {
            for (dest in files) {
                src = files[dest];
                destExt = path.extname(dest);
                isDestADirectory = destExt.length === 0 && !isIndexed;
                src.forEach(function (source) {
                    var isSourceADirectory, sourceExt, sourceFiles;
                    sourceExt = path.extname(source);
                    isSourceADirectory = sourceExt.length === 0;
                    if (isSourceADirectory) {
                        source = path.join(source, '/**/*.*');
                    }
                    sourceFiles = grunt.file.expand(source);
                    return sourceFiles.forEach(function (sourceFile) {
                        var absoluteDestination, cleanSource, destination, relative, sourceDirectory;
                        if (isDestADirectory) {
                            sourceDirectory = path.dirname(source.replace('**', ''));
                            if (sourceFile.indexOf('//') === 0) {
                                relative = sourceFile.substr(sourceDirectory.length);
                            } else {
                                relative = path.relative(sourceDirectory, sourceFile);
                            }
                            absoluteDestination = path.resolve(dest, relative);
                            destination = path.relative('./', absoluteDestination);
                        } else {
                            destination = dest;
                        }
                        if (isSourceADirectory) {
                            cleanSource = source.replace('/**/*.*', '/').replace('\\**\\*.*', '\\');
                            if (!dirs[cleanSource]) {
                                dirs[cleanSource] = [];
                            }
                            dirs[cleanSource].push(sourceFile);
                        }
                        if (!groups[destination]) {
                            groups[destination] = [];
                        }
                        return groups[destination].push(sourceFile);
                    });
                });
            }
        }
        return {
            dirs: dirs,
            groups: groups
        };
    };

    var gTemplate = function (config) {
        var compiled, contents, dest, destination, groups, normalized, separator, sourceContents, src, _results;

        normalized = normalizeFiles(config);
        groups = normalized.groups;
        config.data.include = grunt.file.read;
        config.data.hash = function (filePath) {
            var contents, hash;
            contents = grunt.file.read(filePath);
            return hash = crypto.createHash('sha1').update(contents).digest('hex').substr(0, 10);
        };
        config.data.uniqueVersion = function () {
            var uniqueVersion;
            return uniqueVersion = (new Date()).getTime();
        };
        _results = [];
        for (dest in groups) {
            src = groups[dest];
            sourceContents = [];
            src.forEach(function (source) {
                var contents;
                contents = grunt.file.read(source);
                return sourceContents.push(contents);
            });
            separator = grunt.util.linefeed;
            contents = sourceContents.join(grunt.util.normalizelf(separator));
            compiled = grunt.template.process(contents, {
                data: config.data
            });
            destination = dest.replace('.template', '');
            grunt.file.write(destination, compiled);
            _results.push(grunt.verbose.ok("" + src + " -> " + destination));
        }
        return _results;
    };

    grunt.registerMultiTask('template', 'Compiles HTML Templates', function () {
        return gTemplate(this);
    });

    grunt.initConfig({
        yeoman: yeomanConfig,
        connect: {
            livereload: {
                options: {
                    port: 9000,
                    middleware: function (connect) {

                        return [
                            lrSnippet,
                            mountFolder(connect, './dist')
                        ];
                    }
                }
            },
            test: {
                options: {
                    port: 9000,
                    middleware: function (connect) {
                        return [
                            mountFolder(connect, 'test')
                        ];
                    }
                }
            }
        },
        open: {
            server: {
                url: 'http://localhost:<%= connect.livereload.options.port %>'
            }
        },
        clean: {
            dist: ['./tmp', './dist'],
            buildDemo: ['./tmp', './build/demo'],
            buildProd: ['./tmp', './build/prod'],
            buildDev: ['./tmp', './build/dev'],
            temp: './tmp',
            images: './dist/img'
        },
        compass: {
            dist: {
                options: {
                    config: 'config.rb',
                    outputStyle: 'compressed'
                }
            },
            dev: {
                options: {
                    config: 'config.rb',
                    outputStyle: 'expanded'
                }
            }
        },
        express: {
            livereload: {
                options: {
                    port: 3005,
                    bases: path.resolve('./dist'),
                    debug: true,
                    monitor: {},
                    server: path.resolve('./server')
                }
            }
        },
        // Copies directories and files from one location to another.
        copy: {
            // Copies libs and img directories to temp.
            prep: {
                files: [
                    {expand: true, cwd: './src/', src: [
                        'img/**',
                        'app/**',
                        'core/**',
                        'styles/**',
                        'components/**',
                        '**/*.html'
                    ], dest: './tmp/'}
                ]
            },
            /*
             Copies the contents of the temp directory to the dist directory.
             In 'dev' individual files are used.
             */
            dev: {
                files: [
                    {expand: true, cwd: './tmp/', src: ['**'], dest: './dist/'}
                ]
            },
            /*
             Copies select files from the temp directory to the dev directory.
             Dev is deployed to subtree dev for remote testing
             */
            buildDev: {
                files: [
                    {expand: true, cwd: './tmp/', src: [
                        'scripts/scripts.dev.js',
                        'styles/main.css',
                        'img/**',
                        'components/**',
                        '**/*.html'
                    ], dest: './build/dev/'}
                ]
            },
            buildDemo: {
                files: [
                    {expand: true, cwd: './tmp/', src: [
                        'scripts/scripts.demo.js',
                        'styles/main.css',
                        'img/**',
                        'components/**',
                        '**/*.html'
                    ], dest: './build/demo/'}
                ]
            },
            buildProd: {
                files: [
                    {expand: true, cwd: './tmp/', src: [
                        'scripts/scripts.min.js',
                        'styles/main.css',
                        'img/**',
                        'components/**',
                        '**/*.html'
                    ], dest: './build/prod/'}
                ]
            },
            // Task is run when a watched script is modified.
            appjs: {
                files: [
                    {expand: true, cwd: './src/', src: ['app/**/*.js'], dest: './dist/'}
                ]
            },
            apphtml: {
                files: [
                    {expand: true, cwd: './src/', src: ['app/**/*.html'], dest: './dist/'}
                ]
            },
            core: {
                files: [
                    {expand: true, cwd: './src/', src: ['core/**'], dest: './dist/'}
                ]
            },
            // Task is run when a watched style is modified.
            styles: {
                files: [
                    {expand: true, cwd: './tmp/', src: ['styles/main.css'], dest: './dist/'}
                ]
            },
            // Task is run when an image is modified.
            images: {
                files: [
                    {expand: true, cwd: './src/', src: ['img/**'], dest: './dist/'}
                ]
            },
            // Task is run when a template is modified.
            template: {
                files: [
                    {expand: true, cwd: './src/', src: ['template/**'], dest: './dist/'}
                ]
            }
        },
        concat: {
            demo: {
                src: [
                    './tmp/scripts/scripts.min.js',
                    './tmp/components/angular-mocks/angular-mocks.js',
                    './tmp/app/mock.js'
                ],
                dest: './tmp/scripts/scripts.demo.js'
            }
        },

        /*
         RequireJS optimizer configuration for both scripts and styles.
         This configuration is only used in the 'prod' build.
         The optimizer will scan the main file, walk the dependency tree, and write the output in dependent sequence to a single file.
         Since RequireJS is not being used outside of the main file or for dependency resolution (this is handled by AngularJS), RequireJS is not needed for final output and is excluded.
         RequireJS is still used for the 'dev' build.
         The main file is used only to establish the proper loading sequence.
         */
        requirejs: {
            dev: {
                options: {
                    baseUrl: './tmp/',
                    findNestedDependencies: true,
                    logLevel: 0,
                    mainConfigFile: './tmp/main.js',
                    name: 'main',
                    // Exclude main from the final output to avoid the dependency on RequireJS at runtime.
                    onBuildWrite: function (moduleName, path, contents) {
                        var modulesToExclude = ['main'],
                            shouldExcludeModule = modulesToExclude.indexOf(moduleName) >= 0;

                        if (shouldExcludeModule) {
                            return '';
                        }

                        return contents;
                    },
                    out: './tmp/scripts/scripts.dev.js',
                    preserveLicenseComments: false,
                    skipModuleInsertion: true,
                    optimize: 'uglify',
                    uglify: {
                        // Let uglifier replace variables to further reduce file size.
                        no_mangle: true
                    }
                }
            },
            prod: {
                options: {
                    baseUrl: './tmp/',
                    findNestedDependencies: true,
                    logLevel: 0,
                    mainConfigFile: './tmp/main.js',
                    name: 'main',
                    // Exclude main from the final output to avoid the dependency on RequireJS at runtime.
                    onBuildWrite: function (moduleName, path, contents) {
                        var modulesToExclude = ['main'],
                            shouldExcludeModule = modulesToExclude.indexOf(moduleName) >= 0;

                        if (shouldExcludeModule) {
                            return '';
                        }

                        return contents;
                    },
                    optimize: 'uglify',
                    out: './tmp/scripts/scripts.min.js',
                    preserveLicenseComments: false,
                    skipModuleInsertion: true,
                    uglify: {
                        // Let uglifier replace variables to further reduce file size.
                        no_mangle: true
                    }
                }
            }
        },

        watch: {
            styles: {
                files: ['./src/styles/*.{scss,sass}', './src/styles/**/*.{scss,sass}', './src/app/**/*.{scss,sass}'],
                tasks: ['compass:dev', 'copy:styles', 'livereload']
            },
            appjs: {
                files: ['./src/app/**/*.js'],
                tasks: ['copy:appjs' , 'livereload']
            },
            apphtml: {
                files: ['./src/app/**/*.html'],
                tasks: ['copy:apphtml' , 'livereload']
            },
            core: {
                files: ['./src/core/**'],
                tasks: ['copy:core' , 'livereload']
            },
            images: {
                files: ['./src/img/**'],
                tasks: ['copy:images', 'livereload']
            },
            template: {
                files: ['./src/template/**'],
                tasks: ['copy:template', 'livereload']
            },
            server: {
                files: ['server.js'],
                tasks: 'express-restart:livereload'
            }
        },

        /*
         Compile template files (.template) to HTML (.html).

         .template files are essentially html; however, you can take advantage of features provided by grunt such as underscore templating.

         The example below demonstrates the use of the environment configuration setting.
         In 'prod' the concatenated and minified scripts are used along with a QueryString parameter of the hash of the file contents to address browser caching.
         In environments other than 'prod' the individual files are used and loaded with RequireJS.

         <% if (config.environment === 'prod') { %>
         <script src="/scripts/scripts.min.js?v=<%= config.hash('./temp/scripts/scripts.min.js') %>"></script>
         <% } else { %>
         <script data-main="/scripts/main.js" src="/scripts/libs/require.js"></script>
         <% } %>
         */
        template: {
            shimDev: {
                files: {
                    './tmp/main.js': './src/main.js.template'
                },
                environment: 'dev'
            },
            shimDemo: {
                files: {
                    './tmp/main.js': './src/main.js.template'
                },
                environment: 'demo'
            },
            shimProd: {
                files: {
                    './tmp/main.js': './src/main.js.template'
                },
                environment: 'prod'
            },
            indexLocal: {
                files: {
                    './tmp/index.html': './src/index.html.template'
                },
                environment: 'local'
            },
            indexLocalDev: {
                files: {
                    './tmp/index.html': './src/index.html.template'
                },
                environment: 'localDev'
            },
            indexDev: {
                files: {
                    './tmp/index.html': './src/index.html.template'
                },
                environment: 'dev'
            },
            indexProd: {
                files: {
                    './tmp/index.html': './src/index.html.template'
                },
                environment: 'prod'
            },
            indexDemo: {
                files: {
                    './tmp/index.html': './src/index.html.template'
                },
                environment: 'demo'
            }
        }
    });

    // A task to run unit tests in testacular.
    grunt.registerTask('unit-tests', 'run the testacular test driver on jasmine unit tests', function () {
        var done = this.async();

        require('child_process').exec('./node_modules/testacular/bin/testacular start ./testacular.conf.js --single-run', function (err, stdout) {
            grunt.log.write(stdout);
            done(err);
        });
    });

    grunt.renameTask('regarde', 'watch');

    /*
     Compiles the app with non-optimized build settings, places the build artifacts in the dist directory, and runs unit tests.
     Enter the following command at the command line to execute this build task:
     grunt test
     */
    grunt.registerTask('test', [
        'default',
        'unit-tests'
    ]);

    grunt.registerTask('server', [
        'livereload-start',
        'express',
        'watch'
    ]);

    /*
     Compiles the app with non-optimized build settings, places the build artifacts in the dist directory, and watches for file changes.
     Uses local api services and bootstraps with mock backend module
     Enter the following command at the command line to execute this build task:
     grunt local
     */
    grunt.registerTask('local', [
        'clean:dist',
        'compass:dev', // Compile compass: app -> tmp
        'copy:prep', // Copy all html/css/js: app -> tmp
        'template:indexLocal', // Compile templates: app -> tmp
        'copy:dev', // Copy all from: tmp -> dist
        'clean:temp',
        'server'
    ]);

    /*
     Compiles the app with non-optimized build settings, places the build artifacts in the dist directory, and watches for file changes.
     Uses dev api services and bootstraps with main application
     Enter the following command at the command line to execute this build task:
     grunt dev
     */

    grunt.registerTask('dev', [
        'clean:dist',
        'compass:dev', // Compile compass: app -> tmp
        'copy:prep', // Copy all html/css/js: app -> tmp
        'template:indexLocalDev', // Compile templates: app -> tmp
        'copy:dev', // Copy all from: tmp -> dist
        'clean:temp',
        'server'
    ]);

    /*
     Compiles the app with non-optimized build settings, places the build artifacts in the dist directory, and watches for file changes.
     Uses local api services and bootstraps with mock backend module
     Enter the following command at the command line to execute this build task:
     grunt local
     */
    grunt.registerTask('buildDemo', [
        'clean:buildDemo',
        'compass:dist', // Compile compass: app -> tmp
        'template:shimDemo', // Template requirejs shim -> tmp
        'copy:prep', // Copy components, styles, app, core, assets, **.html: app -> tmp
        'requirejs:prod', // Create minified scripts from shim: app -> tmp
        'concat:demo', // Attach angular-mocks and mock.js to tmp/scripts/scripts.min.js -> tmp/scripts/scripts.demo.js
        'template:indexDemo', // Compile templates: app -> tmp
        'copy:buildDemo', // Copy all from: tmp -> demo
        'clean:temp'
    ]);

    /*
     Compiles the app with non-optimized build settings, places the build artifacts in the dist directory, and watches for file changes.
     Uses dev api services and bootstraps with main application
     Enter the following command at the command line to execute this build task:
     grunt dev
     */
    grunt.registerTask('buildDev', [
        'clean:buildDev',
        'compass:dev', // Compile compass: app -> tmp
        'template:shimDev', // Template requirejs shim -> tmp
        'copy:prep', // Copy styles, app, core, assets, **.html: app -> tmp
        'requirejs:dev', // Builds all js from tmp/ -> tmp/scripts/scripts.dev.js
        'template:indexDev', // Compile index.html.template: app -> tmp
        'copy:buildDev', // Copy **.html, components, img, scripts/scripts.dev.js, styles/main.css -> build/dev
        'clean:temp'
    ]);

    /*
     Compiles the app with optimized build settings and places the build artifacts in build/prod directory.
     Uses production api services and bootstrap with main application
     Enter the following command at the command line to execute this build task:
     grunt buildProd
     */
    grunt.registerTask('buildProd', [
        'clean:buildProd',
        'compass:dist', // Compile compass: app -> tmp
        'template:shimProd', // Template requirejs shim -> tmp
        'copy:prep', // Copy styles, app, core, assets, **.html: app -> tmp
        'requirejs:prod', // Builds all js from tmp/ -> tmp/scripts/scripts.min.js
        'template:indexProd', // Compile index.html.template: app -> tmp
        'copy:buildProd', // Copy **.html, components, img, scripts/scripts.dev.js, styles/main.css -> build/dev
        'clean:temp'
    ]);
};
