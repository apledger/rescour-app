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
            'ui.utils',
            'ui.if',
            'ui.bootstrap',
            'rescour.config',
            'rescour.auth',
            'rescour.user',
            'rescour.utility',
            'rescour.market',
            'rescour.browserDetect',
            'rescour.powers',
            'ngProgress',
            'ahTouch'
        ])
    .config(['$routeProvider', '$locationProvider', '$httpProvider', 'BrowserDetectProvider',
        function ($routeProvider, $locationProvider, $httpProvider, BrowserDetectProvider) {
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
    .controller("AppController", ['$scope', '$rootScope', '$location', '$_api', '$http', '$window',
        function ($scope, $rootScope, $location, $_api, $http, $window) {
            angular.element($window).bind('resize', _.debounce(function () {
                $rootScope.$broadcast('window-resized')
            }, 150));

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
        }])
