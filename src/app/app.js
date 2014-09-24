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
            'ui.router',
            'ui.utils',
            'ui.bootstrap',
            'ngAnimate',
            'chieffancypants.loadingBar',
            'rescour.config',
            'rescour.core',
            'segmentio'
        ])
    .config(function ($httpProvider, $locationProvider, $urlRouterProvider, $stateProvider, cfpLoadingBarProvider) {
        $httpProvider.defaults.useXDomain = true;
        $httpProvider.defaults.withCredentials = true;
        $httpProvider.defaults.headers.common = {
            'Content-Type': 'application/json'
        };
        $locationProvider.html5Mode(true);
        cfpLoadingBarProvider.includeSpinner = false;

        $urlRouterProvider
            .when('/', '/market')
            .when('', '/market');

        $stateProvider.state('home', {
            url: '',
            abstact: true,
            template: "<ui-view></ui-view>",
            controller: 'AppCtrl',
            resolve: {
                CurrentUser: function (User) {
                    var defer = $q.defer();

                    User.get().then(function (response) {
                        defer.resolve(response);
                    }, function (response) {
                        defer.reject(response);
                    });

                    return defer.promise;
                }
            }
        });

    })
    .run(function ($rootScope, $state, $stateParams, segmentio) {
        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;
        $rootScope.rootState = {
            loading: false,
            loaded: false,
            failured: false
        };

        $rootScope.isRootLoading = function () {
            return $rootScope.rootState.loading;
        };

        $rootScope.isRootLoaded = function () {
            return $rootScope.rootState.loaded;
        };

        $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
            var toStateRoot = toState.name.split('.')[0],
                fromStateRoot = fromState.name.split('.')[0];

            if (toStateRoot !== fromStateRoot) {
                $rootScope.rootState.loading = true;
                $rootScope.rootState.loaded = false;
            }
        });

        $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
            $rootScope.rootState.loading = false;
            $rootScope.rootState.loaded = true;
        });

        segmentio.load("ath2m79akg");
    })
    .controller('AppCtrl',
    function ($scope, $modal) {
        $scope.openFeedbackModal = function () {
            $modal.open({
                backdrop: true,
                keyboard: true,
                backdropClick: true,
                dialogFade: true,
                backdropFade: true,
                templateUrl: '/app/market/templates/market.modals.feedback.html?v=' + Date.now().feedback,
                controller: 'FeedbackModalCtrl'
            });
        };
    })
    .controller('FeedbackModalCtrl',
    function ($scope, $http, $modalInstance, $timeout, Environment, User) {
        $scope.feedback = {
            to: 'info@rescour.com',
            subject: User.profile.firstName + " " + User.profile.lastName + " Feedback"
        };
        $scope.alerts = [];

        $scope.sendFeedback = function () {
            if ($scope.feedback.text) {
                var path = Environment.path + '/messages/',
                    config = angular.extend({
                        transformRequest: function (data) {
                            return data;
                        }
                    }, Environment.config),
                    body = JSON.stringify($scope.feedback);

                $http.post(path, body, config).then(
                    function (response) {
                        $scope.feedback.text = "";
                        $scope.alerts = [
                            {
                                type: 'success',
                                text: 'Thank you for your feedback!'
                            }
                        ];

                        $timeout(function () {
                            $modalInstance.close();
                        }, 1000);
                    },
                    function (response) {
                        $scope.alerts = [
                            {
                                type: 'success',
                                text: 'Thank you for your feedback!'
                            }
                        ];
                    }
                );
            }
        };

        $scope.close = function () {
            $modalInstance.close();
        };
    });
