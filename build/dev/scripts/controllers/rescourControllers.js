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
                    transformRequest:$_api.loading.none
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
                    transformRequest:$_api.loading.none
                }, $_api.config),
                body = JSON.stringify({
                    token:$location.search().token,
                    password:$scope.creds.password
                });

            $http.post(path, body, config).then(function (response) {
                console.log(response);
            }, function (response) {

            });
        };

    }])
    .controller('AccountController', ['$scope', 'loadUser', '$_api', '$http', 'User',
    function ($scope, loadUser, $_api, $http, User) {
        $scope.user = User.getUser();

        $scope.accountViews = [
            {name:'Profile', selected:true, partial:'/views/account/partials/profile.html'},
            {name:'Account Settings', selected:false, partial:'/views/account/partials/accountSettings.html'},
            {name:'Billing', selected:false, partial:'/views/account/partials/billing.html'}
        ];

        $scope.currentView = $scope.accountViews[0].partial;

        $scope.changeAccountView = function (view) {
            angular.forEach($scope.accountViews, function (value, key) {
                value.selected = false;
            });

            view.selected = true;
            $scope.currentView = view.partial;
        }
    }])
    .controller('AccountProfileController', ['$scope', '$_api', '$http', '$q',
    function ($scope, $_api, $http, $q) {

        $scope.saveUserField = function () {
            var defer = $q.defer();
            if ($scope.formProfile.$valid && $scope.formProfile.$dirty) {
                console.log($scope.user);
                var path = $_api.path + '/auth/users/user/',
                    config = angular.extend({
                        transformRequest:$_api.loading.none
                    }, $_api.config),
                    body = JSON.stringify($scope.user);

                $http.put(path, body, config).then(function (response) {

                }, function (response) {

                });
            } else {
                defer.reject()
            }
        }

    }])
    .controller('AccountSettingsController', ['$scope', '$_api', '$http', '$q', '$dialog',
    function ($scope, $_api, $http, $q, $dialog) {
        $scope.creds = {};
        $scope.changePassword = function () {
            var defer = $q.defer();
            if ($scope.formChangePassword.$valid && $scope.formPassword.oldPassword.$dirty) {
                console.log($scope.creds);
                var path = $_api.path + '/auth/users/user/',
                    config = angular.extend({
                        transformRequest:$_api.loading.none
                    }, $_api.config),
                    body = JSON.stringify($scope.creds);

                $http.put(path, body, config).then(function (response) {

                }, function (response) {

                });
            } else {
                defer.reject()
            }
        }

        $scope.openCancelDialog = function () {
            $dialog.dialog({
                backdrop:true,
                keyboard:true,
                backdropClick:true,
                dialogFade:true,
                backdropFade:true,
                templateUrl:"/views/account/partials/cancelAccountDialog.html",
                controller:"CancelAccountDialogController"
            }).open()
                .then(function (result) {
                    if (result) {
                        if (result.action === 'save') {
                            $scope.cancelAccount(result.reason);
                        }
                    }
                });
        }

        $scope.cancelAccount = function (reason) {
            var defer = $q.defer();
            var path = $_api.path + '/mail/',
                config = angular.extend({
                    transformRequest:$_api.loading.none
                }, $_api.config),
                body = {
                    message: reason,
                    from_user: $scope.user.email
                };
                body = JSON.stringify(body);

            $http.post(path, body, config).then(function (response) {

            }, function (response) {

            });
        }


    }])
    .controller('CancelAccountDialogController', ['$scope', 'dialog',
    function ($scope, dialog) {
        $scope.cancelFields = {};
        $scope.close = function () {
            dialog.close();
        };

        $scope.continue = function (cancelFields) {
            console.log(cancelFields);
            dialog.close({
                action:'save',
                reason: cancelFields.reason
            });
        };
    }])
    .controller('AccountBillingController', ['$scope', '$_api', '$http', '$q', 'Billing',
    function ($scope, $_api, $http, $q, Billing) {
        $scope.billingInfo = Billing.getBillingInfo();


    }]);