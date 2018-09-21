'use strict';

module.exports = function(server) {
  // Install a `/` route that returns server status
  // var morgan = require('morgan');
  var router = server.loopback.Router();
  router.get('/', server.loopback.status());
  server.use(router);
  // server.use(morgan('combined'));
};
