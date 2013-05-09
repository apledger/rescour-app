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

            $routeProvider.when('/',
                {
                    redirectTo: '/market/'
                })
                .otherwise({
                    redirectTo: '/'
                });
        }])
    .value('$dimensions', {
        discreet: {
            'broker': {
                title: 'Broker',
                weight: 10
            },
            'state': {
                title: 'State',
                weight: 9
            },
            'propertyStatus': {
                title: 'Property Status',
                weight: 8
            },
            'propertyType': {
                title: 'Property Type',
                weight: 7
            }
        },
        range: {
            'numUnits': {
                title: 'Number of Units',
                weight: 10
            },
            'yearBuilt': {
                title: 'Year Built',
                weight: 9
            }
        }
    })
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


