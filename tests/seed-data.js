'use strict';

var faker = require('faker');
var app = require('../server/server');
var Poll = app.models.poll;
var Comment = app.models.comment;
var Vote = app.models.vote;
var Option = app.models.option;
var User = app.models.user;
var Profile = app.models.profile;
var Role = app.models.Role;
var AccessToken = app.models.AccessToken;

var initUsers = [
  {
    email: 'user1@example.com',
    password: 'password',
    firstName: 'Aleson Kelvin',
    lastName: 'Llanes',
    middleName: 'A',
    speciality: 'Internal Medicine',
    trainingLevel: 'Resident Doctor',
  },
  {
    email: 'user2@example.com',
    password: 'password',
    firstName: 'Zaldy Bernabe',
    lastName: 'Bughaw',
    middleName: 'N',
    speciality: 'Surgeon',
    trainingLevel: 'Resident Doctor',
  },
  {
    email: 'user3@example.com',
    password: 'password',
    firstName: 'Rommel',
    lastName: 'Rosales',
    middleName: 'N',
    speciality: 'MidWife',
    trainingLevel: 'Resident Doctor',
  },
];

var initPolls = [
  {
    question: 'Poll Question 1',
    openTime: 3600,
    userId: null,
    _options: [
      {
        description: 'Yes',
      },
      {
        description: 'No',
      },
    ],
  },
  {
    question: 'Poll Question 2',
    userId: null,
    _options: [
      {
        description: 'Yes',
      },
      {
        description: 'No',
      },
      {
        description: 'Maybe',
      },
    ],
  },
  {
    question: 'Poll Question 3',
    openTime: 172800,
    userId: null,
    _options: [
      {
        description: 'Yes',
      },
    ],
  },
];

var initComment = [
  {
    comment: faker.lorem.sentence(),
  },
  {
    comment: 'This is another comment',
  },
];

var randomNumber = function(max) {
  return Math.floor(Math.random() * Math.floor(max));
};

var populatePolls = function(done) {
  User.findOne({where: {email: initUsers[0].email}})
    .then(function(user) {
      return user;
    })
    .then(function(user) {
      Promise.all(initPolls.map(function(poll) {
        poll.userId = user.id;
        return Poll.create(poll);
      }))
      .then(function() {
        done();
      }).catch(function(err) {
        done(err);
      });
    })
    .catch(function(err) {
      done(err);
    });
};

var populateComment = function(done) {
  User.findOne({where: {email: initUsers[0].email}})
    .then(function(user) {
      var newPoll = initPolls[0];
      return user.polls.create(initPolls[0])
        .then(function(poll) {
          return poll;
        });
    })
    .then(function(poll) {
      Promise.all(initComment.map(function(comment) {
        var newComment = comment;
        newComment.userId = poll.userId;
        return poll.comments.create(newComment);
      }))
      .then(function() {
        done();
      });
    })
    .catch(function(err) {
      done(err);
    });
};

var populateUser = function(done) {
  User.destroyAll()
    .then(function() {
      return Role.destroyAll();
    })
    .then(function() {
      return Profile.destroyAll();
    })
    .then(function() {
      return User.create(initUsers);
    })
    .then(function(users) {
      done();
    })
    .catch(function(err) {
      done(err);
    });
};

var populateVote = function(done) {
  var loggedUser = {};
  User.findOne({where: {email: initUsers[0].email}})
    .then(function(user) {
      loggedUser = user;
      return Promise.all(initPolls.map(function(polls) {
        return user.polls.create(polls)
          .then(function(poll) {
            return poll;
          });
      }));
    })
    .then(function(polls) {
      var pollToVote = polls.find(function(poll) {
        return poll.question === initPolls[0].question;
      });

      return pollToVote.options.findOne({
        where: {
          description: initPolls[0]._options[0].description,
        },
      })
      .then(function(option) {
        return option;
      });
    })
    .then(function(option) {
      return Vote.create({
        pollId: option.pollId,
        userId: loggedUser.id,
        optionId: option.id,
      });
    })
    .then(function(vote) {
      // console.log(vote);
      done();
    })
    .catch(function(err) {
      done(err);
    });
};

module.exports = {
  initPolls,
  initComment,
  initUsers,
  populatePolls,
  populateComment,
  populateUser,
  populateVote,
};
