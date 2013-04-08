'use strict';

angular.module('rescour.app')
    .config(['$routeProvider', '$locationProvider', '$httpProvider',
        function ($routeProvider, $locationProvider, $httpProvider) {

            $httpProvider.defaults.useXDomain = true;
            $httpProvider.defaults.withCredentials = true;
            $locationProvider.html5Mode(true);

            $routeProvider.when('/', {           //THIS LINE SHOULD BE '/'
                templateUrl: "/views/market/market.html",
                controller: 'MarketController',
                resolve: {
                    loadItems: function ($q, $_api, Items, $rootScope, Item) {
                        var defer = $q.defer();
                        Item.query().then(function (result) {
                            if (angular.equals(result, [])) {
                                defer.reject("Failed to contact server");
                            } else {
                                Items.createItems(result.data.resources);
                                defer.resolve();
                            }
                        }, function (response) {
                            defer.reject(response);
                        });

                        return defer.promise;
                    }
                }
            });

            $routeProvider.when('/login', {
                templateUrl: "/views/login/login.html",
                controller: 'LoginController'
            });

            $routeProvider.when('/login/forgot-password', {
                templateUrl: "/views/login/forgotPassword.html",
                controller: 'ForgotPasswordController',
                resolve: {

                }
            });

            $routeProvider.when('/login/reset-password', {
                templateUrl: "/views/login/resetPassword.html",
                controller: 'ResetPasswordController',
                resolve: {
                    checkToken: function ($location) {
                        if (!$location.search().token) {
                            $location.path('/login/forgot-password');
                        }
                    }
                }
            });

            $routeProvider.when('/account', {              //THIS LINE SHOULD BE /account
                templateUrl: "/views/account/account.html",
                controller: 'AccountController',
                resolve: {
                    loadUser: function ($q, $_api, $http) {
                        var defer = $q.defer(),
                            self = this,
                            path = $_api.path + '/auth/users/user/',
                            config = angular.extend({
                                transformRequest: $_api.loading.main
                            }, $_api.config);

                        $http.get(path, config).then(
                            function (response) {
                                defer.resolve(response.data);
                            },
                            function (response) {
                                defer.reject();
                            }
                        );

                        return defer.promise;
                    }
                }
            });

            $httpProvider.responseInterceptors.push('Interceptor');
        }])
    .factory('Interceptor', ['$q', '$rootScope', '$timeout',
        function ($q, $rootScope, $timeout) {
            return function (promise) {
                var resolve = function (response) {
                    if (response.config.url === "/details") {
                        $rootScope.$broadcast('loaded#details');
                    }

                    $('#Loading-Details').hide();
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
                            $rootScope.$broadcast('auth#paymentRequired');
                            return defer.promise;
                        default:
                            $('#Loading').hide();
                            $('#Loading-Details').hide();
                    }

                    return $q.reject(response);
                };

                promise.then(resolve, reject);

                return promise;
            };
        }]);