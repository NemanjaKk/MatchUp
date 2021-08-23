const r2 = require("r2");
const { getApplications, getNotifications, markApplicationAsSeen } = require("../../api/students/student.controller");
const { Student, Application, Company, Job } = require('../../models').models;
const Sequelize = require('../../models/db');
const signJWT = require("../../utils/signJWT");
const cleanDatabase = require('../../utils/cleanDatabase.util');

const noop = () => {};
const sequelize = new Sequelize().getInstance();

// we need a reference to the objects that we put in the database so that we can use them in the tests
const o = {};

// first thing, Fill the database with all the necessary stuff
beforeAll(async () => {
  o.student = await Student.create({ firstName: 'Pippo', lastName: 'Pluto', email: "student_mark@applicationTest.c" });
  o.studentNotApplied = await Student.create({ firstName: 'Pippo', lastName: 'Pluto', email: "student_mark@studentNotApplied_mark@applicationTest.c.c" });
  o.student1 = await Student.create({ firstName: 'Pippo', lastName: 'Pluto', email: "student1_mark@applicationTest.c" });
  o.studentAPI = await Student.create({ firstName: 'Pippo', lastName: 'Pluto', email: "studentAPI_mark@applicationTest.c" });
  o.company = await Company.create({name: "TestCompany", email: "company_mark@pippo.com"});
  o.company1 = await Company.create({name: "TestCompany1", email: "company1_mark@pippo.com"});
  o.companyAlreadyShown = await Company.create({name: "TestCompany12", email: "company12_mark@pippo.com"});
  o.job = await Job.create({CompanyId: o.company.id});
  o.jobWithAppDeclined = await Job.create({CompanyId: o.company.id, name: "1"});
  o.jobWithAppAccepted = await Job.create({CompanyId: o.company.id, name: "2"});
  o.jobWithAppAccepted1 = await Job.create({CompanyId: o.company1.id, name: "3"});
  o.jobAlreadyShown = await Job.create({CompanyId: o.company1.id, name: "4"});
  o.jobStudent1 = await Job.create({CompanyId: o.company.id});
  o.application = await Application.create({StudentId: o.student.id, JobId: o.job.id});
  o.applicationDeclined = await Application.create({StudentId: o.student.id, JobId: o.jobWithAppDeclined.id, declined: true});
  o.applicationAccepted = await Application.create({StudentId: o.student.id, JobId: o.jobWithAppAccepted.id, declined: false, alreadyNotified: false});
  o.applicationAccepted1 = await Application.create({StudentId: o.student.id, JobId: o.jobWithAppAccepted1.id, declined: false, alreadyNotified: false});
  o.applicationAlreadyShown = await Application.create({StudentId: o.student.id, JobId: o.jobAlreadyShown.id, declined: false, alreadyNotified: true});

});

afterAll(cleanDatabase.bind(null, o, sequelize));

// unit tests - here you can include directly the middleware so you skip authorization!
test("If we try to mark an application of another student we get an error", async function(){
    const {studentNotApplied, applicationAccepted} = o;
    const ctx = {params: {applicationId: applicationAccepted.id}, user: studentNotApplied};   
    expect((await Application.findByPk(applicationAccepted.id)).alreadyNotified).toBe(false) 
    try{
      await markApplicationAsSeen(ctx, noop);
    }catch(e){
      expect(e.status).toBe(400);
    }
    expect((await Application.findByPk(applicationAccepted.id)).alreadyNotified).toBe(false)//verify that the value does not change even if a 404 message was returned

});

test("If we try to mark an application of another student we get an error", async function(){
  const {studentNotApplied} = o;
  const ctx = {params: {applicationId: undefined}, user: studentNotApplied};
  try{
    await markApplicationAsSeen(ctx, noop);
  }catch(e){
    expect(e.status).toBe(400);
  }
});


test('If markApplicationAsSeen is called on an application, that application has "alreadyNodified = true" ', async function() {
  const { student, applicationAccepted1 } = o;
  const ctx = {params: {applicationId: applicationAccepted1.id}, user: student};
  expect((await Application.findByPk(applicationAccepted1.id)).alreadyNotified).toBe(false)

  await markApplicationAsSeen(ctx, noop);

  expect((await Application.findByPk(applicationAccepted1.id)).alreadyNotified).toBe(true)
});

//api test - here you can test the API with an actual HTTP call, a more realistic test
test("MarkApplicationAsSeen actually modifies the 'alreadyNotified' - API version", async function (){
  const { student, applicationAccepted} = o;
  const studentId = student.id;
  
  expect((await Application.findByPk(applicationAccepted.id)).alreadyNotified).toBe(false) //verifies that the value actually changes (the value could be 'true' from the beginning)

  const jwt = signJWT({id: studentId, userType: "student"});

  const url = `http://localhost:3000/api/v1/student/jobs/markApplicationAsSeen/${applicationAccepted.id}`;
  const response = await r2.post(url, {headers: {authorization: "Bearer " + jwt}}).response;
  
  expect((await Application.findByPk(applicationAccepted.id)).alreadyNotified).toBe(true)  
  expect(response.status).toBe(201)  
});   