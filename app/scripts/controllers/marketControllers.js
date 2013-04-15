'use strict';

angular.module('nebuMarket')
    .controller('MarketController', ['$scope', 'Items', 'Filter', 'Attributes', '$timeout', '$location', '$routeParams',
        function ($scope, Items, Filter, Attributes, $timeout, $location, $routeParams) {
            $scope.items = Items.getItems();
            $scope.attributes = Attributes.active;
            $scope.view = null;
            $scope.toggle = null;
            $scope.selectedItem = null;
            $scope.center = null;
            $scope.modal = {};

            $scope.clear = function () {
                $scope.modal = $scope.selectedItem = $scope.center = null;
            };

            $scope.selectItem = function (item) {
                if (!item.hasOwnProperty('details')) {
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
                        templateUrl: '/views/market/partials/saveSearchDialog.html',
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
                console.log($scope.savedSearches);
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
            var Finance = PropertyDetails.Finance,
                Comment = PropertyDetails.Comment;

            $scope.newComment = {};
            $scope.newEmail = {};
            $scope.panes = PropertyDetails.panes.panes;
            $scope.valueFormats = Finance.valueFormats;
            $scope.financeFields = Finance.fields;


            $scope.addComment = function (comment) {
                var newComment = new Comment(comment);
                if ($scope.formComment.$valid) {
                    $scope.current.addComment(newComment).then(function (response) {
                        comment.text = "";
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

                if (email.length > 0 && email.message) {
                    $http.post($_api.path + '/mail/', JSON.stringify(email), $_api.config).then(function (response) {
                        // Need to check for successful email
                        email.sent = true;
                        $timeout(function () {
                            email.sent = false;
                        }, 1500);
                        email.message = "";
                    }, function (response) {
                        throw new Error("Could not send email: " + response.error);
                    });
                }
            };

            $scope.saveFinance = function (finance) {
                finance.$save();
            };

            $scope.newFinance = function () {
                $scope.newFinance = new Finance();
                $scope.current.addFinance($scope.newFinance);
            };

            $scope.deleteFinance = function (finance) {
                finance.$delete();
            };
        }]);

