/**
 * Created with JetBrains WebStorm.
 * User: apledger
 * Date: 4/24/13
 * Time: 4:56 PM
 * File: /app/home/home.js
 */

angular.module('rescour.app')
    .config(function ($stateProvider, $tooltipProvider, $urlRouterProvider) {
        $tooltipProvider.options({
            appendToBody: true
        });

        $tooltipProvider.setTriggers({
            'mouseover': 'click mouseleave',
            'mouseenter': 'mouseleave'
        });

        $urlRouterProvider
            .when('/market', '/market/mdu/map')
            .when('/market/', '/market/mdu/map')
            .when('/market/mdu', 'market/mdu/map')
            .when('/market/mdu/', 'market/mdu/map')
            .when('/market/mdu/map/', 'market/mdu/map')
            .when('/market/mdu/report/', 'market/mdu/report')
            .when('/market/mdu/:itemId/', 'market/mdu/:itemId/details')
            .when('/market/mdu/:itemId/:pane/', 'market/mdu/:itemId/:pane')
            .when('/market/mdu/report/:itemId/', 'market/mdu/report/:itemId')
            .when('/market/mdu/report/:itemId/:pane/', 'market/mdu/report/:itemId/:pane');

        $stateProvider
            .state('market', {
                abstract: true,
                templateUrl: '/app/market/views/market.html',
                controller: 'MarketCtrl',
                url: '/market'
            })
            .state('market.mdu', {
                abstract: true,
                url: '/mdu',
                templateUrl: '/app/market/views/market.mdu.html',
                resolve: {
                    load: function ($q, MDU, MDUMarket, News, NewsMarket, $log, StatesPolygon, User, Comment, Hidden, Favorite, CustomField) {
                        var mduDefer = $q.defer(),
                            newsDefer = $q.defer();

                        if (!MDUMarket.initialized) {
                            MDU.query()
                                .then(function (results) {
                                    MDUMarket.initialize(MDU.dimensions, results);
                                    Comment.query(MDUMarket.items);
                                    Favorite.query(MDUMarket.items);
                                    Hidden.query(MDUMarket.items).then(function (response) {
                                        MDUMarket.apply();
                                        MDUMarket.predict();
                                    });
                                    CustomField.query(MDUMarket.items);
                                    $log.debug('Resolved MDUMarket', MDUMarket);
                                    return StatesPolygon.initialize();
                                }).then(function () {
                                    mduDefer.resolve();
                                });
                        } else {
                            $log.debug('Resolved Cached MDUMarket', MDUMarket);
                            mduDefer.resolve();
                        }

                        User.get().then(function () {
                            $log.debug("Resolved User", User);
                        });

                        return $q.all([mduDefer.promise]);
                    }
                }
            })
            .state('market.mdu.list', {
                url: '',
                abstract: true,
                templateUrl: '/app/market/views/market.mdu.list.html',
                controller: 'ListCtrl',
                data: {
                    view: 'map'
                }
            })
            .state('market.mdu.list.map', {
                url: '/map',
                templateUrl: '/app/market/views/market.mdu.list.map.html',
                data: {
                    view: 'map'
                }
            })
            .state('market.mdu.list.newPin', {
                url: '/pins/new',
                templateUrl: '/app/market/views/market.mdu.pin.html',
                data: {
                    isFresh: true
                },
                controller: 'PinCtrl'
            })
            .state('market.mdu.list.newPin.pane', {
                url: '/:pane',
                templateUrl: function ($stateParams) {
                    return '/app/market/views/market.mdu.pin.' + $stateParams.pane + '.html'
                }
            })
            .state('market.mdu.list.pin', {
                url: '/pins/:pinId',
                templateUrl: '/app/market/views/market.mdu.pin.html',
                controller: 'PinCtrl'
            })
            .state('market.mdu.list.pin.pane', {
                url: '/:pane',
                templateUrl: function ($stateParams) {
                    return '/app/market/views/market.mdu.pin.' + $stateParams.pane + '.html'
                }
            })
        /** REPORT VIEW **/
            .state('market.mdu.report', {
                url: '/report',
                abstract: true,
                templateUrl: '/app/market/views/market.mdu.report.html',
                controller: 'ReportCtrl',
                data: {
                    view: 'report'
                }
            })
            .state('market.mdu.report.grid', {
                url: '',
                templateUrl: '/app/market/views/market.mdu.report.grid.html',
                data: {
                    view: 'report'
                }
            })
            /** Detail View from List **/
            .state('market.mdu.list.details', {
                url: '/:itemId',
                templateUrl: '/app/market/views/market.mdu.details.html',
                controller: 'MDUDetailsCtrl'
            })
            .state('market.mdu.list.details.pane', {
                url: '/:pane',
                templateUrl: function ($stateParams) {
                    return '/app/market/views/market.mdu.details.' + $stateParams.pane + '.html'
                }
            })
            /** Detail View from Report **/
            .state('market.mdu.report.details', {
                url: '/:itemId',
                templateUrl: '/app/market/views/market.mdu.details.html',
                controller: 'MDUDetailsCtrl'
            })
            .state('market.mdu.report.details.pane', {
                url: '/:pane',
                templateUrl: function ($stateParams) {
                    return '/app/market/views/market.mdu.details.' + $stateParams.pane + '.html'
                }
            });
    });

