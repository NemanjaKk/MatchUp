const { getOneByEmail } = require("../../api/students/student.controller");
const { Student } = require('../../models').models;
const Sequelize = require('../../models/db');
const cleanDatabase = require('../../utils/cleanDatabase.util');

const noop = () => {};
const sequelize = new Sequelize().getInstance();

// we need a reference to the objects that we put in the database so that we can use them in the tests
const o = {};

beforeAll(async () => {
  o.student = await Student.create({email: 'student@testFindByEmail.com'});
});

afterAll(cleanDatabase.bind(null, o, sequelize));

test("The student can be found by email", async function (){
  const { student } = o;
  const ctx = {params: {email: student.email}};
  await getOneByEmail(ctx, noop);
  expect(ctx.status).toBe(200);
  expect(ctx.body.id).toBe(student.id);
});

test("An invalid email does not find any student", async function (){
  const ctx = {params: {email: 'notexisting@impossibleemail.ppp'}};
  try{
    await getOneByEmail(ctx, noop);
  }catch(e){
    expect(e.status).toBe(404);
    expect(e.message).toBe('The requested user doesn\'t exist');
  }
});
