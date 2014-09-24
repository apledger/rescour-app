/**
 * Created with JetBrains WebStorm.
 * User: apledger
 * Date: 4/24/13
 * Time: 3:53 PM
 * File: auth.js
 */

'use strict';

angular.module('rescour.auth', ['rescour.config'])
    .config(function ($httpProvider) {
        $httpProvider.defaults.useXDomain = true;
        $httpProvider.defaults.withCredentials = true;
        $httpProvider.responseInterceptors.push('AuthInterceptor');
    })
    .run(function ($rootScope, $location, $http, Auth) {
        /**
         * Holds all the requests which failed due to 401 response.
         */
        $rootScope.requests401 = [];
        $http.defaults.useXDomain = true;

        /**
         * On 'event:loginConfirmed', resend all the 401 requests.
         */
        $rootScope.$on('auth.resendRequests', function () {
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

        $rootScope.$on('auth.paymentRequired', function () {
            $location.path('/account/subscription');
        });

        $rootScope.$on('auth.paymentConfirmed', function () {
            $location.path('/account/welcome');
        });

        $rootScope.$on('auth.forbidden', function () {
            $location.path('/logout');
        });

        /**
         * On 'event:loginRequest' send credentials to the server.
         */
        $rootScope.$on('auth.loginRequest', function (event, creds) {
            Environment.auth.login(creds, function (response) {
                $rootScope.$broadcast('auth.loginConfirmed');
                $location.path('/');
            }, function (response) {
                $rootScope.$broadcast('auth.loginRequired');
            });
        });

        $rootScope.$on('auth.loginRequired', function () {
            $location.path('/login');
        });
        /**
         * On 'logoutRequest' invoke logout on the server and broadcast 'event:loginRequired'.
         */
        $rootScope.$on('auth.logoutRequest', function () {
            Auth.logout();
        });
    })
    .service('Auth', function ($q, $http, Environment, $rootScope, segmentio) {

        this.reset = function (creds) {
            var path = Environment.path + '/auth/reset/',
                config = _.extend({}, Environment.config),
                body = JSON.stringify(creds),
                defer = $q.defer();

            $http.post(path, body, config)
                .then(function (response) {
                    defer.resolve(response)
                }, function (response) {
                    defer.reject(response);
                });

            return defer.promise;
        };

        this.forgot = function (creds) {
            return this.reset({
                email: creds.email
            });
        };

        this.login = function (creds) {
            var path = Environment.path + '/auth/login/',
                config = _.extend({}, Environment.config),
                body = JSON.stringify(creds),
                defer = $q.defer();

            $http.post(path, body, config)
                .then(function (response) {
                    defer.resolve(response)
                }, function (response) {
                    defer.reject(response);
                });

            return defer.promise;
        };

        this.logout = function () {
            var path = Environment.path + '/auth/logout/',
                config = _.extend({}, Environment.config),
                self = this;

            $http.get(path, config).then(function (response) {
                self.ping();
            }, function (response) {
                self.ping();
            });
        };

        this.ping = function () {
            var defer = $q.defer(),
                path = Environment.path + '/auth/user/',
                config = _.extend({}, Environment.config);

            $http.get(path, config).then(
                function (response) {
                    if (!response.data[0]) {
                        $rootScope.$broadcast('auth.loginRequired');
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
        }
    })
    .factory('AuthInterceptor',
    function ($q, $rootScope, $timeout) {
        return function (promise) {
            var resolve = function (response) {
            }, reject = function (response) {
                var status = response.status;

                switch (status) {
                    case 401:
                        var defer = $q.defer(),
                            req = {
                                config: response.config,
                                deferred: defer
                            };

                        $rootScope.requests401.push(req);
                        $rootScope.$broadcast('auth.loginRequired');
                        return defer.promise;
                    case 201:
                        $rootScope.$broadcast('auth.loginRequired');
                        break;
                    case 402:
                        $rootScope.$broadcast('auth.paymentRequired');
                    case 403:
                        $rootScope.$broadcast('auth.paymentRequired');
                        break;
                    default:
                }

                return $q.reject(response);
            };

            promise.then(resolve, reject);

            return promise;
        };
    });
