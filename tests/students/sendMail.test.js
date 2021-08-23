const r2 = require("r2");
const { Student, StudentSkill, Skill } = require('../../models').models;
const Sequelize = require('../../models/db');
const signJWT = require("../../utils/signJWT");
const cleanDatabase = require('../../utils/cleanDatabase.util');
const { sendMail } = require("../../api/students/student.controller");
const noop = () => {};
const sequelize = new Sequelize().getInstance();

// we need a reference to the objects that we put in the database so that we can use them in the tests
const o = {};

// first thing, Fill the database with all the necessary stuff
beforeAll(async () => {
  o.student = await Student.create({ firstName: 'Luca', lastName: 'Gin', email: "ginluca@outlook.it" });
  o.studentAPI = await Student.create({ firstName: 'Luca', lastName: 'Gin', email: "ginluca@gmail.com" });

  o.studentSkill = await StudentSkill.create({StudentId: o.student.id, SkillId: 1, rating: 3 });
  o.studentSkill = await StudentSkill.create({StudentId: o.student.id, SkillId: 2, rating: 4 });
  o.studentSkill = await StudentSkill.create({StudentId: o.student.id, SkillId: 3, rating: 5 });
  o.skill=await Skill.create({});
});

afterAll(cleanDatabase.bind(null, o, sequelize));

test("Send an email", async function (){
  jest.setTimeout(30000);
  const { student } = o;
  const ctx = { request:{ body:{ message: "Message Test", subject: "Subject Test", companyEmail: "receiver@pladat.tk" }}, user: student };
  await sendMail(ctx, noop);
  expect(ctx.status).toBe(200);
});

test("Send an email - API version", async function (){
  jest.setTimeout(30000);
  const { student } = o;
  const studentId = student.id;
  const jwt = signJWT({id: studentId, userType: "student"});
  const url = `http://localhost:3000/api/v1/student/sendMail/`;
  const response = await r2.post(url,{json:{message: "Message Test", subject: "Subject Test", companyEmail: "receiver@pladat.tk"},headers: {authorization: "Bearer " + jwt}}).response;
  expect(response.status).toBe(200);
});