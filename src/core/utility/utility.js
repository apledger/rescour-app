/**
 * Created with JetBrains WebStorm.
 * User: apledger
 * Date: 4/24/13
 * Time: 4:05 PM
 * File: /core/utility/utility.js
 */

angular.module('rescour.utility', [])
    .filter('limitVisible', ['$document', function ($document) {
        return function (input, limit, exceptions) {
            var visibleItems = [];
            _.each(input, function (item) {
                if (item.isVisible) {
                    visibleItems.push(item);
                }
            });
            return visibleItems;
        };
    }])
    .filter('ellipsis', function () {
        return function (input, limit, exceptions) {
            if (input !== 'No description provided' && input.length > limit) {
                return input.substr(0, limit) + "...";
            } else {
                return input;
            }
        };
    })
    .filter('percentage', function () {
        return function (input, limit, exceptions) {
            var num = parseFloat(input);
            return num.toFixed(3) + " %";
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
    .directive('fade', function () {
        return function (scope, element, attr) {
            scope.$watch(attr.fade, function (value) {
                !!value ? element.fadeIn(700) : element.fadeOut(700);
            });
        };
    })
    .directive('fadeIn', function () {
        return function (scope, element, attr) {
            scope.$watch(attr.fadeIn, function (value) {
                !!value ? element.fadeIn(500) : element.hide();
            });
        };
    })
    .directive('fadeOut', function () {
        return function (scope, element, attr) {
            scope.$watch(attr.fadeOut, function (value) {
                !!value ? element.fadeOut(500) : element.show();
            });
        };
    })
    .directive('fadeAfterOn', ['$timeout', function ($timeout) {
        return {
            link: function (scope, element, attrs) {
                if (parseInt(attrs.fadeAfterOn, 10)) {
                    $timeout(function () {
                        element.fadeOut(700);
                    }, attrs.fadeAfter);
                }
            }
        };
    }])
    .directive('spinner', ['$parse', function ($parse) {
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
                        xs: angular.extend({
                            width: 3, // The line thickness
                            radius: 6 // The radius of the inner circle
                        }, defaults),
                        small: angular.extend({
                            width: 4, // The line thickness
                            radius: 8 // The radius of the inner circle
                        }, defaults),
                        large: angular.extend({
                            width: 12, // The line thickness
                            radius: 24 // The radius of the inner circle
                        }, defaults)
                    },
                    ele = element[0],
                    userOpts = scope.$eval(attrs.spinnerOptions) || {},
                    spinner = new Spinner(angular.extend({}, opts[attrs.spinnerSize || 'small'], userOpts)),
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
    }])
    .directive('chunk', ['$filter', '$parse', function ($filter, $parse) {
        return {
            link: function (scope, element, attrs) {
                var raw = element[0],
                    currentSlice,
                    chunkSize = parseInt(attrs.chunkSize, 10) || 10,
                    visibleItems = [];

                function initChunk() {
                    visibleItems = scope.$eval(attrs.chunk);
                    // If a filter is provided, apply filter to set and return
                    currentSlice = chunkSize;
                    scope.chunk = visibleItems.slice(0, chunkSize);
                }

                element.bind('scroll', function () {
                    // Check if within bottom of scrollable div
                    if ((raw.scrollTop + raw.offsetHeight) * 1.05 >= raw.scrollHeight) {
                        // increase chunkSize and re-filter
                        scope.$apply(function () {
                            // take next limit
                            scope.chunk = scope.chunk.concat(visibleItems.slice(currentSlice, currentSlice += chunkSize));
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
/**
 * A helper service that can parse typeahead's syntax (string provided by users)
 * Extracted to a separate service for ease of unit testing
 */
    .factory('typeaheadSelectParser', ['$parse', function ($parse) {

        //                      00000111000000000000022200000000000000003333333333333330000000000044000
        var TYPEAHEAD_REGEXP = /^\s*(.*?)(?:\s+as\s+(.*?))?\s+for\s+(?:([\$\w][\$\w\d]*))\s+in\s+(.*)$/;

        return {
            parse: function (input) {

                var match = input.match(TYPEAHEAD_REGEXP), modelMapper, viewMapper, source;
                if (!match) {
                    throw new Error(
                        "Expected typeahead specification in form of '_modelValue_ (as _label_)? for _item_ in _collection_'" +
                            " but got '" + input + "'.");
                }

                return {
                    itemName: match[3],
                    source: $parse(match[4]),
                    viewMapper: $parse(match[2] || match[1]),
                    modelMapper: $parse(match[1])
                };
            }
        };
    }])

    //options - min length
    .directive('typeaheadSelect', ['$compile', '$q', '$document', 'typeaheadSelectParser', function ($compile, $q, $document, typeaheadSelectParser) {

        var HOT_KEYS = [9, 13, 27, 38, 40];

        return {
            require: 'ngModel',
            link: function (originalScope, element, attrs, modelCtrl) {

                var selected;

                //minimal no of characters that needs to be entered before typeaheadSelect kicks-in
                var minSearch = originalScope.$eval(attrs.typeaheadMinLength) || 1;

                //expressions used by typeahead
                var parserResult = typeaheadSelectParser.parse(attrs.typeaheadSelect);

                //should it restrict model values to the ones selected from the popup only?
                var isEditable = originalScope.$eval(attrs.typeaheadEditable) !== false;

                //create a child scope for the typeahead directive so we are not polluting original scope
                //with typeahead-specific data (matches, query etc.)
                var scope = originalScope.$new();
                originalScope.$on('$destroy', function () {
                    scope.$destroy();
                });

                var resetMatches = function () {
                    scope.matches = [];
                    scope.activeIdx = -1;
                };

                var getMatchesAsync = function (inputValue) {

                    var locals = {$viewValue: inputValue};
                    $q.when(parserResult.source(scope, locals)).then(function (matches) {

                        //it might happen that several async queries were in progress if a user were typing fast
                        //but we are interested only in responses that correspond to the current view value
                        if (inputValue === modelCtrl.$viewValue) {
                            if (matches.length > 0) {

                                scope.activeIdx = 0;
                                scope.matches.length = 0;

                                //transform labels
                                for (var i = 0; i < matches.length; i++) {
                                    locals[parserResult.itemName] = matches[i];
                                    scope.matches.push({
                                        label: parserResult.viewMapper(scope, locals),
                                        model: matches[i]
                                    });
                                }

                                scope.query = inputValue;

                            } else {
                                resetMatches();
                            }
                        }
                    }, resetMatches);
                };

                resetMatches();

                //we need to propagate user's query so we can higlight matches
                scope.query = undefined;

                //plug into $parsers pipeline to open a typeahead on view changes initiated from DOM
                //$parsers kick-in on all the changes coming from the view as well as manually triggered by $setViewValue
                modelCtrl.$parsers.push(function (inputValue) {

                    resetMatches();
                    if (selected) {
                        return inputValue;
                    } else {
                        if (inputValue && inputValue.length >= minSearch) {
                            getMatchesAsync(inputValue);
                        }
                    }

                    return isEditable ? inputValue : undefined;
                });

                modelCtrl.$render = function () {
                    var locals = {};
                    locals[parserResult.itemName] = selected || modelCtrl.$viewValue;
                    element.val(parserResult.viewMapper(scope, locals) || modelCtrl.$viewValue);
                    selected = undefined;
                };

                scope.select = function (activeIdx) {
                    //called from within the $digest() cycle
                    var locals = {};
                    locals[parserResult.itemName] = selected = scope.matches[activeIdx].model;

                    modelCtrl.$setViewValue(parserResult.modelMapper(scope, locals));
                    modelCtrl.$render();
                };

                //bind keyboard events: arrows up(38) / down(40), enter(13) and tab(9), esc(27)
                element.bind('keydown', function (evt) {

                    //typeahead is open and an "interesting" key was pressed
                    if (scope.matches.length === 0 || HOT_KEYS.indexOf(evt.which) === -1) {
                        return;
                    }

                    evt.preventDefault();

                    if (evt.which === 40) {
                        scope.activeIdx = (scope.activeIdx + 1) % scope.matches.length;
                        scope.$digest();

                    } else if (evt.which === 38) {
                        scope.activeIdx = (scope.activeIdx ? scope.activeIdx : scope.matches.length) - 1;
                        scope.$digest();

                    } else if (evt.which === 13 || evt.which === 9) {
                        scope.$apply(function () {
                            scope.select(scope.activeIdx);
                        });

                    } else if (evt.which === 27) {
                        evt.stopPropagation();

                        resetMatches();
                        scope.$digest();
                    }
                });

                element.bind('focus', function () {
                    scope.$apply(function () {
                        getMatchesAsync(modelCtrl.$viewValue);
                    });
                });

                $document.find('body').bind('click', function () {

                    resetMatches();
                    scope.$digest();
                });

                element.bind('click', function (event) {
                    event.stopPropagation();
                });

                var tplElCompiled = $compile("<typeahead-select-popup matches='matches' active='activeIdx' select='select(activeIdx)' " +
                    "query='query'></typeahead-select-popup>")(scope);
                element.after(tplElCompiled);
            }
        };

    }])

    .directive('typeaheadSelectPopup', function () {
        return {
            restrict: 'E',
            scope: {
                matches: '=',
                query: '=',
                active: '=',
                select: '&'
            },
            replace: true,
            templateUrl: '/template/typeahead/typeaheadSelect.html',
            link: function (scope, element, attrs) {

                scope.isOpen = function () {
                    return scope.matches.length > 0;
                };

                scope.isActive = function (matchIdx) {
                    return scope.active == matchIdx;
                };

                scope.selectActive = function (matchIdx) {
                    scope.active = matchIdx;
                };

                scope.selectMatch = function (activeIdx) {
                    scope.select({activeIdx: activeIdx});
                };
            }
        };
    })
    .filter('typeaheadSelectHighlight', function () {
        return function (matchItem, query) {
            return (query) ? matchItem.replace(new RegExp(query, 'gi'), '<strong>$&</strong>') : matchItem;
        };
    })
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
    });