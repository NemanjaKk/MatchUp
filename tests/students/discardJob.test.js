const r2 = require("r2");
const { discard } = require("../../api/students/student.controller");
const { Student, Matching, Company, Job } = require('../../models').models;
const Sequelize = require('../../models/db');
const signJWT = require("../../utils/signJWT");
const cleanDatabase = require('../../utils/cleanDatabase.util');

const noop = () => {};
const sequelize = new Sequelize().getInstance();

// we need a reference to the objects that we put in the database so that we can use them in the tests
const o = {};

// first thing, Fill the database with all the necessary stuff
beforeAll(async () => {
  o.student = await Student.create({ firstName: 'Tonino', lastName: 'O\' Pazz', email: "student@discardJob.com" });
  o.studentAPI = await Student.create({ firstName: 'Mirko', lastName: 'Mrki', email: "studentAPI@discardJob.com" });
  o.company = await Company.create({email: "company@discardJob.com"});
  o.job = await Job.create({CompanyId: o.company.id});
  o.jobAlreadyDiscarded = await Job.create({CompanyId: o.company.id});
  o.mathing = await Matching.create({JobId: o.jobAlreadyDiscarded.id, StudentId: o.student.id, discarded: true});
  o.jobInMatchingButNotDiscarded = await Job.create({CompanyId: o.company.id});
  o.mathingNotDiscarded = await Matching.create({JobId: o.jobInMatchingButNotDiscarded.id, StudentId: o.student.id, discarded: false});
});

afterAll(cleanDatabase.bind(null, o, sequelize));

// unit tests
test('Student can discard the job', async function() {
  const { student, job } = o;
  const ctx = {params: { jobId: job.id }, user: student};
  await discard(ctx, noop);

  const newMatching = await Matching.findOne({where: { JobId: job.id, StudentId: student.id }});
  expect(newMatching).toBeDefined();
  expect(newMatching.discarded).toBe(true);
  expect(newMatching.StudentId).toBe(student.id);
  expect(newMatching.JobId).toBe(job.id);
  expect(newMatching.id).toBeGreaterThan(0);
});

test('Student already discarded the job', async function() {
  const { student, jobAlreadyDiscarded } = o;
  const ctx = {params: { jobId: jobAlreadyDiscarded.id }, user: student};
  const oldMatching = await Matching.findOne({where: { JobId: jobAlreadyDiscarded.id, StudentId: student.id }});
  expect(oldMatching).toBeDefined();
  expect(oldMatching.discarded).toBe(true);
  expect(oldMatching.StudentId).toBe(student.id);
  expect(oldMatching.JobId).toBe(jobAlreadyDiscarded.id);
  expect(oldMatching.id).toBeGreaterThan(0);

  await discard(ctx, noop);

  const newMatching = await Matching.findOne({where: { JobId: jobAlreadyDiscarded.id, StudentId: student.id }});
  expect(newMatching).toBeDefined();
  expect(newMatching.discarded).toBe(true);
  expect(newMatching.StudentId).toBe(student.id);
  expect(newMatching.JobId).toBe(jobAlreadyDiscarded.id);
  expect(newMatching.id).toBeGreaterThan(0);

  expect(newMatching.id).toBe(oldMatching.id);
});

test('Student discards a job that is in matching but not discarded', async function() {
  const { student, jobInMatchingButNotDiscarded } = o;
  const ctx = {params: { jobId: jobInMatchingButNotDiscarded.id }, user: student};
  const oldMatching = await Matching.findOne({where: { JobId: jobInMatchingButNotDiscarded.id, StudentId: student.id }});
  expect(oldMatching).toBeDefined();
  expect(oldMatching.discarded).not.toBe(true);
  expect(oldMatching.StudentId).toBe(student.id);
  expect(oldMatching.JobId).toBe(jobInMatchingButNotDiscarded.id);

  await discard(ctx, noop);

  const newMatching = await Matching.findOne({where: { JobId: jobInMatchingButNotDiscarded.id, StudentId: student.id }});
  expect(newMatching).toBeDefined();
  expect(newMatching.discarded).toBe(true);
  expect(newMatching.id).toBe(oldMatching.id);
});

test('Undefined job id', async function() {
  const { student } = o;
  const ctx = {params: { jobId: undefined }, user: student};
  try{
    await discard(ctx, noop);
  }catch(e){
    expect(e.status).toBe(400);
  }
});

test('String job id', async function() {
  const { student } = o;
  const ctx = {params: { jobId: 'Hello' }, user: student};
  try{
    await discard(ctx, noop);
  }catch(e){
    expect(e.status).toBe(400);
  }
});

test('job id does not exist', async function() {
  const { student } = o;
  const ctx = {params: { jobId: 100000 }, user: student};
  try{
    await discard(ctx, noop);
  }catch(e){
    expect(e.status).toBe(400);
  }
});

//API tests
test("Student can discard the job - API version", async function (){
  const { studentAPI, job } = o;
  const jobId = job.id;
  const jwt = signJWT({id: studentAPI.id, userType: "student"});
  const url = `http://localhost:3000/api/v1/student/jobs/discard/${jobId}`;
  const response = await r2.post(url, {headers: {authorization: "Bearer " + jwt}}).response;

  const newMatching = await Matching.findOne({where: {StudentId: studentAPI.id, JobId: job.id}});
  expect(newMatching.id).toBeGreaterThan(0);
  expect(newMatching.StudentId).toBe(studentAPI.id);
  expect(newMatching.JobId).toBe(job.id);
  expect(newMatching.discarded).toBe(true);
  expect(response.status).toBe(201);
});