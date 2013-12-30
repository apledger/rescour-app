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
            rentMetricTokens = {
                prod: 'u8LNVTAcLns6ypPmXt82iw'
            },
            config = {
                headers: {'Content-Type': 'application/json'},
                withCredentials: true
            },
            walkScoreTokens = {
                dev: '53a5a8421f9738c864545e91812e2d98'
            },
            loading = {
                none: function (data) {
                    return data;
                }
            };

        return {
            config: config,
            path: url.prod,
            loading: loading,
            stripeToken: stripeTokens.test,
            walkScoreToken: walkScoreTokens.dev,
            rentMetricToken: rentMetricTokens.prod
        };
    });
