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
                var defer = $q.defer();
                $_api.auth.check(function (response) {
                    if (!response.data.user) {
                        $rootScope.$broadcast('auth#loginRequired');
                        defer.reject();
                    } else {
                        defer.resolve();
                    }
                });

                return defer.promise;
            };

            /**
             * On 'event:loginConfirmed', resend all the 401 requests.
             */
            $rootScope.$on('auth#loginConfirmed', function () {
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

                $location.path('/');
            });

            $rootScope.$on('auth#paymentRequired', function () {
                var token = function (res) {
                    var path = $_api.path + '/auth/users/user/payment/',
                        config = angular.extend({
                            transformRequest: $_api.loading.none
                        }, $_api.config),
                        body = JSON.stringify({token: res.id});

                    $http.post(path, body, config).then(function (response) {
                        console.log("Success payment", response, $rootScope);
                        return $rootScope.ping();
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
                    if (response.data.status === "success") {
                        $rootScope.$broadcast('auth#loginConfirmed');
                    } else {
                        $rootScope.$broadcast('auth#loginRequired');
                    }
                });
            });

            $rootScope.$on('auth#loginRequired', function () {
                $location.path('/login');
            });
            /**
             * On 'logoutRequest' invoke logout on the server and broadcast 'event:loginRequired'.
             */
            $rootScope.$on('auth#logoutRequest', function () {
                $_api.auth.logout(function () {
                    $rootScope.ping();
                }, function () {
                    $rootScope.ping();
                });
            });
        }]);