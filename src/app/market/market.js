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
                        loadItems: function ($q, $_api, $rootScope, Item, Market, $dimensions) {
                            var defer = $q.defer();

                            Item.query().then(function (results) {
                                Market.initialize(results.data.resources, $dimensions, Item);
                                defer.resolve();
                            });

                            return defer.promise;
                        },
                        loadUser: function (User, $q) {
                            var defer = $q.defer();
                            User.getProfile().then(function (response) {
                                defer.resolve(response);
                            }, function (response) {
                                defer.reject(response);
                            });
                            return defer.promise;
                        }
                    }
                });
        }])
    .controller('MarketController', ['$scope', '$timeout', '$routeParams', '$location', 'BrowserDetect', 'User', '$dialog', 'Market', 'Reports', 'SavedSearch',
        function ($scope, $timeout, $routeParams, $location, BrowserDetect, User, $dialog, Market, Reports, SavedSearch) {
            $scope.items = Market.visibleItems;
            $scope.attributes = Market.getDimensions();
            $scope.toggle = 'all';
            $scope.getActive = Market.getActive;
            $scope.browser = BrowserDetect;
            $scope.searchText = {};
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
            };

            function show() {
                Market.subset = this.key;
                $scope.render();
                $scope.showPower.icon = this.icon;
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
                        templateUrl: '/app/market/' + BrowserDetect.platform + '/views/partials/market-details.html?' + Date.now(),
                        controller: "DetailsController",
                        resolve: {
                            activeItem: function ($q, Market) {
                                var deferred = $q.defer();

                                var item = Market.getActive() || {};
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
                            Market.setActive(null);
                        } else if (!item && view.isOpen()) {
                            view.close();
                        } else {
                            Market.setActive(item);
                            view.setConditionalClass(item.getStatusClass());
                            view
                                .open()
                                .then(function () {
                                    Market.setActive(null);
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
                if (angular.isObject(Market.items[id])) {
                    $scope.propertyDetails.open(Market.items[id]).selectPane($location.hash());
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
                templateUrl: '/app/market/desktop/views/partials/saved-search-dialog.html?' + Date.now(),
                controller: "SaveSearchDialogController"
            });

            $scope.feedbackDialog = $dialog.dialog({
                backdrop: true,
                keyboard: true,
                backdropClick: true,
                dialogFade: true,
                backdropFade: true,
                templateUrl: '/app/market/desktop/views/partials/feedback-dialog.html?' + Date.now(),
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
                $scope.items = Market.apply();
                Market.predict();
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
                $scope.items = Market.apply(discreet, discreetValue);
                Market.predict();
                $scope.$broadcast('UpdateMap');
                $scope.attributes.modified = true;
            };

            $scope.openFeedbackDialog = function () {
                $scope.feedbackDialog.open();
            };

            $scope.load = function (search) {
                Market.load(search);
                $scope.render();
                $scope.attributes.modified = false;
                $scope.$broadcast('RangesDefined');
            };
        }])
    .controller("FilterController", ['$scope', 'SavedSearch', '$dialog', 'Market',
        function ($scope, SavedSearch, $dialog, Market) {

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
                search = search || {
                    title: 'Untitled Search'
                };

                $scope.load(search);
                $scope.selectedSearch = search;
                $scope.selectedSearch.isSelected = true;
            };
        }])

    .controller('SaveSearchDialogController', ['$scope', 'dialog', 'Market',
        function ($scope, dialog, Market) {
            $scope.attributes = Market.dimensions;
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
                templateUrl: '/app/market/' + BrowserDetect.platform + '/views/partials/reports-dialog.html?' + Date.now(),
                controller: "ReportsDialogController"
            });

            $scope.reportPower = {
                icon: 'icon-download-alt',
                color: 'blue',
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
            $scope.valueFormats = Finance.valueFormats;
            $scope.financeFields = Finance.fields;
            $scope.contactAlerts = [];
            $scope.current = activeItem;
            $scope.currentImages = $scope.current.getImages();

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
    .directive('map', ['$compile', '$location', 'BrowserDetect', 'Market',
        function ($compile, $location, BrowserDetect, Market) {
            return {
                restrict: "A",
                transclude: true,
                template: '<div class="map"></div>',
                link: function (scope, element, attrs, ctrl) {
                    var cloudmadeUrl = 'http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/37875/256/{z}/{x}/{y}.png',
                        openstreetUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                        otileUrl = 'http://otile{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png',
                        stamenUrl = 'http://{s}.tile.stamen.com/terrain/{z}/{x}/{y}.jpg',
                        cloudmade = new L.TileLayer(openstreetUrl, { maxZoom: 17, styleId: 22677 }),
                        defaultLatLng = new L.LatLng(32.0667, -90.3000),
                        defaultZoom = 5,
                        $el = element.find(".map")[0],
                        map = new L.Map($el, { center: defaultLatLng, zoom: defaultZoom, zoomControl: false, attributionControl: false}),
                        markers = new L.MarkerClusterGroup({disableClusteringAtZoom: 13, spiderfyOnMaxZoom: false, spiderfyDistanceMultiplier: 0.1});
                    // layers: [cloudmade],

                    var RescourIcon = L.Icon.extend({
                        options: {
                            shadowUrl: 'img/marker-shadow.png',
                            iconSize: [25, 45],
                            iconAnchor: [12, 0],
                            shadowSize: [41, 41]
                        }
                    });

                    var icons = {
                        'status-marketing': new RescourIcon({
                            iconUrl: 'img/marker-icon-green.png'
                        }),
                        'status-under': new RescourIcon({
                            iconUrl: 'img/marker-icon-orange.png'
                        }),
                        'status-expired': new RescourIcon({
                            iconUrl: 'img/marker-icon-red.png'
                        }),
                        'status-unknown': new RescourIcon({
                            iconUrl: 'img/marker-icon-black.png'
                        })
                    };

                    var items = Market.visibleItems;

                    var googleLayer = new L.Google('ROADMAP');
                    map.addLayer(googleLayer);
                    map.addControl(new L.Control.Zoom({ position: 'topright' }));

                    scope.showDetails = function (item) {
                        $location.search('id', item.id).hash('details');
                    };

                    scope.showPictures = function (item) {
                        $location.search('id', item.id).hash('pictures');
                    };

                    function popupTemplate(item) {
                        scope.item = item;

                        var popupTempl = "<div><div class=\"popup-striped-container popup-header " + item.getStatusClass('gradient') + "\" ng-click=\"showItemDetails(item)\">" +
                            "<h4>" + item.title + "</h4>" +
                            "</div>" +
                            "<div class=\"popup-main-container clearfix\">" +
                            "<div class=\"preview\" ng-click=\"showPictures(item)\"><div class=\"preview-mask\"><i class=\"icon-search\"></i></i></div>" +
                            "<img src=\"" + item.thumbnail + "\" alt=\"\"/></div>" +
                            "<ul>" +
                            "<li><span>" + item.getAttribute('numUnits') + "</span> Units</li>" +
                            "<li>Built in <span>" + item.getAttribute('yearBuilt') + "</span></li>" +
                            "<li><span>" + item.getAttribute('broker') + "</span></li>" +
                            "<li><span>" + item.address.city + ", " + item.address.state + "</span></li>" +
                            "</ul>" +
                            "</div>" +
                            "<div class=\"popup-striped-container popup-footer\">\n    <p>" +
                            item.address.street1 + "</p>\n</div></div>";

                        var popupElement = $compile(popupTempl)(scope);

                        return popupElement[0];
                    }

                    function initMarkers() {
                        angular.forEach(scope.items, function (item) {
                            if (item.location) {
                                item.marker = new L.Marker(new L.LatLng(item.location[0], item.location[1]), { title: item.title, icon: icons[item.getStatusClass()] });
                                item.marker.on("click", function (e) {
                                    scope.$apply(function () {
                                        if (BrowserDetect.platform !== 'tablet') {
                                            scope.showDetails(item);
                                        } else {
                                            item.marker.bindPopup(popupTemplate(item), {closeButton: false, minWidth: 325}).openPopup();
                                        }
                                    });
                                });

                                // Bind mouseover popup
                                item.marker.on("mouseover", function (e) {
                                    item.marker.bindPopup(popupTemplate(item), {closeButton: false, minWidth: 325}).openPopup();
                                });

                                markers.addLayer(item.marker);
                            }
                        });

                        map.addLayer(markers);
                    }

                    function renderFromBounds() {
                        scope.$apply(function () {
                            markers.clearLayers();
                            var bounds = map.getBounds();

                            Market.dimensions.range.latitude.highSelected = bounds._northEast.lat;
                            Market.dimensions.range.longitude.highSelected = bounds._northEast.lng;
                            Market.dimensions.range.latitude.lowSelected = bounds._southWest.lng;
                            Market.dimensions.range.longitude.lowSelected = bounds._southWest.lng;

                            scope.render();

                            for (var i = scope.items.length - 1; i >= 0; i--) {
                                var _item = scope.items[i];
                                if (_item.isVisible && _item.location) {
                                    map.addLayer(_item.marker);
                                }
                            }
                        });
                    }

                    map.on('dragend', renderFromBounds);
                    map.on('zoomend', renderFromBounds);
//                    scope.$on('UpdateMap', function (e) {
//                        // Markers plugin says better performance to clear all markers and recreate
//                        markers.clearLayers();
//                        // Zoom out
////                        map.setView(defaultLatLng, defaultZoom);
//
//                        // Loop through each item
//                        _.each(scope.items, function (item) {
//                            // Check visibility
//                            if (item.isVisible && item.location) {
//                                // Initialize new marker at location
//                                // Add marker to marker group
//                                markers.addLayer(item.marker);
//                            }
//                        });
//                        // Add marker groups
//                        map.addLayer(markers);
//                    });

//                    scope.$watch(function () {
//                        return Market.visibleIds;
//                    }, function () {
//                        // Markers plugin says better performance to clear all markers and recreate
//                        markers.clearLayers();
//                        // Zoom out
//                        map.setView(defaultLatLng, defaultZoom);
//
//                        // Loop through each item
//                        _.each(items, function (item) {
//                            // Check visibility
//                            if (item.isVisible && item.location) {
//                                // Initialize new marker at location
//                                // Add marker to marker group
//                                markers.addLayer(item.marker);
//                            }
//                        });
//                        // Add marker groups
//                        map.addLayer(markers);
//                    });

                    scope.$on('CenterMap', function (event, item) {
                        if (item.marker) {
                            markers.zoomToShowLayer(item.marker, function () {
                                item.marker.bindPopup(popupTemplate(item), {closeButton: false, minWidth: 325}).openPopup();
                            });
                            map.panTo(item.location);
                        }
                    });

                    initMarkers();
                }
            };
        }])
    .directive('slider', ['Market', function (Market) {
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
    }]);