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
    .directive('checkout', ['$http', '$_api', function ($http, $_api) {
        return {
            link: function (scope, element, attrs) {
                element.bind('click', function (e) {
                    var token = function (res) {
//                        var $input = $('<input type=hidden name=stripeToken />').val(res.id);
//                        $('#Checkout').append($input).submit();
                        var path = $_api.path + '/auth/users/user/payment/',
                            config = angular.extend({
                                transformRequest: $_api.loading.none
                            }, $_api.config),
                            body = JSON.stringify({token: res.id});
                        console.log(body);

                        $http.post(path, body, config).then(function (response) {
                            if (response.data.status === "success") {
                                console.log(response);
                            } else {

                            }
                        }, function (response) {

                        });

                    };

                    StripeCheckout.open({
                        key: 'pk_test_wSAqQNQKI7QqPmBpDcQLgGM7',
                        address: true,
                        amount: 5000,
                        name: 'Rescour',
                        description: 'A bag of Pistachios',
                        panelLabel: 'Checkout',
                        token: token
                    });

                    return false;
                });
            }
        };
    }]);