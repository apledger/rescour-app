'use strict';

rescourApp
    .directive('autoselect', function () {
        return function (scope, element, attrs) {
        };
    })
    .directive('editable', function () {
//        Editable is awesome
        return {
            restrict: "A",
            scope: true,
            compile: function (tElement, tAttrs, transclude) {
//                if (tElement.text().slice(0, 2) != '{{' || tElement.text().slice(tElement.text().length - 2) != '}}') {
//                    throw new Error('input must be surrounded in angular binding brackets');
//                }
                var displayTemp = '<span ng-hide="editMode" ng-dblclick="toggleEditMode()">{{' + tElement[0].innerText + '}}</span>';

                var editTemp = '<input ng-show="editMode" ng-dblclick="toggleEditMode()" ng-model="' + tElement[0].innerText + '" />';

                tElement.html(displayTemp);
                tElement.append(editTemp);

                return function (scope, element, attrs) {
                    scope.editMode = false;

                    scope.toggleEditMode = function () {
                        scope.editMode = !scope.editMode;
                    };
                };
            }
        };
    })
    .directive('clickSpin', ['$timeout', function ($timeout) {
        return function (scope, element, attrs) {
            element.bind('click', function () {
                element.find("i").addClass("icon-spin");
                $timeout(function () {
                    element.find("i").removeClass("icon-spin");
                }, 1000);
            });
        };
    }])
    .directive('checkout', function () {
        return {
            link: function (scope, element, attrs) {
                element.bind('click', function (e) {
                    var token = function (res) {
                        var $input = $('<input type=hidden name=stripeToken />').val(res.id);
                        $('#Checkout').append($input).submit();
                    };

                    StripeCheckout.open({
                        key: 'pk_test_czwzkTp2tactuLOEOqbMTRzG',
                        address: true,
                        amount: 5000,
                        name: 'Joes Pistachios',
                        description: 'A bag of Pistachios',
                        panelLabel: 'Checkout',
                        token: token
                    });

                    return false;
                });
            }
        };
    });