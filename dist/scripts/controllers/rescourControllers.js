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
    .controller('LoginController', ['$scope', '$location', '$http', '$_api',
        function ($scope, $location) {
            $scope.creds = {};

            $scope.login = function () {
                $scope.$emit("auth#loginRequest", $scope.creds);
            };

            $scope.forgotPassword = function () {
                $location.path('/login/forgot-password');
            };

        }])
    .controller('ForgotPasswordController', ['$scope', '$location', '$http', '$_api',
        function ($scope, $location, $http, $_api) {
            $scope.creds = {};

            $scope.emailInstructions = function () {
                var path = $_api.path + '/auth/reset/',
                    config = angular.extend({
                        transformRequest: $_api.loading.none
                    }, $_api.config),
                    body = JSON.stringify($scope.creds);

                console.log(body);

                $http.post(path, body, config).then(function (response) {
                    console.log(response);
                }, function (response) {

                });
            };

        }])
    .controller('ResetPasswordController', ['$scope', '$location', '$http', '$_api',
        function ($scope, $location, $http, $_api) {
            $scope.creds = {};

            $scope.resetPassword = function () {
                var path = $_api.path + '/auth/reset/',
                    config = angular.extend({
                        transformRequest: $_api.loading.none
                    }, $_api.config),
                    body = JSON.stringify({
                        token: $location.search('token').target,
                        password: $scope.creds.password
                    });

                console.log(body);

                $http.post(path, body, config).then(function (response) {
                    console.log(response);
                }, function (response) {

                });
            };

        }])
    .controller('AccountController', ['$scope', 'loadUser',
        function ($scope, loadUser) {
            $scope.user = loadUser;
        }]);