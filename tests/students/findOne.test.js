const { getOne, getAll } = require("../../api/students/student.controller");
const { Student } = require('../../models').models;
const Sequelize = require('../../models/db');
const cleanDatabase = require('../../utils/cleanDatabase.util');

const noop = () => {};
const sequelize = new Sequelize().getInstance();

// we need a reference to the objects that we put in the database so that we can use them in the tests
const o = {};

beforeAll(async () => {
  o.student = await Student.create({email: 'student@testFindStud.com'});
});

afterAll(cleanDatabase.bind(null, o, sequelize));

test("find all student", async function (){
  const { student } = o;
  const ctx = {};
  await getAll(ctx, noop);
  expect(ctx.status).toBe(200);
  expect(ctx.body.length).toBeGreaterThan(0);
  expect(ctx.body.find(s => s.id===student.id)).toBeDefined();
});

test("The student can be found", async function (){
  const { student } = o;
  const ctx = {params: {userId: student.id}};
  await getOne(ctx, noop);
  expect(ctx.status).toBe(200);
  expect(ctx.body.email).toBe(student.email);
});

test("An invalid id does not find any student", async function (){
  const ctx = {params: {userId: 10000}};
  try{
    await getOne(ctx, noop);
  }catch(e){
    expect(e.status).toBe(404);
    expect(e.message).toBe('The requested user doesn\'t exist');
  }
});
