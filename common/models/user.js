'use strict';

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


  // # Add Options to Poll - Relation
  User.observe('after save', function(ctx, next) {
    var user = ctx.instance;
    if (ctx.isNewInstance) {
      user.profile.create({
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName,
      })
      .then(function(profile) {
        console.log(profile);
        next();
      })
      .catch(function(e) {
        console.error(e);
        next(e);
      });
    } else {
      // TODO: poll update
      next();
    }
  });
};
