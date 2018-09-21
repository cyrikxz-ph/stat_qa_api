'use strict';

var fs = require('fs');

module.exports = function(server) {
  process.env.APN_KEY = fs.readFileSync(process.env.APN_KEY_PATH).toString();
};
