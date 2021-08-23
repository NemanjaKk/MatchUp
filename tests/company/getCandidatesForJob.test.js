const r2 = require("r2");
const { getCandidatesForJob } = require("../../api/companies/company.controller");
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
  o.student = await Student.create({ firstName: 'Pippo', lastName: 'Pluto', email: "student@lol.ccc" });
  o.studentNotApplied = await Student.create({ firstName: 'PippoNotApplied', lastName: 'PlutoNotApplied', email: "studentNotApplied@lol.ccc" });
  o.studentAPI = await Student.create({ firstName: 'Pippo', lastName: 'Pluto', email: "studentAPI@lol.ccc" });
  o.company = await Company.create({email: "company@getCandidatesForJob.com"});
  o.companyThatDidntCreateJob = await Company.create({email: "companynotauth@company.ccc"});
  o.job = await Job.create({CompanyId: o.company.id});
  o.application = await Application.create({StudentId: o.student.id, JobId: o.job.id});
  o.applicationAPI = await Application.create({StudentId: o.studentAPI.id, JobId: o.job.id});
});

afterAll(cleanDatabase.bind(null, o, sequelize));

test("Only the company that proposed the job can visualize the applicants", async function(){
    const{companyThatDidntCreateJob, job} = o;
    const ctx = {params: {jobId: job.id}, user: companyThatDidntCreateJob};

    try{
        await getCandidatesForJob(ctx, noop);
    }catch(e){
        expect(e.status).toBe(400);
        expect(e.message).toBeDefined() //the value is not null
    }
});

test("THe function returns all and only the candidates", async function(){
  const {company, job, student, studentAPI} = o;
  const ctx = { user: company, params: { jobId: job.id } };
  await getCandidatesForJob(ctx, noop);
  expect(ctx.status).toBe(200);
  expect(ctx.body.length).toBe(2);
  expect(ctx.body.find(s => s.email === studentAPI.email)).not.toBe(null);
  expect(ctx.body.find(s => s.email === student.email)).not.toBe(null);
})

test("The function returns all and only the candidates - API version", async function(){
  const{company, job, student, studentAPI} = o; 
  const jobId = job.id;
  const jwt = signJWT({id: company.id, userType: "company"});
  const url = `http://localhost:3000/api/v1/company/candidateStudents/${jobId}`;
  const responseStatus = await r2.get(url, {headers: {authorization: "Bearer " + jwt}}).response; 
  const responseBody = await r2.get(url, {headers: {authorization: "Bearer " + jwt}}).json;
  expect(responseStatus.status).toBe(200);
  expect(responseBody.length).toBe(2); //makes sure that studentNotApplied is not in the students returned
  expect(responseBody.find(s => s.email === studentAPI.email)).not.toBe(null);
  expect(responseBody.find(s => s.email === student.email)).not.toBe(null);
});
