const r2 = require("r2");
const { deleteJob } = require("../../api/jobs/jobs.controller");
const { Job, Company } = require('../../models').models;
const Sequelize = require('../../models/db');
const signJWT = require("../../utils/signJWT");
const cleanDatabase = require('../../utils/cleanDatabase.util');

const noop = () => {};
const sequelize = new Sequelize().getInstance();

// we need a reference to the objects that we put in the database so that we can use them in the tests
const o = {};

// first thing, Fill the database with all the necessary stuff
beforeAll(async () => {
    o.company = await Company.create({name:'Company'});
    o.job = await Job.create({name: 'oldName', CompanyId: o.company.id});
  });

afterAll(cleanDatabase.bind(null, o, sequelize));

//unit test
test('Jobs is deleted', async function() {
    const { job, company } = o;
    const ctx = {params: {jobId: job.id}, user: company};
    await deleteJob(ctx, noop);
    expect(ctx.status).toBe(200);
  });

test('Invalid job ID', async function() {
    const { company } = o;
    const ctx = {params: { }, user: company};
    try{
        await deleteJob(ctx, noop);
    }catch(e){
        expect(e.status).toBe(400);
        expect(e.message).toBeDefined();
    }
  });

  test('Jobs is deleted', async function() {
    const { company } = o;
    const ctx = {params: {jobId: 123123}, user: company};
    try{
        await deleteJob(ctx, noop);
    }catch(e){
        expect(e.status).toBe(404);
        expect(e.message).toBeDefined();
    }
  });