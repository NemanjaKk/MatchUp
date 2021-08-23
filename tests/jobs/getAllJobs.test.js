const { getAll } = require("../../api/jobs/jobs.controller");
const Sequelize = require('../../models/db');
const { Job, Company } = require('../../models').models;
const cleanDatabase = require('../../utils/cleanDatabase.util');

const sequelize = new Sequelize().getInstance();

const noop = () => {};

const o = {};

// first thing, Fill the database with all the necessary stuff
beforeAll(async () => {
  o.company = await Company.create({ email: 'test@jobGetAll.com' });
  o.job = await Job.create({name: "test job get all", description: "test job", timeLimit: new Date(), CompanyId: o.company.id});
});

afterAll(cleanDatabase.bind(null, o, sequelize));

// unit tests - here you can include directly the middleware so you skip authorization!
test("Some jobs are returned", async function (){
  const ctx = {};
  await getAll(ctx, noop);
  expect(ctx.body.length).toBeGreaterThan(0);
  expect(ctx.body.find(e => e.id === o.job.id).name).toBe("test job get all");
  expect(ctx.status).toBe(200);
});