angular.module('rescour.app')
    .controller('ReportCtrl', ['$scope', 'Property',
        function ($scope, Property) {
            $scope.convertToCSV = function () {
                console.log(Property.convertToCSV($scope.filteredItems));
            }

            $scope.exportPower = {
                icon: 'icon-download-alt',
                float: 'right',
                action: function  () {
                    $scope.convertToCSV();
                }
            }
        }]);