var handleError = function(err, $scope, $analytics) {
  var msg = err.data, email = $scope.user.email;
  if (!msg) {
    $scope.signupError = "Couldn't sign up. Please try again.";
    Rollbar.error("Signup failure", {email: $scope.user.email});
    $analytics.eventTrack('Signup failure', {email: email, cause: 'unknown'});
    return;
  }

  if (msg === 'bad code') {
    $scope.signupError = 'The invitation code you entered is not valid.';
    $analytics.eventTrack('Signup failure', {email: email, cause: 'bad invitation code'});

  } else if (msg.match(/Key.*already exists/)) {
    var match = msg.match(/Key \((.*)\)=\((.*)\) already exists/),
      key = match[1], value = match[2];

    $scope.signupError = format('The %s "%s" is already in use. Try logging in instead?', key, value);
    $analytics.eventTrack('Signup failure', {email: email, cause: 'duplicate ' + key});

  } else {
    $scope.signupError = msg;
    $analytics.eventTrack('Signup failure', {email: email, cause: msg});
  }
};

var controller = function($scope, $analytics, User, Community, ThirdPartyAuth, Invitation) {
  $analytics.eventTrack('Signup start');
  $scope.user = {};

  $scope.invitation = Invitation.storedData();

  $scope.submit = function(form) {
    form.submitted = true;
    $scope.signupError = null;
    if (form.$invalid) return;

    User.signup(_.merge({}, $scope.user, {login: true}))
    .$promise.then(function(user) {
      $analytics.eventTrack('Signup success', {provider: 'password'});
      $scope.$state.go('onboarding.start');
    }, function(err) {
      handleError(err, $scope, $analytics);
    });
  };

  $scope.validateCode = _.debounce(function(form) {
    if ($scope.invitation) return;

    $scope.authStarted = true;
    $scope.validationDone = false;
    if (!_.isEmpty(form.code.$error)) return;

    Community.validate({
      column: 'beta_access_code',
      constraint: 'exists',
      value: form.code.$viewValue,
      store_value: true
    }, function(resp) {
      if (resp.exists) {
        $scope.isCodeValid = true;
        $scope.signupError = null;
      } else {
        $scope.isCodeValid = false;
      }
      $scope.validationDone = true;
    });
  }, 250);

  $scope.useThirdPartyAuth = function(service, form) {
    $scope.authStarted = true;
    if (form.code) {
      if (!_.isEmpty(form.code.$error)) return;
      if (!$scope.isCodeValid) {
        handleError({data: 'bad code'}, $scope, $analytics);
        return;
      }
    }
    $scope.serviceUsed = service;
    $scope.authDialog = ThirdPartyAuth.openPopup(service);
  };

  $scope.finishThirdPartyAuth = function(error) {
    $scope.$apply(function() {
      $scope.authDialog.close();
      if (error) {
        handleError({data: error}, $scope, $analytics);
      } else {
        $analytics.eventTrack('Signup success', {provider: $scope.serviceUsed});
        $scope.$state.go('onboarding.start');
      }
    });
  };

};

module.exports = function(angularModule) {
  angularModule.controller('SignupCtrl', controller);
};