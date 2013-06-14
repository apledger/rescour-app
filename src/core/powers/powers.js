angular.module('rescour.powers', [])
    .factory('Power',
        ['$document', '$window',
            function ($document, $window) {
                function Power(opts) {
                    angular.extend(this, {}, opts);
                    if (this.options) {
                        angular.forEach(this.options, function (value, key) {
                            value.key = key;
                        });
                    }

                    this.float = this.float || 'left';
                };

                Power.prototype.getOptions = function () {
                    return _.map(this.options, function (value) { return value });
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
                    scope.predicate = 'weight';

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

                    scope.selectOption = function (option){
                        if (_power.toggle) {
                            angular.forEach(_power.options, function (value, key) {
                                value.isSelected = false;
                            });
                            option.isSelected = true;
                            _power.toggle = option.key;
                        }
                        option.action();
                    };

                    element.bind('click', function (e) {
                        if (!_power.isOpen && _power.options) {
                            e.preventDefault();
                            e.stopPropagation();
                            PowersController.open(_power);
                        } else if (_power.action) {
                            scope.$apply(function () {
                                _power.action();
                            });
                        }
                    });

                    if (_power.toggle && _power.options.hasOwnProperty(_power.toggle)) {
                        scope.selectOption(_power.options[_power.toggle]);
                    }
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