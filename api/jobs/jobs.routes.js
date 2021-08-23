'use strict';

const controller = require('./jobs.controller');
const { authentication, companyAuthentication } = require("../../middleware/authentication");

module.exports = Router => {
  const router = new Router({
    prefix: `/jobs`,
  });

  router
    .get('/findOne/:jobId', controller.getOne)
    .get('/', controller.getAll)
    .use(authentication) //from now on, only authenticated requests!
    .use(companyAuthentication) //from now on, only authenticated companies
    .post('/', controller.createOne)
    .post('/update', controller.update)
    .post('/update/:jobId/removeReq/:skillId', controller.removeRequiredSkill)
    .post('/update/:jobId/addReq/:skillId', controller.addRequiredSkill)
    .post('/update/:jobId/removeOpt/:skillId', controller.removeOptionalSkill)
    .post('/update/:jobId/addOpt/:skillId', controller.addOptionalSkill)
    .post('/delete/:jobId', controller.deleteJob);
  return router;
};
