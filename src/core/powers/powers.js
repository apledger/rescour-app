angular.module('rescour.powers', [])
    .controller('PowersController', ['$scope', '$rootScope', function ($scope, $rootScope) {
        var powers = [];

        this.addPower = function (power) {
            powers.push(power);
        };

        this.open = function (power) {
            $rootScope.$broadcast('destroyDropdowns');
            power.open();
        };

        $scope.$on('destroyDropdowns', function () {
            angular.forEach(powers, function (value, key) {
                if (value.power.isOpen) {
                    value.power.close();
                }
            });
        });
    }])
    .directive('power', ['$document', '$compile',
        function ($document, $compile) {
            return {
                require: '^powers',
                restrict: 'A',
                scope: {
                    power: '=',
                    powerTooltip: '@',
                    powerTooltipPlacement: '@',
                    powerHide: '='
                },
                replace: true,
                templateUrl: '/core/powers/template/power.html?v=' + Date.now(),
                link: function (scope, element, attrs, PowersController) {
                    var _power = scope.power;
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
                            scope.$broadcast('destroyTooltips');
                        });
                        $document.bind('click', _power.close);
                    };

                    PowersController.addPower(scope);

                    scope.selectOption = function (option) {
                        if (_power.toggle) {
                            angular.forEach(_power.options, function (value, key) {
                                value.isSelected = false;
                            });
                            option.isSelected = true;
                            _power.toggle = option.key;
                        } else if (_power.multiSelect) {
                            option.isSelected = !option.isSelected;
                        }
                        option.action.call(option);
                    };

                    element.bind('click', function (e) {
                        if (!_power.isDisabled) {
                            if (!_power.isOpen && _power.options) {
                                e.preventDefault();
                                e.stopPropagation();
                                if (typeof _power.disableIf == 'function') {
                                    if (!_power.disableIf()) {
                                        PowersController.open(_power);
                                    }
                                } else if (!_power.disableIf) {
                                    PowersController.open(_power);
                                }
                            } else if (_power.action) {
                                scope.$apply(function () {
                                    if (typeof _power.disableIf == 'function') {
                                        if (!_power.disableIf()) {
                                            _power.action();
                                        }
                                    } else if (!_power.disableIf) {
                                        _power.action();
                                    }
                                });

                            }
                        }
                    });

                    if (_power.toggle) {
                        var toggledOption = _.findWhere(_power.options, {key: _power.toggle});
                        if (toggledOption) {
                            scope.selectOption(toggledOption);
                        }
                    }
                }
            };
        }])
    .directive('powers', ['$window', '$timeout',
        function ($window, $timeout) {
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

                    scope.$on('window-resized', function () {
                        setHeight(elSibling);
                    });

                    $timeout(function () {
                        setHeight(elSibling);
                    }, 0);
                },
                controller: 'PowersController'
            }
        }]);