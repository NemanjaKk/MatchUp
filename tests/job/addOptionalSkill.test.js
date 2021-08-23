const r2 = require("r2");
const { addOptionalSkill } = require("../../api/jobs/jobs.controller");
const {  Job, Company, SkillSetOpt, Skill, SkillSetReq } = require('../../models').models;
const Sequelize = require('../../models/db');
const signJWT = require("../../utils/signJWT");
const cleanDatabase = require('../../utils/cleanDatabase.util');

const noop = () => {};
const sequelize = new Sequelize().getInstance();

// we need a reference to the objects that we put in the database so that we can use them in the tests
const o = {};

// first thing, Fill the database with all the necessary stuff
beforeAll(async () => {
  o.company = await Company.create({name:'Company 1'})
  o.company2 = await Company.create({name:'Company 2'})
  o.job1 = await Job.create({name: 'Job 1', CompanyId: o.company.id});
  o.job2 = await Job.create({name: 'Job 2', CompanyId: o.company.id});
  o.job3 = await Job.create({name: 'Job 3', CompanyId: o.company.id});
  o.job4 = await Job.create({name: 'Job 4', CompanyId: o.company2.id});
  o.job5 = await Job.create({name: 'Job 4', CompanyId: o.company2.id});
  o.skill = await Skill.create({name: 'JavaScript'});
  o.skillSet = await SkillSetOpt.create({ JobId: o.job2.id, SkillId: o.skill.id});
  o.skillSetReq = await SkillSetReq.create({ JobId: o.job5.id, SkillId: o.skill.id});

});

afterAll(cleanDatabase.bind(null, o, sequelize));

//unit test
test('Optional skill is added', async function() {
    const { job1, company, skill } = o;
    const ctx = { params:{jobId: job1.id, skillId: skill.id}, user: company};
    await addOptionalSkill(ctx, noop);
    const skillSet = await SkillSetOpt.findOne({where: {JobId: job1.id, SkillId: skill.id}});
    expect(skillSet.JobId).toBe(job1.id);
    expect(skillSet.SkillId).toBe(skill.id);
  });

  test('Optional skill is already added', async function() {
    const { job2, company, skill } = o;
    const ctx = { params:{jobId: job2.id, skillId: skill.id}, user: company};
    try{
        await addOptionalSkill(ctx, noop);
    }catch(e){
        expect(e.status).toBe(401);
        expect(e.message).toBeDefined();
    }
  });

  test('Job does not belong to the company  ', async function() {
    const { job4, company, skill } = o;
    const ctx = { params:{jobId: job4.id, skillId: skill.id}, user: company};
      try{
          await addOptionalSkill(ctx, noop);
      }catch(e){
          expect(e.status).toBe(401);
          expect(e.message).toBeDefined();
      }
    });

    test('Skill does not exist', async function() {
      const { job1, company } = o;
      const ctx = { params:{jobId: job1.id, skillId: 6969}, user: company};
      try{
          await addOptionalSkill(ctx, noop);
      }catch(e){
          expect(e.status).toBe(400);
          expect(e.message).toBeDefined();
      }
    });

    test('Skill already exists in required skills', async function() {
      const { job5, company2, skill } = o;
      const ctx = { params:{jobId: job5.id, skillId: skill.id}, user: company2};
      try{
          await addOptionalSkill(ctx, noop);
      }catch(e){
          expect(e.status).toBe(401);
          expect(e.message).toBeDefined();
      }
    });

  //api test
  test('Optional skill is added - API version', async function() {
    const { job3, company, skill } = o;
    const jwt = signJWT({id: company.id, userType: "company"});
    const jobId = job3.id, skillId = skill.id;
    const url = `http://localhost:3000/api/v1/jobs/update/${jobId}/addOpt/${skillId}`;
    const response = await r2.post(url, {headers: {authorization: "Bearer " + jwt}}).response;
    expect(response.status).toBe(200);
    const skillSet = await SkillSetOpt.findOne({where: {JobId: job3.id, SkillId: skill.id}});
    expect(skillSet.JobId).toBe(job3.id);
    expect(skillSet.SkillId).toBe(skill.id);
  });

  test('Optional skill is already added - API version', async function() {
    const { job2, company, skill } = o;
    const jwt = signJWT({id: company.id, userType: "company"});
    const jobId = job2.id, skillId = skill.id;
    const url = `http://localhost:3000/api/v1/jobs/update/${jobId}/addOpt/${skillId}`;
    const response = await r2.post(url, {headers: {authorization: "Bearer " + jwt}}).response;
    expect(response.status).toBe(401);
  });

  test('Job does not belog to the company - API version', async function() {
    const { job4, company, skill } = o;
    const jwt = signJWT({id: company.id, userType: "company"});
    const jobId = job4.id, skillId = skill.id;
    const url = `http://localhost:3000/api/v1/jobs/update/${jobId}/addOpt/${skillId}`;
    const response = await r2.post(url, {headers: {authorization: "Bearer " + jwt}}).response;
    expect(response.status).toBe(401);
  });