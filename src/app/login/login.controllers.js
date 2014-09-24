angular.module('rescour.app')
    .controller('LoginCtrl',
    function ($scope, $location, Auth) {
        $scope.creds = {};
        $scope.loginAlerts = [];

        $scope.login = function () {
            $scope.loginAlerts = [
                { type: 'info', text: 'Authenticating' }
            ];

            Auth
                .login({
                    email: $scope.creds.email,
                    password: $scope.creds.password
                })
                .then(function () {
                    $scope.$broadcast('auth.resendRequests');
                    $location.path('/');
                }, function () {
                    $scope.loginAlerts = [
                        { type: 'danger', text: 'Incorrect email password combination.  Please try again.' }
                    ];
                    $scope.creds.password = "";
                });
        };

        $scope.forgotPassword = function () {
            $location.path('/login/forgot');
        };
    })
    .controller('ForgotPasswordCtrl',
    function ($scope, Auth) {
        $scope.creds = {};
        $scope.forgotPasswordAlerts = [];

        $scope.emailInstructions = function () {
            $scope.forgotPasswordAlerts = [
                { type: 'info', text: 'Sending email...' }
            ];

            Auth
                .forgot({
                    email: $scope.creds.email
                })
                .then(function () {
                    $scope.creds = {};
                    $scope.forgotPasswordAlerts = [
                        { type: 'success', text: 'Please check your email!' }
                    ];
                }, function () {
                    $scope.forgotPasswordAlerts = [
                        { type: 'danger', text: 'Invalid email, please try again' }
                    ];
                });
        };
    })
    .controller('ResetPasswordCtrl',
    function ($scope, $location, Auth, $timeout) {
        $scope.newPasswordCreds = {};
        $scope.resetPasswordAlerts = [];

        $scope.resetPassword = function () {
            $scope.resetPasswordAlerts = [
                { type: 'info', text: 'Resetting password...' }
            ];

            Auth
                .reset({
                    token: $location.search().token,
                    password: $scope.newPasswordCreds.password,
                    verifyPassword: $scope.newPasswordCreds.verifyPassword
                })
                .then(function () {
                    $scope.resetPasswordAlerts = [
                        { type: 'success', text: 'Password changed!  Redirecting to login..' }
                    ];

                    $timeout(function () {
                        $location.path('/login');
                    }, 1000);
                }, function (response) {
                    $scope.resetPasswordAlerts = [
                        { type: 'danger', text: 'Failed to reset password.' }
                    ];
                })

        };
    });