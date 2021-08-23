const r2 = require("r2");
const { getOne } = require("../../api/jobs/jobs.controller");
const { Job, Company } = require('../../models').models;
const Sequelize = require('../../models/db');
const cleanDatabase = require('../../utils/cleanDatabase.util');

const noop = () => {};
const sequelize = new Sequelize().getInstance();

// we need a reference to the objects that we put in the database so that we can use them in the tests
const o = {};

const now = new Date();
// first thing, Fill the database with all the necessary stuff
beforeAll(async () => {
  o.company = await Company.create({ email: 'test@jobCreate.com' });
  o.job = await Job.create({name: "test job create", description: "test job", timeLimit: now, CompanyId: o.company.id});
});

afterAll(cleanDatabase.bind(null, o, sequelize));

// unit tests - here you can include directly the middleware so you skip authorization!
test("The job is returned", async function (){
  const { job } = o
  const ctx = { params: { jobId: job.id } };
  await getOne(ctx, noop);
  expect(ctx.body.name).toBe('test job create');
  expect(ctx.body.description).toBe('test job');
  expect(ctx.body.Company.email).toBe('test@jobCreate.com');
});

test("Search job with a string as id returns 400", async function (){
  const ctx = {params: { jobId: 'hello' }};
  try{
    await getOne(ctx, noop);
  }catch(e){
    expect(e.status).toBe(400);
    expect(e.message).toBeDefined();
  }
});

test("Search job with an id that does not exist returns 404", async function (){
  const ctx = {params: { jobId: 100000 }};
  try{
    await getOne(ctx, noop);
  }catch(e){
    expect(e.status).toBe(404);
    expect(e.message).toBeDefined();
  }
});

//api test - here you can test the API with an actual HTTP call, a more realistic test
test("The job exists - API version", async function (){
  const { job } = o
  const url = `http://localhost:3000/api/v1/jobs/findOne/${job.id}`;
  const response = await r2.get(url).json;
  expect(response.id).toBe(job.id);
});
