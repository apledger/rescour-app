'use strict';

angular.module('rescour.app')
    .controller("AppController", ['$scope', '$rootScope', '$location', '$_api', '$http',
        function ($scope, $rootScope, $location, $_api, $http) {
            $rootScope.$on("$routeChangeStart", function (event, next, current) {
                $scope.loading = true;
            });
            $rootScope.$on("$routeChangeSuccess", function (event, current, previous) {
                $scope.loading = false;
            });
            $rootScope.$on("$routeChangeError", function (event, current, previous, rejection) {
                $scope.loading = false;
            });

            $scope.resetPermission = function () {
                $rootScope.ping().then(function (response) {
                    var path = $_api.path + '/auth/users/' + response.data.user + '/roles/',
                        config = angular.extend({
                            transformRequest: function (data) {
                                return data;
                            }
                        }, $_api.config),
                        body = JSON.stringify(["verified"]);

                    $http.put(path, body, config).then(function (response) {
                        console.log("Successful reset", response);
                    }, function (response) {
                        console.log("Error reset", response);
                    });
                });
            }
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
                            new_password: $scope.creds.newPassword,
                            verify_password: $scope.creds.newPassword
                        });

                    $http.post(path, body, config).then(function (response) {
                        $scope.resetPasswordAlerts = [
                            {
                                type: 'success',
                                msg: 'Please login'
                            }
                        ];

                        $timeout(function () {
                            $location.path('/login');
                        }, 2000);

                        $scope.creds = {};
                    }, function (response) {
                        $scope.resetPasswordAlerts = [
                            {
                                type: 'error',
                                msg: response.data.status_message
                            }
                        ];

                        $scope.creds = {};
                    });
                }
            };

        }])
    .controller('AccountController', ['$scope', 'loadUser', '$_api', '$http', 'User', '$routeParams', '$rootScope', '$location', 'loadBilling',
        function ($scope, loadUser, $_api, $http, User, $routeParams, $rootScope, $location, loadBilling) {

            $scope.user = User;
            console.log($scope.user);
            console.log(loadBilling);
            $scope.billing = loadBilling;

            $scope.selectSubview = function (subview) {
                if (_.isObject(subview)) {
                    angular.forEach($scope.accountSubviews, function (value, key) {
                        if (value.title === subview.title) {
                            value.selected = true;
                            $scope.activeSubview = key;
                        } else {
                            value.selected = false;
                        }
                    });
                } else if ($scope.accountSubviews.hasOwnProperty(subview)) {
                    angular.forEach($scope.accountSubviews, function (value, key) {
                        value.selected = false;
                    });
                    $scope.accountSubviews[subview].selected = true;
                    $scope.activeSubview = subview;
                } else {
                    throw new Error("Unknown subview " + subview);
                }
            };

            $scope.accountSubviews = {
                profile: {
                    templateUrl: '/views/account/partials/profile.html',
                    title: 'Profile'
                },
                accountSettings: {
                    templateUrl: '/views/account/partials/accountSettings.html',
                    title: 'Account Settings',
                    selected: true
                },
                subscription: {
                    templateUrl: '/views/account/partials/subscription.html',
                    title: 'Subscription',
                    disabled: true
                },
                billing: {
                    templateUrl: '/views/account/partials/billing.html',
                    title: 'Billing'
                }
            };

            if ($routeParams.status === 'activate' && !_.contains($scope.user.profile.roles, 'good standing')) {
                $scope.accountAlerts = [
                    {
                        type: 'info',
                        msg: 'Welcome! Please pick a subscription trial plan to continue to the application.'
                    }
                ];
                $scope.selectSubview('subscription');
            } else if ($routeParams.status === 'welcome') {
                $scope.activePlan = $scope.user.billing.subscription.plan.name;
                $scope.accountAlerts = [
                    {
                        type: 'success',
                        msg: 'Authorization Successful!',
                        action: true
                    }
                ];
                $scope.selectSubview('subscription');

            } else {
                $scope.activePlan = $scope.user.billing.subscription.plan.name;
                $scope.selectSubview('accountSettings');
            }

            $scope.goToApp = function () {
                $location.path('/');
            };
        }])
    .controller('AccountProfileController', ['$scope', '$_api', '$http', '$q',
        function ($scope, $_api, $http, $q) {

            $scope.saveUserField = function () {
                var defer = $q.defer();
                if ($scope.formProfile.$valid && $scope.formProfile.$dirty) {
                    console.log($scope.user);
                    var path = $_api.path + '/auth/users/user/',
                        config = angular.extend({
                            transformRequest: $_api.loading.none
                        }, $_api.config),
                        body = JSON.stringify($scope.user);

                    $http.put(path, body, config).then(function (response) {

                    }, function (response) {

                    });
                } else {
                    defer.reject();
                }
            };
        }])
    .controller('AccountSettingsController', ['$scope', '$_api', '$http', '$q', '$dialog',
        function ($scope, $_api, $http, $q, $dialog) {
            $scope.creds = {};
            $scope.changePassword = function () {
                var defer = $q.defer();
                if ($scope.formChangePassword.$valid && $scope.formPassword.oldPassword.$dirty) {
                    var path = $_api.path + '/auth/users/user/',
                        config = angular.extend({
                            transformRequest: $_api.loading.none
                        }, $_api.config),
                        body = JSON.stringify($scope.creds);

                    $http.put(path, body, config).then(function (response) {

                    }, function (response) {

                    });
                } else {
                    defer.reject();
                }
            }

        }])
    .controller('CancelAccountDialogController', ['$scope', 'dialog',
        function ($scope, dialog) {
            $scope.cancelFields = {};
            $scope.close = function () {
                dialog.close();
            };

            $scope.cancelSubscription = function (cancelFields) {
                if ($scope.formCancelSubscriptionDialog.$valid) {
                    console.log("sup");
                    dialog.close({
                        action: 'save',
                        reason: cancelFields.reason
                    });
                }

            };
        }])
    .controller('AccountBillingController', ['$scope', '$_api', '$http', '$q',
        function ($scope, $_api, $http, $q, Billing) {
        }])
    .controller('AccountSubscriptionController', ['$scope', '$_api', '$http', '$q', '$location', '$dialog',
        function ($scope, $_api, $http, $q, $location, $dialog) {

            $scope.addSubscription = function (type) {
                var token = function (res) {
                    var path = $_api.path + '/auth/users/user/payment/',
                        config = angular.extend({
                            transformRequest: function (data) {
                                $scope.accountAlerts = [
                                    {
                                        type: 'info',
                                        msg: 'Authorizing...'
                                    }
                                ];
                                return data;
                            }
                        }, $_api.config),
                        body = JSON.stringify({token: res.id});

                    $http.post(path, body, config).then(function (response) {
                        $location.path('/');
                    }, function (response) {
                        if (response.status === 400) {
                            $scope.accountAlerts = [
                                {
                                    type: 'error',
                                    msg: response.data.status_message
                                }
                            ];
                        }
                    });
                };

                StripeCheckout.open({
                    key: $_api.stripeToken,
                    address: true,
                    name: 'Rescour',
                    currency: 'usd',
                    image: '/img/stripe-icon.png',
                    description: 'Activate your trial!',
                    panelLabel: 'Checkout',
                    token: token
                });
            };

            $scope.openCancelDialog = function () {
                $dialog.dialog({
                    backdrop: true,
                    keyboard: true,
                    backdropClick: true,
                    dialogFade: true,
                    backdropFade: true,
                    templateUrl: "/views/account/partials/cancelAccountDialog.html",
                    controller: "CancelAccountDialogController"
                }).open()
                    .then(function (result) {
                        var defer = $q.defer();
                        if (result) {
                            if (result.action === 'save') {
                                return $scope.user.cancelSubscription(result.reason, function (data) {
                                    $scope.accountAlerts = [
                                        {
                                            type: 'info',
                                            msg: 'Sending...'
                                        }
                                    ];

                                    return data;
                                });
                            } else {
                                defer.reject();
                            }
                        }
                        return defer.promise;
                    })
                    .then(function (response) {
                        $scope.accountAlerts = [
                            {
                                type: 'success',
                                msg: 'Cancellation request received.  Your request will be processed shortly.'
                            }
                        ];
                    }, function (response) {
                        $scope.accountAlerts = [
                            {
                                type: 'error',
                                msg: 'Something went wrong, please try again.'
                            }
                        ];
                    });
            };

            $scope.cancelSubscription = function (reason) {

            };
        }]);