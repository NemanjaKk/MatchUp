'use strict';

const controller = require('./countries.controller');

module.exports = Router => {
  const router = new Router({
    prefix: `/countries`,
  });

  router
    .get('/findOne/:countryId', controller.getOne)
    .get('/', controller.getAll)

  return router;
};
