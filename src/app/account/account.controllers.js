angular.module('rescour.app')
    .controller('AccountCtrl',
    function ($scope, Environment, $http, User) {
        $scope.user = User;

        $scope.saveProfile = function () {
            $scope.setAlert({
                type: 'info',
                text: 'Updating Profile...'
            });

            User.saveProfile().then(function () {
                $scope.setAlert({
                    type: 'success',
                    text: 'Profile updated'
                });
            }, function () {
                $scope.setAlert({
                    type: 'danger',
                    text: 'Failed to update profile'
                });
            });
        };

        $scope.setAlert = function (alert) {
            $scope.alerts = [alert];
        };

        $scope.clearAlert = function (alert) {
            $scope.alerts = _.without($scope.alerts, alert);
        };
    })
    .controller('AccountChangePasswordCtrl', function ($scope, User) {
        $scope.changePassword = function () {

            $scope.setAlert({
                type: 'info',
                text: 'Changing Password...'
            });

            User.changePassword($scope.newPasswordCreds).then(function (response) {
                $scope.setAlert({
                    type: 'success',
                    text: 'Password successfully changed'
                });
                $scope.newPasswordCreds = {};
                $scope.formChangePassword.$setPristine();
            }, function () {
                $scope.setAlert({
                    type: 'danger',
                    text: 'Failed to change password.'
                });
            });
        };
    })
    .controller('AccountSubscriptionCtrl',
    function ($scope, Environment, $http, $q, $location, $modal) {
        $scope.addSubscription = function (type) {
            $scope.confirmPasswordDialog =
                $modal
                    .open({
                        backdrop: true,
                        keyboard: true,
                        backdropClick: true,
                        dialogFade: true,
                        backdropFade: true,
                        templateUrl: '/app/account/templates/account.modals.confirm-password.html?' + Date.now(),
                        controller: 'ConfirmPasswordModalCtrl'
                    })
                    .result.then(function (creds) {
                        if (creds) {
                            var token = function (res) {
                                $scope.setAlert({
                                    type: 'info',
                                    text: 'Authorizing...'
                                });

                                $scope.user.addStripe(res.id)
                                    .then(function (response) {
                                        return User.login(creds);
                                    }, function (response) {
                                        if (response.status === 400) {
                                            $scope.setAlert({
                                                type: 'danger',
                                                text: response.data.status_message
                                            });
                                        }
                                    })
                                    .then(function (response) {
                                        $location.path('/');
                                    }, function (response) {
                                        $location.path('/');
                                    });
                            };

                            StripeCheckout.open({
                                key: Environment.stripe.token,
                                address: true,
                                name: 'Rescour',
                                currency: 'usd',
                                image: '/assets/img/icon-fitted-small.png',
                                description: 'Activate your trial!',
                                panelLabel: 'Checkout',
                                token: token
                            });
                        }
                    }, function () {
                        $location.path('/login');
                    });
        };

        $scope.openCancelDialog = function () {
            $modal.open({
                backdrop: true,
                keyboard: true,
                backdropClick: true,
                dialogFade: true,
                backdropFade: true,
                templateUrl: '/app/account/templates/account.modals.cancel-account.html?' + Date.now(),
                controller: 'CancelAccountModalCtrl'
            });
        };
    })
    .controller('CancelAccountModalCtrl',
    function ($scope, $modalInstance, Message) {
        $scope.message = {};
        $scope.cancelAccountAlerts = []
        $scope.close = function () {
            $modalInstance.close();
        };

        $scope.cancelAccount = function () {
            $scope.cancelAccountAlerts = [
                { type: 'info',text: 'Sending...' }
            ];

            Message
                .send($scope.message)
                .then(function (response) {
                    $scope.cancelAccountAlerts = [];
                    $modalInstance.close();
                })
        };
    })
    .controller('ConfirmPasswordModalCtrl',
    function ($scope, $modalInstance, User, Environment, $http, $timeout) {
        $scope.confirmPasswordAlerts = [];
        $scope.creds = {
            email: User.profile.email
        };

        $scope.close = function () {
            $modalInstance.close();
        };

        $scope.sendPassword = function () {
            User.login($scope.creds).then(function (response) {
                    $scope.confirmPasswordAlerts = [
                        { type: 'success', text: 'Success!' }
                    ];

                    $timeout(function () {
                        $modalInstance.close($scope.creds);
                    }, 1000);
                }, function () {
                    $scope.confirmPasswordAlerts = [
                        { type: 'danger', text: 'Invalid Credentials.  Logging out..' }
                    ];

                    $timeout(function () {
                        $modalInstance.close();
                    }, 1000);
                }
            );
        };
    });