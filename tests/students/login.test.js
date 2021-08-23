const r2 = require("r2");
const { login } = require("../../api/students/student.controller");
const { Student} = require('../../models').models;
const Sequelize = require('../../models/db');
const password = require("../../utils/password");
const signJWT = require("../../utils/signJWT");
const crypt=require("../../utils/password");
const cleanDatabase = require('../../utils/cleanDatabase.util');


const noop = () => {};
const sequelize = new Sequelize().getInstance();

// we need a reference to the objects that we put in the database so that we can use them in the tests
const o = {};

// first thing, Fill the database with all the necessary stuff
beforeAll(async () => {
  const hash=await crypt.hash("plut");
  o.student = await Student.create({ firstName: 'Pippo', lastName: 'Pluto', email: "student@login.c", password:hash });
  o.studentAPI = await Student.create({ firstName: 'Pippo', lastName: 'Pluto', email: "studentAPI@login.c",password:hash });
});

afterAll(cleanDatabase.bind(null, o, sequelize));

// unit tests - here you can include directly the middleware so you skip authorization!
test("The user must enter correct email in order to login", async function (){
  const ctx = {request:{body: { email: "non@gmail.com", password: "plut" }}};
  try{
    await login(ctx,noop);
  }catch(e){
    expect(e.status).toBe(404);
    expect(e.message).toBeDefined();
  }
});
test("The user must enter correct password in order to login", async function (){
  const { student } = o;
  
  const ctx = {request:{body: {email:student.email, password: "plutoks"}}};
  try{
    await login(ctx,noop);
  }catch(e){
    expect(e.status).toBe(401);
    expect(e.message).toBeDefined();
  }
});

test('The student is able to login', async function() {
  const { student } = o;
  const ctx = {request:{body: {email:student.email, password: "plut"}}};
  
  await login(ctx,noop);
  expect(ctx.status).toBe(200);
});

//api test - here you can test the API with an actual HTTP call, a more realistic test
test("The student is able to login - API version", async function (){
  const { studentAPI } = o;
  const studentPassword = "plut";
  const jwt = signJWT({id: studentAPI.id, userType: "student"});
  const url = `http://localhost:3000/api/v1/student/login/`;
  const response = await r2.post(url,{json:{email:studentAPI.email, password:studentPassword}}, {headers: {authorization: "Bearer " + jwt}}).response;
  expect(response.status).toBe(200);
});
