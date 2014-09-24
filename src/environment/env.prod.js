/**
 * Created with JetBrains WebStorm.
 * User: apledger
 * Date: 4/24/13
 * Time: 8:32 PM
 * File: /core/config/prod.js
 */

'use strict';

angular.module('rescour.config', [])
    .config(function ($logProvider) {
        $logProvider.debugEnabled(false);
    })
    .factory('Environment', function () {
        var url = {
            prod: '/api',
            stage: 'https://api.maasive.net/v2/52956bfdc3034e4a0fe22ef9'
        };

        return {
            name: 'prod',
            path: url.prod,
            adminEmail: 'info@rescour.com',
            config: {},
            rentMetrics: {
                token: 'u8LNVTAcLns6ypPmXt82iw',
                path: '/rentmetrics?',
                method: 'GET'
            },
            walkscore: {
                path:  '/score?'
            },
            stripe: {
                token: 'pk_live_4TLhgO3Pp1gOdWWmvLVK1PG3'
            }
        };
    });