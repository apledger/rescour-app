/**
 * Created with JetBrains WebStorm.
 * User: apledger
 * Date: 4/24/13
 * Time: 8:32 PM
 * File: /core/config/prod.js
 */

'use strict';

angular.module('rescour.config', [])
    .factory('$_api', function () {
        var url = {
                prod: "/api",
                stage: 'https://api.maasive.net/v2/52956bfdc3034e4a0fe22ef9'
            },
            stripeTokens = {
                test: 'pk_test_wSAqQNQKI7QqPmBpDcQLgGM7',
                prod: 'pk_live_4TLhgO3Pp1gOdWWmvLVK1PG3'
            },
            config = {
                headers: {'Content-Type': 'application/json'},
                withCredentials: true
            },
            loading = {
                none: function (data) {
                    return data;
                }
            },
            rentMetrics = {
                token: 'u8LNVTAcLns6ypPmXt82iw',
                path: '/rentmetrics?'
            };

        return {
            config: config,
            path: url.prod,
            loading: loading,
            stripeToken: stripeTokens.prod,
            walkscorePath: 'https://app.rescour.com/score?',
            rentMetrics: rentMetrics

        };
    });
