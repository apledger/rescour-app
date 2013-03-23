'use strict';

angular.module('rescour.app')
    .controller("AppController", ['$scope', '$rootScope', '$location',
        function ($scope, $rootScope, $location) {
            $rootScope.$on("$routeChangeStart", function (event, next, current) {

            });
            $rootScope.$on("$routeChangeSuccess", function (event, current, previous) {

            });
            $rootScope.$on("$routeChangeError", function (event, current, previous, rejection) {

            });
        }])
    .controller('LoginController', ['$scope',
        function ($scope) {
            $scope.creds = {};

            $scope.login = function () {
                $scope.$emit("auth#loginRequest", $scope.creds);
            };
        }])
    .controller('AccountController', ['$scope',
        function ($scope) {

        }]);