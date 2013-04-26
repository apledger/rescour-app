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
            $routeProvider.when('/market', {
                templateUrl: "/app/market/desktop/views/market.html",
                controller: 'MarketController',
                resolve: {
                    loadItems: function ($q, $_api, Items, $rootScope, Item) {
                        var defer = $q.defer();
                        Item.query().then(function (result) {
                            if (angular.equals(result, [])) {
                                defer.reject("Failed to contact server");
                            } else {
                                Items.createItems(result.data.resources);
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
    .controller('MarketController', ['$scope', 'Items', 'Filter', 'Attributes', '$timeout', '$location', '$routeParams',
        function ($scope, Items, Filter, Attributes, $timeout, $location, $routeParams) {
            $scope.items = Items.getItems();
            $scope.attributes = Attributes.active;
            $scope.view = null;
            $scope.toggle = null;
            $scope.selectedItem = null;
            $scope.center = null;
            $scope.modal = {};

            $scope.sortByRange = function (rangeVal) {
                return function (object) {
                    return object.attributes.range[rangeVal] === 'NA' ? 0 : -object.attributes.range[rangeVal];
                };
            };

            $scope.clear = function () {
                $scope.modal = $scope.selectedItem = $scope.center = null;
            };

            $scope.selectItem = function (item) {
                if (!item.hasOwnProperty('details') || _.isEmpty(item.details)) {
                    item.getDetails();
                }
                Items.active = $scope.selectedItem = item;
            };

            $scope.centerMap = function (item) {
                $scope.selectedItem = null;
                $scope.center = item;
            };

            $scope.refreshItems = function () {
                $scope.toggle = "all";
                $scope.render(Filter.filter(Attributes.active));
            };

            $scope.openModal = function (template) {
                $scope.modal = template;
            };

            $scope.filter = function () {
                $scope.toggle = "all";
                $scope.modal = $scope.center = null;
                $scope.attributes.modified = true;
                $scope.render(Filter.filter(Attributes.active));
                // Predict Numbers
                $timeout(function () {
                    angular.forEach($scope.attributes.discreet, function (parent) {
                        angular.forEach(parent.values, function (value) {
                            $timeout(function () {
                                var len;
                                if (parent.selected > 0 && !value.isSelected) {
                                    // Calculate length
                                    len = Filter.addedLength(value);
                                    if (len > 0) {
                                        value.badge = "badge-success";
                                        value.predict = "+" + len;
                                    } else {
                                        value.badge = ""; // Otherwise leave gray
                                        value.predict = 0;
                                    }
                                } else { // Means that there is nothing selected in this attribute section,
                                    // or this value is the one selected

                                    // Calculate intersection of this value and what current visible is
                                    len = _.intersection(value.ids, Filter.getVisibleIds()).length;

                                    // Make the badge blue if greater than 0
                                    value.badge = len ? "badge-info" : "";

                                    // Return the value
                                    value.predict = len;
                                }
                            }, 0);
                        });
                    });
                }, 0);
            };

            $scope.render = function (ids) {
                Items.updateVisible(ids);
                $scope.$broadcast('Render');
            };

            $scope.listFavorites = function () {
                $scope.toggle = "favorites";
                Items.showFavorites();
                $scope.$broadcast('Render');
            };

            $scope.listHidden = function () {
                $scope.toggle = "hidden";
                Items.showHidden();
                $scope.$broadcast('Render');
            };

            $scope.listNotes = function () {
                $scope.toggle = "notes";
                Items.showNotes();
                $scope.$broadcast('Render');
            };

            $scope.$on("MapReady", function () {
                $scope.filter();
                $scope.attributes.modified = false;
            });
        }])
    .controller("FilterController", ['$scope', 'Items', 'Attributes', 'SavedSearch', '$dialog',
        function ($scope, Items, Attributes, SavedSearch, $dialog) {
            $scope.selectedSearch = null;
            $scope.savedSearches = SavedSearch.query();
            console.log(SavedSearch.query());

            $scope.openSaveDialog = function () {
                // If its a new search open the dialog
                if (!$scope.selectedSearch) {
//                    $scope.openModal(Templates.newSearch);
                    $dialog.dialog({
                        backdrop: true,
                        keyboard: true,
                        backdropClick: true,
                        dialogFade: true,
                        backdropFade: true,
                        templateUrl: '/app/home/desktop/views/partials/saved-search-dialog.html',
                        controller: "SaveSearchDialogController"
                    }).open()
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
                    $scope.clear();
                }, function (response) {
                    throw new Error("Could not save search: " + response.error);
                });
            };

            $scope.filterByDiscreet = function (parent, value) {
                value.isSelected = !value.isSelected;
                parent.selected = value.isSelected ? (parent.selected + 1) : (parent.selected - 1);
                $scope.filter();
            };

            $scope.refreshSearch = function () {
                $scope.loadSearch(_.find($scope.savedSearches, function (saved) {
                    return saved.id === $scope.attributes.id;
                }));
            };

            $scope.loadSearch = function (search) {
                $scope.attributes.reset();
                Items.loadItems();
                $scope.attributes.load(search);
                $scope.filter();
                $scope.selectedSearch = search;
                console.log($scope.selectedSearch);
                $scope.attributes.modified = false;
            };

            $scope.hide = function (item) {
                item.isHidden = !item.isHidden;
            };

            $scope.favorite = function (item) {
                item.isFavorite = !item.isFavorite;
            };
        }])
    .controller('SaveSearchDialogController', ['$scope', 'dialog',
        function ($scope, dialog) {
            $scope.searchSettings = {};
            $scope.close = function () {
                dialog.close();
            };

            $scope.save = function (settings) {
                dialog.close({
                    action: 'save',
                    settings: settings
                });
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

            $scope.showPictures = function (item) {
                $scope.selectItem(item);
                PropertyDetails.panes.selectPane("Pictures");
            };

            $scope.showNotes = function (item) {
                $scope.selectItem(item);
                PropertyDetails.panes.selectPane("Comments");
            };

            $scope.showDetails = function (item) {
                $scope.selectItem(item);
                PropertyDetails.panes.selectPane("Details");
            };

            $scope.showContact = function (item) {
                $scope.selectItem(item);
                PropertyDetails.panes.selectPane("Contact");
            };
        }])
    .controller("DetailsController", ['$scope', '$http', '$_api', '$timeout', 'PropertyDetails',
        function ($scope, $http, $_api, $timeout, PropertyDetails) {
            $scope.newComment = {};
            $scope.newEmail = {};
            $scope.panes = PropertyDetails.panes.panes;
            $scope.valueFormats = PropertyDetails.Finance.valueFormats;
            $scope.financeFields = PropertyDetails.Finance.fields;
            $scope.contactAlerts = [];

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
    .directive('propertyDetails', function () {
        return {
            restrict: "C",
            scope: {
                current: "="
            },
            templateUrl: '/app/market/desktop/views/partials/market-details.html',
            controller: 'DetailsController',
            link: function (scope) {
                scope.close = function () {
                    scope.current = null;
                };
            }
        };
    })
    .directive('slider', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attr) {
                function setupSlider() {
                    element.find('.slider').slider({
                        range: true,
                        min: 0,
                        max: 100,
                        // Calculate percentages based off what the low selected and high selected are
                        values: [
                            parseInt((((1.0 * (scope.range.lowSelected - scope.range.low)) / (scope.range.high - scope.range.low)) * 100), 10),
                            parseInt((((1.0 * (scope.range.highSelected - scope.range.low)) / (scope.range.high - scope.range.low)) * 100), 10)
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
                        }
                    });
                }

                // Watch when the slider low or high selected changes, update slider accordingly.

                scope.$on('rangesDefined', function () {
                    setupSlider();
                });

                setupSlider();
            }
        };
    })
    .directive('preview', function () {
        return {
            restrict: 'C',
            link: function (scope, element, attr) {
                element.bind('hover', function () {
                    element.find('.zoom-mask').fadeIn(300);
                }, function () {
                    element.find('.zoom-mask').fadeOut(300);
                });
            }
        };
    })
    .directive('dropdownToggle',
        ['$document', '$location', '$window', function ($document, $location, $window) {
            var openElement = null, close;
            return {
                restrict: 'CA',
                link: function (scope, element, attrs) {
                    scope.$watch(function dropdownTogglePathWatch() {
                        return $location.path();
                    }, function dropdownTogglePathWatchAction() {
                        if (close) {
                            close();
                        }
                    });

                    element.parent().bind('click', function (event) {
                        if (close) {
                            close();
                        }
                    });

                    element.bind('click', function (event) {
                        event.preventDefault();
                        event.stopPropagation();

                        var iWasOpen = false;

                        if (openElement) {
                            iWasOpen = openElement === element;
                            close();
                        }

                        if (!iWasOpen) {
                            element.parent().parent().addClass('open');
                            openElement = element;

                            close = function (event) {
                                if (event) {
                                    event.preventDefault();
                                    event.stopPropagation();
                                }
                                $document.unbind('click', close);
                                element.parent().parent().removeClass('open');
                                close = null;
                                openElement = null;
                            };

                            $document.bind('click', close);
                        }
                    });
                }
            };
        }]);
