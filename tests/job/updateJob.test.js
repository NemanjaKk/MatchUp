const r2 = require("r2");
const { update } = require("../../api/jobs/jobs.controller");
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
    o.company2 = await Company.create({name:'Company'})
    o.city1 = await City.create({name:'Podgorica'});
    o.city2 = await City.create({name:'Milan'});
    o.job = await Job.create({name: 'oldName', description: 'oldDescription', timeLimit: '2020-12-30', salary: 2300, partTime: false, remote: false, CityId: o.city1.id, CompanyId: o.company.id});
    o.job2 = await Job.create({name: 'oldName', description: 'oldDescription', timeLimit: '2020-12-30', salary: 2300, partTime: false, remote: false, CityId: o.city1.id, CompanyId: o.company.id});
    o.job3 = await Job.create({name: 'oldName', description: 'oldDescription', timeLimit: '2020-12-30', salary: 2300, partTime: false, remote: false, CityId: o.city1.id, CompanyId: o.company.id});
    o.job4 = await Job.create({name: 'oldName', description: 'oldDescription', timeLimit: '2020-12-30', salary: 2300, partTime: false, remote: false, CityId: o.city1.id, CompanyId: o.company.id});
    o.job5 = await Job.create({name: 'oldName', description: 'oldDescription', timeLimit: '2020-12-30', salary: 2300, partTime: false, remote: false, CityId: o.city1.id, CompanyId: o.company2.id});
  });

afterAll(cleanDatabase.bind(null, o, sequelize));

//unit test
test('Jobs every information is updated', async function() {
    const { job, city2, company } = o;
    newDate1 = new Date('2021-01-15');
    const ctx = {request: { body: {jobId: job.id, name: 'newName', description: 'New description', timeLimit: newDate1, salary: 2500, partTime: true, remote: true, CityId: city2.id} }, user: company};
    await update(ctx, noop);
    await job.reload();

    expect(job.id).toBeGreaterThan(0);
    expect(job.name).toBe('newName');
    expect(job.description).toBe('New description');
    newDate = new Date('2021-01-15');
    expect(job.timeLimit).toStrictEqual(newDate);
    expect(job.salary).toBe(2500);
    expect(job.partTime).toBe(true);
    expect(job.remote).toBe(true);
    expect(job.CityId).toBe(city2.id);
  });

  test('Jobs name is updated', async function() {
    const { job2, company } = o;
    const ctx = {request: { body: {jobId: job2.id, name: 'newName'} }, user: company};
    await update(ctx, noop);
    await job2.reload();

    expect(job2.id).toBeGreaterThan(0);
    expect(job2.name).toBe('newName');
  });

  test('Job does not belong to this company', async function() {
    const { job5, company } = o;
    const ctx = {request: { body: {jobId: job5.id, name: 'newName'} }, user: company};
    try{
      await update(ctx, noop);
    }catch(e){
      expect(e.status).toBe(401);
      expect(e.message).toBeDefined();
    }
  });

  test('Name cannot be null', async function() {
    const { job, company } = o;
    const ctx = {request: { body: {jobId: job.id, name: null} }, user: company};
    try{
      await update(ctx, noop);
    }catch(e){
      expect(e.status).toBe(400);
      expect(e.message).toBeDefined();
    }
  });

  test('Salary cannot be negative', async function() {
    const { job, city2, company } = o;
    newDate1 = new Date('2021-01-15');
    const ctx = {request: { body: {jobId: job.id, name: 'newName', description: 'New description', timeLimit: newDate1, salary: -2500, partTime: true, remote: true, CityId: city2.id} }, user: company};
    try{
      await update(ctx, noop);
    }catch(e){
      expect(e.status).toBe(400);
      expect(e.message).toBe('Salary cannot be negative');
    }
  });

//api test
test("Jobs every information is updated - API version", async function (){
    const { job3, company, city2 } = o;
    const jwt = signJWT({id: company.id, userType: "company"});
    const url = `http://localhost:3000/api/v1/jobs/update`;
    newDate1 = new Date('2021-01-15');
    const response = await r2.post(url, {json:{jobId: job3.id, name: 'newName', description: 'New description', timeLimit: newDate1, salary: 2500, partTime: true, remote: true, CityId: city2.id}, headers: {authorization: "Bearer " + jwt}}).response;
    await job3.reload();
    expect(response.status).toBe(200);
    expect(job3.id).toBeGreaterThan(0);
    expect(job3.name).toBe('newName');
    expect(job3.description).toBe('New description');
    newDate = new Date('2021-01-15');
    expect(job3.timeLimit).toStrictEqual(newDate);
    expect(job3.salary).toBe(2500);
    expect(job3.partTime).toBe(true);
    expect(job3.remote).toBe(true);
    expect(job3.CityId).toBe(city2.id);
});

test("Jobs name is updated - API version", async function (){
    const { job4, company } = o;
    const jwt = signJWT({id: company.id, userType: "company"});
    const url = `http://localhost:3000/api/v1/jobs/update`;
    const response = await r2.post(url, {json:{jobId: job4.id, name: 'newName'}, headers: {authorization: "Bearer " + jwt}}).response;
    await job4.reload();
    expect(response.status).toBe(200);
    expect(job4.id).toBeGreaterThan(0);
    expect(job4.name).toBe('newName');
});

test("This job does not belog to the company - API version", async function (){
  const { job5, company } = o;
  const jwt = signJWT({id: company.id, userType: "company"});
  const url = `http://localhost:3000/api/v1/jobs/update`;
  try{
    const response = await r2.post(url, {json:{jobId: job5.id, name: 'newName'}, headers: {authorization: "Bearer " + jwt}}).response; 
  }catch(e){
    expect(e.status).toBe(401);
    expect(e.message).toBeDefined();
  }
});