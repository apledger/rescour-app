/**
 * Created with JetBrains WebStorm.
 * User: apledger
 * Date: 4/24/13
 * Time: 3:53 PM
 * File: auth.js
 */

'use strict';

angular.module('rescour.auth', [])
    .config(['$httpProvider', '$routeProvider',
        function ($httpProvider, $routeProvider) {
            $httpProvider.defaults.useXDomain = true;
            $httpProvider.defaults.withCredentials = true;
            $routeProvider.when('/logout', {
                resolve: {
                    checkUser: function ($rootScope, $location) {
                        $rootScope.$broadcast('auth#logoutRequest');
                        $rootScope.ping().then(function (response) {
                            $location.path('/');
                        });
                    }
                }
            });
            $httpProvider.responseInterceptors.push('AuthInterceptor');

        }])
    .run(['$rootScope', '$_api', '$location', '$q', '$http',
        function ($rootScope, $_api, $location, $q, $http) {

            /**
             * Holds all the requests which failed due to 401 response.
             */
            $rootScope.requests401 = [];
            $http.defaults.useXDomain = true;

            $rootScope.ping = function () {
                var defer = $q.defer(),
                    self = this,
                    path = $_api.path + '/auth/check/',
                    config = angular.extend({
                        transformRequest: function (data) {
                            return data;
                        }
                    }, $_api.config);

                $http.get(path, config).then(
                    function (response) {
                        if (!response.data.user) {
                            $rootScope.$broadcast('auth#loginRequired');
                            defer.reject(response);
                        } else {
                            defer.resolve(response);
                        }
                    },
                    function (response) {
                        defer.reject(response);
                    }
                );

                return defer.promise;
            };

            /**
             * On 'event:loginConfirmed', resend all the 401 requests.
             */
            $rootScope.$on('auth#resendRequests', function () {
                function retry(req) {
                    $http(req.config).then(function (response) {
                        req.deferred.resolve(response);
                    });
                }

                var i, requests = $rootScope.requests401;
                for (i = 0; i < requests.length; i++) {
                    retry(requests[i]);
                }
                $rootScope.requests401 = [];
            });

            $rootScope.$on('auth#paymentRequired', function () {
                $location.path('/account/activate/');
            });

            $rootScope.$on('auth#paymentConfirmed', function () {
                $location.path('/account/welcome');
            });

            /**
             * On 'event:loginRequest' send credentials to the server.
             */
            $rootScope.$on('auth#loginRequest', function (event, creds) {
                $_api.auth.login(creds, function (response) {
                    $rootScope.$broadcast('auth#loginConfirmed');
                    $location.path('/');
                }, function (response) {
                    $rootScope.$broadcast('auth#loginRequired');
                });
            });

            $rootScope.$on('auth#loginRequired', function () {
                $location.path('/login');
            });
            /**
             * On 'logoutRequest' invoke logout on the server and broadcast 'event:loginRequired'.
             */
            $rootScope.$on('auth#logoutRequest', function () {
                var path = $_api.path + '/auth/logout/',
                    config = angular.extend({
                        transformRequest: function (data) {
                            return data;
                        }
                    }, $_api.config),
                    body = JSON.stringify({});

                $http.post(path, body, config).then(function (response) {
                    $rootScope.ping();
                }, function (response) {
                    $rootScope.ping();
                });
            });
        }])
    .factory('AuthInterceptor', ['$q', '$rootScope', '$timeout',
        function ($q, $rootScope, $timeout) {
            return function (promise) {
                var resolve = function (response) {
                }, reject = function (response) {
                    var status = response.status,
                        message = response.data.status_message;

                    switch (status) {
                        case 401:
                            var defer = $q.defer(),
                                req = {
                                    config: response.config,
                                    deferred: defer
                                };

                            $rootScope.requests401.push(req);
                            $rootScope.$broadcast('auth#loginRequired');
                            return defer.promise;
                        case 201:
                            $rootScope.$broadcast('auth#loginRequired');
                            break;
                        case 402:
                            var defer = $q.defer(),
                                req = {
                                    config: response.config,
                                    deferred: defer
                                };
                            $rootScope.requests401.push(req);

                            if (message === 'payment required') {
                                $rootScope.$broadcast('auth#paymentRequired');
                            } else if (message === 'payment authorizing') {
                                $rootScope.$broadcast('auth#paymentAuthorizing');
                            }

                            return defer.promise;
                        default:
                    }

                    return $q.reject(response);
                };

                promise.then(resolve, reject);

                return promise;
            };
        }]);
