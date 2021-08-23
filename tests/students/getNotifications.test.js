const r2 = require("r2");
const { getNotifications } = require("../../api/students/student.controller");
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
  o.student = await Student.create({ firstName: 'Pippo', lastName: 'Pluto', email: "student_noti@applicationTest.c" });
  o.studentNotApplied = await Student.create({ firstName: 'Pippo', lastName: 'Pluto', email: "studentNotApplied_noti@applicationTest.c" });
  o.student1 = await Student.create({ firstName: 'Pippo', lastName: 'Pluto', email: "student1_noti@applicationTest.c" });
  o.studentAPI = await Student.create({ firstName: 'Pippo', lastName: 'Pluto', email: "studentAPI_noti@applicationTest.c" });
  o.company = await Company.create({name: "TestCompany", email: "company_noti@pippo.com"});
  o.company1 = await Company.create({name: "TestCompany1", email: "company1_noti@pippo.com"});
  o.companyAlreadyShown = await Company.create({name: "TestCompany12", email: "company12_noti@pippo.com"});
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
test("A student that has no applications accepted has no notifications", async function (){
  const { studentNotApplied } = o;
  const ctx = {user: studentNotApplied};
  await getNotifications(ctx, noop);
  expect(ctx.body.length).toBe(0);
});

test('The student that has two application accepted can see them both', async function() {
  const { student, application, applicationAccepted, applicationAccepted1, jobWithAppAccepted, jobWithAppAccepted1 } = o;
  
  expect(application.declined).toBe(null);
  const ctx = {user: student};
  await getNotifications(ctx, noop);
  const notifications = ctx.body;

  expect(ctx.body.length).toBe(2);
  expect(notifications.find(a => a.id === applicationAccepted.id).Job.name).toBe(jobWithAppAccepted.name)
  expect(notifications.find(a => a.id === applicationAccepted1.id).Job.name).toBe(jobWithAppAccepted1.name)
  
});

//api test - here you can test the API with an actual HTTP call, a more realistic test
test("The student actually receives the notifications - API version", async function (){
  const { student, job, company, jobWithAppAccepted, jobWithAppAccepted1 } = o;
  const studentId = student.id;
  const jwt = signJWT({id: studentId, userType: "student"});
  const url = `http://localhost:3000/api/v1/student/jobs/getNotifications`;
  const response = await r2.get(url, {headers: {authorization: "Bearer " + jwt}}).json;
  expect(response.length).toBe(2);
  expect(response.find(a => a.Job.name ==="2").Job.Company.email).toBe("company_noti@pippo.com")
  expect(response.find(a => a.Job.name ==="3").Job.Company.email).toBe("company1_noti@pippo.com")
  expect(response.find(a => a.Job.name ==="2").Job.id).toBe(jobWithAppAccepted.id)
  expect(response.find(a => a.Job.name ==="3").Job.id).toBe(jobWithAppAccepted1.id)

});