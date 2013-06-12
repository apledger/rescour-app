angular.module('rescour.powers', [])
    .factory('Power',
        ['$document', '$window',
            function ($document, $window) {
                var body = $document.find('body');

                function Power(opts, el) {
                    this.title = opts.title || {};
                    this.options = opts.options || {};
                };

                return Power;
            }])
    .controller('PowersController', ['$scope', '$document', function ($scope, $document) {
        var powers = [];

        this.addPower = function (power) {
            powers.push(power);
        }

        this.open = function (power) {
            angular.forEach(powers, function (value, key) {
                if (value.power.isOpen) {
                    $document.unbind('click', value.power.close);
                    value.power.isOpen = false;
                }
            });

            $document.bind('click', power.close);
            power.isOpen = true;
        }
    }])
    .directive('power', ['$document', 'Power', '$compile',
        function ($document, Power, $compile) {
            var menuTpl = '<div>\n    <ul>\n        <li ng-repeat="option in options" ng-click="option.action()">{{option.title}}</li>\n    </ul>\n</div>';
//            var menuTpl = '<div>Menu Element</div>'
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
                            e.preventDefault();
                            e.stopPropagation();
                        }
                        scope.$apply(function () {
                            _power.isOpen = false;
                        });
                        $document.unbind('click');
                    }

                    PowersController.addPower(scope);

//                    console.log(scope.power);

                    element.bind('click', function (e) {
                        if (!_power.isOpen) {
                            e.preventDefault();
                            e.stopPropagation();
                            scope.$apply(function () {
                                PowersController.open(_power);
                            });
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
//                    console.log(elHeight, elParent.height());
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
    }])
//    .directive('powerMenu', ['$location', '$document',
//        function ($location, $document) {
//            var openElement = null, close;
//            return {
//                scope: {
//                    options: '=',
//                    orientation: '@'
//                },
//                restrict: 'C',
//                templateUrl: '/core/powers/template/power-menu.html',
//                link: function (scope, element, attrs) {
////                element.bind('click', function (event) {
////                    if (element.hasClass('open')) {
////                        element.removeClass('open');
////                    } else {
////                        element.addClass('open');
////                    }
////                });
//                    var pAnchor = scope.anchor || 'bottom-left';
//
//                    var $scope = scope.$new();
//
//                    console.log(element.children());
//
//                    scope.$watch(function dropdownTogglePathWatch() {
//                        return $location.path();
//                    }, function dropdownTogglePathWatchAction() {
//                        if (close) {
//                            close();
//                        }
//                    });
//
//                    element.parent().bind('click', function (event) {
//                        event.preventDefault();
//                        event.stopPropagation();
//                    });
//
//                    element.bind('click', function (event) {
//                        event.preventDefault();
//                        event.stopPropagation();
//
//                        var iWasOpen = false;
//
//                        if (openElement) {
//                            iWasOpen = openElement === element;
//                            close();
//                        }
//
//                        if (!iWasOpen) {
//                            element.parent().addClass('expand');
//                            element.addClass('open');
//                            openElement = element;
//                            close = function (event) {
//                                if (event) {
//                                    event.preventDefault();
//                                    event.stopPropagation();
//                                }
//                                $document.unbind('click', close);
//                                element.parent().removeClass('expand');
//                                element.removeClass('open');
//                                close = null;
//                                openElement = null;
//                            };
//
//                            $document.bind('click', close);
//                        }
//
//                        scope.$emit('window-resized');
//                    });
//                    var menuList = element.find('.powers-menu-list');
//                    menuList.bind('click', function (event) {
//                        event.preventDefault();
//                        event.stopPropagation();
//                    });
//                }
//            };
//        }]);