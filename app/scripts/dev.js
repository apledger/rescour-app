angular.module('rescour.app.dev', ['rescour.app', 'ngMockE2E'])
// Dummy Calls
    .run(['$httpBackend', '$timeout', function ($httpBackend, $timeout) {
        var NUM_ITEMS = 300;

        var saved = [
            {
                discreet: {
                    Broker: {
                        title: "Listing Brokerage Firm",
                        selected: 2,
                        values: {
                            CBRE: {
                                title: "CBRE",
                                ids: [],
                                isSelected: true
                            },
                            "Jones Lang LaSalle": {
                                title: "Jones Lang LaSalle",
                                ids: [],
                                isSelected: false
                            },
                            ARA: {
                                title: "ARA",
                                ids: [1, 2, 3, 4],
                                isSelected: false
                            },
                            HFF: {
                                title: "HFF",
                                ids: [],
                                isSelected: true
                            },
                            "Cushman Wakefield": {
                                title: "Cushman Wakefield",
                                ids: [],
                                isSelected: false
                            },
                            "Random Broker": {
                                title: "Random Broker",
                                ids: [],
                                isSelected: false
                            }
                        }
                    },
                    Region: {
                        title: "Region",
                        selected: 1,
                        values: {
                            Atlanta: {
                                title: "Atlanta",
                                ids: [],
                                isSelected: false
                            },
                            Nashville: {
                                title: "Nashville",
                                ids: [],
                                isSelected: false
                            },
                            Charlotte: {
                                title: "Charlotte",
                                ids: [],
                                isSelected: true
                            },
                            Birmingham: {
                                title: "Birmingham",
                                ids: [],
                                isSelected: false
                            },
                            Memphis: {
                                title: "Memphis",
                                ids: [],
                                isSelected: false
                            },
                            Raleigh: {
                                title: "Raleigh",
                                ids: [],
                                isSelected: false
                            }
                        }
                    }
                },
                range: {
                    "Year Built": {
                        title: "Year Created",
                        ids: [],
                        highSelected: 2000,
                        lowSelected: 1990
                    },
                    "Number of Units": {
                        title: "Number of Units",
                        ids: [],
                        highSelected: 400,
                        lowSelected: 140
                    }
                },
                id: 1,
                title: "1990's"
            }
        ];

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
        var statusMap = ['For Sale', 'Under Contract', 'Sold'];
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

        var items = {},
            itemDetails = {};

        for (var k = 0; k < NUM_ITEMS; k++) {
            var randomCity = regionMap[parseInt((Math.random() * regionMap.length), 10)],
                randomBroker = brokerMap[parseInt((Math.random() * brokerMap.length), 10)],
                randomYear = parseInt(((Math.random() * 60) + 1950), 10),
                randomUnits = parseInt(((Math.random() * 400) + 100), 10),
                randomStatus = statusMap[parseInt((Math.random() * statusMap.length), 10)];

            var randomDetails = generateDetails({
                city: randomCity,
                broker: randomBroker,
                year: randomYear,
                units: randomUnits
            });

            items[k] = {
                id: k,
                thumbnail: "apt" + parseInt((Math.random() * 10), 10) + ".jpg",
                title: randomDetails.title,
                description: randomDetails.description,
                price: "TBD by market",
                address: {
                    street1: "152 Dummy St.",
                    street2: "",
                    zip: "30142",
                    state: "GA",
                    city: "Atlanta"
                },
                attributes: {
                    discreet: {
                        "Broker": randomBroker,
                        "State": randomCity.region,
                        "property_status": randomStatus
                    },
                    range: {
                        "Year Built": randomYear,
                        "Number of Units": randomUnits
                    }
                },
                location: [
                    Math.random() * 0.151 + randomCity.location[0] - 0.075,
                    Math.random() * 0.23 + randomCity.location[1] - 0.115
                ]
            };

            itemDetails[k] = {
                notes: {
                    comments: [],
                    financials: {}
                },
                images: [
                    {
                        link: 'img/apartment-details-1.jpg',
                        caption: 'This is the first picture'
                    },
                    {
                        link: 'img/apartment-details-2.jpg',
                        caption: 'This is the second picture'
                    }
                ],
                unitmix: [
                    {
                        type: '1 BR/1BA',
                        units: '48',
                        sqft: '605',
                        rent: '729',
                        rentpsf: '1.20'
                    },
                    {
                        type: '2 BR/1BA',
                        units: '23',
                        sqft: '924',
                        rent: '950',
                        rentpsf: '1.10'
                    },
                    {
                        type: '2 BR/2BA',
                        units: '220',
                        sqft: '1310',
                        rent: '1280',
                        rentpsf: '0.90'
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
                ]
            };
        }

        var fakeUser = {
            company: "Fake Company",
            email: "bob@fakecompany.com",
            first_name: "Robert",
            groups: "ListField",
            last_name: "Frost",
            password: "myPassword123",
            phone: "123-456-6754",
            username: "bob@fakecompany.com",
        }

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
            "dispute": null
        }

        $httpBackend.whenGET(/\/properties\/[0-9](?!\/notes|\/favorites|\/hidden)/).respond(function (method, url, data, headers) {
            var item_id = url.split("/")[2];

            return [200, itemDetails[item_id], {}];
        });

        $httpBackend.whenGET(/\/properties\/[0-9]+\/notes\/comments\//).respond(function (method, url, data, headers) {
            var item_id = url.split("/")[2];

            return [200, {notes: itemDetails[item_id].notes}, {}];
        });

        $httpBackend.whenPOST(/\/properties\/[0-9]+\/notes\/comments\//).respond(
            function (method, url, data, headers) {
                var _comment = angular.fromJson(data),
                    item_id = url.split("/")[2];

                _comment.comment_id = itemDetails[item_id].notes.comments.length + 1;
                itemDetails[item_id].notes.comments.push(_comment);
                return [200, { id: _comment.id }, {}];
            });

        $httpBackend.whenPOST(/\/mail\//).respond(
            function (method, url, data, headers) {
                return [200, {}, {}];
            }
        );

        $httpBackend.whenGET('/properties/').respond({resources: items});

        $httpBackend.whenGET('/auth/check').respond({user: "Alan"});
        $httpBackend.whenGET('/auth/users/user/').respond(fakeUser);

        $httpBackend.whenGET('/auth/users/billing/').respond(fakeCustomer);

        $httpBackend.whenPUT('/auth/users/user/').respond(function (method, url, data, headers) {
            var _saved = angular.fromJson(data);
            fakeUser = data;
            return [200, {}, {}];
        });

        $httpBackend.whenGET('/search/').respond({resources: saved });
        // adds a new phone to the phones array
        $httpBackend.whenPOST('/search/').respond(function (method, url, data, headers) {
            var _saved = angular.fromJson(data).saved_search;
            _saved.id = saved.length + 1;
            saved.push(_saved);
            return [200, { id: _saved.id }, {}];
        });

        $httpBackend.whenPUT(/\/search\/[0-9]+/).respond(function (method, url, data, headers) {
            var _saved = angular.fromJson(data).saved_search;
            for (var i = 0; i < saved.length; i++) {
                if (saved[i].id == _saved.id) {
                    saved[i] = _saved;
                }
            }
            return [200, {}, {}];
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

        $httpBackend.whenGET(/^\/views\//).passThrough();
        $httpBackend.whenGET(/^\/template\//).passThrough();
        $httpBackend.whenGET(/^template\//).passThrough();
    }]);

angular.bootstrap(document, ['rescour.app.dev']);


