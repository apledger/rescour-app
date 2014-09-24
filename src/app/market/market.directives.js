angular.module('rescour.app')
    .directive('slider', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attr) {
                function setupSlider () {
                    $(element).slider({
                        range: true,
                        min: 0,
                        max: 100,
                        // Calculate percentages based off what the low selected and high selected are
                        values: [
                            (((scope.range.lowSelected - scope.range.low) / (scope.range.high - scope.range.low)) * 100),
                            (((scope.range.highSelected - scope.range.low) / (scope.range.high - scope.range.low)) * 100)
                        ],
                        step: 1,
                        slide: function (event, ui) {
                            scope.$apply(function () {
                                scope.range.lowSelected = (((ui.values[0] / 100) * (scope.range.high - scope.range.low)) + scope.range.low);
                                scope.range.highSelected = (((ui.values[1] / 100) * (scope.range.high - scope.range.low)) + scope.range.low);
                            });
                        },
                        stop: function (event, ui) {
                            scope.$apply(function () {
                                scope.filter();
                            });

                            // WHY THE FUCK DO I NEED TO CALL THIS TWICE??
                            scope.$apply();
                        }
                    });
                }

                scope.$on('RangesDefined', function () {
                    setupSlider();
                });

                setupSlider();
            }
        };
    })
    .directive('disableAnimation',
    function ($animate) {
        return {
            link: function (scope, element, attrs) {
                $animate.enabled(false, element);
            }
        };
    })
    .directive('savedSearchInput',
    function ($timeout, $document, $parse) {
        return {
            require: 'ngModel',
            link: function (scope, element, attrs, modelCtrl) {
                var modelIgnore = 'Untitled Search',
                    modelPrevious = modelIgnore,
                    prevAttributeTitle;

                function checkEmpty () {
                    if (!modelCtrl.$viewValue) {
                        modelCtrl.$viewValue = modelPrevious;
                        modelCtrl.$render();
                    }
                }

                element.bind('focus', function (e) {
                    scope.$apply(function () {
                        prevAttributeTitle = scope.dimensions.title;
                        if (modelCtrl.$viewValue === modelIgnore) {
                            modelPrevious = modelCtrl.$viewValue;
                            modelCtrl.$viewValue = '';
                            modelCtrl.$render();
                        }

                        element.bind('keydown', function (e) {
                            if (e.which === 13 || e.which === 9) {
                                element.blur();
                            }
                        });
                    });
                });

                element.bind('blur', function (e) {
                    scope.$apply(function () {
                        if (prevAttributeTitle !== scope.dimensions.title) {
                            scope.dimensions.modified = true;
                        }
                        checkEmpty();
                    });
                });

                $timeout(checkEmpty, 0);
            }
        };
    })
    .directive('pinMap', function (MarketState, MapUtils, Geocoder) {
        return {
            restrict: 'A',
            scope: true,
            transclude: true,
            template: '<div class="pin-map"></div>',
            link: function (scope, element, attrs, ctrl) {
                var $el = element.find(".pin-map"),
                    el = $el[0],
                    map = new L.Map(el,
                        {
                            center: (MarketState.map.center || MapUtils.defaults.latlng),
                            zoom: (MarketState.map.zoom || MapUtils.defaults.zoom),
                            zoomControl: false,
                            attributionControl: false,
                            minZoom: MapUtils.defaults.zoom
                        }),
                    googleLayer = new L.Google(MarketState.map.tiles),
                    zoomControl = new L.Control.Zoom({ position: 'topright' });

                map.addControl(zoomControl);
                map.addLayer(googleLayer);

                scope.$on('WindowResized', function () {
                    map.invalidateSize();
                });

                map.on('moveend', function (e) {
                    MarketState.map.center = map.getCenter();
                    MarketState.map.zoom = map.getZoom();
                });

                scope.$on('$destroy', function (event) {
                    MarketState.map.center = map.getCenter();
                    MarketState.map.zoom = map.getZoom();
                    map.remove();
                });

                scope.$on('UpdateMarkerIcon', function (e, marker, iconType) {
                    if (MapUtils.icons[iconType]) {
                        marker.setIcon(MapUtils.icons[iconType]);
                    }
                });

                function setPinMarker (pin) {
                    if (pin.marker) {
                        if (map.hasLayer(pin.marker)) {
                            map.removeLayer(pin.marker);
                        }
                    }

                    if (pin.address.latitude && pin.address.latitude) {
                        pin.marker = new L.Marker([pin.address.latitude, pin.address.longitude],
                            {
                                icon: MapUtils.icons[pin.type] || MapUtils.icons.defaultPin,
                                riseOnHover: true,
                                draggable: true
                            });
                        map.addLayer(pin.marker);
                        map.setZoom(13);
                        map.panTo(pin.marker._latlng);
                        pin.marker.on('dragend', function (e) {
                            // Reverse geocode
                            pin.address.latitude = e.target._latlng.lat;
                            pin.address.longitude = e.target._latlng.lng;
                            pin.reverseGeocode();
                        });
                    }
                }

                if (scope.activePin) {
                    setPinMarker(scope.activePin);
                }

                scope.$on('SetPinMarker', function (e, pin) {
                    setPinMarker(pin);
                });

                scope.$on('PinsInitialized', function (e) {
                    setPinMarker(scope.activePin);
                })
            }
        }
    })
    .directive('marketMap',
    function (MarketState, StatesOverlay, NewsLayers, PinLayers, MDULayers, MapUtils) {
        return {
            restrict: 'A',
            transclude: true,
            scope: true,
            template: '<div class="market-map"></div>',
            link: function (scope, element, attrs, ctrl) {
                /**
                 *
                 * Map Initialization
                 *
                 */

                var $el = element.find(".market-map"),
                    el = $el[0],
                    map = new L.Map(el,
                        {
                            center: (MarketState.map.center || MapUtils.defaults.latlng),
                            zoom: (MarketState.map.zoom || MapUtils.defaults.zoom),
                            zoomControl: false,
                            attributionControl: false,
                            minZoom: MapUtils.defaults.zoom
                        }),
                    googleLayer = new L.Google(MarketState.map.tiles);

                map.addLayer(googleLayer);

                /**
                 *
                 * Layer Group initialization
                 *
                 */

                var statesOverlay = new StatesOverlay(map, $el),
                    pinLayers = new PinLayers(map, $el),
                    newsLayers = new NewsLayers(map, $el),
                    mduLayers = new MDULayers(map, $el),
                    zoomControl = new L.Control.Zoom({ position: 'topright' });

                map.addControl(zoomControl);

                /**
                 *
                 * News Toggling
                 *
                 */

                function toggleNewsOn () {
                    MarketState.map.isNewsToggled = true;
                    map.addLayer(newsLayers);
                }

                function toggleNewsOff () {
                    MarketState.map.isNewsToggled = false;
                    map.removeLayer(newsLayers);
                }

                scope.$on('ToggleNews', function (e) {
                    MarketState.map.isNewsToggled ? toggleNewsOff() : toggleNewsOn();
                });

                /**
                 *
                 * Pins Toggling
                 *
                 */

                function togglePinsOn () {
                    MarketState.map.isPinsToggled = true;
                    map.addLayer(pinLayers);
                }

                function togglePinsOff () {
                    MarketState.map.isPinsToggled = false;
                    map.removeLayer(pinLayers);
                }

                scope.$on('TogglePins', function (e) {
                    MarketState.map.isPinsToggled ? togglePinsOff() : togglePinsOn();
                });

                /**
                 *
                 * Map handlers
                 *
                 */

                function renderMap (e) {
                    var currentZoomLevel = map.getZoom();
                    if (currentZoomLevel < 6) {
                        closeActivePopup();
                        map.removeLayer(mduLayers);
                        toggleNewsOff();
                        togglePinsOff();
                        map.addLayer(statesOverlay);
                    } else {
                        map.removeLayer(statesOverlay);
                        map.addLayer(mduLayers);

                        if (MarketState.map.isNewsDisabled()) {
                            toggleNewsOff();
                        } else if (MarketState.map.isNewsToggled) {
                            toggleNewsOn();
                        }

                        if (MarketState.map.isPinsDisabled()) {
                            togglePinsOff();
                        } else if (MarketState.map.isPinsToggled) {
                            togglePinsOn();
                        }
                    }

                    updateMap();

                    // Because popups are now opened on a separate layer, need to check if marker is still in active set
                    if (map.activeMarker) {
                        if (!map.hasLayer(map.activeMarker)) {
                            closeActivePopup();
                        }
                    }
                }

                function updateMap (e) {
                    mduLayers.update();
                    newsLayers.update();
                    pinLayers.update();
                    statesOverlay.update();
                }

                function closeActivePopup () {
                    if (map.activeMarker) {
                        map.activeMarker.closeRemotePopup();
                    }
                }

                map.on('moveend', function (e) {
                    MarketState.map.center = map.getCenter();
                    MarketState.map.zoom = map.getZoom();
                    // Sometimes we need to $apply (updating UI elements outside of the map), sometimes we don't...
                    scope.$apply(renderMap);
                    // DOUBLE APPLY FUCK YEA!!!!
                    scope.$apply();
                });

                map.on('zoomend', closeActivePopup);

                scope.$on('UpdateMap', updateMap);

                scope.$on('CloseActivePopup', closeActivePopup);

                scope.$on('WindowResized', function () {
                    map.invalidateSize();
                });

                scope.$on('GlobalReset', function () {
                    map.setView(MapUtils.defaults.latlng, MapUtils.defaults.zoom);
                });

                scope.$on('CenterMap', function (event, item) {
                    if (item.marker) {
                        map.removeLayer(statesOverlay);
                        map.addLayer(mduLayers);
                        mduLayers.update();
                        mduLayers.zoomTo(item.marker);
                        MapUtils.panMarkerToCenter(map, item.marker);
                    }
                });

                scope.$on('PanMarkerToCenter', function (e, marker) {
                    MapUtils.panMarkerToCenter(map, marker);
                });

                scope.$on('PanMarkerToCenterBottom', function (e, marker) {
                    MapUtils.panMarkerToCenterBottom(map, marker);
                });

                scope.$on('UpdateMarkerIcon', function (e, marker, iconType) {
                    if (MapUtils.icons[iconType]) {
                        marker.setIcon(MapUtils.icons[iconType]);
                    }
                });

                scope.$on('$destroy', function (event) {
                    MarketState.map.center = map.getCenter();
                    MarketState.map.zoom = map.getZoom();
                    map.remove();
                });

                /**
                 * Google Tiles Switching
                 */

                scope.$on('Tiles.SATELLITE', function () {
                    map.removeLayer(googleLayer);
                    googleLayer = new L.Google('SATELLITE');
                    map.addLayer(googleLayer);
                });

                scope.$on('Tiles.ROADMAP', function () {
                    map.removeLayer(googleLayer);
                    googleLayer = new L.Google('ROADMAP');
                    map.addLayer(googleLayer);
                });

                scope.$on('Tiles.TERRAIN', function () {
                    map.removeLayer(googleLayer);
                    googleLayer = new L.Google('TERRAIN');
                    map.addLayer(googleLayer);
                });

                scope.$on('Tiles.HYBRID', function () {
                    map.removeLayer(googleLayer);
                    googleLayer = new L.Google('HYBRID');
                    map.addLayer(googleLayer);
                });

                /**
                 * Deferred initialization
                 */

                scope.$on('NewsInitialized', function () {
                    newsLayers = new NewsLayers(map, $el);
                });
                scope.$on('PinsInitialized', function () {
                    pinLayers = new PinLayers(map, $el);
                });

                renderMap();
            }
        };
    });