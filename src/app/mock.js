/**
 * Created with JetBrains WebStorm.
 * User: apledger
 * Date: 4/24/13
 * Time: 4:27 PM
 * File: /app/mock.js
 */

angular.module('rescour.mock', ['rescour.app', 'ngMockE2E'])
// Dummy Calls
    .run(['$httpBackend', '$timeout', function ($httpBackend, $timeout) {
        var NUM_ITEMS = 2096;

        var saved = {};

        var regionMap = [
            {
                city: 'Atlanta',
                region: 'Georgia',
                location: [33.7489, -84.3881]
            },
            {
                city: 'Birmingham',
                region: 'Alabama',
                location: [33.5206, -86.8025]
            },
            {
                city: 'Charlotte',
                region: 'North Carolina',
                location: [35.2269, -80.8433]
            },
            {
                city: 'Memphis',
                region: 'Tennessee',
                location: [35.1494, -90.0489]
            },
            {
                city: 'Nashville',
                region: 'Tennessee',
                location: [36.1658, -86.7844]
            },
            {
                city: 'Raleigh',
                region: 'North Carolina',
                location: [35.7719, -78.6389]
            },
            {
                city: 'Charleston',
                region: 'South Carolina',
                location: [32.7764, -79.9311]
            },
            {
                city: 'Miami',
                region: 'Florida',
                location: [26.7216, -80.2793]
            },
            {
                city: 'Orlando',
                region: 'Florida',
                location: [28.5381, -81.3794]
            },
            {
                city: 'Tampa',
                region: 'Florida',
                location: [27.9472, -82.4586]
            },
            {
                city: 'Jacksonville',
                region: 'Florida',
                location: [30.3319, -81.6558]
            },
            {
                city: 'Houston',
                region: 'Texas',
                location: [29.7631, -95.3631]
            },
            {
                city: 'Dallas',
                region: 'Texas',
                location: [32.7828, -96.8039]
            },
            {
                city: 'Austin',
                region: 'Texas',
                location: [30.2669, -97.7428]
            },
            {
                city: 'Washington DC',
                region: 'District of Columbia',
                location: [38.8900, -77.0300]
            },
            {
                city: 'Newark',
                region: 'Delaware',
                location: [39.6792, -75.7581]
            },
            {
                city: 'Baltimore',
                region: 'Maryland',
                location: [39.2833, -76.6167]
            },
            {
                city: 'McLean',
                region: 'Virginia',
                location: [38.9283, -77.1753]
            },
            {
                city: 'Richmond',
                region: 'Virginia',
                location: [37.5410, -77.4329]
            },
            {
                city: 'Louisville',
                region: 'Kentucky',
                location: [38.2500, -85.7667]
            },
            {
                city: 'Little Rock',
                region: 'Arkansas',
                location: [34.7361, -92.3311]
            },
            {
                city: 'Jackson',
                region: 'Mississippi',
                location: [32.2989, -90.1847]
            },
            {
                city: 'New Orleans',
                region: 'Louisiana',
                location: [29.9667, 90.0500]
            }
        ];
        var brokerMap = [
            'ARA',
            'CBRE',
            'Cushman & Wakefield',
            'HFF',
            'Jones Lang LaSalle',
            'CAA',
            'Colliers International',
            'Eastdil Secured',
            'Engler',
            'Hendricks & Partners',
            'Marcus & Millichap',
            'Rock',
            'SEAP',
            'Transwestern',
            'Capital Advisors',
            'Capstone',
            'Brown Realty'
        ];
        var statusMap = ['Marketing', 'Under Contract', 'Under LOI', 'Expired', 'Marketing - Past Due', 'Sold'];
        var newsCategoryMap = ['Transactions', 'Future Development', 'Under Construction', 'Renovations', 'Newly Completed', 'Financing', 'Other'];
        var generateDetails = function (options) {
            var details = [
                {
                    title: "Lindley Place",
                    description: "Located in the Upper East District, this " + options.units.city + " unit complex is ideally position for a live, work and play redevelopment with...."
                },
                {
                    title: "Campus Lodge",
                    description: "Located in the Lower East District, this " + options.units.city + " unit complex is ideally position for a live, work and play redevelopment with...."
                },
                {
                    title: "Fox Overview",
                    description: "Tucked away in a golf club community, this " + options.units.city + " unit apartment complex was newly renovated in " + options.year + " as a joint venture between " + options.broker + " and..."
                },
                {
                    title: "Brookstone Homes",
                    description: "Upscale downtown neighborhood apartment complex featuring huge 2 and 3 bedroom units on the top floors and town home style apartments on the lower level..."
                },
                {
                    title: "Chateau Apartments",
                    description: "A modern, garden level style apartment complex located in one of the most desirable neighborhoods in the city is one of a kind with it's refurbished...."
                },
                {
                    title: "Martin Creek Apartments",
                    description: "This property is the largest apartment complex in midtown.  With " + options.units + " units, this urban loft-style investment is ideally situated for high rent levels and high occupancy rates..."
                },
                {
                    title: "Cobblestone Place",
                    description: "Quiet apartment complex nestled into the quaint Highlands of " + options.city.city + ". Surrounded by the small shops and restaurants that have become a landmark of the Highlands."
                },
                {
                    title: "The View Apartments",
                    description: "Upgraded apartment homes located in the historic Lakeview, with breathtaking views overlooking the Lake"
                },
                {
                    title: "Lakeview Apartment Homes",
                    description: "Located in the historic Midtown district of Atlanta with views of the " + options.city.city + " Skyline..."
                },
                {
                    title: "Downtown Apartments",
                    description: "Steps away from the bustling downtown square, while still being blocks from the highway with easy access to the suburbs..."
                },
                {
                    title: "Peachtree Place",
                    description: "Modern apartments located directly on the main strip of " + options.city.city + ", Peachtree Rd. Only 2 blocks from the subway..."
                },
                {
                    title: "The Sungrove",
                    description: "Beautiful gardens surround this sun filled property where the modern apartments are the talk of " + options.city.city + "."
                },
                {
                    title: "The Ivory Landing",
                    description: "Upgraded units are the norm in these downtown lofts. Walking distance to the many hot spots that " + options.city.city + " has to offer."
                },
                {
                    title: "Downtown Apartments",
                    description: "Steps away from the bustling downtown square, while still being blocks from the highway with easy access to the suburbs..."
                },
                {
                    title: "The Ford Lofts",
                    description: "This trendy loft space was once a Ford factory, but now has been converted to a cozy apartment complex with a modern twist."
                },
                {
                    title: "The Cove",
                    description: "These affordable apartments come with all the amenities needed for the worker on the go, coffee shop, news stand and more..."
                },
                {
                    title: "Winterfield Apartments",
                    description: "Close to " + options.city.region + " State University, you will never have a long commute running back and forth from class and group meetings."
                },
                {
                    title: "Maplewood Lofts",
                    description: "These quaint lofts are perfect for someone on a budget, but is still looking for quality apartment homes."
                },
                {
                    title: "1st and Park",
                    description: "Located steps away from the magnificent Freedom park, you will always have a place to meet up with friends and get fresh air in " + options.city.city + "."
                },
                {
                    title: "10th Street Lofts",
                    description: "Blocks away from the sights and sounds of " + options.city.city + ", these lofts are for trendy folks that are on a budget."
                },
                {
                    title: "Slate Street Homes",
                    description: "These apartment homes are in the bustling center of " + options.city.city + ", where the top restaurants and bars are located."
                },
                {
                    title: "The Cumberland Lofts",
                    description: "This building was made famous after the Cumberland company went on strike and abandoned the building. It was converted into lofts in " + options.year + "..."
                }
            ];

            return details[parseInt((Math.random() * details.length), 10)];
        };

        var items = [],
            itemDetails = {},
            news = [];

        function randomDate(start, end) {
            return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
        }

        for (var k = 0; k < NUM_ITEMS; k++) {
            var randomCity = regionMap[parseInt((Math.random() * regionMap.length), 10)],
                randomBroker = brokerMap[parseInt((Math.random() * brokerMap.length), 10)],
                randomYear = parseInt(((Math.random() * 60) + 1950), 10),
                randomUnits = parseInt(((Math.random() * 800) + 100), 10),
                randomStatus = statusMap[parseInt((Math.random() * statusMap.length), 10)],
                randomType = "Apartment";

            var randomDetails = generateDetails({
                city: randomCity,
                broker: randomBroker,
                year: randomYear,
                units: randomUnits
            });

            items[k] = {
                id: k.toString(),
                thumbnail: "/img/apt" + parseInt((Math.random() * 19)+1, 10) + ".jpg",
                flyer: "http://www.realtyjuggler.com/FlyersSummary",
                title: randomDetails.title,
                description: randomDetails.description,
                price: "TBD by market",
                address: {
                    street1: "152 Dummy St.",
                    street2: "",
                    zip: 30309,
                    state: randomCity.region,
                    city: randomCity.city,
                    latitude: Math.random() * 0.40 + randomCity.location[0] - 0.075,
                    longitude: Math.random() * 0.35 + randomCity.location[1] - 0.105
                },
                broker: randomBroker,
                state: randomCity.region,
                propertyStatus: randomStatus,
                propertyType: randomType,
                yearBuilt: randomYear,
                numUnits: randomUnits,
                callForOffers: randomDate(new Date(2013, 0, 1), new Date()).getTime() / 1000,
                datePosted: randomDate(new Date(2013, 7, 1), new Date()).getTime(),
                tourDates: [
                    {date: '2013-03-19T04:00:00.000Z'},
                    {date: '2013-03-26T04:00:00.000Z'},
                    {date: '2013-04-02T04:00:00.000Z'}
                ],
                images: [
                    {
                        id: '/img/apartment-details-1.jpg'
                    },
                    {
                        id: '/img/apartment-details-2.jpg'
                    },
                    {
                        id: '/img/apartment-details-3.jpg'
                    },
                    {
                        id: '/img/apartment-details-4.jpg'
                    },
                    {
                        id: '/img/apartment-details-5.jpg'
                    },
                    {
                        id: '/img/apartment-details-6.jpg'
                    },
                    {
                        id: '/img/apartment-details-7.jpg'
                    },
                    {
                        id: '/img/apartment-details-8.jpg'
                    },
                    {
                        id: '/img/apartment-details-9.jpg'
                    }
                ],
                unitMix: [
                    {
                        type: '1 BR/1BA',
                        units: '48',
                        sqft: '605',
                        rent: '729',
                        rentpsqft: '1.20'
                    },
                    {
                        type: '2 BR/1BA',
                        units: '23',
                        sqft: '924',
                        rent: '950',
                        rentpsqft: '1.10'
                    },
                    {
                        type: '2 BR/2BA',
                        units: '220',
                        sqft: '1310',
                        rent: '1280',
                        rentpsqft: '0.90'
                    }
                ],
                contacts: [
                    {
                        name: "Jim Moore",
                        email: "jmoore@aaarealty.com",
                        phone: "(678)-553-9311"
                    },
                    {
                        name: "Sean Jones",
                        email: "sjones@aaarealty.com",
                        phone: "(678)-132-1532"
                    }
                ],
                resources: {}
            };

            var randomNewsCity = regionMap[parseInt((Math.random() * regionMap.length), 10)];

            news[k] = {
                title: 'News: Something happened here!',
                date: randomDate(new Date(2013, 0, 1), new Date()).getTime(),
                address: {
                    street1: "152 Dummy St.",
                    street2: "",
                    zip: "30142",
                    state: "GA",
                    city: "Atlanta",
                    latitude: Math.random() * 0.40 + randomNewsCity.location[0] - 0.075,
                    longitude: Math.random() * 0.28 + randomNewsCity.location[1] - 0.115
                },
                body: "Body of News Article " + k,
                url: "www.businessinsider.com",
                category: newsCategoryMap[parseInt((Math.random() * newsCategoryMap.length), 10)],
                id: k
            }
        }

        var fakeUser = {
            company: 'Fake Company',
            email: 'bob@fakecompany.com',
            firstName: 'Robert',
            lastName: 'Frost',
            phone: '123-456-6754',
            username: 'bob@fakecompany.com',
            roles: ['staff'],
            id: '1'
        };

        var fakeCustomer = {
            "id": "ch_1a3rxiEot611Pd",
            "object": "charge",
            "created": 1365006494,
            "livemode": false,
            "paid": true,
            "amount": 500,
            "currency": "usd",
            "refunded": false,
            "fee": 45,
            "fee_details": [
                {
                    "amount": 45,
                    "currency": "usd",
                    "type": "stripe_fee",
                    "description": "Stripe processing fees",
                    "application": null,
                    "amount_refunded": 0
                }
            ],
            "card": {
                "object": "card",
                "last4": "4242",
                "type": "Visa",
                "exp_month": 1,
                "exp_year": 2050,
                "fingerprint": "qhjxpr7DiCdFYTlH",
                "country": "US",
                "name": null,
                "address_line1": "792 Techwood DR NW",
                "address_line2": null,
                "address_city": "Atlanta",
                "address_state": "GA",
                "address_zip": "30313",
                "address_country": null,
                "cvc_check": "pass",
                "address_line1_check": null,
                "address_zip_check": null
            },
            "captured": true,
            "failure_message": null,
            "amount_refunded": 0,
            "customer": null,
            "invoice": null,
            "description": null,
            "dispute": null,
            subscription: {
                plan: "staff"
            }
        }

        $httpBackend.whenGET(/\/properties\/[0-9](?!\/comments|\/favorites|\/hidden|\/finances|\/contact)/).respond(function (method, url, data, headers) {
            var item_id = url.split("/")[2];

            return [200, itemDetails[item_id], {}];
        });

        $httpBackend.whenGET(/\/properties\/[0-9]+\/comments\//).respond(function (method, url, data, headers) {
            var item_id = url.split("/")[2];

            return [200, {items: itemDetails[item_id].comments}, {}];
        });

        $httpBackend.whenPOST(/\/properties\/[0-9]+\/comments\//).respond(
            function (method, url, data, headers) {
                var _comment = angular.fromJson(data),
                    item_id = url.split("/")[2];

                _comment.comment_id = itemDetails[item_id].comments.length + 1;
                itemDetails[item_id].comments.push(_comment);
                return [200, { id: _comment.id }, {}];
            });

        $httpBackend.whenPOST(/\/properties\/[0-9]+\/finances\//).respond(
            function (method, url, data, headers) {
                var _finance = angular.fromJson(data),
                    item_id = url.split("/")[2];

                _finance._id = Date.now();
                itemDetails[item_id].finances[_finance._id] = _finance;
                return [200, { id: _finance._id }, {}];
            });

        $httpBackend.whenPUT(/\/properties\/[0-9]+\/finances\/[0-9]+/).respond(
            function (method, url, data, headers) {
                var _finance = angular.fromJson(data),
                    item_id = url.split("/")[2],
                    finance_id = url.split("/")[4];
                itemDetails[item_id].finances[finance_id] = _finance;
                return [200, { }, {}];
            });

        $httpBackend.when('DELETE', /\/properties\/[0-9]+\/finances\/[0-9]+/).respond(
            function (method, url, data, headers) {
                var item_id = url.split("/")[2],
                    finance_id = url.split("/")[4];
                delete itemDetails[item_id].finances[finance_id];
                return [200, {}, {}];
            });

        $httpBackend.whenPOST(/\/properties\/[0-9]+\/contact\//).respond(
            function (method, url, data, headers) {
                return [200, {}, {}];
            }
        );

        $httpBackend.whenGET('/properties/').respond({resources: items});

        $httpBackend.whenGET('/auth/user/').respond([fakeUser]);
        $httpBackend.whenGET('/auth/user/1').respond(fakeUser);
//        $httpBackend.whenGET('/auth/users/user/').respond(fakeUser);

        $httpBackend.whenGET('/auth/user/1/payment/').respond(fakeCustomer);

        $httpBackend.whenPUT('/auth/users/user/').respond(function (method, url, data, headers) {
            var _saved = angular.fromJson(data);
            fakeUser = data;
            return [200, {}, {}];
        });

        $httpBackend.whenGET('/searches/').respond({resources: saved});
        // adds a new phone to the phones array
        $httpBackend.whenPOST('/searches/').respond(function (method, url, data, headers) {
            var _data = angular.fromJson(data),
                _saved = {
                    id: Date.now(),
                    savedSearch: _data.savedSearch,
                    title: _data.title
                };

            saved[_saved.id] = _saved;
            return [200, { id: _saved.id }, {}];
        });

        $httpBackend.whenPOST('/reports/').respond(function (method, url, data, headers) {
            return [200, { status: 'success' }, {}];
        });

        $httpBackend.whenPUT(/\/search\/[0-9]+/).respond(function (method, url, data, headers) {
            var _data = angular.fromJson(data),
                _id = url.split("/")[2],
                _saved = {
                    id: _id,
                    savedSearch: _data.savedSearch,
                    title: _data.title
                };

            saved[_saved.id] = _saved;

            return [200, { id: _saved.id }, {}];
        });

        $httpBackend.whenPUT(/\/properties\/\d+\/notes/).respond(function (method, url, data, headers) {
            return [200, {}, {}];
        });

        $httpBackend.whenPOST(/\/properties\/[0-9]+\/favorites\//).respond(function (method, url, data, headers) {
            return [200, { status: "success" }, {}];
        });

        $httpBackend.whenPOST(/\/properties\/[0-9]+\/hidden\//).respond(function (method, url, data, headers) {
            return [200, { status: "success" }, {}];
        });

//        $httpBackend.whenGET(/\/news\/(\?limit=)[0-9]+&(offset=)[0-9]+/).respond(function (method, url, data, headers) {
//            var limit = parseInt(url.split("limit=")[1].split("&")[0]);
//            var offset = parseInt(url.split("offset=")[1].split("&")[0]) + 1;
//
//            if (limit + offset > news.length) {
//                return [200, news.slice(offset, news.length)]
//            } else {
//                return [200, news.slice(offset, offset + limit)]
//            }
//        });

        $httpBackend.whenGET(/\/properties\/(\?limit=)[0-9]+/).respond(function (method, url, data, headers) {
            var limit = parseInt(url.split("limit=")[1].split("&")[0]),
                offset =parseInt(url.split("offset=")[1] ? url.split("offset=")[1].split("&")[0] : 0);

            if (offset + limit + 1 < items.length) {
                return [200, items.slice(offset === 0 ? 0 : offset + 1, offset + limit + 1)]
            } else {
                return [200, items.slice(offset + 1, items.length + 1)]
            }
        });

        $httpBackend.whenGET(/\/news\/(\?limit=)[0-9]+/).respond(function (method, url, data, headers) {
            var limit = parseInt(url.split("limit=")[1].split("&")[0]),
                offset =parseInt(url.split("offset=")[1] ? url.split("offset=")[1].split("&")[0] : 0);

            if (offset + limit + 1 < news.length) {
                return [200, news.slice(offset === 0 ? 0 : offset + 1, offset + limit + 1)]
            } else {
                return [200, news.slice(offset + 1, news.length + 1)]
            }
        });

        $httpBackend.whenGET(/\/hidden\/(\?limit=)[0-9]+/).respond(function (method, url, data, headers) {
            var limit = parseInt(url.split("limit=")[1].split("&")[0]),
                offset =parseInt(url.split("offset=")[1] ? url.split("offset=")[1].split("&")[0] : 0);

            return [200, [], {}];
        });

        $httpBackend.whenGET(/\/favorites\/(\?limit=)[0-9]+/).respond(function (method, url, data, headers) {
            var limit = parseInt(url.split("limit=")[1].split("&")[0]),
                offset =parseInt(url.split("offset=")[1] ? url.split("offset=")[1].split("&")[0] : 0);

            return [200, [], {}];
        });

        $httpBackend.whenGET(/\/comments\/(\?limit=)[0-9]+/).respond(function (method, url, data, headers) {
            var limit = parseInt(url.split("limit=")[1].split("&")[0]),
                offset =parseInt(url.split("offset=")[1] ? url.split("offset=")[1].split("&")[0] : 0);

            return [200, [], {}];
        });

        $httpBackend.whenGET(/\/finances\/(\?limit=)[0-9]+/).respond(function (method, url, data, headers) {
            var limit = parseInt(url.split("limit=")[1].split("&")[0]),
                offset =parseInt(url.split("offset=")[1] ? url.split("offset=")[1].split("&")[0] : 0);

            return [200, [], {}];
        });

        $httpBackend.whenPOST(/\/finances\//).respond(function (method, url, data, headers) {
            return [200, [], {}];
        });
        $httpBackend.whenPOST(/\/favorites\//).respond(function (method, url, data, headers) {
            return [200, [], {}];
        });
        $httpBackend.whenPOST(/\/hidden\//).respond(function (method, url, data, headers) {
            return [200, [], {}];
        });
        $httpBackend.whenPOST(/\/comments/).respond(function (method, url, data, headers) {
            return [200, [], {}];
        });

        $httpBackend.whenDELETE(/\/finances\//).respond(function (method, url, data, headers) {
            return [200, [], {}];
        });
        $httpBackend.whenDELETE(/\/favorites\//).respond(function (method, url, data, headers) {
            return [200, [], {}];
        });
        $httpBackend.whenDELETE(/\/hidden\//).respond(function (method, url, data, headers) {
            return [200, [], {}];
        });
        $httpBackend.whenDELETE(/\/comments/).respond(function (method, url, data, headers) {
            return [200, [], {}];
        });
        $httpBackend.whenGET(/views\//).passThrough();
        $httpBackend.whenGET(/partials\//).passThrough();
        $httpBackend.whenGET(/template\//).passThrough();
        $httpBackend.whenJSONP(/rentmetrics/).passThrough();
        $httpBackend.whenGET(/walkbitch/).respond(function (method, url, data, headers) {
            return [200, {
                walkscore: 58,
                description: 'Somewhat Walkable',
                ws_link: 'http://www.walkscore.com/score/31790-US-Highway-19-Harbor-Florida-34684/lat=28.0627457/lng=-82.73907200000001/?utm_source=rescour.com&utm_medium=ws_api&utm_campaign=ws_api'
            }, {}];
        });
    }]);

angular.bootstrap(document, ['rescour.mock']);



