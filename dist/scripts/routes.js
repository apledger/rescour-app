'use strict';

angular.module('rescour.app')
    .config(['$routeProvider', '$locationProvider', '$httpProvider',
        function ($routeProvider, $locationProvider, $httpProvider) {

            $httpProvider.defaults.useXDomain = true;
            $httpProvider.defaults.withCredentials = true;


            $routeProvider.when('/', {
                templateUrl: "/views/market/market.html",
                controller: 'MarketController',
                resolve: {
                    loadItems: function ($q, $_api, Items, $rootScope, Item) {
                        var defer = $q.defer();
                        $rootScope.ping().then(
                            function (response) {
                                Item.query().then(function (result) {
                                    if (angular.equals(result, [])) {
                                        defer.reject("Failed to contact server");
                                    } else {
                                        Items.createItems(result.data.resources);
                                        defer.resolve();
                                    }
                                });
                            }
                        );

                        return defer.promise;
                    }
                }
            });

            $routeProvider.when('/login', {
                templateUrl: "/views/login/login.html",
                controller: 'LoginController'
            });

            $routeProvider.when('/account', {
                templateUrl: "/views/account/account.html",
                controller: 'AccountController',
                resolve: {
                    loadUser: function ($q, $_api, $rootScope, $http) {
                        var defer = $q.defer(),
                            self = this,
                            path = $_api.path + '/auth/users/user/',
                            config = angular.extend({
                                transformRequest: $_api.loading.none
                            }, $_api.config);

                        $http.get(path, config).then(
                            function (response) {
                                console.log("Success: ", response);
                                defer.resolve(response.data);
                            },
                            function (response) {
                                console.log("Error: ", response);
                                defer.reject();
                            }
                        );

                        return defer.promise;
                    }
                }
            });

            $httpProvider.responseInterceptors.push('Interceptor');

            $locationProvider.html5Mode(true);
        }])
    .factory('Interceptor', ['$q', '$rootScope', '$timeout',
        function ($q, $rootScope, $timeout) {
            return function (promise) {
                var resolve = function (response) {
                    if (response.config.url === "/details") {
                        $rootScope.$broadcast('loaded#details');
                    }

                    $('#Loading').hide();
                    $('#Loading-Details').hide();

                    // Local simulate loading
                    $timeout(function () {
                        $('#Loading').hide();
                        $('#Loading-Details').hide();
                    }, 250);

                }, reject = function (response) {
                    var status = response.status;
                    console.log(response);
                    if (status === 401) {
                        var defer = $q.defer(),
                            req = {
                                config: response.config,
                                deferred: defer
                            };

                        $rootScope.requests401.push(req);
                        $rootScope.$broadcast('auth#loginRequired');

                        return defer.promise;
                    } else if (status === 201) {
                        $rootScope.$broadcast('auth#loginRequired');
                    }

                    $('#Loading').hide();
                    $('#Loading-Details').hide();
                    return $q.reject(response);
                };

                promise.then(resolve, reject);

                return promise;
            };
        }]);