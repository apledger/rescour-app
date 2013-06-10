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

            function openDetails (id) {
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

            $scope.filter = function () {
                Attributes.apply();
                Items.render();
                if ($scope.toggle !== 'all') {
                    Items.render($scope.toggle);
                }
                Attributes.predict();
                $scope.attributes.modified = true;
            };

            $scope.listAll = function () {
                $scope.toggle = 'all';
                Items.render();
            };

            $scope.listFavorites = function () {
                $scope.toggle = 'favorites';
                Items.render('favorites');
            };

            $scope.listHidden = function () {
                $scope.toggle = 'hidden';
                Items.render('hidden');
            };

            $scope.listNotes = function () {
                $scope.toggle = 'notes';
                Items.render('notes');
            };
        }])
    .controller("FilterController", ['$scope', 'Items', 'Attributes', 'SavedSearch', '$dialog',
        function ($scope, Items, Attributes, SavedSearch, $dialog) {
            $scope.selectedSearch = null;
            $scope.savedSearches = SavedSearch.query();

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
    .controller("ListController", ['$scope', 'PropertyDetails', '$window', 'Power',
        function ($scope, PropertyDetails, $window, Power) {
            $scope.sortBy = function (dimension) {
                console.log("sorting " + dimension);
            }

            $scope.sortYear = function () {
                $scope.sortBy('year')
            };

            $scope.sortUnits = function () {
                $scope.sortBy('units')
            };

            $scope.sortPower = {
                title: 'Sort',
                options: {
                    'Year': {
                        action: $scope.sortYear,
                        icon: 'icon-plus',
                        title: 'Year'
                    },
                    'Units': {
                        action: function () {
                            console.log("hello");
                            $scope.sortBy('Units');
                        },
                        icon: 'icon-minus',
                        title: 'Units'
                    }
                }
            };

            $scope.showPower = {
                title: 'Show',
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

            $scope.searchPower = {
                title: 'Search',
                options: {
                    'Notes': {
                        action: function () {
                            console.log("Notes");
                        },
                        icon: 'icon-minus',
                        title: 'Notes'
                    }
                }
            };



            $scope.panTo = function (item) {
                $scope.centerMap(item);
            };

            $scope.orderNA = function () {
                return function (object) {
                    if (object.attributes.range.yearBuilt === 'NA' && object.attributes.range.numUnits === 'NA') {
                        return 0
                    } else if (object.attributes.range.yearBuilt === 'NA' || object.attributes.range.numUnits === 'NA') {
                        return -1;
                    } else if (object.attributes.range.yearBuilt) {
                        return -object.attributes.range.yearBuilt;
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
    .controller("DetailsController", ['$scope', '$http', '$_api', '$timeout', 'PropertyDetails', 'Items', 'activeItem', '$location', 'Finance',
        function ($scope, $http, $_api, $timeout, PropertyDetails, Items, activeItem, $location, Finance) {
            $scope.newComment = {};
            $scope.newEmail = {};
            $scope.panes = PropertyDetails.panes;
            $scope.valueFormats = Finance.valueFormats;
            $scope.financeFields = Finance.fields;
            $scope.contactAlerts = [];
            $scope.current = activeItem;

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
