'use strict';

const controller = require('./ping.controller');

module.exports = Router => {
  const router = new Router({
    prefix: `/ping`,
  });

  router
    .get('/', controller.ping)

  return router;
};
