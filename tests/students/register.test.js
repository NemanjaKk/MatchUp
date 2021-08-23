const r2 = require("r2");
const { register } = require("../../api/students/student.controller");
const { Student, City } = require('../../models').models;
const Sequelize = require('../../models/db');
const { hash, compare } =require("../../utils/password");
const cleanDatabase = require('../../utils/cleanDatabase.util');


const noop = () => {};
const sequelize = new Sequelize().getInstance();

// we need a reference to the objects that we put in the database so that we can use them in the tests
const o = {};
const email = 'pippo@testRegister.com';
// first thing, Fill the database with all the necessary stuff
beforeAll(async () => {
  const h=await hash("plut");
  o.studentAlreadyThere = await Student.create({ firstName: 'Pippo', lastName: 'Pluto', email, password:h });
  o.city = await City.create({ name: 'Bratislavaaa'});
});

afterAll(cleanDatabase.bind(null, o, sequelize));

// unit tests - here you can include directly the middleware so you skip authorization!
test("The user must enter correct email to register", async function (){
  const ctx = {request:{body: { email: "", password: "plut" }}};
  try{
    await register(ctx,noop);
  }catch(e){
    expect(e.status).toBe(400);
    expect(e.message).toBeDefined();
  }
});

test("The user must enter correct password to register", async function (){
  const ctx = {request:{body: { email: "correct@email.com", password: "" }}};
  try{
    await register(ctx,noop);
  }catch(e){
    expect(e.status).toBe(400);
    expect(e.message).toBeDefined();
  }
});

test("The student cannot register if there is one already registered with the same email", async function (){
  const ctx = {request:{body: { email, password: "plut" }}};
  try{
    await register(ctx,noop);
  }catch(e){
    expect(e.status).toBe(400);
    expect(e.message).toBeDefined();
  }
});

test('The student is able to register', async function() {
  const email = 'studentcanregister@student.com'
  const ctx = {request:{body: { email , password: "plut", firstName: 'a', lastName: 'b' }}};
  await register(ctx,noop);
  o.student = await Student.findOne({ where: {email} });
  expect(o.student).toBeDefined();
  expect(o.student.firstName).toBe('a');
  expect(o.student.lastName).toBe('b');
});

test("The student cannot register if he entered a city that does not belong to a country", async function (){
  const { city } = o;
  const ctx = {request:{body: { email: 'student@city.com', password:'plut', firstName: 'a', lastName: 'b', CityId: city.id }}};
  try{
    await register(ctx,noop);
  }catch(e){
    expect(e.status).toBe(400);
    expect(e.message).toBeDefined();
  }
});

test('The student cannot register if he is born in the future', async function() {
  const ctx = {request:{body: { email: 'student@date.com' , password: "plut", firstName: 'a', lastName: 'b', dateOfBirth: '2022-11-11' }}};
  try{
    await register(ctx,noop);
  }catch(e){
    expect(e.status).toBe(401);
    expect(e.message).toBeDefined();
  }
});

//api test - here you can test the API with an actual HTTP call, a more realistic test
test("The student is able to register - API version", async function (){
  const email = 'apiregister@student.com';
  const url = `http://localhost:3000/api/v1/student/register/`;
  const response = await r2.post(url, {json:{email, password:'plut', firstName: 'a', lastName: 'b'}}).response;
  expect(response.status).toBe(201);
  o.studentAPI = await Student.findOne({ where: {email}});
  expect(o.studentAPI).toBeDefined();
  expect(o.studentAPI.email).toBe(email);
  const comparison = await compare('plut', o.studentAPI.password);
  expect(comparison).toBe(true);
  expect(o.studentAPI.firstName).toBe('a')
  expect(o.studentAPI.lastName).toBe('b')
});
