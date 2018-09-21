'use strict';
var _ = require('lodash');

module.exports = function(Device) {
  var app = require('../../server/server');

  Device.validatesPresenceOf('deviceUUID');
  Device.validatesPresenceOf('deviceToken');

  Device.observe('before save', function(ctx, next) {
    var newDevice = ctx.instance;
    if (ctx.isNewInstance) {
      Device.findOne({
        where: {
          deviceUUID: ctx.instance.deviceUUID,
        },
      })
        .then(function(oldDevice) {
          if (!_.isEmpty(oldDevice)) {
            return Device.deleteById(oldDevice.id);
          } else {
            return new Promise(function(resolve) {
              resolve('');
            });
          }
        })
        .then(function() {
          next();
        });
    } else {
      if (ctx.data) ctx.data = _.pick(ctx.data, 'notificationEnabled');
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

  // Device.observe('access', function(ctx, next) {
  //   console.log(ctx);
  //   next();
  // //   var userId = ctx.query.where.userId;
  // //   var id = ctx.query.where.id;
  // //   ctx.query.where = {
  // //     or: [{
  // //       id: id,
  // //       userId: userId,
  // //     },
  // //     {
  // //       deviceUUID: id,
  // //       userId: userId,
  // //     }],
  // //   };
  // //   next();
  // });
};
