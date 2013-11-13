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
                    templateUrl: '/app/market/' + BrowserDetectProvider.platform + '/views/market.html?' + Date.now(),
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
                        }
                    }
                });
        }])
    .controller('MarketController', ['$scope', '$timeout', '$routeParams', '$location', 'BrowserDetect', 'User', '$dialog', 'PropertyMarket', 'Reports', 'SavedSearch', 'NewsZoomThreshold', 'ngProgress', 'NewsMarket',
        function ($scope, $timeout, $routeParams, $location, BrowserDetect, User, $dialog, PropertyMarket, Reports, SavedSearch, NewsZoomThreshold, ngProgress, NewsMarket) {
            ngProgress.complete();
            $scope.items = PropertyMarket.visibleItems;
            $scope.attributes = PropertyMarket.getDimensions();
            $scope.toggle = 'all';
            $scope.getActive = PropertyMarket.getActive;
            $scope.browser = BrowserDetect;
            $scope.searchText = {};
            $scope.sortBy = {};
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

            $scope.setZoomLevel = function (zoom) {
                $scope.mapData.zoom = zoom;
            };

            $scope.propertyDetails = (function () {
                var panes = [
                        {heading: "Details", active: true},
                        {heading: "Pictures", active: false},
                        {heading: "Contact", active: false},
                        {heading: "Comments", active: false},
                        {heading: "Finances", active: false}
                    ],
                    view = $dialog.dialog({
                        backdrop: false,
                        keyboard: false,
                        backdropClick: true,
                        dialogClass: 'property-details',
                        containerClass: 'map-wrap',
                        dialogFade: true,
                        backdropFade: false,
                        templateUrl: '/app/market/' + BrowserDetect.platform + '/partials/market-details.html?' + Date.now(),
                        controller: "DetailsController",
                        resolve: {
                            activeItem: function ($q) {
                                var deferred = $q.defer();

                                var item = PropertyMarket.getActive() || {};
                                if (!item.hasOwnProperty('details') || _.isEmpty(item.details)) {
                                    item.getDetails().then(function (_item) {
                                        deferred.resolve(_item);
                                    }, function () {
                                        deferred.reject();
                                    });
                                } else {
                                    deferred.resolve(item);
                                }

                                return deferred.promise;
                            },
                            panes: function () {
                                return panes;
                            }
                        }
                    });

                return {
                    isOpen: function () {
                        return view.isOpen();
                    },
                    open: function (item, resolveCb) {
                        if (!item && !view.isOpen()) {
                            PropertyMarket.setActive(null);
                        } else if (!item && view.isOpen()) {
                            view.close();
                        } else {
                            PropertyMarket.setActive(item);
                            view.setConditionalClass(item.getStatusClass());
                            view
                                .open()
                                .then(function () {
                                    PropertyMarket.setActive(null);
                                })
                                .then(resolveCb);
                        }

                        return this;
                    },
                    close: function (result) {
                        view.close();
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
                openDetails($location.search().id);
            }

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

            $scope.feedbackDialog = $dialog.dialog({
                backdrop: true,
                keyboard: true,
                backdropClick: true,
                dialogFade: true,
                backdropFade: true,
                templateUrl: '/app/market/desktop/partials/feedback-dialog.html?' + Date.now(),
                controller: "FeedbackDialogController"
            });

            $scope.mapPower = {
                float: 'right',
                title: User.profile.email,
                options: {
                    'My Account': {
                        title: 'My Account',
                        icon: 'icon-user',
                        action: function () {
                            if ($scope.propertyDetails.isOpen()) {
                                $scope.propertyDetails.close()
                            }
                            $location.path('/account/').search('id', null).hash(null);
                        }
                    },
                    'Logout': {
                        title: 'Logout',
                        icon: 'icon-power-off',
                        action: function () {
                            if ($scope.propertyDetails.isOpen()) {
                                $scope.propertyDetails.close()
                            }
                            $location.path('/logout').search('id', null).hash(null);
                        }
                    }
                }
            };

            $scope.newsDiscreet = NewsMarket.getDimensions().discreet;

            $scope.categoryPower = {
                title: 'Category',
                multiSelect: true,
                options: (function () {
                    var categoryValueOptions = {};
                    angular.forEach($scope.newsDiscreet.category.values, function(value, key){
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

            $scope.sortPower = {
                toggle: true,
                icon: 'icon-long-arrow-down',
                options: {
                    datePosted: {
                        action: sortBy,
                        icon: 'icon-long-arrow-down',
                        title: 'Date Posted'
                    },
                    callForOffers: {
                        action: sortBy,
                        icon: 'icon-long-arrow-down',
                        title: 'Call for Offers'
                    },
                    yearBuilt: {
                        action: sortBy,
                        icon: 'icon-long-arrow-down',
                        title: 'Year Built'
                    },
                    numUnits: {
                        action: sortBy,
                        icon: 'icon-long-arrow-down',
                        title: 'Number of Units'
                    }
                }
            };

            $scope.showPower = {
                toggle: 'all',
                icon: 'icon-list',
                tooltip: {
                    text: 'Show',
                    placement: 'bottom'
                },
                options: {
                    all: {
                        action: show,
                        icon: 'icon-list',
                        title: 'All'
                    },
                    favorites: {
                        action: show,
                        icon: 'icon-star',
                        title: 'Favorites'
                    },
                    hidden: {
                        action: show,
                        icon: 'icon-ban-circle',
                        title: 'Hidden'
                    },
                    notes: {
                        action: show,
                        icon: 'icon-pencil',
                        title: 'Notes'
                    }
                }
            };

            $scope.render = function () {
                $scope.items = PropertyMarket.apply();
                PropertyMarket.predict();
            };

            $scope.$on('$locationChangeSuccess', function (e, newLocation, oldLocation) {
                openDetails($location.search().id);
            });

            $scope.showItemDetails = function (item, pane) {
                $location.search('id', item.id).hash(pane);
            };

            $scope.centerMap = function (item) {
                if ($scope.propertyDetails.isOpen()) {
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
    .controller("FilterController", ['$scope', 'SavedSearch', '$dialog',
        function ($scope, SavedSearch, $dialog) {

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
                                    console.log($scope.attributes, $scope.savedSearches);
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

            $scope.reportDialog = $dialog.dialog({
                backdrop: true,
                keyboard: true,
                backdropClick: true,
                dialogFade: true,
                backdropFade: true,
                templateUrl: '/app/market/' + BrowserDetect.platform + '/partials/reports-dialog.html?' + Date.now(),
                controller: "ReportsDialogController"
            });

            $scope.reportPower = {
                icon: 'icon-download-alt',
                action: function () {
                    // filteredItems set inside the HTML
                    Reports.setItems($scope.filteredItems);
                    $scope.reportDialog.open();
                }
            };
        }])
    .controller("DetailsController", ['$scope', '$http', '$_api', '$timeout', 'activeItem', '$location', 'Finance', 'panes',
        function ($scope, $http, $_api, $timeout, activeItem, $location, Finance, panes) {
            $scope.newComment = {};
            $scope.panes = panes;
            $scope.newEmail = {};
            $scope.finance = Finance;
            $scope.valueFormats = Finance.valueFormats;
            $scope.financeFields = Finance.fields;
            $scope.contactAlerts = [];
            $scope.current = activeItem;
            $scope.currentImages = $scope.current.getImages();
            $scope.currentFinances = activeItem.details.finances;
            $scope.testItems = [
                {
                    id: 1,
                    name: {
                        first: "Marcin",
                        last: "Warpechowski"
                    },
                    address: "Marienplatz 11, Munich",
                    isActive: "Yes",
                    Product: {
                        Description: "Big Mac",
                        Options: [
                            {Description: "Big Mac"},
                            {Description: "Big Mac & Co"}
                        ]
                    }
                },
                {
                    id: 2,
                    name: {
                        first: "Alan",
                        last: "Pledger"
                    },
                    address: "123",
                    isActive: "Yes",
                    Product: {
                        Description: "Big Mac",
                        Options: [
                            {Description: "Big Mac"},
                            {Description: "Big Mac & Co"}
                        ]
                    }
                }
            ];

            $scope.close = function () {
                $location.search('id', null).hash(null);
            };

            $scope.selectPane = function (pane) {
                $location.hash(pane.heading);
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
                email.recipients = [];

                angular.forEach($scope.current.details.contacts, function (value, key) {
                    if (value.selected) {
                        email.recipients.push(value.email);
                    }
                });

                if (email.recipients.length > 0 && email.message) {
                    var path = $_api.path + '/properties/' + $scope.current.id + '/contact/',
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
                            email.message = "";
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
                if (finance.value) {
                    finance.$save();
                }
            };

            $scope.addFinance = function () {
                $scope.current.addFinance({});
            };

            $scope.deleteFinance = function (finance) {
                $scope.current.deleteFinance(finance);
            };
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
    .controller('FeedbackDialogController', ['$scope', '$http', 'dialog', '$timeout', '$_api',
        function ($scope, $http, dialog, $timeout, $_api) {
            $scope.feedback = {};
            $scope.alerts = [];

            $scope.sendFeedback = function () {
                if ($scope.feedback.text) {
                    var path = $_api.path + '/feedback/',
                        config = angular.extend({
                            transformRequest: function (data) {
                                return data;
                            }
                        }, $_api.config),
                        body = JSON.stringify($scope.feedback);

                    $http.post(path, body, config).then(
                        function (response) {
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
    });
