'use strict';
var uuidv1 = require('uuid/v1');

module.exports = function(Specialization) {
  var app = require('../../server/server');
  Specialization.disableRemoteMethodByName('prototype.updateAttributes');
  Specialization.disableRemoteMethodByName('prototype.patchAttributes');
  Specialization.disableRemoteMethodByName('create');
  Specialization.disableRemoteMethodByName('destroyById');
  // Specialization.disableRemoteMethodByName('find');
  Specialization.disableRemoteMethodByName('findById');
  Specialization.disableRemoteMethodByName('count');
  Specialization.disableRemoteMethodByName('replaceById');
  Specialization.disableRemoteMethodByName('upsert');
  Specialization.disableRemoteMethodByName('updateAll');
  Specialization.disableRemoteMethodByName('findOne');
  Specialization.disableRemoteMethodByName('confirm');
  Specialization.disableRemoteMethodByName('exists');
  Specialization.disableRemoteMethodByName('replace');
  Specialization.disableRemoteMethodByName('createChangeStream');
  Specialization.disableRemoteMethodByName('replaceOrCreate');
  Specialization.disableRemoteMethodByName('upsertWithWhere');

  /*
  ###############
  Specialization - Polls (hasMany)
  ##############
  */
  Specialization.disableRemoteMethodByName('prototype.__count__polls');
  Specialization.disableRemoteMethodByName('prototype.__delete__polls');
  Specialization.disableRemoteMethodByName('prototype.__create__polls');
  Specialization.disableRemoteMethodByName('prototype.__findById__polls');
  Specialization.disableRemoteMethodByName('prototype.__get__polls');
  Specialization.disableRemoteMethodByName('prototype.__destroyById__polls');
  Specialization.disableRemoteMethodByName('prototype.__updateById__polls');

  Specialization.observe('after save', function(ctx, next) {
    var specialization = ctx.instance || ctx.data;
    var Notification = app.models.Notification;

    if (ctx.isNewInstance) {
      // # Create Notification Reference
      Notification.create({
        notificationType: 'POLL_NOTIFICATION',
        referenceId: specialization.id,
      });
    }
    next();
  });
};
