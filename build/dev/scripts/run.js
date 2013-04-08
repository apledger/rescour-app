'use strict';

angular.module('rescour.app')
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
                $location.path('/account');
                var token = function (res) {
                    var path = $_api.path + '/auth/users/user/payment/',
                        config = angular.extend({
                            transformRequest: $_api.loading.main
                        }, $_api.config),
                        body = JSON.stringify({token: res.id});

                    $http.post(path, body, config).then(function (response) {
                        console.log("Success payment", response, $rootScope);
                        $rootScope.$broadcast('auth#resendRequests');
                        $location.path('/');
                    }, function (response) {
                        $rootScope.$broadcast('auth#paymentRequired');
                    });

                };

                StripeCheckout.open({
                    key: 'pk_test_wSAqQNQKI7QqPmBpDcQLgGM7',
                    address: true,
                    name: 'Rescour',
                    description: 'Activate your trial!',
                    panelLabel: 'Checkout',
                    token: token
                });
            })

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
        }]);