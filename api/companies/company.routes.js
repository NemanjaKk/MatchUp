'use strict';

const controller = require('./company.controller');
const { authentication, companyAuthentication } = require("../../middleware/authentication");
 const upload=require('../../config/services/file-upload');
const singleUpload=upload.single('image');


module.exports = Router => {
  const router = new Router({
    prefix: `/company`,
  });

  router
    .post('/login', controller.login)
    .post('/register', controller.register)
    .get('/findOne/:companyId', controller.getOne)
    .get('/', controller.getAll)
    .use(authentication) //from now on, only authenticated requests!
    .use(companyAuthentication) //from now on, only authenticated companies
    .post('/imageUpload',singleUpload,controller.imageUpload)
    .post('/jobs/:jobId/accept/:studentId', controller.companyAcceptStudent)
    .post('/jobs/:jobId/discard/:studentId', controller.companyDiscardStudent)
    .get('/candidateStudents/:jobId', controller.getCandidatesForJob)
    .post('/profile', controller.update)
    .get('/getAcceptedStudents/:jobId', controller.getAcceptedStudents)
    
  return router;
};
