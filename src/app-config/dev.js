/**
 * Created with JetBrains WebStorm.
 * User: apledger
 * Date: 4/24/13
 * Time: 8:35 PM
 * File: /core/config/deploy-dev.js
 */

'use strict';

angular.module('rescour.config', [])
    .factory('$_api', function ($http) {
        var url = {
                dev: '/api',
                remote: 'http://dev.maasive.net/v2/528a7eae53d4c940a0a4190d'
            },
            stripeTokens = {
                test: 'pk_test_wSAqQNQKI7QqPmBpDcQLgGM7',
                prod: 'pk_live_4TLhgO3Pp1gOdWWmvLVK1PG3'
            },
            rentMetricTokens = {
                prod: 'u8LNVTAcLns6ypPmXt82iw'
            },
            config = {
                headers: {'Content-Type': 'application/json'},
                withCredentials: true
            },
            loading = {
                none: function (data) {
                    return data;
                }
            };

        return {
            config: config,
            path: url.remote,
            loading: loading,
            stripeToken: stripeTokens.test,
            rentMetricToken: rentMetricTokens.prod
        };
    });
