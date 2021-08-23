const r2 = require("r2");
const { login } = require("../../api/companies/company.controller");
const { Company} = require('../../models').models;
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
  o.company = await Company.create({ name: 'SverigesFtItalienz', description: 'Great team', email: "company@login.c", password:hash });
  o.companyAPI = await Company.create({ name: 'SverigesFtItalienz', description: 'Great team', email: "companyAPI@login.c",password:hash });
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
  const { company } = o;
  const ctx = {request:{body: {email:company.email, password: "plutoks"}}};
  try{
    await login(ctx,noop);
  }catch(e){
    expect(e.status).toBe(401);
    expect(e.message).toBeDefined();
  }
});

test('The company is able to login', async function() {
  const { company } = o;
  const ctx = {request:{body: {email:company.email, password: "plut"}}};
  
  await login(ctx,noop);
  expect(ctx.status).toBe(200);
  expect(ctx.body.jwt).toBeDefined();
  expect(ctx.body.id).toBe(company.id);
});

//api test - here you can test the API with an actual HTTP call, a more realistic test
test("The company is able to login - API version", async function (){
  const { companyAPI } = o;
  const companyPassword = "plut";
  const jwt = signJWT({id: companyAPI.id, userType: "company"});
  const url = `http://localhost:3000/api/v1/company/login/`;
  const response = await r2.post(url,{json:{email:companyAPI.email, password:companyPassword}}, {headers: {authorization: "Bearer " + jwt}}).response;
  expect(response.status).toBe(200);
});
