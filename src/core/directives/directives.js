angular.module('rescour.directives')
    .directive("formatInput", ['$filter', '$timeout', '$parse', function ($filter, $timeout, $parse) {
        return {
            require: 'ngModel',
            link: function (scope, elm, attrs, ctrl) {
                // view -> model
                elm.bind('blur', function () {
                    scope.$apply(function () {
                        applyFilter(attrs.formatInput);
                    });
                });

                function applyFilter(formatInput) {
                    formatInput = formatInput || attrs.formatInput;
                    if (ctrl.$modelValue) {
                        ctrl.$viewValue = $filter(formatInput)(ctrl.$modelValue);
                        ctrl.$render();
                    } else {
                        ctrl.$viewValue = undefined;
                        ctrl.$render();
                    }
                }

                ctrl.$parsers.push(function (viewVal) {
                    return viewVal.replace(/\,/g, '');
                });

                elm.bind('focus', function () {
                    scope.$apply(function () {
                        ctrl.$viewValue = ctrl.$modelValue;
                        ctrl.$render();
                    });
                });

                attrs.$observe('formatInput', function (val) {
                    if (val) {
                        ctrl.$viewValue = $filter(val)(ctrl.$modelValue);
                        ctrl.$render();
                    }
                });

                // load init value from DOM
                $timeout(function () {
                    applyFilter(attrs.formatInput);
                }, 0);
            }
        };
    }])
    .directive('autoFocus', function ($parse) {
        return {
            link: function (scope, element, attrs) {
                element[0].focus();
            }
        }
    })
    .directive('modelIgnore', function () {
        return {
            require: 'ngModel',
            link: function (scope, element, attrs, modelCtrl) {
                var modelIgnore = attrs.modelIgnore;

                modelCtrl.$parsers.push(function (viewVal) {
                    if (viewVal !== modelIgnore) {
                        return viewVal;
                    } else {
                        return '';
                    }
                });

                modelCtrl.$render = function () {
                    element.val(modelCtrl.$modelValue !== modelIgnore ? modelCtrl.$modelValue : '')
                };
            }
        };
    })
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
    .directive('scrollable', function() {
            return {
                link: function(scope, element, attrs) {
                    console.log(element);
                }
            };
        })
    .directive('chunk', ['$filter', '$parse', function ($filter, $parse) {
        return {
            scope: true,
            link: function (scope, element, attrs) {
                var el = element.closest('.scroll-container'),
                    raw = el[0],
                    currentSlice,
                    chunkSize = parseInt(attrs.chunkSize, 10) || 10;

                function initChunk() {
                    scope.visibleItems = scope.$eval(attrs.chunk);
                    // If a filter is provided, apply filter to set and return
                    currentSlice = chunkSize;
                    scope.chunk = scope.visibleItems.slice(0, chunkSize);
                }

                el.bind('scroll', function () {
                    // Check if within bottom of scrollable div
                    if ((raw.scrollTop + raw.offsetHeight) * 1.05 >= raw.scrollHeight) {
                        // increase chunkSize and re-filter
                        scope.$apply(function () {
                            // take next limit
                            scope.chunk = scope.chunk.concat(scope.visibleItems.slice(currentSlice, currentSlice += chunkSize));
                        });
                    }
                });

                scope.$watch(function (newScope) {
                    if (!angular.equals(scope.$eval(attrs.chunk), newScope.visibleItems)) {
                        raw.scrollTop = 0;
                        initChunk();
                    }
                });
            }
        };
    }])
    .directive('spinner', function ($parse) {
        return {
            restrict: 'AC',
            link: function (scope, element, attrs) {
                var defaults = {
                        lines: 9, // The number of lines to draw
                        length: 0, // The length of each line
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
                    opts = {
                        xs: _.extend({
                            width: 3, // The line thickness
                            radius: 6 // The radius of the inner circle
                        }, defaults),
                        small: _.extend({
                            width: 4, // The line thickness
                            radius: 8 // The radius of the inner circle
                        }, defaults),
                        large: _.extend({
                            width: 12, // The line thickness
                            radius: 24 // The radius of the inner circle
                        }, defaults)
                    },
                    ele = element[0],
                    userOpts = scope.$eval(attrs.spinnerOptions) || {},
                    spinner = new Spinner(_.extend({}, opts[attrs.spinnerSize || 'small'], userOpts)),
                    isSpinning = false;

                scope.$watch(function () {
                    if (scope.$eval(attrs.spinner) && isSpinning === false) {
                        spinner.spin(ele);
                        isSpinning = true;
                    } else if (!scope.$eval(attrs.spinner)) {
                        spinner.stop();
                        isSpinning = false;
                    }
                });
            }
        };
    });
