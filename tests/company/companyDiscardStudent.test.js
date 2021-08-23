const r2 = require("r2");
const { companyDiscardStudent } = require("../../api/companies/company.controller");
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
  o.student = await Student.create({ firstName: 'Rino', lastName: 'Pape', email: "paperino@rifiutami.it" });
  o.studentNotApplied = await Student.create({ firstName: 'Lino', lastName: 'Topo', email: "topolino@notapplied.com" });
  o.studentAPI = await Student.create({ firstName: 'Rina', lastName: 'Pape', email: "paperina@checarina.it" });
  o.company = await Company.create({email: "company@home.com"});
  o.company2 = await Company.create({email: "company2@home.com"});
  o.job = await Job.create({CompanyId: o.company.id});
  o.application = await Application.create({StudentId: o.student.id, JobId: o.job.id});
  o.applicationAPI = await Application.create({StudentId: o.studentAPI.id, JobId: o.job.id});
});

afterAll(cleanDatabase.bind(null, o, sequelize));

// unit tests - here you can include directly the middleware so you skip authorization!
test("The company cannot discard a student that did not apply", async function (){
  const { studentNotApplied, job, company } = o;
  const ctx = {params: { studentId: studentNotApplied.id, jobId: job.id }, user:company};
  try{
    await companyDiscardStudent(ctx, noop);
  }catch(e){
    expect(e.status).toBe(400);
    expect(e.message).toBeDefined();
  }
});

test("The company cannot discard a student on a job that does not belong to them", async function (){
  const { student, job, company2 } = o;
  const ctx = {params: { studentId: student.id, jobId: job.id }, user:company2};
  try{
    await companyDiscardStudent(ctx, noop);
  }catch(e){
    expect(e.status).toBe(401);
    expect(e.message).toBeDefined();
  }
});

test('The company can actually discard the student', async function() {
  const { student, job, company, application } = o;
  expect(application.declined).toBe(null);
  const ctx = {params: { studentId: student.id, jobId: job.id }, user: company};
  await companyDiscardStudent(ctx, noop);
  await application.reload();
  expect(student.id).toBeGreaterThan(0);
  expect(application.StudentId).toBe(student.id);
  expect(application.JobId).toBe(job.id);
  expect(application.id).toBeGreaterThan(0);
  expect(application.declined).toBe(true);
});

//api test - here you can test the API with an actual HTTP call, a more realistic test
test("The company can actually discard the student - API version", async function (){
  const { company, studentAPI, job, applicationAPI } = o;
  expect(applicationAPI.declined).toBe(null);
  const studentId = studentAPI.id, jobId = job.id;
  const jwt = signJWT({id: company.id, userType: "company"});
  const url = `http://localhost:3000/api/v1/company/jobs/${jobId}/discard/${studentId}`;
  const response = await r2.post(url, {headers: {authorization: "Bearer " + jwt}}).response;
  await applicationAPI.reload();
  expect(response.status).toBe(201);
  expect(applicationAPI.declined).toBe(true);
});
