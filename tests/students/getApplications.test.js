const r2 = require("r2");
const { getApplications } = require("../../api/students/student.controller");
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
  o.student = await Student.create({ firstName: 'Pippo', lastName: 'Pluto', email: "student@applicationTest.c" });
  o.studentNotApplied = await Student.create({ firstName: 'Pippo', lastName: 'Pluto', email: "studentNotApplied@applicationTest.c" });
  o.student1 = await Student.create({ firstName: 'Pippo', lastName: 'Pluto', email: "student1@applicationTest.c" });
  o.studentAPI = await Student.create({ firstName: 'Pippo', lastName: 'Pluto', email: "studentAPI@applicationTest.c" });
  o.company = await Company.create({email: "company@applicationTest.com"});
  o.job = await Job.create({CompanyId: o.company.id});
  o.jobWithAppDeclined = await Job.create({CompanyId: o.company.id});
  o.jobWithAppAccepted = await Job.create({CompanyId: o.company.id});
  o.jobStudent1 = await Job.create({CompanyId: o.company.id});
  o.application = await Application.create({StudentId: o.student.id, JobId: o.job.id});
  o.applicationDeclined = await Application.create({StudentId: o.student.id, JobId: o.jobWithAppDeclined.id, declined: true});
  o.applicationAccepted = await Application.create({StudentId: o.student.id, JobId: o.jobWithAppDeclined.id, declined: false});
  o.applicationStudent1 = await Application.create({StudentId: o.student1.id, JobId: o.jobStudent1.id, declined: null});
  o.applicationAPI = await Application.create({StudentId: o.studentAPI.id, JobId: o.job.id});
});

afterAll(cleanDatabase.bind(null, o, sequelize));

// unit tests - here you can include directly the middleware so you skip authorization!
test("A student that has no applications receives an empty array", async function (){
  const { studentNotApplied } = o;
  const ctx = {user: studentNotApplied};
  await getApplications(ctx, noop);
  expect(ctx.body.length).toBe(0);
});

test('The student can see his applications', async function() {
  const { student, job, company, application, applicationDeclined, applicationAccepted } = o;
  expect(application.declined).toBe(null);
  const ctx = {user: student};
  await getApplications(ctx, noop);
  expect(ctx.body.length).toBe(3);
  const applications = ctx.body;
  expect(applications.find(a => a.declined === null).Job.Company.email).toBe(company.email);
  expect(applications.find(a => a.declined === true).id).toBe(applicationDeclined.id);
  expect(applications.find(a => a.declined === false).id).toBe(applicationAccepted.id);
});

//api test - here you can test the API with an actual HTTP call, a more realistic test
test("The student can see his application - API version", async function (){
  const { studentAPI, job, company, applicationAPI } = o;
  expect(applicationAPI.declined).toBe(null);
  const studentId = studentAPI.id;
  const jwt = signJWT({id: studentId, userType: "student"});
  const url = `http://localhost:3000/api/v1/student/applications`;
  const response = await r2.get(url, {headers: {authorization: "Bearer " + jwt}}).json;
  expect(response.length).toBe(1);
  const application = response[0];
  expect(application.id).toBe(applicationAPI.id);
  expect(application.Job.id).toBe(job.id);
  expect(application.Job.Company.id).toBe(company.id);
});