angular.module('rescour.app')
    .factory('StatesPolygon', function (MDUMarket, $http, $q) {
        var statesJson, statesKeys;

        return {
            initialize: function () {
                var defer = $q.defer();

                $http.get('/assets/polygon/states.json').then(function (response) {
                    statesKeys = _.keys(MDUMarket.dimensions.discrete.state.values);
                    statesJson = response.data;
                    statesJson.features = _.reject(statesJson.features, function (feat) {
                        return !_.contains(statesKeys, feat.properties.name)
                    });
                    defer.resolve();
                });

                return defer.promise;
            },
            get: function () {
                var statesDiscreteValues = MDUMarket.dimensions.discrete.state.values;

                angular.forEach(statesJson.features, function (feat) {
                    var _stateName = feat.properties.name;
                    feat.properties.density = typeof statesDiscreteValues[_stateName].predict != 'string' ? statesDiscreteValues[_stateName].predict : 0;
                });

                return statesJson;
            }
        }
    })
    .factory('ConvertToCSV', function ($log) {
        return function (items, config) {
            var str = '';

            (function setHeaders () {
                var line = '';
                for (var i = 0; i < config.length; i++) {
                    var reportFieldConfig = config[i];
                    if (line != '') line += ','

                    line += reportFieldConfig.title;
                }
                str += line + '\r\n';
            })();

            (function setFields () {
                for (var i = 0; i < items.length; i++) {
                    var line = '',
                        item = items[i];

                    for (var j = 0; j < config.length; j++) {
                        var reportFieldConfig = config[j],
                            itemField = reportFieldConfig.accessor ? item[reportFieldConfig.accessor][reportFieldConfig.key] : item[reportFieldConfig.key];
                        if (line != '') line += ','

                        if (reportFieldConfig.method) {
                            try {
                                line += '"' + (reportFieldConfig.method(item) || '') + '"';
                            } catch (e) {
                                $log.debug(e);
                            }
                        } else if (_.isArray(itemField)) {
                            var reportArrayLine = '';

                            try {
                                for (var k = 0; k < itemField.length; k++) {
                                    var reportArrayObj = itemField[k],
                                        reportArrayFields = reportFieldConfig.fields || _.keys(reportArrayObj),
                                        objLineArray = [];

                                    if (reportArrayLine != '') reportArrayLine += ', ';
                                    angular.forEach(reportArrayFields, function (fieldKey) {
                                        if (reportFieldConfig.fieldsFormat && reportFieldConfig.fieldsFormat.hasOwnProperty(fieldKey)) {
                                            objLineArray.push(reportFieldConfig.fieldsFormat[fieldKey](reportArrayObj[fieldKey]));
                                        } else {
                                            objLineArray.push(reportArrayObj[fieldKey]);
                                        }
                                    });

                                    reportArrayLine += objLineArray.join(reportFieldConfig.separator || ' - ');
                                }

                                line += ('"' + reportArrayLine + '"');
                            }
                            catch (e) {
                                $log.debug(e);
                            }
                        } else {
                            line += '"' + (itemField || '') + '"';
                        }
                    }

                    str += line + '\r\n';
                }dev
            })();

            return str;
        }
    })
    .factory('MarketModals', function () {
        var modals = {};

        modals.savedSearch = {
            keyboard: true,
            backdropClick: true,
            dialogFade: true,
            backdrop: true,
            templateUrl: '/app/market/templates/market.modals.saved-search.html?v=' + Date.now(),
            controller: 'SavedSearchModalCtrl'
        };

        modals.carousel = {
            keyboard: true,
            backdropClick: true,
            dialogFade: true,
            backdrop: true,
            templateUrl: '/app/market/templates/market.modals.carousel.html?v=' + Date.now(),
            controller: 'CarouselModalCtrl'
        };

        modals.customFieldDimensions = {
            keyboard: true,
            backdropClick: true,
            dialogFade: true,
            backdrop: true,
            templateUrl: '/app/market/templates/market.modals.custom-field-dimensions.html?v=' + Date.now(),
            controller: 'CustomFieldDimensionsModalCtrl'
        };

        modals.confirmDeletePin = {
            keyboard: true,
            backdropClick: true,
            dialogFade: true,
            backdrop: true,
            templateUrl: '/app/market/templates/market.modals.confirm-delete-pin.html?v=' + Date.now(),
            controller: 'ConfirmDeletePinModalCtrl'
        };

        return modals;
    })
    .factory('MarketState', function (NewsMarket, PinMarket) {
        return {
            map: {
                isNewsToggled: false,
                isPinsToggled: false,
                newsThreshold: 10,
                pinsThreshold: 10,
                zoom: 5,
                center: [32.0667, -90.3000],
                isNewsDisabled: function () {
                    return !NewsMarket.initialized || (this.zoom < this.newsThreshold);
                },
                isPinsDisabled: function () {
                    return !PinMarket.initialized || (this.zoom < this.pinsThreshold);
                },
                tiles: 'ROADMAP'
            },
            powers: {},
            collapsed: false
        }
    })
    .factory('MapUtils', function ($log, $rootScope, $compile, $document) {
        var RescourIcon = L.Icon.extend({
            options: {
                shadowUrl: '/assets/img/marker-shadow.png',
                iconSize: [30, 42],
                iconAnchor: [15, 42],
                popupAnchor: [0, -42],
                shadowSize: [42, 42]
            }
        }),
            CircleIcon = L.Icon.extend({
                options: {
                    shadowUrl: '/assets/img/marker-shadow.png',
                    iconSize: [30, 30],
                    iconAnchor: [15, 30],
                    popupAnchor: [0, -30],
                    shadowSize: [30,30]
                }
            }),
            PinIcon = L.Icon.extend({
                options: {
                    shadowUrl: '/assets/img/square-icon-shadow.png',
                    iconSize: [36, 42],
                    iconAnchor: [18, 42],
                    popupAnchor: [0, -42],
                    shadowSize: [42, 42]
                }
            });

        return {
            defaults: {
                lat: 32.0667,
                lng: -90.3000,
                latlng: new L.LatLng(32.0667, -90.3000),
                zoom: 5
            },
            icons: {
                'success': new RescourIcon({
                    iconUrl: '/assets/img/long-marker-green.png'
                }),
                'warning': new RescourIcon({
                    iconUrl: '/assets/img/long-marker-orange.png'
                }),
                'danger': new RescourIcon({
                    iconUrl: '/assets/img/long-marker-red.png'
                }),
                'inverse': new RescourIcon({
                    iconUrl: '/assets/img/long-marker-black.png'
                }),
                'newsCircle': new CircleIcon({
                    iconUrl: '/assets/img/circle-marker-news-blue.png'
                }),
                'Point of Interest': new PinIcon({
                    iconUrl: '/assets/img/square-icon-location-arrow-blue.png'
                }),
                'Listing': new PinIcon({
                    iconUrl: '/assets/img/square-icon-marker-blue.png'
                }),
                'Sales Comp': new PinIcon({
                    iconUrl: '/assets/img/square-icon-s-dollar-blue.png'
                }),
                'News': new PinIcon({
                    iconUrl: '/assets/img/square-icon-news-blue.png'
                }),
                'Rent Comp': new PinIcon({
                    iconUrl: '/assets/img/square-icon-r-dollar-blue.png'
                }),
                'Employer': new PinIcon({
                    iconUrl: '/assets/img/square-icon-briefcase-blue.png'
                }),
                'Asset': new PinIcon({
                    iconUrl: '/assets/img/square-icon-listing-blue.png'
                }),
                'defaultPin': new PinIcon({
                    iconUrl: '/assets/img/square-icon-blue.png'
                })
            },
            applyBounds: function (map, marketplace) {
                var bounds = map.getBounds(),
                    latHighBound = bounds._northEast.lat,
                    lngHighBound = bounds._northEast.lng,
                    latLowBound = bounds._southWest.lat,
                    lngLowBound = bounds._southWest.lng;

                marketplace
                    .applyRange('latitude', latLowBound, latHighBound)
                    .applyRange('longitude', lngLowBound, lngHighBound)
                    .excludeNA('latitude').excludeNA('longitude');
            },
            resetView: function (map) {
                map.setView(this.defaults.latlng, this.defaults.zoom);
            },
            resetBounds: function (marketplace) {
                marketplace
                    .applyRange('latitude', null, null)
                    .applyRange('longitude', null, null)
                    .includeNA('latitude').includeNA('longitude');
            },
            panMarkerToCenterBottom: function (map, marker) {
                map.panTo(marker._latlng).panBy([0, -1 * ((map._size.y / 2) - 100)]);
            },
            panMarkerToCenter: function (map, marker) {
                map.panTo(marker._latlng);
            },
            bindPopupToggle: function (map, item, popupOpts) {
                try {
                    if (!item.marker) {
                        throw new Error('Item ' + item.title + ' has no marker');
                    }

                    var marker = item.marker,
                        popupAnchor = item.marker.options.icon.options.popupAnchor,
                        popupOffset = L.point(popupAnchor).add(L.Popup.prototype.options.offset),
                        popup = L.popup(_.extend({closeButton: false, minWidth: 325, offset: popupOffset}, popupOpts));

                    function compileEl (popupEl) {
                        var $scope = $rootScope.$new();
                        $scope.hoveredItem = item;
                        return $compile(popupEl)($scope);
                    }

                    function toggleRemotePopup () {
                        popup.setLatLng(marker._latlng)
                            .setContent(compileEl(item.getPopupEl())[0]);

                        if (popup) {
                            if (popup._map) {
                                closeRemotePopup();
                            } else {
                                openRemotePopup();
                            }
                        }
                    }

                    function openRemotePopup () {
                        map.activeMarker = marker;
                        map.activePopup = popup;
                        popup.openOn(map);
                        // Remove marker from layer group

                        $document.bind('keydown', function closePopupOnEscape (e) {
                            if (e.keyCode == 27) {
                                map.removeLayer(popup);
                                $document.unbind('keydown', closePopupOnEscape);
                            }
                        });
                    }

                    function closeRemotePopup () {
                        map.activeMarker = null;
                        map.activePopup = null;
                        // Add the marker back to the layer group
                        map.removeLayer(popup);
                    }

                    // Have to remove base openPopup handler
                    marker.toggleRemotePopup = toggleRemotePopup;
                    marker.openRemotePopup = openRemotePopup;
                    marker.closeRemotePopup = closeRemotePopup;
                    marker.off('click', marker._openPopup);
                    marker.on('click', toggleRemotePopup);
                } catch (e) {
                    $log.debug(e);
                }
            }
        }
    })
    .factory('StatesOverlay', function (StatesPolygon, MapUtils, MDUMarket, $log) {
        function getLegendRange (max) {
            return [
                parseInt(max/40),
                parseInt(max/20),
                parseInt(max/10),
                parseInt(max/4),
                parseInt(max/2),
                parseInt(max)
            ]
        }
        function getColor (val, max) {
            max = max > 200 ? max : 200;
            var range = getLegendRange(max);
            return val > range[5] ? '#800026' :
                    val > range[4] ? '#BD0026' :
                    val > range[3] ? '#E31A1C' :
                    val > range[2] ? '#FC4E2A' :
                    val > range[1] ? '#FD8D3C' :
                    val > range[0] ? '#FEB24C' :
                    val > 0 ? '#FED976' :
                '#999';
        }

        function style (feature) {
            try {
                var stateDimension = MDUMarket.dimensions.discrete.state,
                    stateDimensionValue = stateDimension.values[feature.properties.name];

                feature.properties.density = (stateDimensionValue.isSelected || !stateDimension.selected) ? stateDimensionValue.predict : 0;
            } catch (e) {
                $log.error(e);
            }
            return {
                fillColor: getColor(feature.properties.density, MDUMarket.visibleItems.length),
                weight: 2,
                opacity: 1,
                color: 'white',
                dashArray: '3',
                fillOpacity: 0.6
            };
        }

        var defaults = {
            hasControls: true
        };

        return L.Class.extend({
            initialize: function (map, $el, opts) {
                var self = this;
                opts = opts || {};

                self.map = map;
                self.$el = $el;
                self.infoControl = L.control({position: 'topleft'});
                self.legendControl = L.control({position: 'bottomleft'});
                self.options = {
                    hasControls: opts.hasControls === undefined ? defaults.hasControls : !!opts.hasControls
                };

                self.infoControl.onAdd = function (map) {
                    this.isVisible = true;
                    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
                    this.update.call(this);
                    return this._div;
                };

                self.infoControl.onRemove = function (map) {
                    this.isVisible = false;
                };

                // method that we will use to update the control based on feature properties passed
                self.infoControl.update = function (props) {
                    this._div.innerHTML = props ?
                        '<h5>' + props.name + ' Listings: ' + props.density + '</h5>' :
                        '<h5> Select a State </h5>'

                };

                self.legendControl.onAdd = function (map) {
                    this.isVisible = true;
                    this._div = L.DomUtil.create('div', 'info legend');
                    this.update(MDUMarket.visibleItems.length);
                    return this._div;
                };

                self.legendControl.update = function (max) {
                    max = max > 200 ? max : 200;
                    var grades = getLegendRange(max);
                    grades.unshift(1);
                    this.isVisible = true;
                    this._div.innerHTML = '';
                    // loop through our density intervals and generate a label with a colored square for each interval
                    for (var i = 0; i < grades.length; i++) {
                        this._div.innerHTML +=
                            '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
                            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
                    }

                    return this;
                };

                self.legendControl.onRemove = function (map) {
                    this.isVisible = false;
                };

                function _highlightFeature (e) {
                    var layer = e.target;

                    layer.setStyle({
                        weight: 5,
                        color: '#666',
                        dashArray: '3',
                        fillOpacity: 0.9
                    });

                    if (!L.Browser.ie && !L.Browser.opera) {
                        layer.bringToFront();
                    }

                    if (self.options.hasControls) {
                        self.infoControl.update(layer.feature.properties);
                    }
                };

                function _resetHighlight (e) {
                    self.geoLayer.resetStyle(e.target);
                    if (self.options.hasControls) {
                        self.infoControl.update();
                    }
                };

                function _zoomToFeature (e) {
                    self.map.fitBounds(e.target.getBounds());
                };

                function _onEachFeature (feature, layer) {
                    layer.on({
                        mouseover: _highlightFeature,
                        mouseout: _resetHighlight,
                        click: _zoomToFeature
                    });
                };

                self.geoLayer = L.geoJson(StatesPolygon.get(), {
                    style: style,
                    onEachFeature: _onEachFeature
                });
            },
            onAdd: function (map) {
                if (!this.isVisible) {
                    this.map = map;
                    this.isVisible = true;
                    this.map.addLayer(this.geoLayer);
                    if (this.options.hasControls) {
                        this.map.addControl(this.infoControl);
                        this.map.addControl(this.legendControl);
                    }
                    this.update();
                }
            },
            onRemove: function (map) {
                if (this.isVisible) {
                    this.map.removeLayer(this.geoLayer);
                    if (this.options.hasControls) {
                        this.map.removeControl(this.infoControl);
                        this.map.removeControl(this.legendControl);
                    }
                    this.isVisible = false;
                }
            },
            update: function () {
                if (this.isVisible) {
                    MapUtils.resetBounds(MDUMarket);
                    MDUMarket.apply();
                    MDUMarket.predict();
                    this.geoLayer.setStyle(style);

                    if (this.options.hasControls) {
                        if (this.map.hasLayer(this.infoControl)) {
                            this.map.addControl(this.infoControl);
                        }

                        if (this.map.hasLayer(this.legendControl)) {
                            this.map.addControl(this.legendControl);
                        }

                        this.legendControl.update(MDUMarket.visibleItems.length);

                    }
                }
            }
        })
    })
    .factory('PinLayers', function (PinMarket, Pin, MapUtils, $document, MarketState) {
        return L.Class.extend({
            initialize: function (map, $el) {
                var self = this;

                self.pinControl = L.control({position: 'topleft'});
                self.pinLayerGroup = L.layerGroup();
                self.freshPinLayerGroup = L.layerGroup();
                self.map = map;
                self.$el = $el;

                function addNewPin (e) {
                    var pin = new Pin({
                        isFresh: true,
                        address: {
                            latitude: e.latlng.lat,
                            longitude: e.latlng.lng
                        }
                    });

                    pin.reverseGeocode();

                    removePinState();
                    self.map.on('popupclose', function deletePin () {
                        if (pin.isFresh) {
                            pin.delete().then(function () {
                                self.freshPinLayerGroup.removeLayer(pin.marker);
                            });
                        }
                        self.map.off('popupclose', deletePin);
                    }, this);

                    pin.marker = new L.Marker(e.latlng, { icon: MapUtils.icons.defaultPin, riseOnHover: true });
                    MapUtils.bindPopupToggle(self.map, pin, {
                        autoPan: false
                    });
                    self.freshPinLayerGroup.addLayer(pin.marker);
                    pin.marker.toggleRemotePopup();
                    MapUtils.panMarkerToCenter(self.map, pin.marker);
                }

                function removePinState (e) {
                    self.map.off('click', addNewPin, self.pinControl);
                    self.$el.removeClass('crosshair');
                    $(self.pinControl._div).removeClass('active');
                    L.DomEvent.off(self.pinControl._div, 'click', removePinState, self.pinControl);
                    L.DomEvent.on(self.pinControl._div, 'click', setPinState, self.pinControl);
                }

                function setPinState () {
                    self.$el.addClass('crosshair');
                    self.map.on('click', addNewPin, self.pinControl);
                    L.DomEvent.on(self.pinControl._div, 'click', removePinState, self.pinControl);
                    $(self.pinControl._div).addClass('active');
                    $document.bind('keydown', function cancelPinStateOnEscape (e) {
                        if (e.keyCode == 27) {
                            removePinState();
                            $document.unbind('keydown', cancelPinStateOnEscape);
                        }
                    });
                }

                self.pinControl.onAdd = function (map) {
                    this.isVisible = true;
                    this._div = L.DomUtil.create('div', 'info reset-view'); // create a div with a class "info"

                    var stop = L.DomEvent.stopPropagation;

                    L.DomEvent
                        .on(this._div, 'click', stop)
                        .on(this._div, 'mousedown', stop)
                        .on(this._div, 'dblclick', stop)
                        .on(this._div, 'click', L.DomEvent.preventDefault)
                        .on(this._div, 'click', setPinState, this);

                    this.update();
                    return this._div;
                };

                self.pinControl.onRemove = function (map) {
                    this.isVisible = false;
                    removePinState();
                };

                self.pinControl.update = function (props) {
                    this._div.innerHTML = '<h5> <i class="fa fa-map-marker gutter-half-right"></i>Add Pin </h5>'
                };

                angular.forEach(PinMarket.items, function (pin) {
                    if (!!pin.latitude && !!pin.longitude && pin.latitude !== 'NA' && pin.longitude !== 'NA') {
                        pin.marker =
                            new L.Marker(new L.LatLng(pin.latitude, pin.longitude),
                                {
                                    icon: MapUtils.icons[pin.type] || MapUtils.icons.defaultPin,
                                    riseOnHover: true
                                });
                        MapUtils.bindPopupToggle(self.map, pin);
                    }
                });
            },
            onAdd: function (map) {
                if (!this.isVisible) {
                    this.map = map;
                    this.map.addLayer(this.pinLayerGroup);
                    this.map.addLayer(this.freshPinLayerGroup);
                    this.map.addControl(this.pinControl);
                    this.isVisible = true;
                    this.update();
                }
            },
            onRemove: function () {
                if (this.isVisible) {
                    this.map.removeLayer(this.pinLayerGroup);
                    this.map.removeLayer(this.freshPinLayerGroup);
                    this.map.removeControl(this.pinControl);
                    this.isVisible = false;
                }
            },
            update: function () {
                if (this.isVisible) {
                    MapUtils.applyBounds(this.map, PinMarket);
                    this._addMarkers(PinMarket.apply());
                    PinMarket.predict();
                }
            },
            hasLayer: function (layer) {
                return this.pinLayerGroup.hasLayer(layer) || this.freshPinLayerGroup.hasLayer(layer);
            },
            _addMarkers: function (items) {
                var self = this;

                self.pinLayerGroup.clearLayers();
                angular.forEach(items, function (pin) {
                    self.pinLayerGroup.addLayer(pin.marker);
                });
            }
        });
    })
    .factory('NewsLayers', function (NewsMarket, MarketState, MapUtils) {
        return L.Class.extend({
            initialize: function (map, $el) {
                var self = this;
                self.$el = $el;
                self.map = map;
                self.isVisible = false;
                self.newsLayerGroup = L.layerGroup();

                angular.forEach(NewsMarket.items, function (news) {
                    if (!!news.latitude && !!news.longitude && news.latitude !== 'NA' && news.longitude !== 'NA') {
                        news.marker
                            = new L.Marker(new L.LatLng(news.latitude, news.longitude),
                            {
                                title: news.title,
                                icon: MapUtils.icons.newsCircle,
                                riseOnHover: true
                            });
                        MapUtils.bindPopupToggle(self.map, news);
                    }
                });

            },
            onAdd: function (map) {
                if (!this.isVisible) {
                    this.map = map;
                    this.map.addLayer(this.newsLayerGroup);
                    this.isVisible = true;
                    this.update();
                }
            },
            onRemove: function (map) {
                if (this.isVisible) {
                    map.removeLayer(this.newsLayerGroup);
                    this.isVisible = false;
                }
            },
            hasLayer: function (layer) {
                return this.newsLayerGroup.hasLayer(layer);
            },
            update: function () {
                if (this.isVisible) {
                    MapUtils.applyBounds(this.map, NewsMarket);
                    this._addMarkers(NewsMarket.apply());
                    NewsMarket.predict();
                }
            },
            _addMarkers: function (items) {
                var self = this;

                this.newsLayerGroup.clearLayers();

                angular.forEach(items, function (news) {
                    self.newsLayerGroup.addLayer(news.marker);
                });
            }
        })
    })
    .factory('MDULayers', function (MDUMarket, MapUtils, $log) {
        return L.Class.extend({
            initialize: function (map, $el) {
                var self = this;
                self.$el = $el;
                self.map = map;
                self.isVisible = false;
                self.MDUMarkerCluster = new L.MarkerClusterGroup({
                    disableClusteringAtZoom: 10,
                    spiderfyOnMaxZoom: false,
                    spiderfyDistanceMultiplier: 0.1
                });

                self.resetControl = L.control({position: 'bottomleft'});

                self.resetControl.onAdd = function (map) {
                    this.isVisible = true;
                    this._div = L.DomUtil.create('div', 'info reset-view'); // create a div with a class "info"

                    var stop = L.DomEvent.stopPropagation;

                    L.DomEvent
                        .on(this._div, 'click', stop)
                        .on(this._div, 'mousedown', stop)
                        .on(this._div, 'dblclick', stop)
                        .on(this._div, 'click', L.DomEvent.preventDefault)
                        .on(this._div, 'click', function () {
                            MapUtils.resetView(map);
                        }, this);

                    this.update();
                    return this._div;
                };

                self.resetControl.onRemove = function (map) {
                    this.isVisible = false;
                };

                // method that we will use to update the control based on feature properties passed
                self.resetControl.update = function (props) {
                    this._div.innerHTML = '<h5> Reset View </h5>'
                };

                angular.forEach(MDUMarket.items, function (item) {
                    if (item.location) {
                        item.marker =
                            new L.Marker(new L.LatLng(item.location[0], item.location[1]),
                                {
                                    title: item.title,
                                    icon: MapUtils.icons[item.getStatus()],
                                    riseOnHover: true
                                });

                        MapUtils.bindPopupToggle(self.map, item);
                    }
                });
            },
            onAdd: function (map) {
                if (!this.isVisible) {
                    this.map = map;
                    this.map.addControl(this.resetControl);
                    this.map.addLayer(this.MDUMarkerCluster);
                    this.isVisible = true;
                }
            },
            onRemove: function (map) {
                if (this.isVisible) {
                    this.map.removeControl(this.resetControl);
                    this.map.removeLayer(this.MDUMarkerCluster);
                    this.isVisible = false;
                }
            },
            update: function () {
                if (this.isVisible) {
                    MapUtils.applyBounds(this.map, MDUMarket);
                    this._addMarkers(MDUMarket.apply());
                    MDUMarket.predict();
                }
            },
            hasLayer: function (layer) {
                return this.MDUMarkerCluster.hasLayer(layer);
            },
            zoomTo: function (marker) {
                this.MDUMarkerCluster.zoomToShowLayer(marker, function () {
                    marker.toggleRemotePopup();
                });
            },
            _addMarkers: function (items) {
                var self = this;
                self.MDUMarkerCluster.clearLayers();

                angular.forEach(items, function (item) {
                    self.MDUMarkerCluster.addLayer(item.marker);
                });
                return this;
            }
        });
    });