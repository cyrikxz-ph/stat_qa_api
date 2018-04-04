'use strict';

var uuidv1 = require('uuid/v1');

module.exports = function(Notification) {
  var app = require('../../server/server');
  var env = process.env.NODE_ENV || 'development';

  Notification.observe('before save', function(ctx, next) {
    var Sns = app.models.Sns;

    var notification = ctx.instance;
    var snsTopicName = '';

      // # Create AWS SNS Comment Notification TopicARN
    if (notification.notificationType === 'COMMENT_NOTIFICATION') {
      snsTopicName = `${env}-comment-notification-${uuidv1()}`;
    } else if (notification.notificationType === 'POLL_NOTIFICATION') {
      snsTopicName = `${env}-poll-notification-${uuidv1()}`;
    }

    if (env !== 'test') {
      Sns.createTopic({
        Name: snsTopicName,
      }, function(err, data) {
        if (err) {
          notification.success = false;
        } else {
          notification.awsSnsTopicArn = data.TopicArn;
        }
        next();
      });
    } else {
      next();
    }
  });
};
