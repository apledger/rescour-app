'use strict';

angular.module('rescour.api', [])
    .factory('$_api', function () {
        var url = {
                local: "http://10.0.1.92:8080/rescour",
                dev: "http://dev.maasive.net/rescour",
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
                details: function (data) {
                    $('#Loading-Details').show();
                    return data;
                },
                main: function (data) {
                    $('#Loading').show();
                    return data;
                },
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
                        "property_status": "Property Status"
                    },
                    range: {
                        "num_units": "Number of Units",
                        "year_built": "Year Built"
                    }
                }
            },
            config: config,
            path: url.prod,
            loading: loading,
            stripeToken: stripeTokens.test
        };
    });
