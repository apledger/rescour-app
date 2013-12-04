/**
 * Created with JetBrains WebStorm.
 * User: apledger
 * Date: 4/24/13
 * Time: 4:56 PM
 * File: /app/home/home.js
 */

angular.module('rescour.app')
    .config(['$routeProvider', 'BrowserDetectProvider',
        function ($routeProvider, BrowserDetectProvider) {
            $routeProvider
                .when('/market', {
                    templateUrl: '/app/market/desktop/views/market.html?' + Date.now(),
//                    templateUrl: '/app/market/tablet/views/market.html?' + Date.now(),
                    controller: 'MarketController',
                    reloadOnSearch: false,
                    resolve: {
                        load: function ($q, $_api, $rootScope, Property, PropertyMarket, News, User, NewsMarket, ngProgress, $location) {
                            var propertyDefer = $q.defer(),
                                newsDefer = $q.defer(),
                                userDefer = $q.defer();

                            ngProgress.height('4px');
                            ngProgress.color('#993333');
                            ngProgress.start();

                            if ($location.search().token) {
                                $location.search('token', null);
                            }

                            Property.query()
                                .then(function (results) {
                                    ngProgress.set(ngProgress.status() + ((100 - ngProgress.status()) * .15));
                                    PropertyMarket.initialize(results, Property.$dimensions);
                                    return Property.getResources(PropertyMarket.items);
                                })
                                .then(function (results) {
                                    ngProgress.set(ngProgress.status() + ((100 - ngProgress.status()) * .1));
                                    propertyDefer.resolve();
                                });

                            News.query().then(function (results) {
                                ngProgress.set(ngProgress.status() + ((100 - ngProgress.status()) * .15));
                                NewsMarket.initialize(results, News.$dimensions);
                                newsDefer.resolve();
                            });

                            User.get().then(function (response) {
                                ngProgress.set(ngProgress.status() + ((100 - ngProgress.status()) * .1));
                                userDefer.resolve(response);
                            }, function (response) {
                                userDefer.reject(response);
                            });

                            return $q.all([propertyDefer.promise, newsDefer.promise, userDefer.promise]);
                        },
                        fetchTemplates: function ($templateCache, MarketViews, $http, $q) {
                            var mapDefer = $q.defer(),
                                editorDefer = $q.defer(),
                                promises = [];

                            $http.get(MarketViews.mapListRawPath).then(function (response) {
                                $templateCache.put('map-list.html', response.data);
                                mapDefer.resolve();
                            });

                            $http.get(MarketViews.reportListRawPath).then(function (response) {
                                $templateCache.put('report-list.html', response.data);
                                editorDefer.resolve();
                            });

                            return $q.all(promises);
                        }
                    }
                });
        }])
    .value('MarketViews', {
        reportListRawPath: '/app/market/desktop/views/report-list.html?' + Date.now(),
        mapListRawPath: '/app/market/desktop/views/map-list.html?' + Date.now(),

        reportList: 'report-list.html',
        mapList: 'map-list.html'
    })
    .value('MarketPartials', {
        details: '/app/market/desktop/partials/market-details.html?' + Date.now()
    })
    .controller('MarketController', ['$scope', '$timeout', '$routeParams', '$location',
        'BrowserDetect', 'User', '$dialog', 'PropertyMarket', 'Reports', 'SavedSearch',
        'NewsZoomThreshold', 'ngProgress', 'NewsMarket', 'MarketViews', 'MarketPartials',
        function ($scope, $timeout, $routeParams, $location, BrowserDetect, User, $dialog, PropertyMarket, Reports, SavedSearch, NewsZoomThreshold, ngProgress, NewsMarket, MarketViews, MarketPartials) {
            ngProgress.complete();
            $scope.items = PropertyMarket.visibleItems;
            $scope.attributes = PropertyMarket.getDimensions();
            $scope.toggle = 'all';
            $scope.getActive = PropertyMarket.getActive;
            $scope.browser = BrowserDetect;
            $scope.searchText = {};
            $scope.sortBy = {};
            $scope.marketListViewPath = MarketViews.mapList;
            $scope.$on('window-resized', function () {
                console.log($scope);
            })

            $scope.mapData = {
                isNewsDisabled: function () {
                    return this.zoom < NewsZoomThreshold
                },
                newsTooltip: function () {
                    return this.isNewsDisabled() ? 'Zoom to Show News' : this.newsToggled ? 'Hide News' : 'Show News';
                }
            };
            $scope.selectedSearch = null;
            SavedSearch.query().then(function (savedSearches) {
                $scope.savedSearches = savedSearches;
            });

            $scope.setActive = function (item) {
                $scope.current = item;
                PropertyMarket.setActive(item);
            };

            $scope.reportPower = {
                icon: 'icon-file-text',
                tooltip: {
                    text: 'Editor View',
                    placement: 'bottom'
                },
                action: function () {
                    this.isSelected = !this.isSelected;

                    if (this.isSelected) {
                        $scope.marketListViewPath = MarketViews.reportList;
                        this.tooltip.text = 'Map View';
                        this.icon = 'icon-globe';
                    } else {
                        $scope.marketListViewPath = MarketViews.mapList;
                        this.tooltip.text = 'Editor View';
                        this.icon = 'icon-file-text';
                    }

                    $location.search('id', null).hash(null);

                    $scope.$broadcast('destroyTooltips');
                }
            };

            function sortBy() {
                if ($scope.sortBy.predicate === this.key) {
                    $scope.sortBy.reverse = !$scope.sortBy.reverse;
                } else {
                    $scope.sortBy.reverse = false;
                    $scope.sortBy.predicate = this.key;

                    angular.forEach($scope.sortPower.options, function (value, key) {
                        value.icon = 'icon-long-arrow-down'
                    });
                }
                $scope.sortPower.icon = this.icon = $scope.sortBy.reverse ? 'icon-long-arrow-up' : 'icon-long-arrow-down';
                $scope.items = PropertyMarket.sortVisibleItems($scope.sortBy.predicate, $scope.sortBy.reverse);
            };

            function show() {
                PropertyMarket.subset = this.key;
                $scope.render();
                $scope.showPower.icon = this.icon;
                $scope.$broadcast('UpdateMap');
            };

            $scope.sortPower = {
                toggle: true,
                icon: 'icon-long-arrow-down',
                options: [
                    {
                        action: sortBy,
                        icon: 'icon-long-arrow-down',
                        title: 'Date Posted',
                        key: 'datePosted'
                    },
                    {
                        action: sortBy,
                        icon: 'icon-long-arrow-down',
                        title: 'Call for Offers',
                        key: 'callForOffers'
                    },
                    {
                        action: sortBy,
                        icon: 'icon-long-arrow-down',
                        title: 'Year Built',
                        key: 'yearBuilt'
                    },
                    {
                        action: sortBy,
                        icon: 'icon-long-arrow-down',
                        title: 'Number of Units',
                        key: 'numUnits'
                    }
                ]

            };

            $scope.showPower = {
                toggle: 'all',
                icon: 'icon-list',
                tooltip: {
                    text: 'Show',
                    placement: 'bottom'
                },
                options: [
                    {
                        action: show,
                        icon: 'icon-list',
                        title: 'All',
                        key: 'all'
                    },
                    {
                        action: show,
                        icon: 'icon-star',
                        title: 'Favorites',
                        key: 'favorites'
                    },
                    {
                        action: show,
                        icon: 'icon-ban-circle',
                        title: 'Hidden',
                        key: 'hidden'
                    },
                    {
                        action: show,
                        icon: 'icon-pencil',
                        title: 'Notes',
                        key: 'notes'
                    }
                ]
            };

            $scope.setZoomLevel = function (zoom) {
                $scope.mapData.zoom = zoom;
            };

            $scope.propertyDetails = (function () {
                var panes = [
                        {heading: "Details", active: false},
                        {heading: "Pictures", active: false},
                        {heading: "Contact", active: false},
                        {heading: "Comments", active: false},
                        {heading: "Finances", active: false},
                        {heading: "RentMetrics", active: false}
                    ],
                    view = {
                        templateUrl: MarketPartials.details
                    }

                return {
                    open: function (item, paneHeading) {
                        if (!item && !view.isOpen) {
                            $scope.setActive(null);
                        } else if (!item && view.isOpen) {
                            this.close();
                        } else {
                            this.selectPane(paneHeading);
                            $scope.setActive(item);
                            this.isOpen = true;
                        }

                        return this;
                    },
                    templateUrl: view.templateUrl,
                    close: function () {
                        this.isOpen = false;
                        $scope.setActive(null);
                        return this;
                    },
                    panes: panes,
                    selectPane: function (paneHeading) {
                        paneHeading = (paneHeading && _.find(panes, function (val) {
                            return val.heading.toLowerCase() === paneHeading.toLowerCase();
                        })) ? paneHeading : panes[0].heading;

                        angular.forEach(panes, function (pane) {
                            if (pane.heading.toLowerCase() === paneHeading.toLowerCase()) {
                                pane.active = true;
                            } else {
                                pane.active = false;
                            }
                        });
                        return this;
                    }
                };
            })();

            function openDetails(id) {
                if (angular.isObject(PropertyMarket.items[id])) {
                    $scope.propertyDetails.open(PropertyMarket.items[id]).selectPane($location.hash());
                } else {
                    $scope.propertyDetails.isOpen ? $scope.propertyDetails.close() : null;
                    $location.search('id', null).hash(null);
                }
            }

            if ($location.search().id) {
                $timeout(function () {
                    openDetails($location.search().id);
                }, 0);
            }

            $scope.feedbackDialog = $dialog.dialog({
                backdrop: true,
                keyboard: true,
                backdropClick: true,
                dialogFade: true,
                backdropFade: true,
                templateUrl: '/app/market/desktop/partials/feedback-dialog.html?' + Date.now(),
                controller: "FeedbackDialogController"
            });

            $scope.accountPower = {
                float: 'right',
                title: User.profile.email,
                options: [
                    {
                        title: 'My Account',
                        icon: 'icon-user',
                        action: function () {
                            if ($scope.propertyDetails.isOpen) {
                                $scope.propertyDetails.close()
                            }
                            $location.path('/account/').search('id', null).hash(null);
                        }
                    },
                    {
                        title: 'Logout',
                        icon: 'icon-power-off',
                        action: function () {
                            if ($scope.propertyDetails.isOpen) {
                                $scope.propertyDetails.close()
                            }
                            $location.path('/logout').search('id', null).hash(null);
                        }
                    }
                ]

            };

            $scope.newsDiscreet = NewsMarket.getDimensions().discreet;

            $scope.categoryPower = {
                title: 'Category',
                multiSelect: true,
                options: (function () {
                    var categoryValueOptions = {};
                    angular.forEach($scope.newsDiscreet.category.values, function (value, key) {
                        categoryValueOptions[key] = {
                            title: value.title,
                            action: function () {
                                NewsMarket.toggleDiscreet($scope.newsDiscreet.category, value);
                                $scope.$broadcast('UpdateMap');
                                NewsMarket.predict();
                            }
                        }
                    });

                    return categoryValueOptions;
                })()
            };

            $scope.toggleNewsDiscreet = function (discreet, discreetValue) {
                NewsMarket.toggleDiscreet(discreet, discreetValue);
                $scope.$broadcast('UpdateMap');
                NewsMarket.predict();
            };

            $scope.displayNews = function () {
                if (!$scope.mapData.isNewsDisabled()) {
                    $scope.$broadcast('DisplayNews');
                }
            };

            $scope.render = function () {
                $scope.items = PropertyMarket.apply();
//                console.log($scope.items);
                PropertyMarket.predict();
            };

            $scope.$on('$locationChangeSuccess', function (e, newLocation, oldLocation) {
                var activeId = PropertyMarket.getActive() ? PropertyMarket.getActive().id : null;
                if ($location.search().id === activeId && $location.hash()) {
                    $scope.propertyDetails.selectPane($location.hash());
                } else {
                    openDetails($location.search().id);
                }
            });

            $scope.showItemDetails = function (item, pane) {
                $location.search('id', item.id).hash(pane);
            };

            $scope.centerMap = function (item) {
                if ($scope.propertyDetails.isOpen) {
                    $location.search('id', null).hash(null);
                }
                $scope.$broadcast('CenterMap', item);
            };

            $scope.filter = function (discreet, discreetValue) {
                $scope.searchText = {};
                $scope.items = PropertyMarket.toggleDiscreet(discreet, discreetValue).apply();
                PropertyMarket.predict();
                $scope.$broadcast('UpdateMap');
                $scope.attributes.modified = true;
            };

            $scope.toggleNA = function (range) {
                range.excludeNA = !range.excludeNA;
                $scope.render();
                $scope.$broadcast('UpdateMap');
            };

            $scope.openFeedbackDialog = function () {
                $scope.feedbackDialog.open();
            };

            $scope.load = function (search) {
                PropertyMarket.load(search);
                $scope.render();
                $scope.$broadcast('UpdateMap');
                $scope.attributes.modified = false;
                $scope.$broadcast('RangesDefined');
            };
        }])
    .controller("FilterController", ['$scope', 'SavedSearch', '$dialog', 'PropertyMarket',
        function ($scope, SavedSearch, $dialog, PropertyMarket) {

            $scope.savedSearchDialog = $dialog.dialog({
                backdrop: true,
                keyboard: true,
                backdropClick: true,
                dialogFade: true,
                backdropFade: true,
                templateUrl: '/app/market/desktop/partials/saved-search-dialog.html?' + Date.now(),
                controller: "SaveSearchDialogController",
                resolve: {
                    dimensions: function () {
                        return PropertyMarket.dimensions;
                    }
                }
            });

            $scope.isNotHidden = function (range) {
                return !range.hidden;
            };

            $scope.orderByWeight = function () {
                return function (object) {
                    return object.weight;
                };
            };

            $scope.openSaveDialog = function () {
                // If its a new search open the dialog
                if ($scope.attributes.modified) {
                    if (!$scope.selectedSearch) {
                        $scope.savedSearchDialog
                            .open()
                            .then(function (result) {
                                result ? (result.action === 'save' ? $scope.saveSearch(result.settings) : null) : null;
                            });
                    } else {
                        $scope.saveSearch();
                    }
                }
            };

            $scope.saveSearch = function () {
                if (!$scope.attributes.id) {
                    // If no id, then it is a new search
                    $scope.savedSearchDialog
                        .open()
                        .then(function (settings) {
                            if (settings) {
                                // Creating in dialog cb so attributes will have finished being edited
                                $scope.attributes = angular.extend($scope.attributes, settings)
                                var _search = new SavedSearch($scope.attributes);
                                _search.$save().then(function (response) {
                                    $scope.attributes.id = response.id;
                                    $scope.selectedSearch = _search;
                                    $scope.selectedSearch.isSelected = true;
                                    $scope.attributes.modified = false;
                                    $scope.savedSearches.push(_search);
                                });
                            }
                        }, function (response) {
                            $scope.savedSearches = SavedSearch.query();
                            throw new Error("Could not save search: " + response.error);
                        });
                } else {
                    // If there is an id, need to update
                    var _search = new SavedSearch($scope.attributes);
                    _search.$save().then(function (response) {
                        var _old = _.findWhere($scope.savedSearches, {id: $scope.attributes.id})
                        // Since we do not requery, need to update local saved search collection
                        $scope.savedSearches = _.map($scope.savedSearches, function (val) {
                            return val.id === _old.id ? _search : val;
                        });
                        $scope.selectedSearch = _search;
                        $scope.selectedSearch.isSelected = true;
                        $scope.attributes.modified = false;
                    }, function (response) {
                        $scope.savedSearches = SavedSearch.query();
                        throw new Error("Could not save search: " + response.error);
                    });
                }
            };

            $scope.refreshSearch = function () {
                if ($scope.selectedSearch) {
                    $scope.loadSearch(_.find($scope.savedSearches, function (saved) {
                        return saved.id === $scope.attributes.id;
                    }));
                } else {
                    $scope.loadSearch();
                }
            };

            $scope.loadSearch = function (search) {
                if ($scope.selectedSearch) {
                    $scope.selectedSearch.isSelected = false;
                }
                search = search || {
                    title: 'Untitled Search'
                };
                $scope.load(search);
                $scope.selectedSearch = search;
                $scope.selectedSearch.isSelected = true;
            };

            $scope.deleteSearch = function (search, e) {
                e.stopPropagation();
                search.$delete().then(function (response) {
                    $scope.savedSearches = _.reject($scope.savedSearches, function (val) {
                        return angular.equals(val, search);
                    });
                    if ($scope.attributes.id === search.id) {
                        $scope.attributes.id = undefined;
                        $scope.attributes.title = 'Untitled Search';
                    }
                });
            }
        }])

    .controller('SaveSearchDialogController', ['$scope', 'dialog', 'dimensions',
        function ($scope, dialog, dimensions) {
            $scope.attributes = dimensions;
            $scope.searchSettings = {};
            $scope.close = function () {
                dialog.close();
            };

            $scope.save = function () {
                dialog.close($scope.searchSettings);
            };
        }])
    .controller("ListController", ['$scope', '$q', '$dialog', 'BrowserDetect', 'Reports',
        function ($scope, $q, $dialog, BrowserDetect, Reports) {
            $scope.sortBy = {
                predicate: '',
                reverse: false
            };

            $scope.panTo = function (item) {
                $scope.centerMap(item);
            };

            $scope.orderNA = function () {
                return function (object) {
                    var _attr = object.getAttribute($scope.sortBy.predicate);
                    if (_attr && _attr !== 'NA') {
                        return -_attr;
                    } else if (_attr === 'NA') {
                        return 9999 * ($scope.sortBy.reverse ? -1 : 1);
                    } else {
                        return 0;
                    }
                };
            };

            $scope.toggleFavorites = function (item) {
                item.toggleFavorites();
            };

            $scope.toggleHidden = function (item) {
                item.toggleHidden();
            };
        }])
    .controller("DetailsController", ['$scope', '$http', '$_api', '$timeout', '$location', 'Finance', 'RentMetrics', 'PropertyMarket',
        function ($scope, $http, $_api, $timeout, $location, Finance, RentMetrics, PropertyMarket) {
            $scope.newComment = {};
            $scope.panes = $scope.propertyDetails.panes;
            $scope.newEmail = {};
            $scope.finance = Finance;
            $scope.valueFormats = Finance.valueFormats;
            $scope.financeFields = Finance.fields;
            $scope.contactAlerts = [];
            $scope.currentImages = $scope.current.images || [];
            $scope.currentFinances = $scope.current.resources.finances;
            $scope.rentComps = [];
            $scope.rentMetricsPastOptions = [30, 60, 90];
            $scope.rentMetricsRadiusOptions = [5, 10, 25];
            var rentMetrics = new RentMetrics($scope.current.address),
                checkRentMetric = function () {
                    var rentMetricPane = _.find($scope.panes, function (val) {
                        return val.heading === 'RentMetrics'
                    });

                    if (rentMetricPane.active && !$scope.rentMetrics) {
                        $scope.rentMetrics = rentMetrics;
                        $scope.rentMetrics.query();
                    }
                };

            $http.get('http://walkbitch.rescour.com/score?', {
                params: {
                    format: 'json',
                    address: $scope.current.getAddress(),
                    lat: $scope.current.address.latitude,
                    lon: $scope.current.address.longitude,
                    wsapikey: $_api.walkScoreToken
                },
                cache: true,
                headers: {'Content-Type': 'application/json'},
                withCredentials: true
            }).then(function (response) {
                    $scope.current.walkscore = response.data;
                });

            $scope.setRentCompsPast = function (days) {
                $scope.rentMetrics.setStartDate(days);
                $scope.refreshRentComps();
            };

            $scope.setRentCompsRadius = function (radius) {
                $scope.rentMetrics.radius = radius;
                $scope.refreshRentComps();
            };

            $scope.refreshRentComps = function () {
                $scope.rentMetrics.query();
            }

            $scope.keypressBlur = function (e) {
                // Ugly hack to get around $apply
                $timeout(function () {
                    e.currentTarget.blur();
                }, 0);
            }

            $scope.close = function () {
                $location.search('id', null).hash(null);
            };

            $scope.$on('$locationChangeSuccess', function () {
                checkRentMetric();
            });

            $scope.selectPane = function (pane) {
                $location.hash(pane.heading);
//                $scope.refreshRentComps();
            };

            $scope.addComment = function (comment) {
                if ($scope.newComment.text) {
                    $scope.current.addComment(comment).$save().then(function (response) {
                        $scope.newComment.text = '';
                    }, function (newComment) {
                        $scope.current.deleteComment(newComment);
                    });
                }
            };

            $scope.sendEmail = function (email) {
                var recipients = [];

                angular.forEach($scope.current.contacts, function (value, key) {
                    if (value.selected) {
                        recipients.push(value.email);
                    }
                });

                email.to = recipients.join(',');
                email.subject = $scope.current.title + " via REscour.com";

                if (recipients.length > 0 && email.text) {
                    var path = $_api.path + '/messages/',
                        config = angular.extend({
                            transformRequest: function (data) {
                                $scope.contactAlerts = [
                                    {
                                        type: 'info',
                                        msg: 'Sending..'
                                    }
                                ];
                                return data;
                            }
                        }, $_api.config),
                        body = JSON.stringify(email);

                    $http.post(path, body, config).then(
                        function (response) {
                            email.text = "";
                            $scope.contactAlerts = [
                                {
                                    type: 'success',
                                    msg: 'Message sent!'
                                }
                            ];

                        },
                        function (response) {
                            $scope.contactAlerts = [
                                {
                                    type: 'error',
                                    msg: 'Message failed to send'
                                }
                            ];
                        }
                    );
                } else {
                    $scope.contactAlerts = [
                        {
                            type: 'error',
                            msg: 'Please select recipients and provide a message!'
                        }
                    ];
                }
            };

            $scope.saveFinance = function (finance) {
                $scope.current.saveFinance(finance);
            };

            $scope.addFinance = function () {
                $scope.current.addFinance({});
            };

            $scope.deleteFinance = function (finance) {
                $scope.current.deleteFinance(finance);
            };

            checkRentMetric();
        }])
    .controller('ReportsDialogController', ['$scope', 'dialog', 'Reports', 'User',
        function ($scope, dialog, Reports, User) {
            $scope.userEmail = User.profile.email;
            $scope.reportItems = _.map(Reports.getItems(),
                function (item) {
                    return {
                        id: item.id,
                        title: item.title,
                        isSelected: true
                    }
                });

            $scope.reportSettings = {};

            $scope.reportLength = function () {
                $scope.selectedItems = _.reject($scope.reportItems, function (item) {
                    return !item.isSelected;
                });
                return $scope.selectedItems.length;
            };

            $scope.close = function () {
                dialog.close();
            };

            $scope.save = function (settings) {
                var _ids = _.map($scope.selectedItems, function (item) {
                    return item.id;
                });

                Reports.send({ids: _ids, token: User.profile.token})
                    .then(function () {
                        dialog.close({
                            status: "success"
                        });
                    }, function () {
                        dialog.close({
                            status: "fail"
                        });
                    });
            };
        }])
    .controller('FeedbackDialogController', ['$scope', '$http', 'dialog', '$timeout', '$_api', 'User',
        function ($scope, $http, dialog, $timeout, $_api, User) {
            $scope.feedback = {
                to: 'info@rescour.com',
                subject: User.profile.firstName + " " + User.profile.lastName + " Feedback"
            };
            $scope.alerts = [];

            $scope.sendFeedback = function () {
                if ($scope.feedback.text) {
                    var path = $_api.path + '/messages/',
                        config = angular.extend({
                            transformRequest: function (data) {
                                return data;
                            }
                        }, $_api.config),
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
                                dialog.close();
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
                dialog.close();
            };
        }])
    .directive('savedSearchInput', ['$timeout', '$document', '$parse',
        function ($timeout, $document, $parse) {
            return {
                require: 'ngModel',
                link: function (scope, element, attrs, modelCtrl) {
                    var modelIgnore = 'Untitled Search',
                        modelPrevious = modelIgnore,
                        prevAttributeTitle;

                    function checkEmpty() {
                        if (!modelCtrl.$viewValue) {
                            modelCtrl.$viewValue = modelPrevious;
                            modelCtrl.$render();
                        }
                    }

                    element.bind('focus', function (e) {
                        scope.$apply(function () {
                            prevAttributeTitle = scope.attributes.title;
                            if (modelCtrl.$viewValue === modelIgnore) {
                                modelPrevious = modelCtrl.$viewValue;
                                modelCtrl.$viewValue = '';
                                modelCtrl.$render();
                            }

                            element.bind('keydown', function (e) {
                                if (e.which === 13 || e.which === 9) {
                                    element.blur();
                                }
                            });
                        });
                    });

                    element.bind('blur', function (e) {
                        scope.$apply(function () {
                            if (prevAttributeTitle !== scope.attributes.title) {
                                scope.attributes.modified = true;
                            }
                            checkEmpty();
                        });
                    });

                    $timeout(checkEmpty, 0);
                }
            };
        }])
    .directive('inputDropdown', ['$document',
        function ($document) {
            return {
                restrict: 'C',
                link: function (scope, element, attrs) {
                    var ddBtn = element.find('.input-dropdown-btn');
                    var ddMenu = element.find('.input-dropdown-menu');

                    scope.$on('destroyDropdowns', close);

                    function open(e) {
                        if (e) {
                            e.stopPropagation();
                            e.preventDefault();
                        }

                        scope.$broadcast('destroyDropdowns');
                        scope.$broadcast('destroyTooltips');

                        if (!scope.isOpen) {
                            scope.$apply(function () {
                                ddMenu.show();
                                scope.isOpen = true;
                                $document.bind('click', close);
                                ddBtn.unbind('click', open);
                            });
                        } else {
                            close();
                        }
                    }

                    function close(e) {
                        scope.$apply(function () {
                            if (scope.isOpen) {
                                ddMenu.hide();
                                scope.isOpen = false;
                                $document.unbind('click', close);
                                ddBtn.bind('click', open);
                            }
                        });
                    }

                    ddBtn.bind('click', open);
                }
            };
        }])
    .directive('slider', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attr) {
                function setupSlider() {
                    $(element).slider({
                        range: true,
                        min: 0,
                        max: 100,
                        // Calculate percentages based off what the low selected and high selected are
                        values: [
                            parseInt((((scope.range.lowSelected - scope.range.low) / (scope.range.high - scope.range.low)) * 100), 10),
                            parseInt((((scope.range.highSelected - scope.range.low) / (scope.range.high - scope.range.low)) * 100), 10)
                        ],
                        step: 1,
                        slide: function (event, ui) {
                            scope.$apply(function () {
                                scope.range.lowSelected = parseInt((((ui.values[0] / 100) * (scope.range.high - scope.range.low)) + scope.range.low), 10);
                                scope.range.highSelected = parseInt((((ui.values[1] / 100) * (scope.range.high - scope.range.low)) + scope.range.low), 10);
                            });
                        },
                        stop: function (event, ui) {
                            scope.$apply(function () {
                                scope.filter();
                            });

                            // WHY THE FUCK DO I NEED TO CALL THIS TWICE??
                            scope.$apply();
                        }
                    });
                }

                scope.$on('RangesDefined', function () {
                    setupSlider();
                });

                setupSlider();
            }
        };
    })
    .directive('imgViewer', ['$_api',
        function ($_api) {
            return{
                restrict: 'EA',
//            transclude: true,
//            replace: true,
                templateUrl: '/template/img-viewer/img-viewer.html',
                controller: 'viewerCtrl',
                scope: {
                    images: '='
                },
                link: function (scope, element, attr, viewerCtrl) {
                    if (scope.images.length > 0) {
                        scope.images[0].isActive = true;

                        for (var i = 1; i < scope.images.length; i++) {
                            var _image = scope.images[i];
                            _image.isActive = false;
                        }
                    }
                    scope.imageUrl = '';

                    if ($_api.env !== 'local') {
                        scope.imageUrl = $_api.path + '/pictures/';
                    }

                    viewerCtrl.setSlides(scope.images);
                    viewerCtrl.element = element;
                }
            }
        }])
    .controller('viewerCtrl', ['$scope', '$timeout',
        function ($scope, $timeout) {
            var self = this;
            $scope.current = 0;
            self.setSlides = function (slides) {
                $scope.slides = slides;
            };

            $scope.prev = function () {
                $scope.slides[$scope.current].isActive = false;
                $scope.current = $scope.current == 0 ? $scope.slides.length - 1 : $scope.current -= 1;
                $scope.slides[$scope.current].isActive = true;
            };

            $scope.next = function () {
                $scope.slides[$scope.current].isActive = false;
                $scope.current = $scope.current == $scope.slides.length - 1 ? $scope.current = 0 : $scope.current += 1;
                $scope.slides[$scope.current].isActive = true;
            };
        }])
    .filter('checkHighBound', function () {
        return function (input, limit, e) {
            return input == limit ? input + "+" : input;
        }
    })
    .filter('checkLowBound', function () {
        return function (input, limit, e) {
            return input == limit ? "< " + input : input;
        }
    });