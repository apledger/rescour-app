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
                $scope.selectedItem = item;
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
    .controller("FilterController", ['$scope', 'Items', 'Attributes', 'Templates', 'SavedSearch', '$dialog',
        function ($scope, Items, Attributes, Templates, SavedSearch, $dialog) {
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
                        templateUrl: Templates.saveSearchDialog,
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
                // If search is null, load will create new object
                Attributes.load(search);
                Items.loadItems();
                $scope.selectedSearch = search;
                $scope.$broadcast("rangesDefined");
                $scope.attributes = Attributes.active;
                $scope.filter();
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
    .controller("ListController", ['$scope', 'detailPanes',
        function ($scope, detailPanes) {
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
                detailPanes.selectPane("Pictures");
            };

            $scope.showNotes = function (item) {
                $scope.selectItem(item);
                detailPanes.selectPane("Comments");
            };

            $scope.showDetails = function (item) {
                $scope.selectItem(item);
                detailPanes.selectPane("Details");
            };

            $scope.showContact = function (item) {
                $scope.selectItem(item);
                detailPanes.selectPane("Contact");
            };
        }])
    .controller("DetailsController", ['$scope', '$http', '$_api', '$timeout', 'detailPanes', 'FinancialFields',
        function ($scope, $http, $_api, $timeout, detailPanes, FinancialFields) {
            $scope.newComment = {};
            $scope.newEmail = {};
            $scope.panes = detailPanes.panes;
            $scope.financialFields = FinancialFields;

            $scope.formats = [
                {icon: '$', class: 'currency', selected: true},
                {icon: '%', class: 'percentage', selected: false},
                {icon: '0.0', class: 'number', selected: false}
            ];

            $scope.addComment = function (comment) {
                if (comment.text) {
                    $scope.current.addComment(comment).then(function (response) {
                        $scope.newComment.text = "";
                    });
                }
            };

            $scope.sendEmail = function () {
                $scope.newEmail.recipients = [];

                angular.forEach($scope.current.details.contacts, function (value, key) {
                    if (value.selected) {
                        $scope.newEmail.recipients.push(value.email);
                    }
                });

                if ($scope.newEmail.recipients.length > 0 && $scope.newEmail.message) {
                    $http.post($_api.path + '/mail/', JSON.stringify($scope.newEmail), $_api.config).then(function (response) {
                        // Need to check for successful email
                        $scope.newEmail.sent = true;
                        $timeout(function () {
                            $scope.newEmail.sent = false;
                        }, 1500);
                        $scope.newEmail.message = "";
                    }, function (response) {
                        throw new Error("Could not send email: " + response.error);
                    });
                }
            };

            $scope.saveNote = function (property) {
                property.saveNote().then(
                    function () {
                        $scope.$broadcast('autoSaveSuccess');
                    },
                    function (err) {
                        console.log('error saving note', err);
                    }
                );
            };
            
            $scope.addFinancial = function(){
                $scope.current.addFinancial();
            };

            $scope.saveFinancialModel = function(item){
                $scope.current.saveFinancial(item);
                if(!_.find($scope.financialFields.fields, function(value){return value == item.title})){
                    $scope.financialFields.fields = FinancialFields.addField(item.title);
                }
            };

            $scope.deleteFinancialModel = function(item){
                $scope.current.deleteFinancial(item);
            };

        }]);

