'use strict';

const controller = require('./skills.controller');

module.exports = Router => {
  const router = new Router({
    prefix: `/skills`,
  });

  router
    .get('/getOne/:skillId', controller.getOne)
    .get('/findByCategory/:categoryId', controller.findByCategory)
    .get('/getAllCategories', controller.getAllCategories)
    .get('/', controller.getAll)
    .get('/search/:name', controller.search)
  return router;
};
