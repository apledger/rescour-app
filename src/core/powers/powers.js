angular.module('rescour.powers', [])
    .factory('Power',
        ['$document', '$window',
            function ($document, $window) {
                function Power(opts, el) {
                    this.title = opts.title || {};
                    this.options = opts.options || {};
                };

                return Power;
            }])
    .controller('PowersController', ['$scope', '$rootScope', function ($scope, $rootScope) {
        var powers = [];

        this.addPower = function (power) {
            powers.push(power);
        };

        this.open = function (power) {
            $rootScope.$broadcast('Powers.close');
            power.open();
        };

        $scope.$on('Powers.close', function () {
            angular.forEach(powers, function (value, key) {
                if (value.power.isOpen) {
                    value.power.close();
                }
            });
        });

    }])
    .directive('power', ['$document', 'Power', '$compile',
        function ($document, Power, $compile) {
            return {
                require: '^powers',
                scope: {
                    power: '='
                },
                replace: true,
                templateUrl: '/core/powers/template/power.html',
                link: function (scope, element, attrs, PowersController) {

                    var _power = scope.power = new Power(scope.power, element);
                    var body = $document.find('body');

                    _power.close = function (e) {
                        if (e) {
                            e.stopPropagation();
                            e.preventDefault();
                        }

                        scope.$apply(function () {
                            _power.isOpen = false;
                        });

                        $document.unbind('click', _power.close);
                    };

                    _power.open = function () {
                        scope.$apply(function () {
                            _power.isOpen = true;
                        });
                        $document.bind('click', _power.close);
                    };

                    PowersController.addPower(scope);

                    element.bind('click', function (e) {
                        if (!_power.isOpen) {
                            e.preventDefault();
                            e.stopPropagation();
                            PowersController.open(_power);
                        }
                    });
                }
            };
        }])
    .directive('powers', ['$window', function ($window) {
        return {
            restrict: 'C',
            link: function (scope, element, attrs) {

                var elHeight = element.prop('offsetHeight'),
                    elSibling = element.next(),
                    elParent = element.parent();

                function setHeight(el) {
                    elHeight = element.prop('offsetHeight');
                    el.css({
                        height: elParent.height() - elHeight
                    });
                }

                setHeight(elSibling);

                angular.element($window).bind('resize', function () {
                    scope.$apply(function () {
                        scope.$broadcast('window-resized');
                    });
                });

                scope.$on('window-resized', function () {
                    setHeight(elSibling);
                });
            },
            controller: 'PowersController'
        }
    }]);