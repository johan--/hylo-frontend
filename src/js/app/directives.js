var angularModule = angular.module('hyloDirectives', ['ngResource']);

require('./directives/contenteditable')(angularModule);
require('./directives/hylo_post')(angularModule);
require('./directives/socialMedia')(angularModule);
require('./directives/seeMore')(angularModule);
require('./directives/embeddedComments')(angularModule);
require('./directives/masonry')(angularModule);
require('./directives/anguvideo')(angularModule);

angularModule.directive('ngEnter', function() {
  return function(scope, element, attrs) {
    element.bind("keydown keypress", function(event) {
      if (event.which === 13) {
        scope.$apply(function() {
          scope.$eval(attrs.ngEnter);
        });

        event.preventDefault();
      }
    });
  };
}).

directive('scrollClass', function($window) {
  return function(scope, element, attrs) {
    var threshold = parseInt(attrs.scrollClassThreshold),
      className = attrs.scrollClass;

    angular.element($window).bind('scroll', function() {
      if (this.pageYOffset >= threshold && !element.hasClass(className)) {
        element.addClass(className);
        scope.$apply();
      } else if (this.pageYOffset < threshold && element.hasClass(className)) {
        element.removeClass(className);
        scope.$apply();
      }
    });
  }
}).

directive('animateIf', function($animate) {
  return function(scope, element, attrs) {
    scope.$watch(attrs.animateIf, function(val) {
      if (val) {
        $animate.addClass(element, attrs.animation);
      } else {
        $animate.removeClass(element, attrs.animation);
      }
    })
  }
}).

// https://gist.github.com/kirkstrobeck/599664399dbc23968741
directive('autofocus', function ($timeout) {
  return {
    restrict: 'A',
    link: function ($scope, $element) {
      $timeout(function () {
        $element[0].focus();
      });
    }
  };
}).

directive('backImg', [function() {
  function link(scope, element, attrs) {
    scope.$watch(attrs.backImg, function(value) {
      if (!value) return;
      var style;
      if (attrs.backImgGradient) {
        style = format('%s, url(%s)', attrs.backImgGradient, value);
      } else {
        style = format('url(%s)', value);
      }
      element.css({'background-image': style});
    });
  }

  return {
    link: link
  };
}]).

directive('hyloUnique', ['$http', function ($http) {
  return {
    require: 'ngModel',
    link: function (scope, elem, attrs, ctrl) {
      elem.on('blur', function (evt) {
        scope.$apply(function () {
          var extraData = _.isEmpty(attrs.hyloUniqueExtra) ? null : attrs.hyloUniqueExtra;

          if (elem.val() == '') return;

          // FIXME don't use $http directly
          $http({
            method: 'POST',
            url: '/noo/community/validate',
            data: {
              column: attrs.hyloUnique,
              constraint: 'unique',
              value: elem.val()
            }
          })
          .success(function(data, status, headers, config) {
            ctrl.$setValidity('unique', data.unique);
          });
        });
      });
    }
  }
}
]).

directive('forceLowercase', function() {
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, modelCtrl) {
      var lowercase = function(inputValue) {
        if(inputValue == undefined) inputValue = '';
        var lowercased = inputValue.toLowerCase();
        if(lowercased !== inputValue) {
          modelCtrl.$setViewValue(lowercased);
          modelCtrl.$render();
        }
        return lowercased;
      }
      modelCtrl.$parsers.push(lowercase);
      lowercase(scope[attrs.ngModel]);  // capitalize initial value
    }
  };
}).

directive("loadingIndicator", function() {
  return {
    template: '<div class="spinner"><div class="double-bounce1"></div><div class="double-bounce2"></div></div>'
  };
});