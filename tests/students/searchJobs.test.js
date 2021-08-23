const r2 = require("r2");
const { searchJobs } = require("../../api/students/student.controller");
const { Student, Application, Company, Job, Skill, SkillSetReq, SkillSetOpt, StudentSkill, Matching, City } = require('../../models').models;
const Sequelize = require('../../models/db');
const signJWT = require("../../utils/signJWT");
const cleanDatabase = require('../../utils/cleanDatabase.util');
const assert = require('assert').strict;

const noop = () => {};
const sequelize = new Sequelize().getInstance();

// we need a reference to the objects that we put in the database so that we can use them in the tests
const o = {};

// first thing, Fill the database with all the necessary stuff
beforeAll(async () => {
  const skills = await Skill.findAll();
  const getSkill = name => skills.find(s => s.name === name);
  
  o.milan = await City.create({name: "Milan"})
  o.vasteras = await City.create({name: "Vasteras"})

  o.student = await Student.create({ firstName: 'Pippo', lastName: 'Pluto', email: "student@searchJob.com" });
  o.studentSkill = [];
  assert(o.student.id > 0);
  o.studentSkill.push(await StudentSkill.create({ StudentId: o.student.id, SkillId: getSkill("C#").id, rating: 3}));

  o.studentAPI = await Student.create({ firstName: 'PippoAPI', lastName: 'Pluto', email: "studentAPI@searchJob.com" });
  o.studentAPISkill = [];
  assert(o.studentAPI.id > 0);
  o.studentAPISkill.push(await StudentSkill.create({ StudentId: o.studentAPI.id, SkillId: getSkill("C#").id , rating: 3}));

  o.company = await Company.create({email: "company@searchJob.com"});
  o.verySkilledStudent = await Student.create({ firstName: 'Rino', lastName: 'Pape', email: "paperino@searchJob.com" });
  o.verySkilledStudentSkill = [];
  assert(o.verySkilledStudent.id > 0);
  o.verySkilledStudentSkill.push(await StudentSkill.create({ StudentId: o.verySkilledStudent.id, SkillId: getSkill("C#").id , rating: 3}));
  o.verySkilledStudentSkill.push(await StudentSkill.create({ StudentId: o.verySkilledStudent.id, SkillId: getSkill("NodeJS").id , rating: 4})); 
  o.verySkilledStudentSkill.push(await StudentSkill.create({ StudentId: o.verySkilledStudent.id, SkillId: getSkill("F#").id , rating: 4})); 

  o.job = await Job.create({CompanyId: o.company.id, timeLimit: "2030-01-10", name: "Normal Job"});
  o.skillsRequiredJob1 = await SkillSetReq.create({ JobId: o.job.id, SkillId: getSkill("C#").id });

  o.jobExpired = await Job.create({CompanyId: o.company.id, timeLimit: "2010-01-10", name: "Expired Job"});
  o.skillsRequiredJobExpired = await SkillSetReq.create({ JobId: o.jobExpired.id, SkillId: getSkill("C#").id });

  o.jobWithMoreReqSkills = await Job.create({CompanyId: o.company.id, timeLimit: "2030-01-10", name: "JobWithManySkills", CityId: o.milan.id});
  o.skillsRequiredJobMoreReqSkills = [];
  o.skillsRequiredJobMoreReqSkills.push(await SkillSetReq.create({ JobId: o.jobWithMoreReqSkills.id, SkillId: getSkill("C#").id }));
  o.skillsRequiredJobMoreReqSkills.push(await SkillSetReq.create({ JobId: o.jobWithMoreReqSkills.id, SkillId: getSkill("NodeJS").id }));
  o.skillsRequiredJobMoreReqSkills.push(await SkillSetOpt.create({ JobId: o.jobWithMoreReqSkills.id, SkillId: getSkill("F#").id }));


  /*should be ranked lower because the student does not have the F# skill, except when we filter by city */
  o.jobWithTooManyOptionalSkills = await Job.create({CompanyId: o.company.id, timeLimit: "2030-01-10", name: "Hard Job", CityId: o.vasteras.id});
  o.skillsTooManyOptional = [];
  o.skillsTooManyOptional.push(await SkillSetReq.create({ JobId: o.jobWithTooManyOptionalSkills.id, SkillId: getSkill("C#").id }));
  o.skillsTooManyOptional.push(await SkillSetReq.create({ JobId: o.jobWithTooManyOptionalSkills.id, SkillId: getSkill("NodeJS").id }));
  o.skillsTooManyOptional.push(await SkillSetOpt.create({ JobId: o.jobWithTooManyOptionalSkills.id, SkillId: getSkill("F#").id }));
  o.skillsTooManyOptional.push(await SkillSetOpt.create({ JobId: o.jobWithTooManyOptionalSkills.id, SkillId: getSkill("Sequelize").id }));

  o.jobWithTooManySkills = await Job.create({CompanyId: o.company.id, timeLimit: "2030-01-10", name: "Job Very Skilled", CityId: o.vasteras.id});
  o.skillsRequiredJobTooManySkills = [];
  o.skillsRequiredJobTooManySkills.push(await SkillSetReq.create({ JobId: o.jobWithTooManySkills.id, SkillId: getSkill("C#").id }));
  o.skillsRequiredJobTooManySkills.push(await SkillSetReq.create({ JobId: o.jobWithTooManySkills.id, SkillId: getSkill("F#").id }));
  o.skillsRequiredJobTooManySkills.push(await SkillSetReq.create({ JobId: o.jobWithTooManySkills.id, SkillId: getSkill("NodeJS").id }));
  o.skillsRequiredJobTooManySkills.push(await SkillSetReq.create({ JobId: o.jobWithTooManySkills.id, SkillId: getSkill("Sequelize").id }));

  o.jobDiscarded = await Job.create({CompanyId: o.company.id, timeLimit: "2030-01-10", name: "Discarded Job", CityId: o.milan.id});
  o.skillsRequiredJobDiscarded = await SkillSetReq.create({ JobId: o.jobDiscarded.id, SkillId: getSkill("C#").id });
  o.mathingDiscarded = await Matching.create({StudentId: o.student.id, JobId: o.jobDiscarded.id, discarded: true});

  o.jobApplied = await Job.create({CompanyId: o.company.id, timeLimit: "2030-01-10", name: "Applied Job", CityId: o.vasteras.id});
  o.skillsRequiredJobApplied = await SkillSetReq.create({ JobId: o.jobApplied.id, SkillId: getSkill("C#").id });
  o.jobApplication = await Application.create({StudentId: o.student.id, JobId: o.jobApplied.id, declined: null});
});

afterAll(cleanDatabase.bind(null, o, sequelize));

// unit tests - here you can include directly the middleware so you skip authorization!
test("Student cannot find the expired job", async function (){
  const { student, jobExpired } = o;
  const ctx = { user: student, request:{} };
  await searchJobs(ctx, noop);
  expect(ctx.body.length).toBeGreaterThan(0);
  const jobs = ctx.body;
  expect(jobs.find(j => j.id === jobExpired.id)).toBeUndefined();
});

test("Student cannot find the job with too many mandatory skills", async function (){
  const { student, jobWithTooManySkills } = o;
  const ctx = { user: student, request:{} };
  await searchJobs(ctx, noop);
  expect(ctx.body.length).toBeGreaterThan(0);
  const jobs = ctx.body;
  expect(jobs.find(j => j.id === jobWithTooManySkills.id)).toBeUndefined();
});

test("Student cannot find the job he already discarded", async function (){
  const { student, jobDiscarded } = o;
  const ctx = { user: student, request:{} };
  await searchJobs(ctx, noop);
  expect(ctx.body.length).toBeGreaterThan(0);
  const jobs = ctx.body;
  expect(jobs.find(j => j.id === jobDiscarded.id)).toBeUndefined();
});

test("Student cannot find the job he already applied to", async function (){
  const { student, jobApplied } = o;
  const ctx = { user: student, request:{}};
  
  await searchJobs(ctx, noop);
  expect(ctx.body.length).toBeGreaterThan(0);
  const jobs = ctx.body;
  expect(jobs.find(j => j.id === jobApplied.id)).toBeUndefined();
});

//api test - here you can test the API with an actual HTTP call, a more realistic test
test("The student can find some jobs - API version", async function (){
  const { studentAPI, job} = o;
  const studentId = studentAPI.id;
  const jwt = signJWT({id: studentId, userType: "student"});
  const url = `http://localhost:3000/api/v1/student/jobs/search`;
  //some jobs are returned
  const jobs = await r2.get(url, {headers: {authorization: "Bearer " + jwt}}).json;
  expect(jobs.length).toBeGreaterThan(0);
  expect(jobs.find(j => j.id === job.id)).toBeDefined();
});

test("The jobs are ordered - API version", async function(){
  const {verySkilledStudent, jobWithMoreReqSkills} = o;
  const anotherJwt = signJWT({id: verySkilledStudent.id, userType: "student"});
  const url = `http://localhost:3000/api/v1/student/jobs/search`;

  // verify that the jobs are ordered by deacreasing matching skills
  
  const orderedJobs = await r2.get(url, {headers: {authorization: "Bearer " + anotherJwt}}).json;
  expect(orderedJobs[0].id).toEqual(jobWithMoreReqSkills.id);
});

test("The jobs are ordered and filtered by city - API version", async function(){
  const {  verySkilledStudent, vasteras,  jobWithTooManyOptionalSkills} = o;
  const anotherJwt = signJWT({id: verySkilledStudent.id, userType: "student"});

  urlWithQuery = `http://localhost:3000/api/v1/student/jobs/search?city=${vasteras.id}`;
  const orderedJobsWithCity = await r2.get(urlWithQuery, {headers: {authorization: "Bearer " + anotherJwt}}).json;
  expect(orderedJobsWithCity[0].id).toEqual(jobWithTooManyOptionalSkills.id); //should not work
});

