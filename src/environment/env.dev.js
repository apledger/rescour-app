/**
 * Created with JetBrains WebStorm.
 * User: apledger
 * Date: 4/24/13
 * Time: 8:35 PM
 * File: /core/config/deploy-dev.js
 */

'use strict';

angular.module('rescour.config', [])
    .config(function ($logProvider) {
        $logProvider.debugEnabled(true);
    })
    .factory('Environment', function ($http) {
        var url = {
            dev: '/api',
            remote: 'http://dev.maasive.net/v2/528a7eae53d4c940a0a4190d',
            test: 'http://test.maasive.net/v2.4/52956bfdc3034e4a0fe22ef9'
        };

        return {
            name: 'dev',
            adminEmail: 'alan@rescour.com',
            path: url.test,
            config: {},
            walkscore: {
                path: 'http://app-dev.rescour.com/score?'
            },
            stripe: {
                token: 'pk_test_wSAqQNQKI7QqPmBpDcQLgGM7'
            },
            rentMetrics: {
                token: 'u8LNVTAcLns6ypPmXt82iw',
                path: 'http://www.rentmetrics.com/api/v1/apartments.json?',
                method: 'JSONP'
            }
        };
    });
