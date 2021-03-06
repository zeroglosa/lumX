/* global angular */
/* global moment */
/* global navigator */
'use strict'; // jshint ignore:line


angular.module('lumx.date-picker', [])
    .controller('lxDatePickerController', ['$scope', '$timeout', '$window', function($scope, $timeout, $window)
    {
        var self = this,
            activeLocale,
            $datePicker,
            $datePickerFilter,
            $datePickerContainer,
            $computedWindow;

	    var dateFormat = 'LL';
	    if (typeof $scope.dateFormat !== 'undefined') {
		    dateFormat = $scope.dateFormat;
	    }

        $scope.ctrlData = {
            isOpen: false
        };

        this.init = function(element, locale)
        {
            $datePicker = element.find('.lx-date-picker');
            $datePickerContainer = element;
            $computedWindow = angular.element($window);

            self.build(locale, false);
        };

        this.build = function(locale, isNewModel)
        {
            if (locale === activeLocale && !isNewModel)
            {
                return;
            }

            activeLocale = locale;

            moment.locale(activeLocale);

            if (angular.isDefined($scope.model))
            {
                $scope.selected = {
                    model: moment($scope.model).format(dateFormat),
                    date: $scope.model
                };

                $scope.activeDate = moment($scope.model);
            }
            else
            {
                $scope.selected = {
                    model: undefined,
                    date: new Date()
                };

                $scope.activeDate = moment();
            }

            $scope.moment = moment;

            $scope.days = [];
            $scope.daysOfWeek = [moment.weekdaysMin(1), moment.weekdaysMin(2), moment.weekdaysMin(3), moment.weekdaysMin(4), moment.weekdaysMin(5), moment.weekdaysMin(6), moment.weekdaysMin(0)];

            $scope.years = [];

            for (var y = moment().year() - 100; y <= moment().year() + 100; y++)
            {
                $scope.years.push(y);
            }

            generateCalendar();
        };

        $scope.previousMonth = function()
        {
            $scope.activeDate = $scope.activeDate.subtract(1, 'month');
            generateCalendar();
        };

        $scope.nextMonth = function()
        {
            $scope.activeDate = $scope.activeDate.add(1, 'month');
            generateCalendar();
        };

        $scope.select = function(day)
        {
            $scope.selected = {
                model: day.format(dateFormat),
                date: day.toDate()
            };

            $scope.model = day.toDate();

            generateCalendar();
        };

        $scope.selectYear = function(year)
        {
            $scope.yearSelection = false;

            $scope.selected.model = moment($scope.selected.date).year(year).format(dateFormat);
            $scope.selected.date = moment($scope.selected.date).year(year).toDate();
            $scope.model = moment($scope.selected.date).toDate();
            $scope.activeDate = $scope.activeDate.add(year - $scope.activeDate.year(), 'year');

            generateCalendar();
        };

        $scope.openPicker = function()
        {
            if ($scope.ctrlData.isOpen)
            {
                return;
            }

            $scope.ctrlData.isOpen = true;

            $timeout(function()
            {
                $scope.yearSelection = false;

                $datePickerFilter = angular.element('<div/>', {
                    class: 'lx-date-filter'
                });

                $datePickerFilter
                    .appendTo('body')
                    .on('click', function()
                    {
                        $scope.closePicker();
                    });

                $datePicker
                    .appendTo('body')
                    .show();

                $timeout(function()
                {
                    $datePickerFilter.addClass('lx-date-filter--is-shown');
                    $datePicker.addClass('lx-date-picker--is-shown');
                }, 100);
            });
        };

        $scope.closePicker = function()
        {
            if (!$scope.ctrlData.isOpen)
            {
                return;
            }

            $datePickerFilter.removeClass('lx-date-filter--is-shown');
            $datePicker.removeClass('lx-date-picker--is-shown');

            $computedWindow.off('resize');

            $timeout(function()
            {
                $datePickerFilter.remove();

                $datePicker
                    .hide()
                    .appendTo($datePickerContainer);

                $scope.ctrlData.isOpen = false;
            }, 600);
        };

        $scope.displayYearSelection = function()
        {
            $scope.yearSelection = true;

            $timeout(function()
            {
                var $yearSelector = $datePicker.find('.lx-date-picker__year-selector');
                var $activeYear = $yearSelector.find('.lx-date-picker__year--is-active');
                $yearSelector.scrollTop($yearSelector.scrollTop() + $activeYear.position().top - $yearSelector.height()/2 + $activeYear.height()/2);
            });
        };

        $scope.clearDate = function()
        {
            $scope.model = undefined;
        };

        function generateCalendar()
        {
            var days = [],
                previousDay = angular.copy($scope.activeDate).date(0),
                firstDayOfMonth = angular.copy($scope.activeDate).date(1),
                lastDayOfMonth = angular.copy(firstDayOfMonth).endOf('month'),
                maxDays = angular.copy(lastDayOfMonth).date();

            $scope.emptyFirstDays = [];

            for (var i = firstDayOfMonth.day() === 0 ? 6 : firstDayOfMonth.day() - 1; i > 0; i--)
            {
                $scope.emptyFirstDays.push({});
            }

            for (var j = 0; j < maxDays; j++)
            {
                var date = angular.copy(previousDay.add(1, 'days'));

                date.selected = angular.isDefined($scope.selected.model) && date.isSame($scope.selected.date, 'day');
                date.today = date.isSame(moment(), 'day');

                days.push(date);
            }

            $scope.emptyLastDays = [];

            for (var k = 7 - (lastDayOfMonth.day() === 0 ? 7 : lastDayOfMonth.day()); k > 0; k--)
            {
                $scope.emptyLastDays.push({});
            }

            $scope.days = days;
        }
    }])
    .directive('lxDatePicker', function()
    {
        return {
            restrict: 'AE',
            controller: 'lxDatePickerController',
            scope: {
                model: '=',
                label: '@',
                fixedLabel: '&',
                allowClear: '@',
                icon: '@',
                dateFormat: '@'
            },
            templateUrl: 'date-picker.html',
            link: function(scope, element, attrs, ctrl)
            {
                ctrl.init(element, checkLocale(attrs.locale));

                attrs.$observe('locale', function()
                {
                    ctrl.build(checkLocale(attrs.locale), false);
                });

                scope.$watch('model', function()
                {
                    ctrl.build(checkLocale(attrs.locale), true);
                });

                attrs.$observe('allowClear', function(newValue)
                {
                    scope.allowClear = !!(angular.isDefined(newValue) && newValue === 'true');
                });

                function checkLocale(locale)
                {
                    if (!locale)
                    {
                        return (navigator.language !== null ? navigator.language : navigator.browserLanguage).split("_")[0].split("-")[0] || 'en';
                    }

                    return locale;
                }
            }
        };
    });
