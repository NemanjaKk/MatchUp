'use strict';
const { models } = require('../../models');
const { Student, Job, Company, Application, Skill, Matching,StudentSkill, City, Country, SkillCategory, LevelDescription } = models;
const signJWT=require('../../utils/signJWT');
const pgDate = require("../../utils/postgresDate");
const { Op } = require("sequelize");
const Sequelize = require("../../models/db");
const { hash, compare } = require('../../utils/password');
const nodemailer = require('nodemailer');
const sequelize = new Sequelize().getInstance();

exports.getOne = async ctx => {
  const { userId } = ctx.params;
  const student = await Student.findByPk(userId, {include: [
    {model: Skill, as: 'skills', include: [{model: SkillCategory, include: [{model: LevelDescription}]}]},
      {model: City, include: [{model: Country}]}]});
  if (!student) throw {status: 404, message: "The requested user doesn't exist"};
  ctx.status = 200;
  ctx.body = student;
};

exports.getOneByEmail = async ctx => {
  const { email } = ctx.params;
  const student = await Student.findOne({where: { email }});
  if (!student) throw {status: 404, message: "The requested user doesn't exist"};
  ctx.status = 200;
  ctx.body = student;
};

exports.getAll = async ctx => {
  ctx.status = 200;
  ctx.body = await Student.findAll();
};

exports.getApplications = async ctx => {
  const student = ctx.user;
  ctx.body = await student.getApplications({
    include: [ {
      model: Job,
      as: "Job",
      include: [ {model: Company, as: "Company"} ]
    } ]
  });
}

exports.register = async ctx => {
  const { firstName, lastName, email, password, dateOfBirth, picture, CityId } = ctx.request.body;
  if (!email || !password) throw { status: 400, message: 'Email and password are required fields' };
  if(CityId){
    const city = await City.findOne({where:{ id: CityId}});
    const countryExists = await Country.findOne({where:{ id: city.CountryId}});
    if(!countryExists) throw { status: 400, message: 'This city does not belong to a country' };
  }
  if(dateOfBirth){
    const insertedDate = new Date(dateOfBirth);
    const todaysDate = new Date();
    if(todaysDate<insertedDate) throw { status: 401, message: 'You cannot be born in the future' };
  }
  const alreadyExists = await Student.findOne({where: {email}});
  if(alreadyExists) throw { status: 400, message: 'Email already used' };
  const hashedPassword = await hash(password);
  const student = await Student.create({ firstName, lastName, email, password: hashedPassword, dateOfBirth, picture, CityId });

  if (!student) throw {status: 500, message: 'Unexpected Error'};

  ctx.status = 201;
}

exports.login = async ctx => {
  const {email, password} = ctx.request.body;
  const user = await Student.findOne({where: {email:email}});
  if( !user ){
    throw { status: 404, message: "Mail not found, user does not exist" };
  }
  const p = await compare(password, user.password);
  if(p){
    const token= signJWT({userType: "student", id:user.id});
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

exports.apply = async ctx => {
  const { jobId } = ctx.params;
  const studentId = ctx.user.id;
  const student = await Student.findByPk(studentId);

  let application = await Application.findOne({where: { JobId: jobId, StudentId: studentId }});
  if(application) throw { status: 400, message: "This student already applied for this job." };

  await Application.create( {date: pgDate(new Date()), declined: null, StudentId: studentId, JobId: jobId});
  const job = await Job.findByPk(jobId, {include: [{ model: Company }]});
  ctx.body = { message: 'Student applied' };
  ctx.status = 201;

  await sendEmail('info@pladat.tk', job.Company.email, "New Candidate", "Candidate to job " + job.name + ": " + student.email);
};

exports.discard = async ctx => {
  const jobId = parseInt(ctx.params.jobId);
  const studentId = ctx.user.id;

  if(!jobId) throw { status: 400, message: 'Bad format for job id' }
  const job = await Job.findOne({where: {id: jobId}});
  if (!job) throw { status: 400, message: 'Job with given id not found' }
  let matching = await Matching.findOne({where: { StudentId: studentId, JobId: jobId }});
  if (matching) {
    await matching.update({discarded: true});
  }else{
    matching = await Matching.create({discarded: true, StudentId: studentId, JobId: jobId});
  }
  if (!matching || !matching.discarded) throw { status: 400, message: 'Unexpected error while discarding job' }
  ctx.body = { message: 'Job discarded' };
  ctx.status = 201;
};

/**
 * Takes nothing as input, only needs to be authenticated
 * Returns all the applications that have alreadyNotified=false 
 */
exports.getNotifications = async ctx => {
  const student = ctx.user;

  const query = await Application.findAll({
    where: {alreadyNotified: false, StudentId: student.id},
    include: [{
      model: Job,
      as: "Job",
      include: [{model: Company, as: "Company"}] 
    }]
  })
  
  ctx.status = 200;
  ctx.body = query;
}

/**
 * Takes as input the id of the application to be marked as read 
 */
exports.markApplicationAsSeen = async ctx => {
  const student = ctx.user;
  const {applicationId} = ctx.params;

  if(isNaN(applicationId) ) throw {status: 400, message: "Invalid id"} //if the applicationId is not a number (usually undefined) returns an error

  const application = await Application.findByPk(applicationId)
  if (application === null || application.StudentId !== student.id ) throw {status: 400, message: "No application found with this id "} //if the student is not the student whom made the call it returns a 404 error 
  await application.update({alreadyNotified: true}) 
  
  ctx.status = 201;
  ctx.body = {message: "Application marked as seen"};
}
/**
 * Takes the user id and returnes the jobs that he is fit to do ordered by the fitness function "jobFitness" 
 */
exports.searchJobs = async ctx => { 
  const ratings = await ctx.user.getStudentSkills()

  const today = pgDate(new Date());

  const alreadyExcludedJobs = await sequelize.dialect.queryGenerator.selectQuery("Matchings", {
    attributes: ['JobId'],
    where: { StudentId: ctx.user.id, discarded: true }
  }).slice(0, -1); // removes ';'

  const alreadyAppliedJobs = await  sequelize.dialect.queryGenerator.selectQuery("Applications", {
    attributes: ['JobId'],
    where: { StudentId: ctx.user.id } 
  }).slice(0, -1); // removes ';'

  /*collects all the skills of the student */
  const skillStudent = await  sequelize.dialect.queryGenerator.selectQuery("StudentSkills",{
    attributes: ['SkillId'],
    where: {StudentId: ctx.user.id, rating: {[Op.gt]: 2}}
  }).slice(0, -1);// removes ';'

  /*collects all the skill that the student does not have*/
  const notSkillStudent = await sequelize.dialect.queryGenerator.selectQuery("StudentSkills",{
    attributes: ['SkillId'],
    where: {SkillId:{[Op.notIn]: sequelize.literal('('+skillStudent+')')}}
  }).slice(0, -1);// removes ';'

  /*collects all jobs  that contain a skill the student does not possess */

  const jobStudentIsNotQualifiedFor = await sequelize.dialect.queryGenerator.selectQuery("SkillSetReqs",{
    attributes: ['JobId'],
    where: {SkillId: {[Op.in]: sequelize.literal('('+notSkillStudent+')')}}
  }).slice(0, -1);// removes ';'

  /*collect all the jobs that contain a skill that the student does not possess */
  const jobStudentIsQualifiedFor = await sequelize.dialect.queryGenerator.selectQuery("Jobs", {
    attributes: ['id'],
    where: {id: {[Op.notIn]: sequelize.literal('('+jobStudentIsNotQualifiedFor+')')}}
  }).slice(0, -1);// removes ';'
  let jobs = undefined;
  if(ctx.request.query === undefined || ctx.request.query.city === undefined){
    jobs = await Job.findAll({
      where:
        {
          timeLimit: { [Op.gt]: today },
          id: {
            [Op.and]: [
              { [Op.notIn]: sequelize.literal('('+alreadyExcludedJobs+')') },
              { [Op.notIn]: sequelize.literal('('+alreadyAppliedJobs+')') } ,
              { [Op.in]: sequelize.literal('('+jobStudentIsQualifiedFor+')') }
            ]  },
        },
      include: [
        {model: Skill, as: "requiredSkills"},
        {model: Skill, as: "optionalSkills"},
      ]
    });
  }
  else{
    if(isNaN(ctx.request.query.city)) throw { status: 400, message: 'The query is not well formatted, city id is needed for this API request to work' }
    jobs = await Job.findAll({
      where:
        {
          timeLimit: { [Op.gt]: today },
          CityId: ctx.request.query.city,
          id: {
            [Op.and]: [
              { [Op.notIn]: sequelize.literal('('+alreadyExcludedJobs+')') },
              { [Op.notIn]: sequelize.literal('('+alreadyAppliedJobs+')') } ,
              { [Op.in]: sequelize.literal('('+jobStudentIsQualifiedFor+')') }
            ]  },
        },
      include: [
        {model: Skill, as: "requiredSkills"},
        {model: Skill, as: "optionalSkills"},
      ]
    });
  }
  //calculate the fitness of the jobs first and then sort the jobs (more efficient because jobfitness is called only once and less problems with async functions)
  let comparisonArray = await Promise.all(jobs.map(async x => [await jobFitness(x, ratings), x]))
  
  jobs = comparisonArray.sort(function(a,b){return b[0] - a[0]}).map(x => x[1]) //maps to the second element of the list to retrieve the job (the first is just the fitness)
  
  ctx.body = jobs;
}
/**
 * Calculates the fitness of the job for the student
 * It has two parameters, alpha regulates the contribution of requested skills to the final result (the weight of the contribution of the optional skills will be 1-alpha)
 * The constant denominator helps both with division by zero and making sure that we take into consideration how many skills are matched in the final result (if I match 1 out of 1 skill is different from matching 10/10 skills, and adding a constant value at the denominator adds this information). It basically discourages matches with jobs with few overall skills
 * The fitness formula is the following (alpha)*(sum of the rating of the student for the given required skill)/(maximum possible required skills score + constant_denominator) + (1-alpha)*(sum of the rating of the student for the optional skills)/(maximum possible optional skills score  + constant_denominator)
 */
async function jobFitness(job, ratings){
  const alpha = 0.6
  const constantDenominatorValue = 2;

  let sumRatingRequired = 0; //sum of the skill rating of the skill required by job (note that the rating represents how good a student is at a certain skill)
  let sumRatingOptional = 0; //sum of the skill rating of the optional skill by job (note that the rating represents how good a student is at a certain skill)

  let sumPossibleRequiredSkills = 0; //stores the maximum score that can be obtained from a certain set of required skills
  let sumPossibleOptionalSkills = 0; //stores the maximum score that can be obtained from a certain set of optional skills

  //sum all the ratings of the skills
  for(let requiredSkill of job.requiredSkills){
    if(ratings.map(x => x.SkillId).includes(requiredSkill.id)){
      sumRatingRequired += ratings.filter(x => x.SkillId === requiredSkill.id)[0].rating
    }
    sumPossibleRequiredSkills += await getMaxRating(requiredSkill.id)
  }

  for(let optionalSkill of job.optionalSkills){
    if(ratings.map(x => x.SkillId).includes(optionalSkill.id)){
      sumRatingOptional += ratings.filter(x => x.SkillId === optionalSkill.id)[0].rating
    }
    sumPossibleOptionalSkills += await getMaxRating(optionalSkill.id)
  }
  return alpha*sumRatingRequired/(sumPossibleRequiredSkills+constantDenominatorValue) + (1-alpha)*sumRatingOptional/(sumPossibleOptionalSkills+constantDenominatorValue)
}
/*Takes as input the skillId, returns the maximum rating that can be obtained in that skill */
async function getMaxRating(skillId){

  const skill = await Skill.findByPk(skillId)
  const levels = await LevelDescription.findAll({
    where: {
      SkillCategoryId: skill.SkillCategoryId
    }
  })

  return levels.map(x => x.level).reduce(function(acc, curr){ return Math.max(acc, curr)}) //selects the maximum level possible
}

exports.update = async ctx => {
  const { id, email, password, ...rest } = ctx.request.body;
  const student = ctx.user;

  if(email){
    const alreadyExists = await Student.findOne({where: { email: email }});
    if(!alreadyExists){
      await student.update({email: email})
    } else throw { status: 400, message: "This email is already taken." };
  }
  if(password){
    const hashedPassword = await hash(password);
    await student.update({password: hashedPassword});
  }

  await student.update(rest);

  ctx.status = 200;
  ctx.body = { message: 'Information updated' };
}

exports.addCapability= async ctx => {
  //add 
  const studentId = ctx.user.id;
  const id = parseInt(ctx.request.body.id);
  const rating = parseInt(ctx.request.body.rating);
  if (!id) throw {status: 400, message: 'Invalid skill id'};
  if (!rating) throw {status: 400, message: 'Invalid skill rating'};
  const alreadyExists = await StudentSkill.findOne({where: {StudentId:studentId, SkillId: id}});
  if(!alreadyExists){
    await StudentSkill.create({ StudentId:studentId, SkillId: id, rating: rating });
    ctx.body = { message: 'New skill added' };
    ctx.status = 201;
  }else{
    throw { status: 400, message: "Skill already exists" };
  }
 }

 exports.removeCapability= async ctx => {
  const studentId = ctx.user.id;
  const {removeSkillId} = ctx.request.body;

  const exist = await StudentSkill.findOne({where: {StudentId:studentId, SkillId: removeSkillId}});
  if(!exist){
    throw { status: 404, message: 'Skill does not exist' };
   
  }else{
     await StudentSkill.destroy({where: {StudentId:studentId, SkillId: removeSkillId}});
     ctx.body = { message: 'Skill deleted' };
     ctx.status = 200;
  }

 }

exports.editCapability = async ctx => {
  const studentId = ctx.user.id;
  const skillId = parseInt(ctx.request.body.id);
  const skillRating = parseInt(ctx.request.body.rating);
  if (!skillId) throw {status: 400, message: 'Wrong skill id'};
  if (!skillRating) throw {status: 400, message: 'Wrong skill rating'};
  const studentSkill = await StudentSkill.findOne({where: { StudentId: studentId, SkillId: skillId }});
  if (!studentSkill) throw {status: 400, message: "This student does not have this skill"};

  const skill = await studentSkill.getSkill();
  const levelDescription = await LevelDescription.findOne({where: {SkillCategoryId: skill.SkillCategoryId, level: skillRating}});
  if (!levelDescription) throw {message: 'Level for this skill not in range', status: 400};

  await studentSkill.update({rating: skillRating});
  ctx.status = 201;
  ctx.body = {};
}

exports.sendMail = async ctx => {
  const name = ctx.user.firstName;
  const surname = ctx.user.lastName;
  const studentEmail = ctx.user.email;
  const { subject, companyEmail } = ctx.request.body;
  const message = ctx.request.body.message + `\n\nFirst name: ${name}\nLast Name: ${surname}\nEmail: ${studentEmail}`;
  await sendEmail('info@pladat.tk', companyEmail, subject, message);
  ctx.body = {message: "OK"};
  ctx.status = 200;
}

const sendEmail = async (senderEmail, receiverEmail, subject, message) => {
    const transporter = nodemailer.createTransport({
      host: 'mail.pladat.tk',
      port: 465,
      secure: true,
      auth: {
        user: 'info@pladat.tk',
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: `"PlaDat" <${senderEmail}>`,
      to: receiverEmail,
      subject: subject,
      text: message
    };
    return await transporter.sendMail(mailOptions);
}