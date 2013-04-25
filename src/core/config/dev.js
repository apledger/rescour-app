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
                dev: '/api'
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
            };

        return {
            map: {
                attributes: {
                    discreet: {
                        "Broker": "Broker",
                        "State": "State",
                        "property_status": "Property Status"
                    },
                    range: {
                        "Number of Units": "Number of Units",
                        "Year Built": "Year Built"
                    }
                }
            },
            config: config,
            path: url.dev,
            loading: loading,
            stripeToken: stripeTokens.test
        };
    });
