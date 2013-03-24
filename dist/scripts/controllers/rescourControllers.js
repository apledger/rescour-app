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
            $scope.logout = function () {
                $scope.$emit('auth#logoutRequest');
            };
        }])
    .controller('LoginController', ['$scope',
        function ($scope) {
            $scope.creds = {};

            $scope.login = function () {
                $scope.$emit("auth#loginRequest", $scope.creds);
            };

        }])
    .controller('AccountController', ['$scope', 'loadUser',
        function ($scope, loadUser) {
            $scope.user = loadUser;
        }]);