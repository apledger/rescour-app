/**
 * Created with JetBrains WebStorm.
 * User: apledger
 * Date: 4/24/13
 * Time: 4:56 PM
 * File: /app/home/home.js
 */

angular.module('rescour.app')
    .config(['$routeProvider',
        function ($routeProvider) {
            $routeProvider
                .when('/market', {
                    templateUrl: "/app/market/desktop/views/market.html",
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
                        },
                        detailsId: function ($location) {
                            return $location.search().id;
                        }
                    }
                });
        }])
    .controller('MarketController', ['$scope', 'Items', 'Attributes', '$timeout', '$routeParams', 'detailsId', 'PropertyDetails', '$location',
        function ($scope, Items, Attributes, $timeout, $routeParams, detailsId, PropertyDetails, $location) {
            $scope.items = Items.toArray();
            $scope.attributes = Attributes;
            $scope.toggle = 'all';
            $scope.getActive = Items.getActive;

            if (detailsId) {
                PropertyDetails.open(Items.items[detailsId]);
            }
//
//            $scope.$on('$locationChangeSuccess', function (e, newLocation, oldLocation) {
//                console.log(oldLocation);
//                if (angular.isObject(Items.items[$location.search().id]) && !PropertyDetails.isOpen()) {
//                    $scope.showItemDetails(Items.items[$location.search().id]);
//                } else if (!angular.isObject(Items.items[$location.search().id]) && PropertyDetails.isOpen()) {
//                    $scope.showItemDetails(null);
//                }
//            });

            $scope.sortByRange = function (rangeVal) {
                return function (object) {
                    if (object.attributes.range[rangeVal] === 'NA') {
                        return 0
                    } else {
                        return -object.attributes.range[rangeVal]
                    }
                };
            };

            $scope.showItemDetails = function (item, pane) {
                PropertyDetails.open(item).selectPane(pane);
            };

            $scope.centerMap = function (item) {
                Items.setActive(null);
                $scope.$broadcast('CenterMap', item);
            };

            $scope.filter = function () {
                Attributes.apply();
                Items.render();
                Attributes.predict();
                $scope.toggle = 'all';
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
                        SavedSearch.dialog.open()
                            .then(function (result) {
                                if (result) {
                                    if (result.action === 'save') {
                                        $scope.saveSearch(result.settings);
                                    }
                                }
                            });
                    } else {
                        $scope.saveSearch();
                    }
                }
            };

            $scope.saveSearch = function (settings) {
                if (typeof settings !== 'undefined') {
                    angular.extend($scope.attributes, settings);
                }
                // Create a new resource object with existing attributes
                $scope.selectedSearch = new SavedSearch($scope.attributes);
                $scope.selectedSearch.$save().then(function (response) {
                    $scope.savedSearches = SavedSearch.query();
                    $scope.attributes.modified = false;
                    $scope.attributes.id = response.id;
                }, function (response) {
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
    .controller("ListController", ['$scope', 'PropertyDetails',
        function ($scope, PropertyDetails) {
            $scope.panTo = function (item) {
                $scope.centerMap(item);
            };

            $scope.getStatusClass = function (status) {
                switch (status) {
                    case 'Marketing':
                        return 'caption-green';
                    case 'Under Contract':
                        return 'caption-orange';
                    case 'Under LOI':
                        return 'caption-orange';
                    case 'Expired':
                        return 'caption-red';
                }
            };

            $scope.toggleFavorites = function (item) {
                item.toggleFavorites();
            };

            $scope.toggleHidden = function (item) {
                item.toggleHidden();
            };
        }])
    .controller("DetailsController", ['$scope', '$http', '$_api', '$timeout', 'PropertyDetails', 'Items', 'activeItem', 'dialog', 'Finance',
        function ($scope, $http, $_api, $timeout, PropertyDetails, Items, activeItem, dialog, Finance) {
            $scope.newComment = {};
            $scope.newEmail = {};
            $scope.panes = PropertyDetails.panes;
            $scope.valueFormats = Finance.valueFormats;
            $scope.financeFields = Finance.fields;
            $scope.contactAlerts = [];
            $scope.current = activeItem;

            $scope.close = function () {
                dialog.close();
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
