'use strict';

var utils = require('loopback/lib/utils');
var _ = require('lodash');
var app = require('../../server/server');
var apn = require('apn');

module.exports = function(User) {
/*
  ###############
  User - accessTokens
  ##############
*/
  User.disableRemoteMethodByName('prototype.__findById__accessTokens');
  User.disableRemoteMethodByName('prototype.__count__accessTokens');
  User.disableRemoteMethodByName('prototype.__create__accessTokens');
  User.disableRemoteMethodByName('prototype.__delete__accessTokens');
  User.disableRemoteMethodByName('prototype.__destroyById__accessTokens');
  User.disableRemoteMethodByName('prototype.__findById__accessTokens');
  User.disableRemoteMethodByName('prototype.__get__accessTokens');
  User.disableRemoteMethodByName('prototype.__updateById__accessTokens');
/*
  ###############
  User - Model
  ##############
*/
  // User.disableRemoteMethodByName('prototype.updateAttributes');
  // User.disableRemoteMethodByName('prototype.patchAttributes');
  // User.disableRemoteMethodByName('create');
  User.disableRemoteMethodByName('destroyById');
  User.disableRemoteMethodByName('find');
  // User.disableRemoteMethodByName('findById');
  User.disableRemoteMethodByName('verify');
  User.disableRemoteMethodByName('count');
  User.disableRemoteMethodByName('replaceById');
  User.disableRemoteMethodByName('upsert');
  User.disableRemoteMethodByName('updateAll');
  User.disableRemoteMethodByName('findOne');
  User.disableRemoteMethodByName('confirm');
  User.disableRemoteMethodByName('exists');
  User.disableRemoteMethodByName('replace');
  User.disableRemoteMethodByName('createChangeStream');
  User.disableRemoteMethodByName('replaceOrCreate');
  User.disableRemoteMethodByName('upsertWithWhere');
/*
  ###############
  User - votes (hasMany)
  ##############
*/
  User.disableRemoteMethodByName('prototype.__count__votes');
  User.disableRemoteMethodByName('prototype.__delete__votes');
  User.disableRemoteMethodByName('prototype.__create__votes');
  User.disableRemoteMethodByName('prototype.__findById__votes');
  User.disableRemoteMethodByName('prototype.__get__votes');
  User.disableRemoteMethodByName('prototype.__destroyById__votes');
  User.disableRemoteMethodByName('prototype.__updateById__votes');
/*
  ###############
  User - polls (hasMany)
  ##############
*/
  User.disableRemoteMethodByName('prototype.__count__polls');
  User.disableRemoteMethodByName('prototype.__delete__polls');
  User.disableRemoteMethodByName('prototype.__create__polls');
  User.disableRemoteMethodByName('prototype.__findById__polls');
  User.disableRemoteMethodByName('prototype.__get__polls');
  User.disableRemoteMethodByName('prototype.__destroyById__polls');
  User.disableRemoteMethodByName('prototype.__updateById__polls');
/*
  ###############
  User - comments (hasMany)
  ##############
*/
  User.disableRemoteMethodByName('prototype.__count__comments');
  User.disableRemoteMethodByName('prototype.__delete__comments');
  User.disableRemoteMethodByName('prototype.__create__comments');
  User.disableRemoteMethodByName('prototype.__findById__comments');
  User.disableRemoteMethodByName('prototype.__get__comments');
  User.disableRemoteMethodByName('prototype.__destroyById__comments');
  User.disableRemoteMethodByName('prototype.__updateById__comments');
  /*
    ###############
    User - profile (hasOne)
    ##############
  */
  User.disableRemoteMethodByName('prototype.__create__profile');
  // User.disableRemoteMethodByName('prototype.__get__profile');
  User.disableRemoteMethodByName('prototype.__destroy__profile');
  // User.disableRemoteMethodByName('prototype.__update__profile');

  /*
    ###############
    User - devices (hasMany)
    ##############
  */
  User.disableRemoteMethodByName('prototype.__count__devices');
  User.disableRemoteMethodByName('prototype.__delete__devices');
  // User.disableRemoteMethodByName('prototype.__create__devices');
  // User.disableRemoteMethodByName('prototype.__findById__devices');
  User.disableRemoteMethodByName('prototype.__get__devices');
  // User.disableRemoteMethodByName('prototype.__destroyById__devices');
  // User.disableRemoteMethodByName('prototype.__updateById__devices');

  /**
   * Gets user stats
   * @param {string} id user id
   * @param {Function(Error, object)} callback
   */

  User.prototype.stats = function(cb) {
    var Comment = app.models.Comment;
    var Poll = app.models.Poll;
    var Vote = app.models.Vote;
    var stats;

    var user = this;
    var commentCountPromise = Comment.count({
      userId: user.id,
    });

    var pollCountPromise = Poll.count({
      userId: user.id,
    });

    var voteCountPromise = Vote.count({
      userId: user.id,
    });

    var topVoteCountPromise = Vote.count({
      and: [
        {userId: user.id},
        {isTopVote: true},
      ],
    });
    // TODO
    Promise.all([
      commentCountPromise,
      pollCountPromise,
      voteCountPromise,
      topVoteCountPromise])
      .then(function(properties) {
        stats = {
          commentCount: properties[0],
          pollCount: properties[1],
          voteCount: properties[2],
          topVoteCount: properties[3],
        };
        cb(null, stats);
      })
      .catch(function(err) {
        cb(err);
      });
  };

  User.observe('before save', function(ctx, next) {
    var user = ctx.instance || ctx.data;

    var Specialization = app.models.Specialization;
    var TrainingLevel = app.models.TrainingLevel;

    var specialyPromise = Specialization.count({id: user.specializationId});
    var trainingLvlPromise = TrainingLevel.count({id: user.trainingLvlId});

    Promise.all([specialyPromise, trainingLvlPromise])
      .then(function(ret) {
        var specialtyCount = ret[0];
        var trainingLvlCount = ret[1];

        if (specialtyCount < 1) {
          next({
            statusCode: 400,
            name: 'Bad Request',
            message: `specializationId ${user.specializationId} does not exists.`,
          });
        } else if (trainingLvlCount < 1) {
          next({
            statusCode: 400,
            name: 'Bad Request',
            message: `trainingLvlId ${user.trainingLvlId} does not exists.`,
          });
        } else {
          next();
        }
      })
      .catch(function(e) {
        next(e);
      });
  });

  User.observe('after save', function(ctx, next) {
    var user = ctx.instance;
    if (ctx.isNewInstance) {
      user.profile.create({
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName,
        trainingLvlId: user.trainingLvlId,
        specializationId: user.specializationId,
      })
      .then(function(profile) {
        next();
      })
      .catch(function(e) {
        next(e);
      });
    } else {
      next();
    }
  });

  User.prototype.sendDeviceNotification = function(notificationType, data) {
    var user = this;

    return user.devices.find({where: {notificationEnabled: true}})
      .then(function(userDevices) {
        if (_.isEmpty(userDevices)) {
          return Promise.resolve();
        } else {
          console.info('Creating notification for userId:', user.id);

          var userDvcTokens = _.map(userDevices, function(device) {
            return device.deviceToken;
          });
          console.info('Device Token count:', userDvcTokens.length);

          var apnProvider = new apn.Provider({
            token: {
              key: process.env.APN_KEY.replace(/\\n/g, '\n'),
              keyId: process.env.APN_KEY_ID,
              teamId: process.env.APN_TEAM_ID,
            },
            production: process.env.APN_PROD_MODE,
          });

          console.info('Creating payload');
          var payload = createApnNotificationPayload(notificationType, data);

          console.info('Payload:', payload);
          console.info('Sending notification to user device token:', userDvcTokens);
          return apnProvider.send(payload, userDvcTokens);
        }
      })
      .then(function(result) {
        return Promise.resolve();
      })
      .catch(function(err) {
        console.error(err);
      });
  };

  User.beforeRemote('*.__updateById__devices', findByDeviceUUID);
  User.beforeRemote('*.__findById__devices', findByDeviceUUID);
  User.beforeRemote('*.__destroyById__devices', findByDeviceUUID);

  function findByDeviceUUID(ctx, modelInstance, next) {
    var Device = app.models.Device;
    Device.findOne({where:
      {or: [{deviceUUID: ctx.args.fk}, {id: ctx.args.fk}]},
    })
      .then(function(device) {
        if (device) {
          ctx.args.fk = device.id;
        }
        next();
      });
  }

  function createApnNotificationPayload(notificationType, data) {
    var notification = new apn.Notification();
    var notificationExpiry = Math.floor(Date.now() / 1000) + 3600;

    notification.topic = process.env.APN_BUNDLE_ID;
    notification.expiry = notificationExpiry;
    notification.sound = 'ping.aiff';
    notification.payload = {
      pollId: data.pollId.toString(),
    };

    if (notificationType == 'NEW_COMMENT') {
      notification.category = 'NEW_COMMENT';
      notification.alert = {
        title: 'New Comment',
        subtitle: data.text,
      };
    } else if (notificationType == 'POLL_CLOSED') {
      notification.category = 'POLL_CLOSED';
      notification.alert = {
        title: 'Poll Closed',
        subtitle: data.text,
      };
    } else if (notificationType == 'NEW_POLL') {
      notification.category = 'NEW_POLL';
      notification.alert = {
        title: 'New Poll',
        subtitle: data.text,
      };
    }

    return notification;
  }
};
