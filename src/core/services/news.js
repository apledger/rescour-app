angular.module('rescour.services')
    .factory('NewsMarket', ['News',
        function (News) {
            return new thotpod.Marketplace(News);
        }])
    .factory('News',
    function (Environment, $q, $http, cfpLoadingBar, $filter) {

        // Item constructor
        var News = function (data) {
            if (!data.address) {
                throw new Error("[NEWS] No address specified for " + data.id + ": " + data.title);
            } else if (!data.address.latitude || !data.address.longitude) {
//                throw new Error("[NEWS] No lat,lng specified for " + data.id + ": " + data.title);
            }
            this.id = data.id;
            this.title = data.title || 'Not Available';
            this.body = data.body || 'Not Available';
            this.source = data.source || 'Not Available';
            this.address = data.address || {
                street1: 'Not Address Listed',
                latitude: 'NA',
                longitude: 'NA'
            };

            // Check if http is on URL
            if (data.url) {
                if (data.url.indexOf('http://') == -1) {
                    this.url = 'http://' + data.url;
                } else {
                    this.url = data.url;
                }
            }

            if (Date.parse(data.date)) {
                this.date = new Date(data.date);
            } else {
                this.date = data.date ? new Date(parseInt(data.date, 10)) : new Date(parseInt(this.id.toString().slice(0, 8), 16) * 1000);
            }

            /** Range **/
            this.latitude = parseFloat(data.address.latitude) || 'NA';
            this.longitude = parseFloat(data.address.longitude) || 'NA';
            this.age = Math.ceil(Math.abs(Date.now() - (this.date.getTime())) / (1000 * 3600 * 24));

            /** Discrete **/
            this.category = data.category || null;
        };

        News.dimensions = {
            discrete: {
                category: {
                    title: 'Category',
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
                },
                'age': {
                    title: 'Date',
                    weight: 9
                }
            }
        };

        News.query = function () {
            var items = [],
                defer = $q.defer(),
                config = _.extend({
                    cache: true,
                    ignoreLoadingBar: true
                }, Environment.config),
                batchLimit = 500,
                rootPath = Environment.path + '/news/';

            cfpLoadingBar.start();
            (function batchItems(limit, offset) {
                var path = rootPath + "?limit=" + limit + (offset ? "&offset=" + offset : "");

                $http.get(path, config).then(function (response) {
                    items = items.concat(response.data);

                    if (response.data.length < limit || response.data.length === 0) {
                        cfpLoadingBar.complete();
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

        News.prototype.getPopupEl = function () {
            return angular.element("<div class=\"news-popup-header\">\n    <a target=\"_blank\" ng-href=\"{{ hoveredItem.url }}\">\n        <h5 ng-bind=\"hoveredItem.title\"></h5>\n    </a>\n    <span ng-bind=\"\'Posted on \' + (hoveredItem.date | date)\"></span>\n</div>");
        };

        News.prototype.getAddress = function () {
            var addressStr = '';

            if (this.address.street1) {
                addressStr += this.address.street1;
            }
            if (this.address.state) {
                addressStr += ', ';
                addressStr += this.address.city ? this.address.city + ', ' + this.address.state : this.address.state;
            }
            if (this.address.zip) {
                addressStr += ' ';
                addressStr += this.address.zip;
            }

            return addressStr;
        };

        return News;
    });