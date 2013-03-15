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
        var items = {};
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

        var details = {
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

        for (var k = 0; k < NUM_ITEMS; k++) {
            var randomCity = regionMap[parseInt((Math.random() * regionMap.length), 10)],
                randomBroker = brokerMap[parseInt((Math.random() * brokerMap.length), 10)],
                randomYear = parseInt(((Math.random() * 60) + 1950), 10),
                randomUnits = parseInt(((Math.random() * 400) + 100), 10);

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
                attributes: {
                    discreet: {
                        "Broker": randomBroker,
                        "State": randomCity.region
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
        }
        var notes = {
            comments: []
        };
        $httpBackend.whenGET(/\/properties\/[0-9](?!\/notes|\/favorites|\/hidden)/).respond(details);

        $httpBackend.whenGET(/\/properties\/[0-9]+\/notes\/comments\//).respond({notes: notes});

        $httpBackend.whenPOST(/\/properties\/[0-9]+\/notes\/comments\//).respond(
            function (method, url, data, headers) {
                var _comment = angular.fromJson(data);
                _comment.comment_id = notes.comments.length + 1;
                notes.comments.push(_comment);
                return [200, { id: _comment.id }, {}];
            });

        $httpBackend.whenPOST(/\/mail\//).respond(
            function (method, url, data, headers) {
                return [200, {}, {}];
            }
        );

        $httpBackend.whenGET('/properties/').respond({resources: items});

        $httpBackend.whenGET('/auth/check').respond({user: "Alan"});

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


