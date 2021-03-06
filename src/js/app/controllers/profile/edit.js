var filepickerUpload = require('../../services/filepickerUpload');

var controller = function($scope, $analytics, currentUser, growl, onboarding) {
  var user = $scope.user = currentUser,
    editData = $scope.editData = _.pick(user, [
      'bio', 'work', 'intention', 'extra_info', 'avatar_url', 'banner_url',
      'skills', 'organizations', 'phones', 'emails', 'websites',
      'twitter_name', 'linkedin_url', 'facebook_url'
    ]),
    edited = {},
    bio = editData.bio;

  $scope.save = function() {
    if (editData.banner_url === require('../../services/defaultUserBanner')) {
      editData.banner_url = null;
    }

    var saveData = _.clone(editData);

    if (saveData.bio != bio) $analytics.eventTrack('My Profile: Updated Bio');

    if (!edited.skills) delete saveData.skills;
    else $analytics.eventTrack('My Profile: Updated Skills');

    if (!edited.organizations) delete saveData.organizations;
    else $analytics.eventTrack('My Profile: Updated Affiliations');

    user.update(saveData, function() {
      _.extend(user, saveData);
      $analytics.eventTrack('My Profile: Saved Changes');

      if (onboarding && onboarding.currentStep() === 'profile') {
        onboarding.goNext();
      } else {
        $scope.cancel();
      }

    });
  };

  $scope.cancel = function() {
    $scope.$state.go('profile.about', {id: user.id});
  };

  $scope.add = function(event, type) {
    if (event.which == 13) {
      if (!_.contains(editData[type], event.target.value))
        editData[type].unshift(event.target.value);

      event.target.value = '';
      edited[type] = true;
      $analytics.eventTrack('My Profile: Edit: Add to Profile', {item_type: type});
    }
    return true;
  };

  $scope.remove = function(value, type) {
    editData[type].splice(editData[type].indexOf(value), 1);
    edited[type] = true;
  };

  var imageChangeFn = function(opts) {
    return function() {
      filepickerUpload({
        path: opts.path,
        convert: opts.convert,
        success: function(url) {
          $scope.$apply(function() {
            editData[opts.fieldName] = url;
            $analytics.eventTrack('Profile: Changed ' + opts.humanName, {user_id: user.id});
          });
        },
        failure: function(error) {
          if (error.code != 101) {
            $scope.$apply(function() {
              growl.addErrorMessage('An error occurred while uploading the image. Please try again.');
              $analytics.eventTrack('Profile: Failed to Change ' + opts.humanName, {user_id: user.id});
            });
          }
        }
      });
    };
  };

  $scope.changeAvatar = imageChangeFn({
    fieldName: 'avatar_url',
    humanName: 'Icon',
    path: 'thumb',
    convert: {width: 200, height: 200, fit: 'clip', rotate: "exif"}
  });

  $scope.changeBanner = imageChangeFn({
    fieldName: 'banner_url',
    humanName: 'Banner',
    path: 'userBanner',
    convert: {width: 1600, format: 'jpg', fit: 'max', rotate: "exif"}
  });

  $scope.changeTwitter = function() {
    var response = prompt(
      'Enter your Twitter username, or leave blank:',
      editData.twitter_name
    );

    editData.twitter_name = response;

    if (response) {
      $analytics.eventTrack('My Profile: Edit: Add Social Media Link to Profile', {provider: 'Twitter'});
    }
  };

  $scope.changeFacebook = function() {
    if (editData.facebook_url) {
      if (confirm('Choose OK to remove your Facebook information.')) {
        editData.facebook_url = null;
        $analytics.eventTrack('My Profile: Edit: Remove Social Media Link from Profile', {provider: 'Facebook'});
      }
    } else {
      FB.login(function() {
        FB.api('/me', function(resp) {
          // TODO store linked account
          $scope.$apply(function() {
            editData.facebook_url = resp.link;
            $analytics.eventTrack('My Profile: Edit: Add Social Media Link to Profile', {provider: 'Facebook'});
          });
        })
      })
    }
  };

  $scope.changeLinkedin = function() {
    if (editData.linkedin_url) {
      if (confirm('Choose OK to remove your LinkedIn information.')) {
        editData.linkedin_url = null;
        $analytics.eventTrack('My Profile: Edit: Remove Social Media Link from Profile', {provider: 'LinkedIn'});

      }
    } else {
      var left = document.documentElement.clientWidth/2 - 200;
      $scope.linkedinDialog = window.open('/noo/linkedin/authorize', 'linkedinAuth',
        'width=400, height=625, titlebar=no, toolbar=no, menubar=no, left=' + left);
    }
  };

  $scope.finishLinkedinChange = function(url) {
    $scope.$apply(function() {
      editData.linkedin_url = url;
      $scope.linkedinDialog.close();
      $analytics.eventTrack('My Profile: Edit: Add Social Media Link to Profile', {provider: 'LinkedIn'});
    });
  };
};

module.exports = function(angularModule) {
  angularModule.controller('ProfileEditCtrl', controller);
};
