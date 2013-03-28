'use strict';

require(
    {
        shim: {
            'app': {
                deps: [
                    'lib/angular/angular',
                    'lib/angular/angular-resource',
                    'lib/underscore-min',
                    'angular_components/carousel',
                    'angular_components/tabs',
                    'angular_components/transition',
                    'lib/jquery-ui.min',
                    'lib/jquery.min'
                ]
            },
            'lib/jquery-ui.min': {
                deps: ['lib/jquery.min']
            },
            'controllers/marketControllers': {
                deps: ['app', 'services/marketServices']
            },
            'controllers/rescourControllers': {
                deps: ['app']
            },
            'directives/marketDirectives': {
                deps: [
                    'app',
                    'lib/angular/angular',
                    'services/marketServices',
                    'lib/jquery-ui.min',
                    'lib/jquery.min',
                    'lib/underscore-min'
                ]
            },
            'directives/rescourDirectives': {
                deps: ['app']
            },
            'filters/limitVisible': {
                deps: ['app']
            },
            'services/marketServices': {
                deps: ['app']
            },
            'services/rescourServices': {
                deps: ['app']
            },
            'services/api/APIservices': {
                deps: ['app']
            },
            'bootstrap': {
                deps: ['app']
            },
            'routes': {
                deps: ['app']
            },
            'run': {
                deps: ['app']
            }
        }
    },
    [
        'require',
        'lib/jquery-ui.min',
        'controllers/marketControllers',
        'controllers/rescourControllers',
        'services/marketServices',
        'services/rescourServices',
        'services/api/APIServices',
        'filters/limitVisible',
        'directives/marketDirectives',
        'directives/rescourDirectives',
        'routes',
        'run'
    ],
    function (require) {
        return require(['bootstrap']);
    }
);
