 /**
 * Created with JetBrains WebStorm.
 * User: apledger
 * Date: 4/24/13
 * Time: 8:34 PM
 * File: /core/config/local.js
 */

'use strict';

angular.module('rescour.config', [])
    .factory('$_api', function () {
        var url = {
                local: ""
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
            path: url.local,
            loading: loading,
            stripeToken: stripeTokens.test,
            rentMetricToken: rentMetricTokens.prod,
            walkscorePath: 'http://app-dev.rescour.com/score?',
            env: 'local'
        };
    });
