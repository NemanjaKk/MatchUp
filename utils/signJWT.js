const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/components/server.config');

module.exports = obj => {
  return jwt.sign(obj, jwtSecret);
};
