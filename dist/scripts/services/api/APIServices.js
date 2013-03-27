'use strict';

angular.module('rescour.api', [])
    .factory('$_api', ['$http', function ($http) {
        var url = {
            local: "http://10.0.1.92:8080/rescour",
            dev: "http://dev.maasive.net/rescour",
            prod: "http://api.maasive.net/rescour"
        };

        var path = url.dev;
        var config = {
            headers: {'Content-Type': 'application/json'},
            withCredentials: true
        }

        return {
            map: {
                attributes: {
                    discreet: {
                        "broker": "Broker",
                        "state": "State"
                    },
                    range: {
                        "num_units": "Number of Units",
                        "year_built": "Year Built"
                    }
                }
            },
            config: config,
            path: path,
            loading: {
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
            },
            auth: {
                check: function (successcb, failurecb) {
                    $http.get(path + '/auth/check/', config).then(successcb, failurecb);
                },
                login: function (creds, successcb, failurecb) {
                    $http.post(path + '/auth/login/', JSON.stringify(creds), config).then(successcb, failurecb);
                },
                logout: function (successcb, failurecb) {
                    $http.post(path + '/auth/logout/', {}, config).then(successcb, failurecb);
                }
            }
        };
    }]);

