/**
 * Created with JetBrains WebStorm.
 * User: apledger
 * Date: 4/24/13
 * Time: 3:21 PM
 * File: /app/account/account.js
 */

'use strict';

angular.module('rescour.app')
    .config(['$routeProvider',
        function ($routeProvider) {
            $routeProvider
                .when('/account/:status', {
                    templateUrl: "/app/account/desktop/views/account.html",
                    controller: 'AccountController',
                    resolve: {
                        loadUser: function (User, $q) {
                            var defer = $q.defer();
                            User.getProfile().then(function (response) {
                                defer.resolve(response);
                            }, function (response) {
                                defer.reject(response);
                            });
                            return defer.promise;
                        },
                        loadBilling: function (User, $q) {
                            var defer = $q.defer();
                            User.getBilling().then(function (response) {
                                defer.resolve(response);
                            }, function (response) {
                                defer.reject(response);
                            });

                            return defer.promise;
                        }
                    }
                });
        }])
    .controller('AccountController', ['$scope', 'loadUser', '$_api', '$http', 'User', '$routeParams', '$rootScope', '$location', 'loadBilling',
        function ($scope, loadUser, $_api, $http, User, $routeParams, $rootScope, $location, loadBilling) {

            $scope.user = User;

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
                    templateUrl: '/app/account/desktop/views/partials/profile.html',
                    title: 'Profile'
                },
                accountSettings: {
                    templateUrl: '/app/account/desktop/views/partials/settings.html',
                    title: 'Account Settings'
                },
                subscription: {
                    templateUrl: '/app/account/desktop/views/partials/subscription.html',
                    title: 'Subscription'
                },
                billing: {
                    templateUrl: '/app/account/desktop/views/partials/billing.html',
                    title: 'Billing'
                }
            };

            if (_.contains($scope.user.profile.roles, 'staff')) {
                $scope.accountSubviews = {
                    profile: {
                        templateUrl: '/app/account/desktop/views/partials/profile.html',
                        title: 'Profile'
                    },
                    accountSettings: {
                        templateUrl: '/app/account/desktop/views/partials/settings.html',
                        title: 'Account Settings',
                        selected: true
                    }
                };
                $scope.selectSubview('accountSettings');
            }
            else if ($routeParams.status === 'activate' && !_.contains($scope.user.profile.roles, 'good standing')) {
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

            $scope.saveProfile = function () {
                $scope.user.saveProfile().then(function (response) {
                    $scope.accountAlerts = [
                        {
                            type: 'success',
                            msg: 'Profile saved!',
                            action: true
                        }
                    ];
                });
            };
        }])
    .controller('AccountProfileController', ['$scope', '$_api', '$http', '$q',
        function ($scope, $_api, $http, $q) {

            $scope.saveUserField = function () {
                var defer = $q.defer();
                if ($scope.formProfile.$valid && $scope.formProfile.$dirty) {
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
                if ($scope.formChangePassword.$valid) {
                    var path = $_api.path + '/auth/users/user/',
                        config = angular.extend({
                            transformRequest: function (data) {
                                $scope.accountAlerts = [
                                    {
                                        type: 'info',
                                        msg: 'Saving...'
                                    }
                                ];
                                return data;
                            }
                        }, $_api.config),
                        body = JSON.stringify({
                            oldPassword: $scope.creds.oldPassword,
                            newPassword: $scope.creds.newPassword,
                            verifyPassword: $scope.creds.verifyPassword
                        });

                    $http.put(path, body, config).then(
                        function (response) {
                            $scope.accountAlerts = [
                                {
                                    type: 'success',
                                    msg: 'Password change successful!'
                                }
                            ];
                        },
                        function (response) {
                            $scope.accountAlerts = [
                                {
                                    type: 'error',
                                    msg: 'Error changing password.'
                                }
                            ];
                        }
                    );
                }
            };

        }])
    .controller('CancelAccountDialogController', ['$scope', 'dialog',
        function ($scope, dialog) {
            $scope.cancelFields = {};
            $scope.close = function () {
                dialog.close();
            };

            $scope.cancelSubscription = function (cancelFields) {
                if ($scope.formCancelSubscriptionDialog.$valid) {
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
            $scope.creds = {};

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
                    templateUrl: "/app/account/desktop/views/partials/cancel-account-dialog.html",
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
        }]);