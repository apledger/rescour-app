/**
 * Created with JetBrains WebStorm.
 * User: apledger
 * Date: 4/24/13
 * Time: 8:28 PM
 * File:
 */

angular.module('rescour.market.map', ['rescour.market'])
    .directive("map", ['Filter', 'Items', '$compile', 'PropertyDetails',
        function (Filter, Items, $compile, PropertyDetails) {
            return {
                restrict: "A",
                transclude: true,
                scope: {
                    selected: "="
                },
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
                            "<li><span>" + item.address.city + ", " + item.address.state + "</span></li>" +
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
//                        scope.selected = item;
                        Items.setActive(item);
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

                    scope.$on('CenterMap', function (event, item) {
                        if (item) {
                            map.panTo(item.location);
                            markers.zoomToShowLayer(item.marker, function () {
                                item.marker.bindPopup(popupTemplate(item), {closeButton: false, minWidth: 325}).openPopup();
                            });
                        }
                    });

                    // Let the controller know to initialize otherwise markers don't get constructed
                    scope.$emit("MapReady");
                }
            };
        }]);