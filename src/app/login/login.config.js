angular.module('rescour.app')
    .config(function ($stateProvider, $urlRouterProvider) {
        $urlRouterProvider
            .when('/login/', '/login')
            .when('/login/forgot/', '/login/forgot')
            .when('/login/reset/', '/login/reset')
            .when('/logout/', '/logout');

        $stateProvider
            .state('login', {
                templateUrl: '/app/login/views/login.html',
                abstract: true,
                url: '/login'
            })
            .state('login.signIn', {
                templateUrl: '/app/login/views/login.sign-in.html',
                controller: 'LoginCtrl',
                url: ''
            })
            .state('login.forgot', {
                templateUrl: '/app/login/views/login.forgot-password.html',
                controller: 'ForgotPasswordCtrl',
                url: '/forgot'
            })
            .state('login.reset', {
                templateUrl: '/app/login/views/login.reset-password.html',
                controller: 'ResetPasswordCtrl',
                url: '/reset-password'
            })
            .state('logout', {
                url: '/logout',
                resolve: {
                    logout: function ($rootScope, MDUMarket, NewsMarket, segmentio) {
                        MDUMarket.initialized = false;
                        NewsMarket.initialized = false;
                        $rootScope.$broadcast('auth.logoutRequest');
                    }
                }
            });
    });