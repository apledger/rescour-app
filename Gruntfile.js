'use strict';
var lrSnippet = require('grunt-contrib-livereload/lib/utils').livereloadSnippet;

var mountFolder = function (connect, dir) {
    return connect.static(require('path').resolve(dir));
};

var yeomanConfig = {
    app:'app',
    dist:'dist'
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
            dirs:dirs,
            groups:groups
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
                data:config.data
            });
            destination = dest.replace('.template', '.html');
            grunt.file.write(destination, compiled);
            _results.push(grunt.verbose.ok("" + src + " -> " + destination));
        }
        return _results;
    };

    grunt.registerMultiTask('template', 'Compiles Templates', function () {
        return gTemplate(this);
    });

    grunt.initConfig({
        yeoman:yeomanConfig,
        connect:{
            livereload:{
                options:{
                    port:9000,
                    middleware:function (connect) {
                        return [
                            lrSnippet,
                            mountFolder(connect, './dist')
                        ];
                    }
                }
            },
            test:{
                options:{
                    port:9000,
                    middleware:function (connect) {
                        return [
                            mountFolder(connect, 'test')
                        ];
                    }
                }
            }
        },
        open:{
            server:{
                url:'http://localhost:<%= connect.livereload.options.port %>'
            }
        },
        clean:{
            dist:['./tmp', './dist'],
            demo:['./tmp', './demo'],
            prod:['./tmp', './prod'],
            dev:['./tmp', './dev'],
            temp:'./tmp',
            images:'./dist/img'
        },
        imagemin:{
            dist:{
                options:{
                    optimizationLevel:7,
                    progressive:true
                },
                files:[
                    {
                        expand:true,
                        cwd:'./dist/img',
                        src:'**/*.{png,jpg,jpeg}',
                        dest:'./dist/img'
                    }
                ]
            }
        },
        htmlmin:{
            dist:{
                options:{
                    removeCommentsFromCDATA:true,
                    removeComments:true
                },
                files:[
                    {
                        expand:true,
                        cwd:'./tmp/',
                        src:['*.html', '**/*.html'],
                        dest:'./tmp/'
                    }
                ]
            }
        },
        compass:{
            dist:{
                options:{
                    config:'config.rb',
                    outputStyle:'compressed'
                }
            },
            dev:{
                options:{
                    config:'config.rb',
                    outputStyle:'expanded'
                }
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
        template:{
            dev:{
                files:{
                    './tmp/views/':'./app/views/**/*.template',
                    './tmp/index.html':'./app/index.template'
                },
                environment:'dev'
            },
            prod:{
                files:{
                    './tmp/views/':'./app/views/**/*.template',
                    './tmp/index.html':'./app/index.template'
                },
                environment:'prod'
            },
            local:{
                files:{
                    './tmp/views/':'./app/views/**/*.template',
                    './tmp/index.html':'./app/index.template'
                },
                environment:'local'
            },
            demo:{
                files:{
                    './tmp/views/':'./app/views/**/*.template',
                    './tmp/index.html':'./app/index.template'
                },
                environment:'demo'
            }
        },

        // Copies directories and files from one location to another.
        copy:{
            // Copies libs and img directories to temp.
            prep:{
                files:[
                    {expand:true, cwd:'./app/', src:['img/**', 'styles/**', 'scripts/**', 'views/**/*.html', '*.html'], dest:'./tmp/'}
                ]
            },
            /*
             Copies the contents of the temp directory to the dist directory.
             In 'dev' individual files are used.
             */
            dev:{
                files:[
                    {expand:true, cwd:'./tmp/', src:['**'], dest:'./dist/'}
                ]
            },
            /*
             Copies select files from the temp directory to the dev directory.
             Dev is deployed to subtree dev for remote testing
             */
            deploydev: {
                files:[
                    {expand:true, cwd:'./tmp/', src:['**'], dest:'./dev/'}
                ]
            },
            deploydemo: {
                files:[
                    {expand:true, cwd:'./tmp/', src:['img/**', 'scripts/scripts.min.js', 'styles/main.css', 'styles/fonts/**','styles/lib/**', '**/*.html',
                        // Map specific libraries
                        'scripts/dev.js',
                        'scripts/lib/es5-shim/es5-shim.min.js',
                        'scripts/lib/json3/json3.min.js',
                        'scripts/lib/leaflet.js',
                        'scripts/lib/leaflet.markercluster-src.js',
                        'scripts/lib/leaflet-google.js',
                        'scripts/lib/angular/angular-mocks.js'
                    ], dest:'./demo/'}
                ]
            },
            /*
             Copies select files from the temp directory to the dist directory.
             In 'prod' minified files are used along with img and libs.
             The dist artifacts contain only the files necessary to run the application.
             */
            deployprod: {
                files:[
                    {expand:true, cwd:'./tmp/', src:['img/**', 'scripts/scripts.min.js', 'styles/**', '**/*.html',
                        // Map specific libraries
                        'scripts/lib/es5-shim/es5-shim.min.js',
                        'scripts/lib/json3/json3.min.js',
                        'scripts/lib/leaflet.js',
                        'scripts/lib/leaflet.markercluster-src.js',
                        'scripts/lib/leaflet-google.js'
                    ], dest:'./prod/'}
                ]
            },
            // Task is run when a watched script is modified.
            scripts:{
                files:[
                    {expand:true, cwd:'./app/', src:['scripts/**/*.js'], dest:'./dist/'}
                ]
            },
            // Task is run when a watched style is modified.
            styles:{
                files:[
                    {expand:true, cwd:'./tmp/', src:['styles/main.css'], dest:'./dist/'}
                ]
            },
            // Task is run when the watched index.template file is modified.
            index:{
                files:[
                    {expand:true, cwd:'./tmp/', src:['index.html'], dest:'./dist/'}
                ]
            },
            // Task is run when a watched view is modified.
            views:{
                files:[
                    {expand:true, cwd:'./app/', src:['views/**/*.html'], dest:'./dist/'}
                ]
            },
            // Task is run when an image is modified.
            images:{
                files:[
                    {expand:true, cwd:'./app/', src:['img/**'], dest:'./dist/'}
                ]
            }
        },
        uglify:{
            options:{
                mangle:true
            },
            scripts:{
                files:{
                    './tmp/scripts/scripts.concatmin.js':['./tmp/scripts/scripts.concat.js']
                }
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
        requirejs:{
            scripts:{
                options:{
                    baseUrl:'./app/scripts/',
                    findNestedDependencies:true,
                    logLevel:0,
                    mainConfigFile:'./app/scripts/main.js',
                    name:'main',
                    // Exclude main from the final output to avoid the dependency on RequireJS at runtime.
                    onBuildWrite:function (moduleName, path, contents) {
                        var modulesToExclude = ['main'],
                            shouldExcludeModule = modulesToExclude.indexOf(moduleName) >= 0;

                        if (shouldExcludeModule) {
                            return '';
                        }

                        return contents;
                    },
                    optimize:'uglify',
                    out:'./tmp/scripts/scripts.min.js',
                    preserveLicenseComments:false,
                    skipModuleInsertion:true,
                    uglify:{
                        // Let uglifier replace variables to further reduce file size.
                        no_mangle:true
                    }
                }
            },
            demo:{
                options:{
                    baseUrl:'./app/scripts/',
                    findNestedDependencies:true,
                    logLevel:0,
                    mainConfigFile:'./app/scripts/demomain.js',
                    name:'demomain',
                    // Exclude main from the final output to avoid the dependency on RequireJS at runtime.
                    onBuildWrite:function (moduleName, path, contents) {
                        var modulesToExclude = ['demomain'],
                            shouldExcludeModule = modulesToExclude.indexOf(moduleName) >= 0;

                        if (shouldExcludeModule) {
                            return '';
                        }

                        return contents;
                    },
                    optimize:'uglify',
                    out:'./tmp/scripts/scripts.min.js',
                    preserveLicenseComments:false,
                    skipModuleInsertion:true,
                    uglify:{
                        // Let uglifier replace variables to further reduce file size.
                        no_mangle:true
                    }
                }
            }
        },

        watch:{
            compass:{
                files:['./app/styles/*.{scss,sass}', './app/styles/**/*.{scss,sass}'],
                tasks:['compass:dev', 'copy:styles', 'livereload']
            },
            index:{
                files:'./app/index.template',
                tasks:['template:dev', 'copy:index', 'livereload']
            },
            views:{
                files:['./app/views/**'],
                tasks:['copy:views' , 'livereload']
            },
            scripts:{
                files:['./app/scripts/**/*.js'],
                tasks:['copy:scripts', 'livereload']
            },
            images:{
                files:['./app/img/**'],
                tasks:['clean:images', 'copy:images', 'livereload']
            }
        },

        hash:{
            dist:{
                files:['./dist/scripts/**/*.js']
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

    grunt.registerTask('server', [
        'livereload-start',
        'connect:livereload',
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
        'template:local', // Compile templates: app -> tmp
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
        'template:dev', // Compile templates: app -> tmp
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
    grunt.registerTask('deploydev', [
        'clean:dev',
        'compass:dev', // Compile compass: app -> tmp
        'copy:prep', // Copy all html/css/js: app -> tmp
        'template:dev', // Compile templates: app -> tmp
        'copy:deploydev', // Copy all from: tmp -> dev
        'clean:temp'
    ]);

    /*
     Compiles the app with non-optimized build settings, places the build artifacts in the dist directory, and watches for file changes.
     Uses local api services and bootstraps with mock backend module
     Enter the following command at the command line to execute this build task:
     grunt local
     */
    grunt.registerTask('deploydemo', [
        'clean',
        'compass:dist', // Compile compass: app -> tmp
        'requirejs:demo', // Create minified scripts from shim: app -> tmp
        'copy:prep', // Copy all html/css/js: app -> tmp
        'template:demo', // Compile templates: app -> tmp
        'copy:deploydemo', // Copy all from: tmp -> demo
        'clean:temp'
    ]);

    /*
     Compiles the app with optimized build settings and places the build artifacts in the dist directory.
     Uses production api services and bootstrap with main application
     Enter the following command at the command line to execute this build task:
     grunt prod
    */
    grunt.registerTask('deployprod', [
        'clean:prod',
        'compass:dist', // Compass compile and minify: app -> tmp
        'requirejs:scripts', // Create minified scripts from shim: app -> tmp
        'copy:prep', // Copy img + lib + html: app/img/* + app -> tmp
        'template:prod', // Apply html templates: app -> tmp
        'htmlmin', // Minify html: tmp -> tmp
        'copy:deployprod', // Copy: tmp -> prod
        'clean:temp' // Delete tmp
    ]);


    /*
     Compiles the app with non-optimized build settings, places the build artifacts in the dist directory, and runs unit tests.
     Enter the following command at the command line to execute this build task:
     grunt test
     */
    grunt.registerTask('test', [
        'default',
        'unit-tests'
    ]);
};
