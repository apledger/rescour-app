angular.module('rescour.services')
    .factory('Geocoder', function ($http, $q, $log) {
        var geocoder = new google.maps.Geocoder();

        function extractAddress (address) {
            var extractedAddress = {};

            if (address.address_components.length) {
                for (var j = 0; j < address.address_components.length; j++) {
                    var addressComponent = address.address_components[j];
                    if (_.contains(addressComponent.types, 'street_number')) {
                        extractedAddress.streetNumber = addressComponent.long_name || addressComponent.short_name || '';
                    } else if (_.contains(addressComponent.types, 'route')) {
                        extractedAddress.route = addressComponent.long_name || addressComponent.short_name || '';
                    } else if (_.contains(addressComponent.types, 'locality')) {
                        extractedAddress.city = addressComponent.long_name || addressComponent.short_name || '';
                    } else if (_.contains(addressComponent.types, 'administrative_area_level_1')) {
                        extractedAddress.state = addressComponent.long_name || addressComponent.short_name || '';
                    } else if (_.contains(addressComponent.types, 'postal_code')) {
                        extractedAddress.zip = addressComponent.long_name || addressComponent.short_name || '';
                    }
                }
            }

            return {
                street1: extractedAddress.streetNumber + ' ' + extractedAddress.route,
                city: extractedAddress.city,
                state: extractedAddress.state,
                zip: extractedAddress.zip
            }
        }

        return {
            geocode: function (address) {
                var defer = $q.defer(),
                    address = address || {};

                if (address.street1) {
                    geocoder.geocode({
                        address: address.street1 + ',' + address.city + ',' + address.state
                    }, function (results, status) {
                        if (results && results[0]) {
                            var _location = results[0].geometry.location,
                                address = extractAddress(results[0]);

                            if (_location) {
                                defer.resolve({
                                    street1: address.street1,
                                    city: address.city,
                                    state: address.state,
                                    zip: address.zip,
                                    latitude: _location.lat(),
                                    longitude: _location.lng()
                                });
                            } else {
                                $log.debug(status);
                                defer.reject('Could not find location');
                            }
                        } else {
                            $log.debug(status);
                            defer.reject('Could not find location');
                        }
                    })
                } else {
                    defer.reject('Address is required');
                }

                return defer.promise;
            },
            reverseGeocode: function (latlng) {
                var defer = $q.defer(),
                    latlng = latlng || {};

                if (latlng.latitude && latlng.longitude) {
                    var latlng = new google.maps.LatLng(latlng.latitude, latlng.longitude);
                    geocoder.geocode({
                        location: latlng
                    }, function (results, status) {
                        if (results && results.length) {
                            defer.resolve(extractAddress(results[0] || {}));
                        } else {
                            $log.debug(status);
                            defer.reject('Could not find location');
                        }
                    })
                } else {
                    defer.reject('Address is required');
                }

                return defer.promise;
            }
        }
    });