'use strict';
var _ = require('lodash');

module.exports = function(Device) {
  var app = require('../../server/server');

  Device.observe('before save', function(ctx, next) {
    var newDevice = ctx.instance;
    if (ctx.isNewInstance) {
      Device.findOne({
        where: {
          device: newDevice.appleDeviceId,
        },
      })
      .then(function(device) {
        if (device) {
          next({
            statusCode: 400,
            name: 'Bad Request',
            message: 'deviceId `' + device.appleDeviceId + '` already exists for user `' + device.userId + '`.',
          });
        } else {
          next();
        }
      });
    } else {
      if (ctx.data) ctx.data = _.omit(ctx.pick, 'notificationEnabled');
      if (_.isEmpty(ctx.data)) {
        next({
          statusCode: 400,
          name: 'bad request',
          message: 'no changes to apply.',
        });
      } else {
        next();
      }
    }
  });

  Device.observe('access', function(ctx, next) {
    var userId = ctx.query.where.userId;
    var id = ctx.query.where.id;
    ctx.query.where = {
      or: [{
        id: id,
        userId: userId,
      },
      {
        appleDeviceId: id,
        userId: userId,
      }],
    };
    next();
  });
};
