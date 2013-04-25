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
                prod: "/api"
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
                        "broker": "Broker",
                        "state": "State",
                        "propertyStatus": "Property Status",
                        "propertyType": "Property Type"
                    },
                    range: {
                        "numUnits": "Number of Units",
                        "yearBuilt": "Year Built"
                    }
                }
            },
            config: config,
            path: url.prod,
            loading: loading,
            stripeToken: stripeTokens.prod
        };
    });
