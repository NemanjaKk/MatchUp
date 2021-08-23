const r2 = require("r2");
const { createOne } = require("../../api/jobs/jobs.controller");
const {  Job, Company, City } = require('../../models').models;
const Sequelize = require('../../models/db');
const signJWT = require("../../utils/signJWT");
const cleanDatabase = require('../../utils/cleanDatabase.util');

const noop = () => {};
const sequelize = new Sequelize().getInstance();

// we need a reference to the objects that we put in the database so that we can use them in the tests
const o = {};

// first thing, Fill the database with all the necessary stuff
beforeAll(async () => {
    o.company = await Company.create({name:'Company'})
    o.city1 = await City.create({name:'Podgorica'});
  });

afterAll(cleanDatabase.bind(null, o, sequelize));

const newJob = {
  name: "Test Job",
  description: "A job that is used to test",
  timeLimit: new Date("2030-12-13"),
  salary: 300,
  partTime: true,
  remote: true,
};

test("Company can create a job", async function() {
  const {company} = o;
  newJob["CityId"] = o.city1.id;
  const ctx = { user: company, request: { body: newJob } };
  await createOne(ctx, noop);
  expect(ctx.status).toBe(200);
  for (let key of Object.keys(newJob)){
    expect(ctx.body[key]).toStrictEqual(newJob[key]);
  }
  o.newJob = await Job.findOne({where: {id: ctx.body.id}, include: [{model: City}]});
  expect(o.newJob.City.name).toBe(o.city1.name);
});

test("Company can create a job - API", async function () {
  const {company} = o;
  const jwt = signJWT({id: company.id, userType: "company"});
  const url = `http://localhost:3000/api/v1/jobs/`;
  const response = await r2.post(url, {json:{newJob}, headers: {authorization: "Bearer " + jwt}}).response;
  expect(response.status).toBe(200);
});