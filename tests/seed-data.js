'use strict';

var app = require('../server/server');
var Poll = app.models.poll;
var Comment = app.models.comment;
var Vote = app.models.vote;
var User = app.models.user;
var Role = app.models.Role;
var AccessToken = app.models.AccessToken;

var initUsers = [
  {
    email: 'user1@example.com',
    password: 'password',
  },
  {
    email: 'user2@example.com',
    password: 'password',
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
    comment: 'This is a comment',
  },
  {
    comment: 'This is another comment',
  },
];

var populatePolls = function(done) {
  Poll.destroyAll()
    .then(function() {
      return User.findOne({where: {email: initUsers[0].email}})
        .then(function(user) {
          return user;
        });
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
  Poll.destroyAll()
    .then(function() {
      return Comment.destroyAll();
    })
    .then(function() {
      return User.findOne({where: {email: initUsers[0].email}})
        .then(function(user) {
          return user;
        });
    })
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
      return User.create(initUsers)
              .then(function(users) {
                return users;
              });
    })
    .then(function(users) {
      // users.forEach(function(user, index) {
      //   initUsers[index].id = user.id;
      // });
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
};
