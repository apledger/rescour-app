/**
 * Created with JetBrains WebStorm.
 * User: apledger
 * Date: 4/24/13
 * Time: 8:32 PM
 * File: /core/config/dev.js
 */

'use strict';

angular.module('rescour.config', [])
    .factory('$_api', function () {
        var url = {
                local: "http://10.0.1.92:8080/rescour",
                dev: "http://dev.maasive.net/rescour",
                v2: "http://dev.maasive.net/v2/528a7eae53d4c940a0a4190d"
            },
            stripeTokens = {
                test: 'pk_test_wSAqQNQKI7QqPmBpDcQLgGM7',
                prod: 'pk_live_4TLhgO3Pp1gOdWWmvLVK1PG3'
            },
            rentMetrics = {
                token: 'u8LNVTAcLns6ypPmXt82iw',
                path: 'http://www.rentmetrics.com/api/v1/apartments.json?',
                method: 'JSONP'
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
            path: url.v2,
            loading: loading,
            stripeToken: stripeTokens.test,
            walkscorePath: 'http://app-dev.rescour.com/score?',
            rentMetrics: rentMetrics
        };
    });
