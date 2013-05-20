/**
 * Created with JetBrains WebStorm.
 * User: apledger
 * Date: 4/24/13
 * Time: 8:28 PM
 * File:
 */

angular.module('rescour.market.map', ['rescour.market'])
    .directive("map", ['Items', '$compile', 'PropertyDetails', '$location', 'BrowserDetect',
        function (Items, $compile, PropertyDetails, $location, BrowserDetect) {
            return {
                restrict: "A",
                transclude: true,
                template: '<div class="map"></div>',
                link: function (scope, element, attrs, ctrl) {
                    var cloudmadeUrl = 'http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/37875/256/{z}/{x}/{y}.png',
                        openstreetUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                        otileUrl = 'http://otile{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png',
                        stamenUrl = 'http://{s}.tile.stamen.com/terrain/{z}/{x}/{y}.jpg',
                        cloudmade = new L.TileLayer(openstreetUrl, { maxZoom: 17, styleId: 22677 }),
                        defaultLatLng = new L.LatLng(32.0667, -90.3000),
                        defaultZoom = 5,
                        $el = element.find(".map")[0],
                        map = new L.Map($el, { center: defaultLatLng, zoom: defaultZoom, zoomControl: false, attributionControl: false}),
                        markers = new L.MarkerClusterGroup({disableClusteringAtZoom: 13, spiderfyOnMaxZoom: false, spiderfyDistanceMultiplier: 0.1});
                    // layers: [cloudmade],

                    var googleLayer = new L.Google('ROADMAP');
                    map.addLayer(googleLayer);
                    map.addControl(new L.Control.Zoom({ position: 'topright' }));

                    function popupTemplate(item) {
                        scope.item = item;

                        var popupTempl = "<div><div class=\"btn popup-striped-container popup-header\">" +
                            "<h4 ng-click=\"showDetails(item)\">" + item.title + "</h4>" +
                            "</div>" +
                            "<div class=\"popup-main-container clearfix\">" +
                            "<div class=\"preview\" ng-click=\"showPictures(item)\"><div class=\"preview-mask\"><i class=\"icon-search\"></i></i></div>" +
                            "<img src=\"" + item.thumbnail + "\" alt=\"\"/></div>" +
                            "<ul>" +
                            "<li><span>" + item.getAttribute('numUnits') + "</span> Units</li>" +
                            "<li>Built in <span>" + item.getAttribute('yearBuilt') + "</span></li>" +
                            "<li><span>" + item.getAttribute('broker') + "</span></li>" +
                            "<li><span>" + item.address.city + ", " + item.address.state + "</span></li>" +
                            "</ul>" +
                            "</div>" +
                            "<div class=\"popup-striped-container popup-footer\">\n    <p>" +
                            item.address.street1 + "</p>\n</div></div>";

                        var popupElement = $compile(popupTempl)(scope);

                        return popupElement[0];
                    }

                    scope.showDetails = function (item) {
                        $location.search('id', item.id).hash('details');
                    };

                    scope.showPictures = function (item) {
                        $location.search('id', item.id).hash('pictures');
                    };

                    scope.$watch(function () {
                        return Items.visibleIds;
                    }, function () {
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
                                var popupTpl = popupTemplate(item);
                                item.marker.bindPopup(popupTpl, {closeButton: false, minWidth: 325});
                                // Open modal popup
                                item.marker.on("click", function (e) {
                                    scope.$apply(function () {
                                        if (BrowserDetect.platform !== 'tablet') {
                                            scope.showDetails(item);
                                        } else {
                                            item.marker.openPopup();
                                        }
                                    });
                                });

                                // Bind mouseover popup
                                item.marker.on("mouseover", function (e) {
                                    item.marker.openPopup();
                                });
                                // Add marker to marker group
                                markers.addLayer(item.marker);
                            }
                        });
                        // Add marker groups
                        map.addLayer(markers);
                    });

                    scope.$on('CenterMap', function (event, item) {
                        if (item.marker) {
                            markers.zoomToShowLayer(item.marker, function () {
                                item.marker.bindPopup(popupTemplate(item), {closeButton: false, minWidth: 325}).openPopup();
                            });
                            map.panTo(item.location);
                        }
                    });
                }
            };
        }]);