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
        var NUM_ITEMS = 1000;
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

        var mdus = [],
            news = [],
            userData = {
                "id": "1",
                "firstName": "Bob",
                "lastName": "Smith",
                "email": "bobsmith@gmail.com",
                "phone": "123-456-7890",
                "company": "Fake Company",
                "userRoles": ["verified"],
                "clientRoles": ["good_standing"]
            },
            mduDetails = {

                comments: [
                    {
                        id: '1',
                        text: 'This is a comment',
                        datePosted: randomDate(new Date(2013, 0, 1), new Date()).getTime(),
                        userEmail: 'teammate@company.org'
                    }
                ],
                tourDates: [
                    {date: '2013-03-19T04:00:00.000Z'},
                    {date: '2013-03-26T04:00:00.000Z'},
                    {date: '2013-04-02T04:00:00.000Z'}
                ],
                images: [
                    {
                        id: '/assets/img/apartment-details-1.jpg'
                    },
                    {
                        id: '/assets/img/apartment-details-2.jpg'
                    },
                    {
                        id: '/assets/img/apartment-details-3.jpg'
                    },
                    {
                        id: '/assets/img/apartment-details-4.jpg'
                    },
                    {
                        id: '/assets/img/apartment-details-5.jpg'
                    },
                    {
                        id: '/assets/img/apartment-details-6.jpg'
                    },
                    {
                        id: '/assets/img/apartment-details-7.jpg'
                    },
                    {
                        id: '/assets/img/apartment-details-8.jpg'
                    },
                    {
                        id: '/assets/img/apartment-details-9.jpg'
                    }
                ],
                unitMixes: [
                    {
                        type: '1 BR/1BA',
                        units: '48',
                        squareFeet: '605',
                        rent: '729',
                        rentPerSquareFoot: '1.20'
                    },
                    {
                        type: '2 BR/1BA',
                        units: '23',
                        squareFeet: '924',
                        rent: '950',
                        rentPerSquareFoot: '1.10'
                    },
                    {
                        type: '2 BR/2BA',
                        units: '220',
                        squareFeet: '1310',
                        rent: '1280',
                        rentPerSquareFoot: '0.90'
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

            var mdu = {
                id: k.toString(),
                thumbnail: "/assets/img/apt" + parseInt((Math.random() * 19)+1, 10) + ".jpg",
                flyer: "http://www.realtyjuggler.com/FlyersSummary",
                title: randomDetails.title,
                description: randomDetails.description,
                price: "TBD by market",
                addresses: [{
                    street1: "152 Dummy St.",
                    street2: "",
                    zip: "30142",
                    state: randomCity.region,
                    city: randomCity.city,
                    latitude: Math.random() * 0.40 + randomCity.location[0] - 0.075,
                    longitude: Math.random() * 0.35 + randomCity.location[1] - 0.105
                }],
                broker: randomBroker,
                state: randomCity.region,
                mduStatus: randomStatus,
                mduType: randomType,
                yearBuilt: randomYear,
                numberUnits: randomUnits,
                callForOffers: randomDate(new Date(2013, 0, 1), new Date()).getTime(),
                datePosted: randomDate(new Date(2013, 0, 1), new Date()).getTime()
            };
            mdus.push(mdu);
            var randomNewsCity = regionMap[parseInt((Math.random() * regionMap.length), 10)];

            var article = {
                title: 'News: Something happened here!',
                date: randomDate(new Date(2013, 0, 1), new Date()).getTime(),
                addresses: [{
                    street1: "152 Dummy St.",
                    street2: "",
                    zip: "30142",
                    state: "GA",
                    city: "Atlanta",
                    latitude: Math.random() * 0.40 + randomNewsCity.location[0] - 0.075,
                    longitude: Math.random() * 0.28 + randomNewsCity.location[1] - 0.115
                }],
                body: "Body of News Article " + k,
                url: "www.businessinsider.com",
                category: newsCategoryMap[parseInt((Math.random() * newsCategoryMap.length), 10)],
                id: k.toString()
            };
            news.push(article);
        };

        var searches = [];

        function createSearch (searchData) {
            var newSearch = angular.extend({id: searches.length + 1}, searchData);
            searches.push(newSearch);
            return newSearch;
        }

        $httpBackend.whenGET(/\/mdus\/(\?limit=)[0-9]+/).respond(function (method, url, data, headers) {
            var limit = parseInt(url.split("limit=")[1].split("&")[0]),
                offset =parseInt(url.split("offset=")[1] ? url.split("offset=")[1].split("&")[0] : 0);
            console.log("blah");
            if (offset + limit + 1 < mdus.length) {
                return [200, mdus.slice(offset === 0 ? 0 : offset + 1, offset + limit + 1)]
            } else {
                return [200, mdus.slice(offset + 1, mdus.length + 1)]
            }
        });

        $httpBackend.whenGET(/\/mdus\/$/).respond(function (method, url, data, headers) {
            return [200, mdus, {}]
        });

        $httpBackend.whenGET(/\/mdus\/[0-9]+/).respond(function (method, url, data, headers) {
            var id = parseInt(url.split('/'))[1];
            return [200, mduDetails, {}]
        });

        $httpBackend.whenPOST(/\/mdus\/[0-9]+\/comments\//).respond(function (method, url, data, headers) {
            var id = parseInt(url.split('/'))[1];
            return [200, {}, {}]
        });

        $httpBackend.whenPOST(/\/mdus\/[0-9]+\/favorites\//).respond(function (method, url, data, headers) {
            var id = parseInt(url.split('/'))[1];
            return [200, {}, {}]
        });

        $httpBackend.whenDELETE(/\/mdus\/[0-9]+\/favorites\//).respond(function (method, url, data, headers) {
            var id = parseInt(url.split('/'))[1];
            return [200, {}, {}]
        });

        $httpBackend.whenPOST(/\/mdus\/[0-9]+\/hidden\//).respond(function (method, url, data, headers) {
            var id = parseInt(url.split('/'))[1];
            return [200, {}, {}]
        });

        $httpBackend.whenDELETE(/\/mdus\/[0-9]+\/hidden\//).respond(function (method, url, data, headers) {
            var id = parseInt(url.split('/'))[1];
            return [200, {}, {}]
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

        $httpBackend.whenGET(/\/news\//).respond(function (method, url, data, headers) {
            return [200, news, {}]
        });


        $httpBackend.whenGET(/\/user\//).respond(function (method, url, data, headers) {
            return [200, userData, {}]
        });

        $httpBackend.whenGET(/\/searches\//).respond(function (method, url, data, headers) {
            var newSearch = createSearch(data);
            return [200, [], {}];
        });
        $httpBackend.whenPOST(/\/searches\//).respond(function (method, url, data, headers) {
            var newSearch = createSearch(data);
            return [200, {
                id: newSearch.id
            }, {}];
        });

        $httpBackend.whenGET(/views\//).passThrough();
        $httpBackend.whenGET(/partials\//).passThrough();
        $httpBackend.whenGET(/templates\//).passThrough();
        $httpBackend.whenGET(/assets\//).passThrough();
    }]);

angular.bootstrap(document, ['rescour.mock']);



