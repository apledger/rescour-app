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
                        loadItems: function ($q, $_api, Items, $rootScope, Item) {
                            var defer = $q.defer();
                            Item.query().then(function (result) {
                                if (angular.equals(result, [])) {
                                    defer.reject("Failed to contact server");
                                } else {
                                    Items.initialize(result.data.resources);
                                    defer.resolve();
                                }
                            }, function (response) {
                                defer.reject(response);
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
    .controller('MarketController', ['$scope', 'Items', 'Attributes', '$timeout', '$routeParams', 'PropertyDetails', '$location', 'BrowserDetect',
        function ($scope, Items, Attributes, $timeout, $routeParams, PropertyDetails, $location, BrowserDetect) {
            $scope.items = Items.toArray();
            $scope.attributes = Attributes;
            $scope.toggle = 'all';
            $scope.getActive = Items.getActive;
            $scope.browser = BrowserDetect;

            function openDetails(id) {
                if (angular.isObject(Items.items[id])) {
                    PropertyDetails.open(Items.items[id]).selectPane($location.hash());
                } else {
                    PropertyDetails.isOpen ? PropertyDetails.close() : null;
                    $location.search('id', null).hash(null);
                }
            }

            if ($location.search().id) {
                openDetails($location.search().id);
            }

            $scope.$on('$locationChangeSuccess', function (e, newLocation, oldLocation) {
                openDetails($location.search().id);
            });

            $scope.showItemDetails = function (item, pane) {
                $location.search('id', item.id).hash(pane);
            };

            $scope.centerMap = function (item) {
                if (PropertyDetails.isOpen()) {
                    $location.search('id', null).hash(null);
                }
                $scope.$broadcast('CenterMap', item);
            };

            $scope.render = function (subset) {
                Items.render(subset);
            };

            $scope.filter = function () {
                Attributes.apply();
                Items.render();
                Attributes.predict();
                $scope.attributes.modified = true;
            };
        }])
    .controller("FilterController", ['$scope', 'Items', 'Attributes', 'SavedSearch', '$dialog',
        function ($scope, Items, Attributes, SavedSearch, $dialog) {
            $scope.selectedSearch = null;
            $scope.loadPower = {
                title: 'Load',
                options: {
                    'New': {
                        action: function () {
                            $scope.loadSearch();
                        },
                        icon: 'icon-plus-sign',
                        title: 'New Search',
                        weight: 10
                    }
                }
            };

            var updateLoadPower = function () {
                angular.forEach($scope.savedSearches, function (value) {
                    $scope.loadPower.options[value.title] = {
                        action: function () {
                            console.log(value);
                            $scope.loadSearch(value);
                        },
                        title: value.title
                    }
                });
            }

            SavedSearch.query().then(function (savedSearches) {
                $scope.savedSearches = savedSearches;
                updateLoadPower();
            });

            $scope.savePower = {
                title: 'Save',
                color: 'green',
                options: {
                    'Save': {
                        action: function () {
                            $scope.openSaveDialog();
                        },
                        icon: 'icon-save',
                        title: 'Save'
                    },
                    'SaveAs': {
                        action: function () {
                            console.log("hello");
                        },
                        icon: 'icon-save',
                        title: 'Save As...'
                    }
                }
            };

            $scope.openSaveDialog = function () {
                // If its a new search open the dialog
                if ($scope.attributes.modified) {
                    if (!$scope.selectedSearch) {
                        SavedSearch.dialog
                            .open()
                            .then(function (result) {
                                result ? (result.action === 'save' ? $scope.saveSearch(result.settings) : null) : null;
                            });
                    } else {
                        $scope.saveSearch();
                    }
                }
            };

            $scope.orderByWeight = function () {
                return function (object) {
                    return object.weight;
                };
            };

            $scope.saveSearch = function (settings) {
                angular.extend($scope.attributes, settings);

                var _search = new SavedSearch($scope.attributes),
                    _old = _.findWhere($scope.savedSearches, {id: $scope.attributes.id});

                _search.$save().then(function (response) {
                    if (!_old) {
                        $scope.savedSearches.push(_search);
                        $scope.attributes.id = response.id;

                    } else {
                        $scope.savedSearches = _.map($scope.savedSearches, function (val) {
                            return val.id === _old.id ? _search : val;
                        });
                    }
                    $scope.selectedSearch = _search;
                    $scope.attributes.modified = false;
                    updateLoadPower();
                }, function (response) {
                    $scope.savedSearches = SavedSearch.query();
                    throw new Error("Could not save search: " + response.error);
                });
            };

            $scope.toggleDiscreet = function (value) {
                value.isSelected = !value.isSelected;
                $scope.filter();
            };

            $scope.refreshSearch = function () {
                $scope.loadSearch(_.find($scope.savedSearches, function (saved) {
                    return saved.id === $scope.attributes.id;
                }));
            };

            $scope.loadSearch = function (search) {
                Attributes.load(search);
                $scope.$broadcast('rangesDefined');
                $scope.filter();
                $scope.selectedSearch = search;
                $scope.attributes.modified = false;
            };

            $scope.hide = function (item) {
                item.isHidden = !item.isHidden;
            };

            $scope.favorite = function (item) {
                item.isFavorite = !item.isFavorite;
            };
        }])
    .
    controller("ListController", ['$scope', 'PropertyDetails', 'Items',
        function ($scope, PropertyDetails, Items) {
            $scope.sortBy = "yearBuilt";

            $scope.sortPower = {
                title: 'Sort',
                options: {
                    'Year': {
                        action: function () {
                            $scope.sortBy = 'yearBuilt';
                        },
                        icon: 'icon-calendar',
                        title: 'Year'
                    },
                    'Units': {
                        action: function () {
                            $scope.sortBy = 'numUnits';
                        },
                        icon: 'icon-building',
                        title: 'Units'
                    },
                    'Name': {
                        action: function () {
                            $scope.sortBy = 'Name';
                        },
                        icon: 'icon-sort-by-alphabet',
                        title: 'Name'
                    }
                }
            };

            $scope.reportPower = {
                title: 'Export',
                options: {
                    'CSV': {
                        action: $scope.sortYear,
                        icon: 'icon-mail',
                        title: 'To CSV'
                    }
                }
            };

            $scope.showPower = {
                title: 'All',
                toggle: 'all',
                options: {
                    all: {
                        action: function () {
                            Items.render(this.key);
                            $scope.showPower.title = this.title;
                        },
                        icon: 'icon-list',
                        title: 'All'
                    },
                    'favorites': {
                        action: function () {
                            Items.render(this.key);
                            $scope.showPower.title = this.title;
                        },
                        icon: 'icon-star',
                        title: 'Favorites'
                    },
                    'hidden': {
                        action: function () {
                            Items.render(this.key);
                            $scope.showPower.title = this.title;
                        },
                        icon: 'icon-ban-circle',
                        title: 'Hidden'
                    },
                    'notes': {
                        action: function () {
                            Items.render(this.key);
                            $scope.showPower.title = this.title;
                        },
                        icon: 'icon-pencil',
                        title: 'Notes'
                    }
                }
            };

            $scope.panTo = function (item) {
                $scope.centerMap(item);
            };

            $scope.orderNA = function () {
                if ($scope.sortBy === "numUnits" || $scope.sortBy === "yearBuilt") {
                    return function (object) {
                        if (object.attributes.range.yearBuilt === 'NA' && object.attributes.range.numUnits === 'NA') {
                            return 0
                        } else if (object.attributes.range.yearBuilt === 'NA' || object.attributes.range.numUnits === 'NA') {
                            return -1;
                        } else if (object.attributes.range[$scope.sortBy]) {
                            return -object.attributes.range[$scope.sortBy];
                        }
                    };
                } else {
                    return function (object) {
                        return object.title;
                    }
                }
            };

            $scope.toggleFavorites = function (item) {
                item.toggleFavorites();
            };

            $scope.toggleHidden = function (item) {
                item.toggleHidden();
            };
        }])
    .controller("DetailsController", ['$scope', '$http', '$_api', '$timeout', 'PropertyDetails', 'Items', 'activeItem', '$location', 'Finance',
        function ($scope, $http, $_api, $timeout, PropertyDetails, Items, activeItem, $location, Finance) {
            $scope.newComment = {};
            $scope.newEmail = {};
            $scope.panes = PropertyDetails.panes;
            $scope.valueFormats = Finance.valueFormats;
            $scope.financeFields = Finance.fields;
            $scope.contactAlerts = [];
            $scope.current = activeItem;
            $scope.currentImages = $scope.current.getImages();
            $scope.detailsPower = {
                title: 'Options',
                options: {
                    'All': {
                        action: function () {
                            console.log("All");
                        },
                        icon: 'icon-plus',
                        title: 'All'
                    },
                    'Favorites': {
                        action: function () {
                            console.log("favorites");
                        },
                        icon: 'icon-minus',
                        title: 'Favorites'
                    },
                    'Hidden': {
                        action: function () {
                            console.log("Hidden");
                        },
                        icon: 'icon-minus',
                        title: 'Hidden'
                    },
                    'Notes': {
                        action: function () {
                            console.log("Notes");
                        },
                        icon: 'icon-minus',
                        title: 'Notes'
                    }
                }
            };

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
        }]);
