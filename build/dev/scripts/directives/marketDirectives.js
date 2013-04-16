'use strict';

angular.module('nebuMarket')
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
        }])
    .directive('preview', function () {
        return {
            restrict: 'C',
            link: function (scope, element, attr) {
                element.hover(function () {
                    element.find('.zoom-mask').fadeIn(300);
                }, function () {
                    element.find('.zoom-mask').fadeOut(300);
                });
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
    .directive('discreetFilter', [function () {
        return {
            restrict: 'EA',
            replace: true,
            link: function (scope, element, attr) {


                // Make badge pulse when filter is selected
                element.click(function () {
                    $(this).find('.badge').effect("pulsate", { times: 2 }, 300);
                });
            }
        };
    }])
    .directive("map", ['Filter', 'Items', '$compile', 'PropertyDetails',
        function (Filter, Items, $compile, PropertyDetails) {
            return {
                restrict: "A",
                transclude: true,
                scope: {
                    view: "=",
                    selected: "=",
                    center: "="
                },
                template: '<div class="map"></div>',
                link: function (scope, element, attrs, ctrl) {
                    var cloudmadeUrl = 'http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/37875/256/{z}/{x}/{y}.png',
                        openstreetUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                        otileUrl = 'http://otile{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png',
                        stamenUrl = 'http://{s}.tile.stamen.com/terrain/{z}/{x}/{y}.jpg',
                        cloudmade = new L.TileLayer(openstreetUrl, { maxZoom: 17, styleId: 22677 }),
                        defaultLatLng = new L.LatLng(32.3667, -86.3000),
                        defaultZoom = 6,
                        $el = element.find(".map")[0],
                        map = new L.Map($el, { center: defaultLatLng, zoom: defaultZoom, zoomControl: false, attributionControl: false}),
                        markers = new L.MarkerClusterGroup({disableClusteringAtZoom: 13});
                    // layers: [cloudmade],

                    var googleLayer = new L.Google('ROADMAP');
                    map.addLayer(googleLayer);

                    map.addControl(new L.Control.Zoom({ position: 'topright' }));
                    //map.scrollWheelZoom.disable();

                    // Listen for when a filter event is fired

                    function popupTemplate(item) {
                        scope.item = item;

                        var popupTempl = "<div><div class=\"btn popup-striped-container popup-header\">" +
                            "<h4 ng-click=\"showDetails(item)\">" + item.title + "</h4>" +
                            "</div>" +
                            "<div class=\"popup-main-container clearfix\">" +
                            "<div class=\"preview\" ng-click=\"showPictures(item)\"><div class=\"zoom-mask\"></div>" +
                            "<img src=\"" + item.thumbnail + "\" alt=\"\"/></div>" +
                            "<ul>" +
                            "<li><span>" + item.getAttribute('Number of Units') + "</span> Units</li>" +
                            "<li>Built in <span>" + item.getAttribute('Year Built') + "</span></li>" +
                            "<li><span>" + item.getAttribute('Broker') + "</span></li>" +
                            "<li><span>" + item.getAttribute('State') + "</span></li>" +
                            "</ul>" +
                            "</div>" +
                            "<div class=\"popup-striped-container popup-footer\">\n    <p>" +
                            item.address.street1 + "</p>\n</div></div>";

                        var popupElement = $compile(popupTempl)(scope);

                        return popupElement[0];
                    }

                    scope.showDetails = function (item) {
                        if (!item.hasOwnProperty('details')) {
                            item.getDetails();
                        }
                        scope.selected = item;
                        PropertyDetails.panes.selectPane("Details");
                    };

                    scope.showPictures = function (item) {
                        if (!item.hasOwnProperty('details')) {
                            item.getDetails();
                        }
                        scope.selected = item;
                        PropertyDetails.panes.selectPane("Pictures");
                    };

                    scope.$on("Render", function () {
                        // Markers plugin says better performance to clear all markers and recreate
                        markers.clearLayers();
                        // Zoom out
                        map.setView(defaultLatLng, defaultZoom);

                        // Loop through each item
                        _.each(Items.items, function (item) {
                            // Check visibility
                            if (item.isVisible && item.location) {
                                // Initialize new marker at location
                                item.marker = new L.Marker(new L.LatLng(item.location[0], item.location[1]), { title: item.title });
                                // Open modal popup
                                item.marker.on("click", function (e) {
                                    scope.$apply(function () {
                                        scope.$parent.selectItem(item);
                                    });
                                });

                                // Bind mouseover popup
                                item.marker.on("mouseover", function (e) {
                                    item.marker.bindPopup(popupTemplate(item), {closeButton: false, minWidth: 325}).openPopup();
//                                    item.marker.bindPopup(popupTemplate(item)[0] + popupTemplate(item)[1] +  popupTemplate(item)[2]).openPopup();
                                });
                                // Add marker to marker group
                                markers.addLayer(item.marker);
                            }
                        });
                        // Add marker groups
                        map.addLayer(markers);
                    });

                    scope.$watch("center", function (item) {
                        if (item) {
                            markers.zoomToShowLayer(item.marker, function () {
                                map.panTo(item.location);
                                item.marker.bindPopup(popupTemplate(item), {closeButton: false, minWidth: 325}).openPopup();
                            });
                        }
                    });

                    // Let the controller know to initialize otherwise markers don't get constructed
                    scope.$emit("MapReady");
                }
            };
        }])
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
    .directive('propertyDetails', function () {
        return {
            restrict: "C",
            scope: {
                current: "="
            },
            templateUrl: '/views/market/partials/marketDetails.html',
            controller: 'DetailsController',
            link: function (scope) {
                scope.close = function () {
                    scope.current = null;
                };
            }
        };
    })
    .directive('chunk', ['$filter', '$parse', function ($filter, $parse) {
        return {
            link: function (scope, element, attrs) {
                var raw = element[0],
                    currentSlice,
                    chunkSize = parseInt(attrs.chunkSize, 10) || 10;

                function initChunk() {
                    scope.visibleItems = scope.$eval(attrs.chunk);
                    // If a filter is provided, apply filter to set and return
                    currentSlice = chunkSize;
                    scope.chunk = scope.visibleItems.slice(0, chunkSize);
                }

                element.bind('scroll', function () {
                    // Check if within bottom of scrollable div
                    if ((raw.scrollTop + raw.offsetHeight) * 1.2 > raw.scrollHeight) {
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

            element.bind('focus', function(){
                scope.$apply(function(){
                   getMatchesAsync(modelCtrl.$viewValue);
                });
            });

            $document.find('body').bind('click', function () {

                resetMatches();
                scope.$digest();
            });

            element.bind('click', function(event) {
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
            templateUrl: 'template/typeahead/typeaheadSelect.html',
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
    });
