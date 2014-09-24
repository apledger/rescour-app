angular.module('rescour.services')
    .factory('Pin',
    function (Environment, $q, $http, segmentio, Geocoder, $log) {

        /**
         * Pin
         * @param data
         * @constructor
         */
        var Pin = function (data) {
            data = data || {};
            this.id = data.id || null;
            this.title = data.title || 'New Pin';
            this.type = data.type || '';
            this.url = data.url || '';
            this.body = data.body || '';
            this.address = data.address || {
                street1: '',
                city: '',
                state: '',
                zip: ''
            };
            this.latitude = this.address.latitude || null;
            this.longitude = this.address.longitude || null;
            this.isEditing = data.isEditing || false;
            this.isFresh = data.isFresh || false;
            this.datePosted = data.datePosted || Date.now();
            this.status = data.status || '';
            this.propertyType = data.propertyType || '';
            this.sqft = data.sqft || '';
            this.description = data.description || '';
            this.source = data.source || '';
            this.yearBuilt = data.yearBuilt || '';
            this.numUnits = data.numUnits || '';
            this.category = data.category || '';
            this.broker = data.broker || '';
            this.seller = data.seller || '';
            this.price = data.price || '';
            this.pricePerSqft = data.pricePerSqft || '';
            this.pricePerUnit = data.pricePerUnit || '';
            this.buyer = data.buyer || '';
            this.owner = data.owner || '';
            this.numJobs = data.numJobs || '';
            this.industry = data.industry || '';
            this.employerType = data.employerType || '';
        };

        Pin.types = {
            'Listing': {
                icon: 'fa-map-marker',
                title: 'Listing',
                fields: [
                    {
                        key: 'propertyType',
                        title: 'Property Type',
                        weight: 5000,
                        type: 'dropdown',
                        options: ['Multifamily', 'Office', 'Industrial', 'Retail', 'Mixed Use', 'Flex', 'Hospitality', 'Self Storage']
                    },
                    {
                        key: 'status',
                        title: 'Status',
                        type: 'dropdown',
                        options: ['Marketing', 'Under Contract', 'Expired', 'Sold'],
                        weight: 4000
                    },
                    {
                        key: 'broker',
                        title: 'Broker',
                        weight: 3000
                    },
                    {
                        key: 'seller',
                        title: 'Seller',
                        weight: 2000
                    },
                    {
                        key: 'yearBuilt',
                        title: 'Year Built',
                        weight: 1000
                    },
                    {
                        key: 'numUnits',
                        title: 'Number of Units',
                        weight: 500
                    },
                    {
                        key: 'source',
                        title: 'Source',
                        weight: 500
                    }
                ]
            },
            'Sales Comp': {
                icon: 'fa-dollar',
                title: 'Sales Comp',
                fields: [
                    {
                        key: 'price',
                        title: 'Price',
                        weight: 5000
                    },
                    {
                        key: 'buyer',
                        title: 'Buyer',
                        weight: 4000
                    },
                    {
                        key: 'seller',
                        title: 'Seller',
                        weight: 3000
                    },
                    {
                        key: 'broker',
                        title: 'Broker',
                        weight: 2000
                    },
                    {
                        key: 'numUnits',
                        title: 'Number of Units',
                        weight: 250
                    },
                    {
                        key: 'propertyType',
                        title: 'Property Type',
                        weight: 1000,
                        type: 'dropdown',
                        options: ['Multifamily', 'Office', 'Industrial', 'Retail', 'Mixed Use', 'Flex', 'Hospitality', 'Self Storage']
                    },
                    {
                        key: 'yearBuilt',
                        title: 'Year Built',
                        weight: 500
                    },
                    {
                        key: 'pricePerUnit',
                        title: 'Price / Unit',
                        weight: 100
                    },
                    {
                        key: 'sqft',
                        title: 'Sq Ft',
                        weight: 200
                    },
                    {
                        key: 'pricePerSqft',
                        title: 'Price / Sq Ft',
                        weight: 100
                    },
                    {
                        key: 'source',
                        title: 'Source',
                        weight: 150
                    }
                ]
            },
            'Rent Comp': {
                icon: 'fa-dollar',
                title: 'Rent Comp',
                fields: [
                    {
                        key: 'owner',
                        title: 'Owner',
                        weight: 500
                    },
                    {
                        key: 'rentPrice',
                        title: 'Rent Price',
                        weight: 500
                    },
                    {
                        key: 'propertyType',
                        title: 'Property Type',
                        weight: 1000,
                        type: 'dropdown',
                        options: ['Multifamily', 'Office', 'Industrial', 'Retail', 'Mixed Use', 'Flex', 'Hospitality', 'Self Storage']
                    }
                ]
            },
            'Point of Interest': {
                icon: 'fa-location-arrow',
                title: 'Point of Interest',
                fields: [
                    {
                        key: 'category',
                        title: 'Category',
                        weight: 500,
                        type: 'dropdown',
                        options: ['Schools', 'Retailer', 'Entertainment', 'Airports', 'Office', 'Industrial', 'Transportation', 'Hospital', 'Other']
                    }
                ]
            },
            'Employer': {
                icon: 'fa-briefcase',
                title: 'Employer',
                fields: [
                    {
                        key: 'numJobs',
                        title: 'Number of Jobs',
                        weight: 500
                    },
                    {
                        key: 'industry',
                        title: 'Industry',
                        weight: 500
                    },
                    {
                        key: 'employerType',
                        title: 'Ownership Type',
                        weight: 500,
                        type: 'dropdown',
                        options: ['Public', 'Private']
                    }
                ]
            },
            'News': {
                icon: 'fa-rss-square',
                title: 'News',
                fields: [
                    {
                        key: 'body',
                        title: 'Body',
                        type: 'textarea',
                        weight: 500
                    },
                    {
                        key: 'source',
                        title: 'Source',
                        weight: 500
                    }
                ]
            },
            'Asset': {
                icon: 'fa-building',
                title: 'Asset',
                fields: [
                    {
                        key: 'status',
                        title: 'Status',
                        options: ['Marketing', 'Under Contract', 'Expired', 'Sold'],
                        weight: 500
                    },
                    {
                        key: 'yearBuilt',
                        title: 'Year Built',
                        weight: 500
                    },
                    {
                        key: 'numUnits',
                        title: 'Number of Units',
                        weight: 500
                    },
                    {
                        key: 'sqft',
                        title: 'Sq Ft',
                        weight: 500
                    },
                    {
                        key: 'propertyType',
                        title: 'Property Type',
                        type: 'dropdown',
                        options: ['Multifamily', 'Office', 'Industrial', 'Retail', 'Mixed Use', 'Flex', 'Hospitality', 'Self Storage'],
                        weight: 500
                    },
                    {
                        key: 'source',
                        title: 'Source',
                        weight: 500
                    }
                ]
            }
        };

        Pin.dimensions = {
            discrete: {
                type: {
                    title: 'Type',
                    weight: 0
                }
            },
            range: {
                'latitude': {
                    title: 'Latitude',
                    weight: 9,
                    hidden: true
                },
                'longitude': {
                    title: 'Longitude',
                    weight: 9,
                    hidden: true
                }
            }
        };

        Pin.query = function () {
            var items = [],
                defer = $q.defer(),
                config = _.extend({ ignoreLoadingBar: true }, Environment.config),
                batchLimit = 500,
                rootPath = Environment.path + '/pins/';

            (function batchItems (limit, offset) {
                var path = rootPath + "?limit=" + limit + (offset ? "&offset=" + offset : "");

                $http.get(path, config).then(function (response) {
                    items = items.concat(response.data);

                    if (response.data.length < limit || response.data.length === 0) {
                        defer.resolve(items);
                    } else {
                        batchItems(limit, response.data[response.data.length - 1].id);
                    }
                }, function (response) {
                    defer.reject(response);
                });

            })(batchLimit);

            return defer.promise;
        };

        Pin.prototype.save = function () {
            var defer = $q.defer(),
                self = this,
                path = Environment.path + '/pins/' + (self.id || ''),
                method = self.id ? 'PUT' : 'POST',
                config = _.extend({}, Environment.config);
            body = JSON.stringify({
                title: self.title,
                address: self.address,
                type: self.type,
                url: self.url,
                body: self.body,
                datePosted: self.datePosted,
                status: self.status,
                propertyType: self.propertyType,
                sqft: self.sqft,
                description: self.description,
                source: self.source,
                yearBuilt: self.yearBuilt,
                numUnits: self.numUnits,
                category: self.category,
                broker: self.broker,
                seller: self.seller,
                price: self.price,
                pricePerSqft: self.pricePerSqft,
                pricePerUnit: self.pricePerUnit,
                buyer: self.buyer,
                owner: self.owner,
                numJobs: self.numJobs,
                industry: self.industry,
                employerType: self.employerType
            });

            $http(_.extend({
                url: path,
                method: method,
                data: body
            }, config)).then(
                function (response) {
                    if (self.isFresh) {
                        segmentio.track('Created Pin', {
                            title: self.title,
                            type: self.type,
                            latitude: self.address.latitude || self.latitude,
                            longitude: self.address.longitude || self.longitude
                        });
                    } else {
                        segmentio.track('Updated Pin', {
                            title: self.title,
                            type: self.type,
                            latitude: self.address.latitude || self.latitude,
                            longitude: self.address.longitude || self.longitude
                        });
                    }
                    self.isFresh = false;
                    self.id = response.data.id;
                    defer.resolve(response);
                },
                function (response) {
                    defer.reject(response);
                }
            );

            return defer.promise;
        };

        Pin.prototype.delete = function () {
            var defer = $q.defer(),
                self = this,
                path = Environment.path + '/pins/' + (self.id || ''),
                method = 'DELETE',
                config = _.extend({}, Environment.config);

            if (self.id) {
                $http(_.extend({
                    url: path,
                    method: method
                }, config)).then(
                    function (response) {
                        segmentio.track('Deleted Pin', {
                            title: self.title,
                            type: self.type,
                            latitude: self.address.latitude || self.latitude,
                            longitude: self.address.longitude || self.longitude
                        });
                        defer.resolve(response);
                    },
                    function (response) {
                        defer.reject(response);
                    }
                );
            } else {
                defer.resolve();
            }

            return defer.promise;
        };

        Pin.prototype.geocode = function () {
            var defer = $q.defer(),
                self = this;

            Geocoder.geocode(self.address).then(function (address) {
                if (address) {
                    self.latitude = self.address.latitude = address.latitude;
                    self.longitude = self.address.longitude = address.longitude;
                    self.address.street1 = address.street1 || '';
                    self.address.city = address.city || '';
                    self.address.state = address.state || '';
                    self.address.zip = address.zip || '';
                    defer.resolve(self);
                } else {
                    defer.reject('Failed to geocode');
                }
            }, function (e) {
                $log.debug(e);
                defer.reject('Failed to geocode');
            });

            return defer.promise;
        };

        Pin.prototype.reverseGeocode = function () {
            var defer = $q.defer(),
                self = this;

            self.latitude = self.address.latitude;
            self.longitude = self.address.longitude;

            Geocoder.reverseGeocode(self.address).then(function (address) {
                self.address.street1 = address.street1 || '';
                self.address.city = address.city || '';
                self.address.state = address.state || '';
                self.address.zip = address.zip || '';
                defer.resolve(self);
            }, function (e) {
                $log.debug(e);
                defer.reject('Failed to geocode');
            });

            return defer.promise;
        };

        Pin.prototype.getUrl = function () {
            if (this.url.indexOf('http://') !== -1 || this.url.indexOf('https://') !== -1) {
                return this.url
            } else {
                return 'http://' + this.url;
            }
        };

        Pin.prototype.preserve = function () {
            return $.extend(true, {}, this);
        };

        Pin.prototype.rollback = function (version) {
            $.extend(true, this, version);

            return this;
        };

        Pin.prototype.hasNoLocation = function () {
            return !this.address.latitude || !this.address.longitude;
        };

        Pin.prototype.getPopupEl = function () {
            if (this.isFresh) {
                return angular.element("<div ng-cloak ng-controller=\"PinPopupCtrl\" ng-click=\"closeTypesDropdown()\">\n    <header>\n        <div class=\"inner-container popup-header bg-solid--primary text-color--white\"\n             ng-cloak>\n            <div class=\"row\">\n                <div class=\"form-group col-lg-12\">\n                    <label class=\"control-label\">Title</label>\n                    <input class=\"form-control\" ng-model=\"hoveredItem.title\" type=\"text\" auto-focus/>\n                </div>\n            </div>\n        </div>\n    </header>\n\n    <div class=\"module__body\" ng-cloak>\n        <div class=\"row\">\n            <div class=\"col-lg-12 dropdown\" ng-class=\"{\'open\': isTypesOpen}\">\n                <i ng-class=\"pinTypes[hoveredItem.type].icon || \'fa-warning\'\" class=\"lead fa gutter-right\"></i>\n                <strong ng-bind=\"hoveredItem.type || \'Please select type\'\"></strong>\n\n                <div class=\"icon-btn gutter-left\"\n                     ng-show=\"hoveredItem.isFresh\"\n                     ng-click=\"toggleTypesDropdown($event)\">\n                    <i class=\"fa fa-caret-down\"></i>\n                </div>\n                <ul class=\"dropdown__list\">\n                    <li ng-repeat=\"(key, type) in pinTypes\"\n                        ng-class=\"{\'active\': hoveredItem.type == key}\"\n                        ng-click=\"selectPinType(key, hoveredItem)\">\n                        <i ng-class=\"type.icon\" class=\"fa gutter-half-right\"></i>\n                        <a href=\"javascript:\" ng-bind=\"key\"></a>\n                    </li>\n                </ul>\n            </div>\n        </div>\n    </div>\n\n    <footer class=\"popup-footer\">\n        <div class=\"row\">\n            <div class=\"col-lg-6\">\n                <div class=\"flip-btn btn--block popup-footer-action-left\"\n                     ng-click=\"editPin(hoveredItem)\">\n                    Edit\n                </div>\n            </div>\n\n            <div class=\"col-lg-6\">\n                <div class=\"flat-btn flat-btn--success btn--block popup-footer-action-right\"\n                     ng-click=\"savePin(hoveredItem)\">\n                    Create\n                </div>\n            </div>\n        </div>\n    </footer>\n</div>\n\n")
            } else {
                return angular.element("<div ng-cloak ng-controller=\"PinPopupCtrl\">\n    <header>\n        <h4 class=\"popup-striped-container popup-header btn-bg--primary break-word\"\n            ng-click=\"editPin(hoveredItem)\"\n            ng-bind=\"hoveredItem.title\"></h4>\n    </header>\n\n    <div class=\"module__body\" ng-cloak>\n        <div class=\"row\">\n            <div class=\"col-lg-12 dropdown\" ng-class=\"{\'open\': isTypesOpen}\">\n                <i ng-class=\"pinTypes[hoveredItem.type].icon\" class=\"lead fa gutter-right\"></i>\n                <strong ng-bind=\"hoveredItem.type\"></strong>\n            </div>\n        </div>\n        <div class=\"row\">\n            <div class=\"col-lg-12 gutter-half-top\">\n                <p class=\"max-height-150 break-word\" ng-bind=\"hoveredItem.description\"></p>\n            </div>\n        </div>\n    </div>\n\n    <footer class=\"popup-footer\">\n        <div class=\"row\" ng-show=\"!hoveredItem.isFresh\" ng-cloak>\n            <div class=\"col-lg-12 center-text\">\n                <div class=\"flip-btn btn--block popup-footer-action-full\"\n                   ng-click=\"openUrl(hoveredItem)\"><i class=\"fa fa-external-link gutter-half-right\"></i>Open URL\n                </div>\n            </div>\n        </div>\n</div>\n</footer>\n</div>\n\n");
            }
        };

        return Pin;
    })
    .factory('PinMarket',
    function (Pin) {
        return new thotpod.Marketplace(Pin);
    });