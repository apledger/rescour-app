/**
 * Created with JetBrains WebStorm.
 * User: apledger
 * Date: 4/24/13
 * Time: 4:49 PM
 * File: /app/login/login.js
 */

'use strict';

angular.module('rescour.app')
    .config(['$routeProvider',
        function ($routeProvider) {
            $routeProvider.when('/login', {
                templateUrl: "/app/login/desktop/views/login.html",
                controller: 'LoginController',
                resolve: {
                    checkUser: function ($rootScope, $location) {
//                        $rootScope.ping().then(function (response) {
//                            console.log("ping success");
//                            $location.path('/');
//                        });
                    }
                }
            });

            $routeProvider.when('/login/forgot-password', {
                templateUrl: "/app/login/desktop/views/forgot-password.html",
                controller: 'ForgotPasswordController'
            });

            $routeProvider.when('/login/reset-password', {
                templateUrl: "/app/login/desktop/views/reset-password.html",
                controller: 'ResetPasswordController',
                resolve: {
                    checkToken: function ($location) {
                        if (!$location.search().token) {
                            $location.path('/login/forgot-password');
                        }
                    }
                }
            });
        }])
    .controller('LoginController', ['$scope', '$location', '$http', '$_api',
        function ($scope, $location, $http, $_api) {
            $scope.creds = {};
            $scope.loginAlerts = [];
            var loginFailAlert = { type: 'error', msg: 'Incorrect email password combination.  Please try again.' },
                loginAuthenticatingAlert = { type: 'info', msg: 'Authenticating' };

            $scope.login = function () {
                var path = $_api.path + '/auth/login/',
                    config = angular.extend({
                        transformRequest: function (data) {
                            $scope.loginAlerts = [loginAuthenticatingAlert];

                            return data;
                        }
                    }, $_api.config),
                    body = JSON.stringify($scope.creds);

                $http.post(path, body, config).then(function (response) {
                    $scope.loginAlerts = [];
                    $scope.$broadcast('auth#resendRequests');
                    $location.path('/');
                }, function (response) {
                    $scope.loginAlerts = [loginFailAlert];
                    $scope.creds.password = "";
                });
            };

            $scope.forgotPassword = function () {
                $location.path('/login/forgot-password');
            };
        }])
    .controller('ForgotPasswordController', ['$scope', '$location', '$http', '$_api',
        function ($scope, $location, $http, $_api) {
            $scope.creds = {};
            $scope.forgotPasswordAlerts = [];

            $scope.emailInstructions = function () {
                var path = $_api.path + '/auth/reset/',
                    config = angular.extend({
                        transformRequest: function (data) {
                            $scope.forgotPasswordAlerts = [
                                {
                                    type: 'info',
                                    msg: 'Sending email...'
                                }
                            ];

                            return data;
                        }
                    }, $_api.config),
                    body = JSON.stringify($scope.creds);

                $http.post(path, body, config).then(function (response) {
                    $scope.creds = {};
                    $scope.forgotPasswordAlerts = [
                        {
                            type: 'success',
                            msg: 'Please check your email!'
                        }
                    ];
                }, function (response) {
                    $scope.forgotPasswordAlerts = [
                        {
                            type: 'error',
                            msg: 'Invalid email, please try again'
                        }
                    ];
                });
            };
        }])
    .controller('ResetPasswordController', ['$scope', '$location', '$http', '$_api', '$timeout',
        function ($scope, $location, $http, $_api, $timeout) {
            $scope.creds = {};
            $scope.resetPasswordAlerts = [];

            $scope.resetPassword = function () {
                if ($scope.formResetPassword.$valid) {
                    var path = $_api.path + '/auth/reset/',
                        config = angular.extend({
                            transformRequest: function (data) {
                                $scope.resetPasswordAlerts = [
                                    {
                                        type: 'info',
                                        msg: 'Resetting password...'
                                    }
                                ];

                                return data;
                            }
                        }, $_api.config),
                        body = JSON.stringify({
                            token: $location.search().token,
                            newPassword: $scope.creds.newPassword,
                            verifyPassword: $scope.creds.verifyPassword
                        });

                    $http.post(path, body, config).then(function (response) {
                        $scope.resetPasswordAlerts = [
                            {
                                type: 'success',
                                msg: 'Password changed!  Redirecting to login..'
                            }
                        ];

                        $timeout(function () {
                            $location.path('/login');
                        }, 1000);
                    }, function (response) {
                        $scope.resetPasswordAlerts = [
                            {
                                type: 'error',
                                msg: response.data.status_message
                            }
                        ];
                    });
                }
            };
        }]);