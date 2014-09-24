/**
 * Created with JetBrains WebStorm.
 * User: apledger
 * Date: 4/24/13
 * Time: 8:34 PM
 * File: /core/config/local.js
 */

'use strict';

angular.module('rescour.config', [])
    .config(function($logProvider) {
        $logProvider.debugEnabled(true);
    })
    .factory('Environment', function () {
        return {
            name: 'mock',
            path: '',
            config: {},
            adminEmail: 'info@rescour.com',
            rentMetrics: {
                token: 'u8LNVTAcLns6ypPmXt82iw',
                path: '/rentmetrics?',
                method: 'JSONP'
            },
            walkscore: {
                path:  '/walkbitch/?score'
            },
            stripe: {
                token: 'pk_test_wSAqQNQKI7QqPmBpDcQLgGM7'
            }
        };
    });
