/**
 * Created with JetBrains WebStorm.
 * User: apledger
 * Date: 4/24/13
 * Time: 4:24 PM
 * File: /app/app.js
 */

if (!window.console) window.console = {};
if (!window.console.log) window.console.log = function () {
};

angular.module('rescour.app',
        [
            'ui.bootstrap',
            'rescour.config',
            'rescour.auth',
            'rescour.user',
            'rescour.utility',
            'rescour.market',
            'rescour.market.map'
        ])
    .config(['$routeProvider', '$locationProvider', '$httpProvider',
        function ($routeProvider, $locationProvider, $httpProvider) {

            $httpProvider.defaults.useXDomain = true;
            $httpProvider.defaults.withCredentials = true;
            $locationProvider.html5Mode(true);

            $routeProvider.when('/', {
                templateUrl: "/app/home/desktop/views/home.html",
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
                    },
                    loadUser: function (User, $q) {
                        var defer = $q.defer();
                        User.getProfile().then(function (response) {
                            defer.resolve(response);
                        }, function (response) {
                            defer.reject(response);
                        });
                        return defer.promise;
                    }
                }
            })
                .otherwise({
                    redirectTo: '/'
                });
        }])
    .controller("AppController", ['$scope', '$rootScope', '$location', '$_api', '$http',
        function ($scope, $rootScope, $location, $_api, $http) {
            $rootScope.$on("$routeChangeStart", function (event, next, current) {
                $scope.loading = true;
                $scope.failure = false;
            });
            $rootScope.$on("$routeChangeSuccess", function (event, current, previous) {
                $scope.loading = false;
                $scope.failure = false;
            });
            $rootScope.$on("$routeChangeError", function (event, current, previous, rejection) {
                $scope.loading = false;
                $scope.failure = true;
            });
        }]);


