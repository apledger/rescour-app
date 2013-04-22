'use strict';

rescourApp
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
            link: function (scope, element, attrs, ctrl) {


                scope.$watch(function () {
                    return scope.$eval(attrs.passwordVerify);
                }, function (newVal) {

                    ctrl.$viewValue = "";
                    ctrl.$modelValue = "";
                    ctrl.$render();
                    ctrl.$setValidity("passwordMatch", false);
                    console.log(newVal);
                });

                ctrl.$parsers.unshift(function (viewValue) {
                    var origin = scope.$eval(attrs.passwordVerify);
                    if (viewValue === origin) {
                        ctrl.$setValidity('passwordMatch', true);
                        return viewValue;
                    } else {
                        ctrl.$setValidity('passwordMatch', false);
                        return undefined;
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
    })
    .directive('ngBlur', ['$parse', function ($parse) {
        return function (scope, element, attr) {
            var fn = $parse(attr['ngBlur']);
            element.bind('blur', function (event) {
                scope.$apply(function () {
                    fn(scope, {$event: event, $element: element});
                });
            });
        };
    }])
    .directive('autoSave', ['$parse', '$timeout', function ($parse, $timeout) {
        return {
            restrict: 'A',
            scope: true,
            link: function (scope, element, attr) {
                var fn = $parse(attr['autoSave']);
                element.bind('blur', function (event) {
                    scope.$apply(function () {
                        fn(scope, {$event: event});
                    });
                });
                scope.$on('autoSaveSuccess', function () {
                    element.addClass('auto-save-success');
                    $timeout(
                        function () {
                            element.removeClass('auto-save-success');
                        },
                        400
                    );
                });
                element.addClass('auto-save');
            }
        };
    }])
    .directive('fadeAfter', ['$timeout', function ($timeout) {
        return {
            link: function (scope, element, attrs) {
                if (parseInt(attrs.fadeAfter, 10)) {
                    $timeout(function () {
                        element.fadeOut(700);
                    }, attrs.fadeAfter);
                }
            }
        };
    }])
    .directive('spinner', function () {
        return {
            restrict: 'AC',
            link: function (scope, element, attrs) {
                var opts = {
                        small: {
                            lines: 9, // The number of lines to draw
                            length: 0, // The length of each line
                            width: 4, // The line thickness
                            radius: 8, // The radius of the inner circle
                            corners: 1, // Corner roundness (0..1)
                            rotate: 37, // The rotation offset
                            direction: 1, // 1: clockwise, -1: counterclockwise
                            color: '#555', // #rgb or #rrggbb
                            speed: 1.0, // Rounds per second
                            trail: 85, // Afterglow percentage
                            shadow: false, // Whether to render a shadow
                            hwaccel: true, // Whether to use hardware acceleration
                            className: 'spinner', // The CSS class to assign to the spinner
                            zIndex: 2e9, // The z-index (defaults to 2000000000)
                            top: 'auto', // Top position relative to parent in px
                            left: 'auto' // Left position relative to parent in px
                        },
                        large: {
                            lines: 9, // The number of lines to draw
                            length: 0, // The length of each line
                            width: 12, // The line thickness
                            radius: 24, // The radius of the inner circle
                            corners: 1, // Corner roundness (0..1)
                            rotate: 37, // The rotation offset
                            direction: 1, // 1: clockwise, -1: counterclockwise
                            color: '#555', // #rgb or #rrggbb
                            speed: 1.0, // Rounds per second
                            trail: 85, // Afterglow percentage
                            shadow: false, // Whether to render a shadow
                            hwaccel: true, // Whether to use hardware acceleration
                            className: 'spinner', // The CSS class to assign to the spinner
                            zIndex: 2e9, // The z-index (defaults to 2000000000)
                            top: 'auto', // Top position relative to parent in px
                            left: 'auto' // Left position relative to parent in px
                        }
                    },
                    ele = element[0],
                    spinner = new Spinner(opts[attrs.spinnerSize || 'small']);
//
//                function getPosition() {
//                    var boundingClientRect = element[0].getBoundingClientRect();
//                    return {
//                        width: element.prop('offsetWidth'),
//                        height: element.prop('offsetHeight'),
//                        top: boundingClientRect.top + $window.pageYOffset,
//                        left: boundingClientRect.left + $window.pageXOffset
//                    };
//                }

                scope.$watch(function () {
                    if (scope.$eval(attrs.spinner)) {
                        spinner.spin(ele);
                    } else {
                        spinner.stop();
                    }
                });
            }
        };
    });