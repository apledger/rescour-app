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
                        amount: 1000000,
                        name: 'Rescour',
                        description: 'Activate your trial!',
                        panelLabel: 'Checkout',
                        token: token
                    });

                    return false;
                });
            }
        };
    }])

    .directive("passwordVerify", function () {
        return {
            require: "ngModel",
            scope: {
                passwordVerify: '='
            },
            link: function (scope, element, attrs, ctrl) {

                scope.$watch('passwordVerify', function (value) {
                    ctrl.$viewValue = "";
                    ctrl.$render();
                    ctrl.$setValidity("passwordMatch", false);
                });

                ctrl.$parsers.unshift(function (viewValue) {
                    var origin = scope.passwordVerify;
                    if (origin !== viewValue) {
                        ctrl.$setValidity("passwordMatch", false);
                        return undefined;
                    } else {
                        ctrl.$setValidity("passwordMatch", true);
                        return viewValue;
                    }
                });
            }
        };
    })
    .directive('passwordValidate', function () {
        return {
            require: 'ngModel',
            link: function (scope, elm, attrs, ctrl) {
                ctrl.$parsers.unshift(function (viewValue) {

                    scope.pwdValidLength = (viewValue && viewValue.length >= 8 ? 'valid' : undefined);
                    scope.pwdHasLetter = (viewValue && /[A-z]/.test(viewValue)) ? 'valid' : undefined;
                    scope.pwdHasNumber = (viewValue && /\d/.test(viewValue)) ? 'valid' : undefined;

                    if (scope.pwdValidLength && scope.pwdHasLetter && scope.pwdHasNumber) {
                        ctrl.$setValidity('passwordValid', true);
                        return viewValue;
                    } else {
                        ctrl.$setValidity('passwordValid', false);
                        return undefined;
                    }
                });
            }
        };
    }).directive('ngBlur', ['$parse', function($parse) {
    return function(scope, element, attr) {
        var fn = $parse(attr['ngBlur']);
        element.bind('blur', function(event) {
            scope.$apply(function() {
                fn(scope, {$event:event});
            });
        });
    };
}]);