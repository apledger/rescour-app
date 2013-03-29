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
    .directive('collapse', function () {
        return function (scope, element, attr) {
            scope.$watch(attr.collapse, function (value) {
                !!value ? element.hide() : element.fadeIn(300);
            });
        };
    })
    .directive("map", ['Filter', 'Items', '$compile', 'detailPanes',
        function (Filter, Items, $compile, detailPanes) {
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
                            "<img src=\"img/" + item.thumbnail + "\" alt=\"\"/></div>" +
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
                        detailPanes.selectPane("Details");
                    };

                    scope.showPictures = function (item) {
                        if (!item.hasOwnProperty('details')) {
                            item.getDetails();
                        }
                        scope.selected = item;
                        detailPanes.selectPane("Pictures");
                    };

                    scope.$on("RenderMap", function () {
                        // Markers plugin says better performance to clear all markers and recreate
                        markers.clearLayers();
                        // Zoom out
                        map.setView(defaultLatLng, defaultZoom);

                        // Loop through each item
                        _.each(Items.items, function (item) {
                            // Check visibility
                            if (item.isVisible) {
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
    });
