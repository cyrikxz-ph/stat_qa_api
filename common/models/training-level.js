'use strict';

module.exports = function(Traininglevel) {
  Traininglevel.disableRemoteMethodByName('prototype.updateAttributes');
  Traininglevel.disableRemoteMethodByName('prototype.patchAttributes');
  Traininglevel.disableRemoteMethodByName('create');
  Traininglevel.disableRemoteMethodByName('destroyById');
  // Traininglevel.disableRemoteMethodByName('find');
  Traininglevel.disableRemoteMethodByName('findById');
  Traininglevel.disableRemoteMethodByName('count');
  Traininglevel.disableRemoteMethodByName('replaceById');
  Traininglevel.disableRemoteMethodByName('upsert');
  Traininglevel.disableRemoteMethodByName('updateAll');
  Traininglevel.disableRemoteMethodByName('findOne');
  Traininglevel.disableRemoteMethodByName('confirm');
  Traininglevel.disableRemoteMethodByName('exists');
  Traininglevel.disableRemoteMethodByName('replace');
  Traininglevel.disableRemoteMethodByName('createChangeStream');
  Traininglevel.disableRemoteMethodByName('replaceOrCreate');
  Traininglevel.disableRemoteMethodByName('upsertWithWhere');
};
