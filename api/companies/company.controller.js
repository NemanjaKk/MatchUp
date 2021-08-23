'use strict';
const { Application, Job, Student,Company, City, Country } = require("../../models").models;
const signJWT=require('../../utils/signJWT');
const { hash, compare } = require('../../utils/password');
const upload=require('../../config/services/file-upload');
const singleUpload=upload.single('image');

exports.getOne = async ctx => {
  let { companyId } = ctx.params;
  companyId = parseInt(companyId);
  if(!companyId) throw {status: 400, message: 'Invalid company id'};
  const company = await Company.findOne({
    where: {id: companyId},
    include: [
      { model: City, include: [{model: Country}] },
      { model: Job} ]
  });
  if (!company) throw {status: 404, message: 'Company not found'};
  ctx.body = company;
}

exports.getAll = async ctx => {
  ctx.body = await Company.findAll();
}

exports.companyAcceptStudent = async ctx => {
  const { jobId, studentId } = ctx.params;
  const company = ctx.user;
  // check that the job belongs to the company
  const jobObj = await Job.findOne({where: {id: jobId, CompanyId: company.id}});
  if(!jobObj) throw { status: 401, message: "This job does not belong to you" };

  const application = await Application.findOne({where: { JobId: jobId, StudentId: studentId, declined: null }});
  if(!application) throw { status: 400, message: "This user did not apply to this job" };

  await application.update({declined: "false", alreadyNotified: "false"});
  ctx.body = ""
  ctx.status = 201;
};

exports.companyDiscardStudent = async ctx => {
  const { jobId, studentId } = ctx.params;
  const company = ctx.user;
  // check that the job belongs to the company
  const jobObj = await Job.findOne({where: {id: jobId, CompanyId: company.id}});
  if(!jobObj) throw { status: 401, message: "This job does not belong to you" };

  const application = await Application.findOne({where: { JobId: jobId, StudentId: studentId, declined: null }});
  if(!application) throw { status: 400, message: "This user did not apply to this job" };

  await application.update({declined: "true", alreadyNotified: false});
  ctx.body = ""
  ctx.status = 201;
};

exports.getCandidatesForJob = async ctx =>{
  const {jobId} = ctx.params;
  const company = ctx.user;
  //check if the job belongs to the company
  const jobObj = await Job.findOne({where: {id: jobId, CompanyId: company.id}});
  if(!jobObj) throw { status: 400, message: "This job does not belong to you" };

  /**
   * Takes the jobIds, queries in Application to find the studentId
   * Returns a list of students (fetched using the studentsIds)
   */
  const studentsApplied = await Student.findAll(
    {include: [{
      model: Application,
      where:{JobId:jobObj.id, declined:null}
    }]}
  );
  ctx.status=200;
  ctx.body = studentsApplied
}

exports.register = async ctx => {
  const { name, description, picture, email, password, cityId } = ctx.request.body;

  if(!email || !password) throw { status: 400, message: 'Email and password are required fields' };

  const alreadyExists = await Company.findOne({where: {email}});
  if(alreadyExists) throw { status: 400, message: 'Email already used' };

  const hashedPassword = await hash(password);
  const company = await Company.create({ name, description, email, password: hashedPassword, picture, cityId });

  if(!company) throw { status: 500, message: 'Unexpected Error' };

  ctx.status = 201;
}

exports.login = async ctx => {
  const {email, password} = ctx.request.body;
  const user = await Company.findOne({where: {email:email}});
  if( !user ){
    throw { status: 404, message: "Mail not found, user does not exist" };
  }
  const p = await compare(password, user.password);
  if(p){
    const token= signJWT({userType: "company", id:user.id});
    ctx.status = 200;
    ctx.body={
      message:"Successfully logged in",
      id: user.id,
      jwt: token
    }
  }else{
    throw { status: 401, message: "Auth failed" };
  }
};

exports.update = async ctx => {
  const { name, description, email, password, picture } = ctx.request.body;

  const company = ctx.user;

  if(email !== undefined){
    const alreadyExists = await Company.findOne({where: { email: email }});
    if(!alreadyExists){
      await company.update({email: email})
    } else {
      throw { status: 400, message: "This email is already taken." };
    }
  }

  if(name){
    await company.update({name: name});
  }
  if(description){
    await company.update({description: description});
  }
  if(password){
    const hashedPassword = await hash(password);
    await company.update({password: hashedPassword});
  }
  if(picture){
    await company.update({picture: picture});
  }

  ctx.status = 200;
  ctx.body = { message: 'Profile edited' };
}
exports.imageUpload = async ctx => {
  const company = ctx.user;
  if (!ctx.file || !ctx.file.location) throw {status:400, message: "No image in the upload" };
  const location = ctx.file.location;
  await company.update({picture: location})
  ctx.body= {picture: location};
  ctx.status=200;
};
exports.getAcceptedStudents = async ctx => {
  const {jobId} = ctx.params;
  const company = ctx.user;
  //check if the job belongs to the company
  const jobObj = await Job.findOne({where: {id: jobId, CompanyId: company.id}});
  if(!jobObj) throw { status: 400, message: "This job does not belong to you" };

  /**
   * Takes the jobIds, queries in Application to find the studentId
   * Returns a list of students (fetched using the studentsIds)
   */
  const acceptedStudents = await Student.findAll(
    {include: [{
      model: Application,
      where:{JobId:jobObj.id, declined: false}
    }]}
  );
  ctx.status=200;
  ctx.body = acceptedStudents
}

