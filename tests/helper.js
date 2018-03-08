'use strict';

var expect = require('expect');

var standardPollPropertiesResponse = function(poll) {
  expect(poll).toHaveProperty('id');
  expect(poll).toHaveProperty('question');
  expect(poll).toHaveProperty('isOpen');
  expect(poll).toHaveProperty('openTime');
  expect(poll).toHaveProperty('_options');
  poll._options.forEach(function(option) {
    expect(option).toHaveProperty('id');
    expect(option).toHaveProperty('description');
    expect(option).toHaveProperty('voteCount');
  });
  expect(poll).toHaveProperty('totalVotes');
  expect(poll).toHaveProperty('totalComments');
  expect(poll).toHaveProperty('createdAt');
  expect(poll).toHaveProperty('updatedAt');
};

module.exports = {
  standardPollPropertiesResponse,
};
