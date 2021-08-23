'use strict';
const { Job, Company, Skill, SkillCategory, City, Country, SkillSetOpt, SkillSetReq} = require("../../models").models;

exports.getOne = async ctx => {
  let { jobId } = ctx.params;
  jobId = parseInt(jobId);
  if (!jobId) throw {status: 400, message: 'Invalid job id'};
  const job = await Job.findOne({
    where: {id: jobId},
    include: [
      {model: Company},
      {model: City, include:[{ model: Country }]},
      {model: Skill, as: 'requiredSkills', include: [{model: SkillCategory}]},
      {model: Skill, as: 'optionalSkills', include: [{model: SkillCategory}]},
    ]});
  if (!job) throw {status: 404, message: 'Job not found'};
  ctx.body = job;
}

exports.getAll = async ctx => {
  ctx.body = await Job.findAll({include: [{model: Company}]});
  ctx.status = 200;
}

exports.createOne = async ctx => {
  const company = ctx.user;
  const body = ctx.request.body;
  body.CompanyId = company.id;
  ctx.body = await Job.create(body);
  ctx.status = 200;
};

exports.update = async ctx => {
  const { jobId, CompanyId, ...rest } = ctx.request.body;
  const company = ctx.user;

  const hasJob = await company.getJobs({where: {id: jobId}});
  if (hasJob.length === 0) throw {status: 401, message: "This job does not belong to this company"}

  const job = await Job.findOne({ where: {id: jobId}});
  if(!rest.name) throw {status: 400, message: 'Job Name cannot be null'};
  if (parseInt(rest.salary < 0)) throw {status: 400, message: 'Salary cannot be negative'};
  await job.update(rest);

  ctx.status = 200;
  ctx.body = { message: 'Job updated' };
}

exports.removeRequiredSkill = async ctx => {
  const { jobId, skillId} = ctx.params;
  const company = ctx.user;

  const hasJob = await company.getJobs({where: {id: jobId}});
  if (hasJob.length === 0) throw {status: 401, message: "This job does not belong to this company"}

  const exist = await SkillSetReq.findOne({where: {JobId: jobId, SkillId: skillId}});
  if(!exist){
    throw { status: 400, message: 'Skill does not exist' };
  }else{
     await SkillSetReq.destroy({where: {JobId: jobId, SkillId: skillId}});
     ctx.body = { message: 'Required skill deleted' };
     ctx.status = 200;
  }
}

exports.addRequiredSkill = async ctx => {
  const { jobId, skillId} = ctx.params;
  const company = ctx.user;

  const hasJob = await company.getJobs({where: {id: jobId}});
  if (hasJob.length === 0) throw {status: 401, message: "This job does not belong to this company"}

  const skillExist = await Skill.findOne({where: {id: skillId}});
  if(!skillExist) throw { status: 400, message: 'Skill does not exist' }

  const exist = await SkillSetReq.findOne({where: {JobId: jobId, SkillId: skillId}});
  if(exist) throw { status: 401, message: 'Required skill already exists' };

  const existInOptionals = await SkillSetOpt.findOne({where: {JobId: jobId, SkillId: skillId}});
  if(existInOptionals) throw { status: 401, message: 'This skill already exists in optional skills' };

  await SkillSetReq.create({ JobId: jobId, SkillId: skillId });
  ctx.body = { message: 'Required skill added' };
  ctx.status = 200;
}

exports.removeOptionalSkill = async ctx => {
  const { jobId, skillId} = ctx.params;
  const company = ctx.user;

  const hasJob = await company.getJobs({where: {id: jobId}});
  if (hasJob.length === 0) throw {status: 401, message: "This job does not belong to this company"}

  const exist = await SkillSetOpt.findOne({where: {JobId: jobId, SkillId: skillId}});
  if(!exist) throw { status: 400, message: 'Skill does not exist' };

   await SkillSetOpt.destroy({where: {JobId: jobId, SkillId: skillId}});
   ctx.body = { message: 'Optional skill deleted' };
   ctx.status = 200;

}

exports.addOptionalSkill = async ctx => {
  const { jobId, skillId} = ctx.params;
  const company = ctx.user;

  const hasJob = await company.getJobs({where: {id: jobId}});
  if (hasJob.length === 0) throw {status: 401, message: "This job does not belong to this company"}

  const skillExist = await Skill.findOne({where: {id: skillId}});
  if(!skillExist) throw { status: 400, message: 'Skill does not exist' }

  const exist = await SkillSetOpt.findOne({where: {JobId: jobId, SkillId: skillId}});
  if(exist) throw { status: 401, message: 'Optional skill already exists' };

  const existInRequired = await SkillSetReq.findOne({where: {JobId: jobId, SkillId: skillId}});
  if(existInRequired) throw { status: 401, message: 'This skill already exists in required skills' };

  await SkillSetOpt.create({ JobId: jobId, SkillId: skillId });
  ctx.body = { message: 'Optional skill added' };
  ctx.status = 200;
}

exports.deleteJob = async ctx => {
  const jobId = parseInt(ctx.params.jobId);
  if (!jobId) throw {status: 400, message: "Invalid job id"};

  const job = await Job.findOne({where: { id: jobId, CompanyId: ctx.user.id }});
  if(!job) throw {status: 404, message: "No job found with id " + jobId + " for this company"}

  await job.destroy();
  ctx.status = 200;
  ctx.body = {id: jobId};
}