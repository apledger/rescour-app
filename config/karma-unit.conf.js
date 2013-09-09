/**
 *
 * Created with JetBrains WebStorm.
 * User: spencer
 * Date: 7/18/13
 * Time: 7:52 PM
 * To change this template use File | Settings | File Templates.
 */

basePath = '../.tmp';

files = [
    JASMINE,
    JASMINE_ADAPTER,
    'components/leaflet/dist/leaflet.js',
    'components/jquery/jquery.js',
    'components/jquery-ui/jquery-ui.js',
    'components/angular/angular.js',
    'components/angular-cookies/angular-cookies.js',
    'components/angular-mocks/angular-mocks.js',
    'app-config/local.js',
    'components/underscore/underscore.js',
    'components/angular-ui-bootstrap-bower/ui-bootstrap.js',
    'components/leaflet.markerclusterer/dist/leaflet.markercluster.js',
    'components/spin.js/dist/spin.js',
    'components/hammerjs/dist/hammer.js',
    'components/angular-hammerjs/angular-hammer.js',
    'core/**/*.js',
    'app/app.js',
    'app/**/*.js',
    'app/**/*.unit.js'
];

exclude = [
    'app/bootstrap.js'
];
//
// test results reporter to use
// possible values: dots || progress || growl
reporters = ['dots', 'junit'];

// web server port
port = 8080;

// cli runner port
//runnerPort = 9100;

colors = true;

logLevel = LOG_INFO;

// enable / disable watching file and executing tests whenever any file changes
autoWatch = true;

// Continuous Integration mode
// if true, it capture browsers, run tests and exit
singleRun = true;

// break from module
browsers = ['Chrome'];

junitReporter = {
    outputFile: 'log/test-results.xml'
};
