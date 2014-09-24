angular.module('rescour.app')
    .config(function ($stateProvider, $urlRouterProvider) {
        $urlRouterProvider
            .when('/account', '/account/profile')
            .when('/account/', '/account/profile')
            .when('/account/:pane/', '/account/:pane');

        $stateProvider
            .state('account', {
                templateUrl: '/app/account/views/account.html',
                controller: 'AccountCtrl',
                url: '/account',
                resolve: {
                    user: function (User, $q) {
                        var defer = $q.defer();

                        User.get().then(function () {
                            defer.resolve(User);
                        });

                        return defer.promise;
                    }
                }
            })
            .state('account.pane', {
                url: '/:pane',
                templateUrl: function ($stateParams) {
                    return '/app/account/views/account.' + $stateParams.pane + '.html'
                }
            });
    });