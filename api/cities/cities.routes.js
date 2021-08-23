'use strict';

const controller = require('./cities.controller');

module.exports = Router => {
  const router = new Router({
    prefix: `/cities`,
  });

  router
    .get('/findOne/:cityId', controller.getOne)
    .get('/', controller.getAll)

  return router;
};
